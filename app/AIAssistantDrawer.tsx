'use client'

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, ImagePlus, Send, X } from 'lucide-react';
import type { GeminiScannedStudent } from './geminiBatchScan';

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
  imagePreview?: string;
};

const SYSTEM_INSTRUCTION = `You are Janjir, a highly accurate data extraction AI for the 'Dev By JANJIR' school ERP. Process the provided marksheet image strictly according to the user's instructions. You MUST output the final extracted data as a valid JSON array of objects. Format the response strictly inside a markdown block with json fences.`;

type Props = {
  onApproveSave: (rows: GeminiScannedStudent[]) => Promise<{ updated: number; inserted: number }>;
};

function extractJsonArrayFromMarkdown(text: string): GeminiScannedStudent[] {
  const blockMatch = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = (blockMatch?.[1] || text).trim();
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('AI response is not a JSON array.');
  return parsed
    .filter((r) => r?.studentName && r?.className && r?.marks)
    .map((r) => ({ studentName: String(r.studentName), className: String(r.className), marks: r.marks || {} }));
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
    reader.onerror = () => reject(new Error('Failed to read image.'));
    reader.readAsDataURL(file);
  });
}

export default function AIAssistantDrawer({ onApproveSave }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'Hi, I am Janjir for Dev By JANJIR. Upload a sheet and tell me what to extract.' },
  ]);
  const [draftRows, setDraftRows] = useState<GeminiScannedStudent[]>([]);
  const [saving, setSaving] = useState(false);

  const chatSessionRef = useRef<any>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  const canSend = useMemo(() => text.trim().length > 0 || !!imageFile, [text, imageFile]);

  const initChat = async () => {
    if (chatSessionRef.current) return chatSessionRef.current;
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Missing NEXT_PUBLIC_GEMINI_API_KEY in .env');

    const importFromUrl = new Function('u', 'return import(u)');
    const sdk = await (importFromUrl as any)('https://esm.sh/@google/generative-ai');
    const genAI = new sdk.GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    chatSessionRef.current = model.startChat({ history: [] });
    return chatSessionRef.current;
  };

  const send = async () => {
    if (!canSend || sending) return;
    setSending(true);

    try {
      const userText = text.trim() || 'Extract all student records from the uploaded marksheet image.';
      const imagePreview = preview;
      setMessages((prev) => [...prev, { role: 'user', text: userText, imagePreview }]);

      const parts: any[] = [{ text: userText }];
      if (imageFile) {
        parts.push({ inlineData: { data: await fileToBase64(imageFile), mimeType: imageFile.type || 'image/jpeg' } });
      }

      const chat = await initChat();
      const result = await chat.sendMessage(parts);
      const reply = result?.response?.text?.() || 'No response from Janjir.';
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);

      const rows = extractJsonArrayFromMarkdown(reply);
      setDraftRows(rows);

      setText('');
      setImageFile(null);
      setPreview('');
    } catch (error: any) {
      setMessages((prev) => [...prev, { role: 'assistant', text: error.message || 'Extraction failed.' }]);
    } finally {
      setSending(false);
    }
  };

  const updateRow = (idx: number, patch: Partial<GeminiScannedStudent>) => {
    setDraftRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const updateMark = (idx: number, subject: string, value: string) => {
    setDraftRows((prev) => prev.map((r, i) => (i === idx ? { ...r, marks: { ...r.marks, [subject]: value } } : r)));
  };

  const approveAndSave = async () => {
    if (!draftRows.length) return;
    setSaving(true);
    try {
      const result = await onApproveSave(draftRows);
      setMessages((prev) => [...prev, { role: 'assistant', text: `Successfully processed ${result.updated + result.inserted} students (${result.updated} updated, ${result.inserted} new).` }]);
      setDraftRows([]);
    } catch (error: any) {
      setMessages((prev) => [...prev, { role: 'assistant', text: error.message || 'Save failed.' }]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-[80] h-14 w-14 rounded-full bg-schoolBlue text-white shadow-2xl flex items-center justify-center hover:bg-blue-800">
        <Bot size={24} />
      </button>

      <div className={`fixed top-0 right-0 h-full w-full sm:w-[440px] bg-white shadow-2xl z-[90] transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="px-4 py-3 border-b bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
            <div>
              <div className="font-extrabold">Janjir AI Assistant</div>
              <div className="text-xs text-blue-100">Dev By JANJIR</div>
            </div>
            <button onClick={() => setOpen(false)}><X size={20} /></button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((m, idx) => (
              <div key={idx} className={`rounded-xl p-3 text-sm ${m.role === 'user' ? 'bg-schoolBlue text-white ml-8' : 'bg-white border border-gray-200 mr-8'}`}>
                {m.imagePreview && <img src={m.imagePreview} className="w-24 h-24 object-cover rounded mb-2 border border-white/40" />}
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>
            ))}

            {draftRows.length > 0 && (
              <div className="bg-white border border-indigo-200 rounded-xl p-3">
                <div className="font-bold text-indigo-700 mb-2">Review & Edit ({draftRows.length})</div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {draftRows.map((row, idx) => (
                    <div key={idx} className="border rounded-lg p-2 bg-gray-50">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input value={row.studentName} onChange={(e) => updateRow(idx, { studentName: e.target.value })} className="border rounded px-2 py-1 text-xs" />
                        <input value={row.className} onChange={(e) => updateRow(idx, { className: e.target.value })} className="border rounded px-2 py-1 text-xs" />
                      </div>
                      {Object.entries(row.marks || {}).map(([sub, val]) => (
                        <div key={sub} className="grid grid-cols-[1fr_72px] gap-2 mb-1">
                          <input value={sub} readOnly className="border rounded px-2 py-1 text-xs bg-white" />
                          <input value={String(val ?? '')} onChange={(e) => updateMark(idx, sub, e.target.value)} className="border rounded px-2 py-1 text-xs" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <button onClick={approveAndSave} disabled={saving} className="mt-3 w-full bg-indigo-700 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60">{saving ? 'Saving...' : 'Approve & Save'}</button>
              </div>
            )}
          </div>

          <div className="border-t p-3 bg-white">
            {preview && <img src={preview} className="w-16 h-16 object-cover rounded border mb-2" />}
            <div className="flex gap-2">
              <button onClick={() => fileRef.current?.click()} className="h-10 w-10 rounded-lg border border-gray-300 flex items-center justify-center"><ImagePlus size={18} /></button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setImageFile(file);
                if (file) setPreview(URL.createObjectURL(file));
                else setPreview('');
              }} />
              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="Tell Janjir what to extract..." className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <button onClick={send} disabled={!canSend || sending} className="h-10 w-10 rounded-lg bg-schoolBlue text-white flex items-center justify-center disabled:opacity-50"><Send size={16} /></button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
