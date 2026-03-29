'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, ImagePlus, Loader2, SendHorizontal, Sparkles, X } from 'lucide-react';
import { findRecordByNameAndClass, getAllRecords, putRecord, type StudentRecord } from '../app/localDb';

type Role = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: Role;
  text?: string;
  imagePreview?: string;
};

type StudentScanRow = {
  studentName: string;
  rollNo?: string;
  className: string;
  marks: Record<string, number | string>;
};

type AssistantAction = {
  action: 'FIND' | 'UPDATE';
  student?: string;
  class?: string;
  updates?: Record<string, number | string>;
};

type ParsedResponse =
  | { type: 'rows'; rows: StudentScanRow[]; note?: string }
  | { type: 'action'; command: AssistantAction; note?: string }
  | { type: 'text'; text: string };

const SYSTEM_PROMPT = `You are EduPrime SMS Universal Assistant for offline-first school ERP.

Database context:
- Local IndexedDB table stores student records with fields: id, student_name, roll_no, class_name, student_data, marks_data, extra_data, created_at, updated_at.
- marks_data shape: { [subject: string]: { t1: string, t2: string, t3: string } }
- class_name example: "5" (not always prefixed with "Class").

Response rules (strict):
1) If user sends marksheet image and asks extraction/review, return ONLY JSON in this shape:
{
  "type": "STUDENT_ROWS",
  "rows": [{ "studentName": "Rahul", "rollNo": "12", "className": "5", "marks": { "Math": 95, "Science": 88 } }],
  "note": "optional short note"
}

2) If user asks to find/edit/update records, return ONLY JSON in this shape:
{
  "type": "ACTION",
  "command": { "action": "FIND" | "UPDATE", "student": "Rahul", "class": "Class 5", "updates": { "Math": 95 } },
  "note": "optional short note"
}

3) For normal chat/help, return plain text only.
Do not wrap JSON in markdown fences unless unavoidable.`;

