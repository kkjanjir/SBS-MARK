'use client'

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, ImagePlus, Send, X } from 'lucide-react';

type AIMarksRow = {
  studentName: string;
  rollNo: string;
  className?: string;
  marks: Record<string, number | string>;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  text?: string;
  imagePreview?: string;
  rows?: AIMarksRow[];
};

const SYSTEM_PROMPT =
  "You are the EduPrime Data Assistant. Extract student names, roll numbers, and marks from the provided image based strictly on the user's instructions. Return ONLY a valid JSON array of student objects. Do not include markdown formatting like ```json in the final string, just the raw JSON array.";

function toMarksState(marks: Record<string, number | string>) {
  const shaped: Record<string, { t1: string; t2: string; t3: string }> = {};
  Object.entries(marks || {}).forEach(([subject, value]) => {
    shaped[subject] = { t1: '', t2: '', t3: String(value ?? '').trim() };
  });
  return shaped;
}

function safeParseRows(raw: string): AIMarksRow[] {
  const sanitized = raw.trim().replace(/^```json\s*/i, '').replace(/^```/i, '').replace(/```$/, '').trim();
  const parsed = JSON.parse(sanitized);
  if (!Array.isArray(parsed)) throw new Error('AI response is not a JSON array');
  return parsed.map((r) => ({
    studentName: String(r.studentName || r.name || '').trim(),
    rollNo: String(r.rollNo || r.roll_no || r.roll || '').trim(),
    className: String(r.className || r.class || '').trim(),
    marks: (r.marks || {}) as Record<string, number | string>,
  }));
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

export default function AIDataAssistant() {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState('Extract all students and marks clearly.');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingRows, setPendingRows] = useState<AIMarksRow[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'Hi! I am EduPrime Data Assistant. Upload a marksheet image and give instructions.' },
  ]);

  const chatSessionRef = useRef<any>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, pendingRows, open]);

  const canSend = useMemo(() => !!file && instruction.trim().length > 0, [file, instruction]);

  const initGeminiChat = async () => {
    if (chatSessionRef.current) return chatSessionRef.current;
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Missing NEXT_PUBLIC_GEMINI_API_KEY in .env');

    const importFromUrl = new Function('u', 'return import(u)');
    const sdk = await (importFromUrl as any)('https://esm.sh/@google/generative-ai');
    const genAI = new sdk.GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: SYSTEM_PROMPT });
    chatSessionRef.current = model.startChat({ history: [] });
    return chatSessionRef.current;
  };

  const handleSend = async () => {
    if (!file || !canSend || sending) return;
    setSending(true);
    try {
      setMessages((prev) => [...prev, { role: 'user', text: instruction, imagePreview: preview }]);
      const base64 = await fileToBase64(file);
      const chat = await initGeminiChat();
      const result = await chat.sendMessage([
        { text: instruction },
        { inlineData: { mimeType: file.type || 'image/jpeg', data: base64 } },
      ]);
      const text = result?.response?.text?.() || '[]';
      const rows = safeParseRows(text);
      setPendingRows(rows);
      setMessages((prev) => [...prev, { role: 'assistant', text: `Parsed ${rows.length} students. Please review and approve.`, rows }]);
      setFile(null);
      setPreview('');
    } catch (error: any) {
      setMessages((prev) => [...prev, { role: 'assistant', text: error.message || 'Failed to process image.' }]);
    } finally {
      setSending(false);
    }
  };

  const updateCell = (rowIdx: number, field: 'studentName' | 'rollNo' | 'className', value: string) => {
    setPendingRows((prev) => prev.map((row, idx) => (idx === rowIdx ? { ...row, [field]: value } : row)));
  };

  const updateMark = (rowIdx: number, subject: string, value: string) => {
    setPendingRows((prev) =>
      prev.map((row, idx) => (idx === rowIdx ? { ...row, marks: { ...row.marks, [subject]: value } } : row))
    );
  };

  const handleApproveSave = async () => {
    if (!pendingRows.length) return;
    setSaving(true);
    try {
      const importFromUrl = new Function('u', 'return import(u)');
      const dexieModule = await (importFromUrl as any)('https://esm.sh/dexie');
      const Dexie = dexieModule.default;

      const db = new Dexie('sbs_offline_db');
      db.version(1).stores({ marks_records: 'id,class_name,student_name,roll_no,updated_at' });
      const table = db.table('marks_records');

      const all = await table.toArray();
      for (const row of pendingRows) {
        const className = (row.className || '').replace(/^class\s*/i, '').trim().toUpperCase() || '5';
        const existing = all.find((r: any) =>
          r.student_name?.trim().toLowerCase() === row.studentName.trim().toLowerCase() &&
          r.class_name?.trim().toLowerCase() === className.toLowerCase() &&
          (row.rollNo ? r.roll_no === row.rollNo : true)
        );

        const now = new Date().toISOString();
        const marks_data = toMarksState(row.marks);

        const payload = existing
          ? {
              ...existing,
              student_name: row.studentName,
              roll_no: row.rollNo || existing.roll_no || '',
              class_name: className,
              marks_data: { ...(existing.marks_data || {}), ...marks_data },
              updated_at: now,
            }
          : {
              id: crypto.randomUUID(),
              student_name: row.studentName,
              roll_no: row.rollNo || '',
              class_name: className,
              student_data: { name: row.studentName, roll: row.rollNo || '', mother: '', father: '', gender: 'MALE', photo: null },
              marks_data,
              extra_data: { attendance: '', remark: '', issueDate: now.slice(0, 10), coScholastic: { sports: 'A', art: 'A', music: 'A', discipline: 'A' } },
              created_at: now,
              updated_at: now,
            };

        await table.put(payload);
      }

      setMessages((prev) => [...prev, { role: 'assistant', text: 'Data successfully saved locally!' }]);
      setPendingRows([]);
    } catch (error: any) {
      setMessages((prev) => [...prev, { role: 'assistant', text: error.message || 'Failed to save locally.' }]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-[80] h-14 w-14 rounded-full bg-schoolBlue text-white shadow-xl flex items-center justify-center">
        <Bot size={24} />
      </button>

      <div className={`fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white border-l shadow-2xl z-[90] transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="px-4 py-3 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex justify-between items-center">
            <div>
              <div className="font-bold">EduPrime Data Assistant</div>
              <div className="text-xs text-blue-100">Multimodal Marksheet Parser</div>
            </div>
            <button onClick={() => setOpen(false)}><X size={18} /></button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-3 bg-gray-50 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`rounded-xl p-3 text-sm ${m.role === 'user' ? 'bg-blue-600 text-white ml-8' : 'bg-white border mr-8'}`}>
                {m.imagePreview && <img src={m.imagePreview} className="w-24 h-24 rounded object-cover mb-2" />}
                {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
              </div>
            ))}

            {pendingRows.length > 0 && (
              <div className="bg-white border rounded-xl p-3">
                <h4 className="font-bold text-indigo-700 mb-2">Review & Approve ({pendingRows.length})</h4>
                <div className="overflow-auto max-h-72 border rounded">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">Roll</th>
                        <th className="p-2 text-left">Class</th>
                        <th className="p-2 text-left">Subjects / Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRows.map((row, idx) => (
                        <tr key={idx} className="border-t align-top">
                          <td className="p-2"><input value={row.studentName} onChange={(e) => updateCell(idx, 'studentName', e.target.value)} className="border rounded px-2 py-1 w-36" /></td>
                          <td className="p-2"><input value={row.rollNo} onChange={(e) => updateCell(idx, 'rollNo', e.target.value)} className="border rounded px-2 py-1 w-20" /></td>
                          <td className="p-2"><input value={row.className || ''} onChange={(e) => updateCell(idx, 'className', e.target.value)} className="border rounded px-2 py-1 w-24" /></td>
                          <td className="p-2 space-y-1">
                            {Object.entries(row.marks || {}).map(([sub, val]) => (
                              <div key={sub} className="grid grid-cols-[1fr_72px] gap-2">
                                <input value={sub} readOnly className="border rounded px-2 py-1 bg-gray-50" />
                                <input value={String(val ?? '')} onChange={(e) => updateMark(idx, sub, e.target.value)} className="border rounded px-2 py-1 text-center" />
                              </div>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={handleApproveSave} disabled={saving} className="mt-3 w-full bg-indigo-700 text-white py-2 rounded-lg font-bold disabled:opacity-50">
                  {saving ? 'Saving...' : 'Approve & Save to Database'}
                </button>
              </div>
            )}
          </div>

          <div className="border-t p-3 bg-white">
            {preview && <img src={preview} className="w-16 h-16 rounded object-cover mb-2 border" />}
            <div className="flex gap-2">
              <button onClick={() => fileRef.current?.click()} className="h-10 w-10 border rounded flex items-center justify-center"><ImagePlus size={18} /></button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const selected = e.target.files?.[0] || null;
                setFile(selected);
                setPreview(selected ? URL.createObjectURL(selected) : '');
              }} />
              <input value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="e.g. Extract only Math and Science marks" className="flex-1 border rounded px-3 py-2 text-sm" />
              <button onClick={handleSend} disabled={!canSend || sending} className="h-10 w-10 bg-blue-600 text-white rounded flex items-center justify-center disabled:opacity-50"><Send size={16} /></button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