const cleanJsonText = (raw: string): string => raw.trim().replace(/^```json\s*/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();

const normalizeClassName = (value: string): string => value.replace(/^class\s*/i, '').trim();

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });

function parseAssistantResponse(raw: string): ParsedResponse {
  const text = raw.trim();
  try {
    const parsed = JSON.parse(cleanJsonText(text)) as any;

    if (Array.isArray(parsed)) {
      const rows: StudentScanRow[] = parsed.map((row) => ({
        studentName: String(row.studentName || row.name || '').trim(),
        rollNo: String(row.rollNo || row.roll_no || row.roll || '').trim(),
        className: normalizeClassName(String(row.className || row.class || '')) || '5',
        marks: (row.marks || {}) as Record<string, number | string>,
      }));
      return { type: 'rows', rows };
    }

    if (parsed?.type === 'STUDENT_ROWS' && Array.isArray(parsed.rows)) {
      const rows: StudentScanRow[] = parsed.rows.map((row: any) => ({
        studentName: String(row.studentName || '').trim(),
        rollNo: String(row.rollNo || '').trim(),
        className: normalizeClassName(String(row.className || '')) || '5',
        marks: (row.marks || {}) as Record<string, number | string>,
      }));
      return { type: 'rows', rows, note: typeof parsed.note === 'string' ? parsed.note : undefined };
    }

    if (parsed?.type === 'ACTION' && parsed.command?.action) {
      const command: AssistantAction = {
        action: parsed.command.action,
        student: parsed.command.student,
        class: parsed.command.class,
        updates: parsed.command.updates,
      };
      return { type: 'action', command, note: typeof parsed.note === 'string' ? parsed.note : undefined };
    }
  } catch {
    const blockMatch = text.match(/\{[\s\S]*\}/);
    if (blockMatch) {
      try {
        const candidate = JSON.parse(cleanJsonText(blockMatch[0])) as AssistantAction;
        if (candidate?.action) return { type: 'action', command: candidate };
      } catch {
        // ignore and return text
      }
    }
  }

  return { type: 'text', text };
}

const buildMarksData = (updates: Record<string, number | string>, existing?: StudentRecord['marks_data']): StudentRecord['marks_data'] => {
  const marksData = { ...(existing || {}) };
  Object.entries(updates).forEach(([subject, value]) => {
    const existingKey = Object.keys(marksData).find((k) => k.toLowerCase() === subject.toLowerCase()) || subject;
    marksData[existingKey] = {
      t1: marksData[existingKey]?.t1 || '',
      t2: marksData[existingKey]?.t2 || '',
      t3: String(value ?? '').trim(),
    };
  });
  return marksData;
};

export default function GlobalAIAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedPreview, setAttachedPreview] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      text: 'Hi! I can scan handwritten marksheets and also find/update local student records. Attach an image or type a command.',
    },
  ]);
  const [pendingRows, setPendingRows] = useState<StudentScanRow[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pendingRows, open]);

  const modelRef = useRef<any>(null);

  const getModel = async () => {
    if (modelRef.current) return modelRef.current;
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!key) throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is missing. Please configure it in your environment.');
    const importFromUrl = new Function('u', 'return import(u)');
    const sdk = await (importFromUrl as (u: string) => Promise<any>)('https://esm.sh/@google/generative-ai');
    const genAI = new sdk.GoogleGenerativeAI(key);
    modelRef.current = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: SYSTEM_PROMPT });
    return modelRef.current;
  };

  const canSend = input.trim().length > 0 || !!attachedFile;

  const pushAssistantText = (text: string) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', text }]);
  };

  const executeAction = async (command: AssistantAction): Promise<string> => {
    const normalizedClass = normalizeClassName(command.class || '');
    const targetStudent = (command.student || '').trim();

    if (command.action === 'FIND') {
      const all = await getAllRecords();
      const found = all.filter((row) => {
        const nameOk = targetStudent ? row.student_name.toLowerCase().includes(targetStudent.toLowerCase()) : true;
        const classOk = normalizedClass ? row.class_name.toLowerCase() === normalizedClass.toLowerCase() : true;
        return nameOk && classOk;
      });
      if (!found.length) return 'No matching student record found in local database.';
      const summary = found.slice(0, 5).map((s) => `${s.student_name} (Class ${s.class_name}, Roll ${s.roll_no || '-'})`).join(', ');
      return `Found ${found.length} record(s): ${summary}`;
    }

    if (command.action === 'UPDATE') {
      if (!targetStudent || !normalizedClass || !command.updates || !Object.keys(command.updates).length) {
        return 'Update command is incomplete. Please provide student, class, and updates.';
      }
      const existing = await findRecordByNameAndClass(targetStudent, normalizedClass);
      if (!existing) return `Could not find ${targetStudent} in Class ${normalizedClass}.`;

      const now = new Date().toISOString();
      const updated: StudentRecord = {
        ...existing,
        marks_data: buildMarksData(command.updates, existing.marks_data),
        updated_at: now,
      };
      await putRecord(updated);
      return `Done! Updated ${existing.student_name}'s marks.`;
    }

    return 'Unsupported action command.';
  };

  const handleSend = async () => {
    if (!canSend || isSending) return;

    setIsSending(true);
    try {
      const model = await getModel();

      const currentText = input.trim();
      const currentPreview = attachedPreview;
      const currentFile = attachedFile;

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'user', text: currentText || 'Analyze this image', imagePreview: currentPreview || undefined },
      ]);

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
      parts.push({ text: currentText || 'Please analyze this marksheet and follow system rules.' });

      if (currentFile) {
        const base64 = await toBase64(currentFile);
        parts.push({ inlineData: { mimeType: currentFile.type || 'image/jpeg', data: base64 } });
      }

      const result = await model.generateContent(parts);
      const raw = result.response.text() || 'I could not generate a response.';
      const parsed = parseAssistantResponse(raw);

      setInput('');
      setAttachedFile(null);
      setAttachedPreview('');

      if (parsed.type === 'rows') {
        const validRows = parsed.rows.filter((r) => r.studentName && Object.keys(r.marks || {}).length > 0);
        setPendingRows(validRows);
        pushAssistantText(parsed.note || `I extracted ${validRows.length} row(s). Please review below, then approve to save.`);
        return;
      }

      if (parsed.type === 'action') {
        const output = await executeAction(parsed.command);
        pushAssistantText(parsed.note ? `${parsed.note}\n${output}` : output);
        return;
      }

      pushAssistantText(parsed.text);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong while contacting Gemini.';
      pushAssistantText(message);
    } finally {
      setIsSending(false);
    }
  };

  const updateRowField = (idx: number, key: 'studentName' | 'rollNo' | 'className', value: string) => {
    setPendingRows((prev) => prev.map((row, i) => (i === idx ? { ...row, [key]: value } : row)));
  };

  const updateMark = (idx: number, subject: string, value: string) => {
    setPendingRows((prev) => prev.map((row, i) => (i === idx ? { ...row, marks: { ...row.marks, [subject]: value } } : row)));
  };

  const handleApproveAndSave = async () => {
    if (!pendingRows.length || isSaving) return;
    setIsSaving(true);
    try {
      const now = new Date().toISOString();

      for (const row of pendingRows) {
        const className = normalizeClassName(row.className || '5') || '5';
        const found = await findRecordByNameAndClass(row.studentName, className);

        const marksData = buildMarksData(row.marks, found?.marks_data);

        const payload: StudentRecord = found
          ? {
              ...found,
              roll_no: row.rollNo?.trim() || found.roll_no,
              marks_data: marksData,
              updated_at: now,
            }
          : {
              id: crypto.randomUUID(),
              student_name: row.studentName.trim(),
              roll_no: row.rollNo?.trim() || '',
              class_name: className,
              student_data: {
                name: row.studentName.trim(),
                roll: row.rollNo?.trim() || '',
                mother: '',
                father: '',
                gender: 'MALE',
                photo: null,
              },
              marks_data: marksData,
              extra_data: {
                attendance: '',
                remark: '',
                issueDate: now.slice(0, 10),
                coScholastic: { sports: 'A', art: 'A', music: 'A', discipline: 'A' },
              },
              created_at: now,
              updated_at: now,
            };

        await putRecord(payload);
      }

      setPendingRows([]);
      pushAssistantText('Approved and saved to local IndexedDB successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save scanned data locally.';
      pushAssistantText(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-xl shadow-indigo-500/30 transition hover:scale-105"
        aria-label="Toggle AI Assistant"
      >
        {open ? <X size={22} /> : <Bot size={22} />}
      </button>

      <aside
        className={`fixed bottom-24 right-5 z-[80] flex h-[72vh] w-[94vw] max-w-[430px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur transition-all duration-300 ${
          open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
        }`}
      >
        <header className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-700 via-blue-700 to-cyan-600 px-4 py-3 text-white">
          <div>
            <h2 className="text-sm font-semibold tracking-wide">EduPrime • Universal Gemini Assistant</h2>
            <p className="text-xs text-indigo-100">Scan, Review, Save, Find & Edit local records</p>
          </div>
          <Sparkles size={16} className="text-cyan-100" />
        </header>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`rounded-2xl px-3 py-2 text-sm ${msg.role === 'user' ? 'ml-8 bg-indigo-600 text-white' : 'mr-8 border border-slate-200 bg-white text-slate-700'}`}>
              {msg.imagePreview && <img src={msg.imagePreview} alt="Uploaded" className="mb-2 h-24 w-24 rounded-lg object-cover" />}
              {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
            </div>
          ))}

          {pendingRows.length > 0 && (
            <section className="mr-2 rounded-2xl border border-indigo-100 bg-white p-3 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-indigo-700">Review Extracted Students ({pendingRows.length})</h3>
              <div className="max-h-64 overflow-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-xs">
                  <thead className="sticky top-0 bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-2 py-2 text-left">Student</th>
                      <th className="px-2 py-2 text-left">Roll</th>
                      <th className="px-2 py-2 text-left">Class</th>
                      <th className="px-2 py-2 text-left">Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRows.map((row, idx) => (
                      <tr key={`${row.studentName}-${idx}`} className="align-top even:bg-slate-50">
                        <td className="p-2"><input value={row.studentName} onChange={(e) => updateRowField(idx, 'studentName', e.target.value)} className="w-32 rounded-md border border-slate-300 px-2 py-1" /></td>
                        <td className="p-2"><input value={row.rollNo || ''} onChange={(e) => updateRowField(idx, 'rollNo', e.target.value)} className="w-16 rounded-md border border-slate-300 px-2 py-1" /></td>
                        <td className="p-2"><input value={row.className} onChange={(e) => updateRowField(idx, 'className', e.target.value)} className="w-20 rounded-md border border-slate-300 px-2 py-1" /></td>
                        <td className="space-y-1 p-2">
                          {Object.entries(row.marks).map(([subject, mark]) => (
                            <div key={subject} className="grid grid-cols-[1fr_68px] gap-1">
                              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1">{subject}</span>
                              <input value={String(mark ?? '')} onChange={(e) => updateMark(idx, subject, e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-center" />
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={handleApproveAndSave}
                disabled={isSaving}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-700 to-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                Approve & Save to DB
              </button>
            </section>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white p-3">
          {attachedPreview && <img src={attachedPreview} alt="Attachment Preview" className="mb-2 h-16 w-16 rounded-lg border object-cover" />}
          <div className="flex items-center gap-2">
            <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100">
              <ImagePlus size={18} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setAttachedFile(file);
                  setAttachedPreview(file ? URL.createObjectURL(file) : '');
                }}
              />
            </label>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything… e.g. Update Rahul in Class 5 Math to 95"
              className="h-10 flex-1 rounded-xl border border-slate-300 px-3 text-sm outline-none ring-indigo-400 focus:ring"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend || isSending}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white disabled:opacity-60"
            >
              {isSending ? <Loader2 size={16} className="animate-spin" /> : <SendHorizontal size={16} />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
