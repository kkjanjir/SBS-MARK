'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Expand,
  ImagePlus,
  Minimize2,
  Send,
  Square,
  X,
  Sparkles,
  CheckCircle2,
  Database,
  PlayCircle,
} from 'lucide-react';

type ChatRole = 'user' | 'assistant';

type StudentLikeRow = {
  name?: string;
  class?: string;
  roll?: string;
  marks?: Record<string, string | number>;
  [key: string]: unknown;
};

type ActionCommand = {
  action: 'UPDATE' | 'FIND' | 'DELETE' | 'INSERT';
  student?: string;
  class?: string;
  roll?: string;
  updates?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  query?: Record<string, unknown>;
  [key: string]: unknown;
};

type AssistantPayload =
  | { kind: 'text'; text: string }
  | { kind: 'table'; rows: StudentLikeRow[] }
  | { kind: 'action'; command: ActionCommand };

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  imagePreview?: string;
  payload: AssistantPayload;
  createdAt: string;
};

type WindowState = {
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
};

const DB_NAME = 'eduprime_ai_assistant_db';
const DB_VERSION = 1;
const STORE = 'students';

const SYSTEM_PROMPT = `You are EduPrime SMS Universal Gemini Manager for offline-first school ERP workflows.

Response Modes (STRICT):
1) If the user asks to extract marksheet data, return ONLY a raw JSON array of student objects.
   Example: [{"name":"Rahul","class":"10A","marks":{"Math":95,"Science":88}}]
2) If the user asks to find/edit/update/delete/insert a record, return ONLY a structured JSON command object.
   Example: {"action":"UPDATE","student":"Rahul","class":"10A","updates":{"marks.Math":95}}
3) For all other user messages, return normal conversational text.

Do not include markdown code fences for JSON. JSON must be directly parseable.`;

function createMessage(role: ChatRole, text: string, payload?: AssistantPayload, imagePreview?: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    text,
    imagePreview,
    payload: payload ?? { kind: 'text', text },
    createdAt: new Date().toISOString(),
  };
}

function extractJsonCandidate(raw: string): string {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fence?.[1] ?? raw).trim();
}

function parseAssistantPayload(raw: string): AssistantPayload {
  const candidate = extractJsonCandidate(raw);

  try {
    const parsed = JSON.parse(candidate);

    if (Array.isArray(parsed)) {
      const rows = parsed.filter((row) => row && typeof row === 'object') as StudentLikeRow[];
      return { kind: 'table', rows };
    }

    if (parsed && typeof parsed === 'object') {
      const cmd = parsed as ActionCommand;
      if (typeof cmd.action === 'string') {
        return { kind: 'action', command: cmd };
      }
    }
  } catch {
    // Conversational text fallback.
  }

  return { kind: 'text', text: raw };
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const out = String(reader.result ?? '');
      resolve(out.split(',')[1] || '');
    };
    reader.onerror = () => reject(new Error('Failed to read image for Gemini request.'));
    reader.readAsDataURL(file);
  });
}

async function getDb(): Promise<IDBDatabase> {
  return await new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('class', 'class', { unique: false });
        store.createIndex('roll', 'roll', { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB.'));
  });
}

async function txDone(tx: IDBTransaction): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function saveRowsToDb(rows: StudentLikeRow[]): Promise<number> {
  const db = await getDb();
  const tx = db.transaction(STORE, 'readwrite');
  const os = tx.objectStore(STORE);

  rows.forEach((row) => {
    const now = new Date().toISOString();
    const name = String(row.name ?? 'Unknown');
    const className = String(row.class ?? 'N/A');
    const roll = String(row.roll ?? '');
    const id = `${name.toLowerCase()}-${className.toLowerCase()}-${roll.toLowerCase() || 'na'}`;

    os.put({
      id,
      name,
      class: className,
      roll,
      marks: row.marks ?? {},
      source: 'GlobalAIAssistant',
      raw: row,
      updatedAt: now,
      createdAt: now,
    });
  });

  await txDone(tx);
  db.close();
  return rows.length;
}

async function executeActionCommand(command: ActionCommand): Promise<string> {
  const db = await getDb();
  const action = String(command.action || '').toUpperCase();

  if (action === 'FIND') {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    const rows = await new Promise<any[]>((resolve, reject) => {
      req.onsuccess = () => resolve((req.result as any[]) ?? []);
      req.onerror = () => reject(req.error);
    });
    await txDone(tx);
    db.close();

    const student = String(command.student ?? '').toLowerCase();
    const className = String(command.class ?? '').toLowerCase();
    const matched = rows.filter(
      (r) =>
        (!student || String(r.name ?? '').toLowerCase().includes(student)) &&
        (!className || String(r.class ?? '').toLowerCase() === className)
    );

    return `Found ${matched.length} matching record(s) in local database.`;
  }

  if (action === 'DELETE') {
    const tx = db.transaction(STORE, 'readwrite');
    const os = tx.objectStore(STORE);
    const id = `${String(command.student ?? '').toLowerCase()}-${String(command.class ?? '').toLowerCase()}-${String(command.roll ?? '').toLowerCase() || 'na'}`;
    os.delete(id);
    await txDone(tx);
    db.close();
    return 'Delete command executed in local IndexedDB.';
  }

  if (action === 'UPDATE' || action === 'INSERT') {
    const name = String(command.student ?? command.payload?.name ?? 'Unknown');
    const className = String(command.class ?? command.payload?.class ?? 'N/A');
    const roll = String(command.roll ?? command.payload?.roll ?? '');
    const id = `${name.toLowerCase()}-${className.toLowerCase()}-${roll.toLowerCase() || 'na'}`;

    const tx = db.transaction(STORE, 'readwrite');
    const os = tx.objectStore(STORE);

    const currentReq = os.get(id);
    const existing = await new Promise<Record<string, unknown> | undefined>((resolve, reject) => {
      currentReq.onsuccess = () => resolve(currentReq.result as Record<string, unknown> | undefined);
      currentReq.onerror = () => reject(currentReq.error);
    });

    const record = {
      id,
      name,
      class: className,
      roll,
      marks: (existing?.marks as Record<string, unknown>) ?? {},
      ...(existing ?? {}),
      ...(command.payload ?? {}),
      updatedAt: new Date().toISOString(),
    } as Record<string, unknown>;

    if (command.updates && typeof command.updates === 'object') {
      Object.entries(command.updates).forEach(([k, v]) => {
        if (k.startsWith('marks.')) {
          const key = k.replace('marks.', '');
          record.marks = { ...(record.marks as Record<string, unknown>), [key]: v };
        } else {
          record[k] = v;
        }
      });
    }

    os.put(record);
    await txDone(tx);
    db.close();
    return `${action} command executed for ${name} (${className}).`;
  }

  db.close();
  throw new Error(`Unsupported action: ${command.action}`);
}

export default function GlobalAIAssistant() {
  const [windowState, setWindowState] = useState<WindowState>({ isOpen: false, isMinimized: false, isMaximized: false });
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage(
      'assistant',
      'Hi! I am EduPrime AI. Send a message, or add an image for marksheet extraction. I work fully with local IndexedDB approvals.'
    ),
  ]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [busyActionId, setBusyActionId] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, windowState.isOpen, windowState.isMinimized]);

  const showFab = !windowState.isOpen || windowState.isMinimized;

  const canSend = useMemo(() => input.trim().length > 0 || Boolean(imageFile), [input, imageFile]);

  const initializeChat = async () => {
    if (chatRef.current) return chatRef.current;

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Missing NEXT_PUBLIC_GEMINI_API_KEY.');

    const importFromUrl = new Function('u', 'return import(u)');
    const sdk = await (importFromUrl as (u: string) => Promise<any>)('https://esm.sh/@google/generative-ai');
    const genAI = new sdk.GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    });

    chatRef.current = model.startChat({ history: [] });
    return chatRef.current;
  };

  const onSend = async () => {
    if (!canSend || sending) return;

    setSending(true);
    try {
      const userText = input.trim() || 'Please extract marksheet entries from this image.';
      const userMessage = createMessage('user', userText, { kind: 'text', text: userText }, imagePreview || undefined);
      setMessages((prev) => [...prev, userMessage]);

      const parts: any[] = [];
      if (userText) parts.push({ text: userText });

      if (imageFile) {
        const data = await toBase64(imageFile);
        parts.push({ inlineData: { data, mimeType: imageFile.type || 'image/jpeg' } });
      }

      const chat = await initializeChat();
      const result = await chat.sendMessage(parts);
      const replyText = result?.response?.text?.() || 'No response from Gemini.';
      const payload = parseAssistantPayload(replyText);
      const assistantMessage = createMessage('assistant', replyText, payload);
      setMessages((prev) => [...prev, assistantMessage]);

      setInput('');
      setImageFile(null);
      setImagePreview('');
    } catch (error: any) {
      setMessages((prev) => [...prev, createMessage('assistant', error?.message || 'Request failed. Please retry.')]);
    } finally {
      setSending(false);
    }
  };

  const handleApproveTableSave = async (message: ChatMessage, rows: StudentLikeRow[]) => {
    setBusyActionId(message.id);
    try {
      const count = await saveRowsToDb(rows);
      setMessages((prev) => [...prev, createMessage('assistant', `Approved and saved ${count} record(s) to local IndexedDB.`)]);
    } catch (error: any) {
      setMessages((prev) => [...prev, createMessage('assistant', error?.message || 'Could not save table to IndexedDB.')]);
    } finally {
      setBusyActionId(null);
    }
  };

  const handleConfirmCommand = async (message: ChatMessage, command: ActionCommand) => {
    setBusyActionId(message.id);
    try {
      const result = await executeActionCommand(command);
      setMessages((prev) => [...prev, createMessage('assistant', result)]);
    } catch (error: any) {
      setMessages((prev) => [...prev, createMessage('assistant', error?.message || 'Could not execute action command.')]);
    } finally {
      setBusyActionId(null);
    }
  };

  const openChat = () => setWindowState({ isOpen: true, isMinimized: false, isMaximized: false });
  const minimizeChat = () => setWindowState((s) => ({ ...s, isOpen: true, isMinimized: true, isMaximized: false }));
  const closeChat = () => setWindowState({ isOpen: false, isMinimized: false, isMaximized: false });
  const toggleMaximize = () => setWindowState((s) => ({ ...s, isOpen: true, isMinimized: false, isMaximized: !s.isMaximized }));

  const windowClass = windowState.isMaximized
    ? 'fixed inset-3 sm:inset-6 z-[120]'
    : 'fixed bottom-6 right-6 z-[120] w-[calc(100vw-1.5rem)] sm:w-[430px] h-[76vh] max-h-[720px]';

  return (
    <>
      {showFab && (
        <button
          onClick={openChat}
          className="fixed bottom-6 right-6 z-[110] h-14 w-14 rounded-full bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-[0_18px_35px_rgba(37,99,235,0.45)] transition hover:scale-105 active:scale-95"
          aria-label="Open AI assistant"
          title="Open AI assistant"
        >
          <Bot className="mx-auto" size={24} />
        </button>
      )}

      {windowState.isOpen && !windowState.isMinimized && (
        <section className={`${windowClass} rounded-2xl border border-white/25 bg-white/95 backdrop-blur-xl shadow-2xl overflow-hidden`}>
          <header className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white border-b border-indigo-300/25">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/20 grid place-content-center">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">EduPrime AI Assistant</p>
                <p className="text-[11px] text-indigo-200">Universal Gemini Manager · Offline First</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button onClick={minimizeChat} className="rounded-md p-1.5 hover:bg-white/15" aria-label="Minimize">
                <Minimize2 size={16} />
              </button>
              <button onClick={toggleMaximize} className="rounded-md p-1.5 hover:bg-white/15" aria-label="Maximize">
                {windowState.isMaximized ? <Square size={15} /> : <Expand size={16} />}
              </button>
              <button onClick={closeChat} className="rounded-md p-1.5 hover:bg-rose-500/70" aria-label="Close">
                <X size={16} />
              </button>
            </div>
          </header>

          <div ref={listRef} className="h-[calc(100%-133px)] overflow-y-auto bg-slate-50 p-3 space-y-3">
            {messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <article key={message.id} className={`rounded-2xl p-3 ${isUser ? 'ml-10 bg-indigo-600 text-white' : 'mr-10 bg-white border border-slate-200 text-slate-800'}`}>
                  {message.imagePreview && <img src={message.imagePreview} alt="attachment" className="mb-2 h-24 w-24 rounded-lg border object-cover" />}

                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.payload.kind === 'text' ? message.payload.text : message.text}</p>

                  {message.payload.kind === 'table' && (
                    <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">Detected Marksheet Data ({message.payload.rows.length})</p>
                      <div className="max-h-64 overflow-auto rounded-lg border border-indigo-100 bg-white">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-indigo-100 text-indigo-800">
                            <tr>
                              <th className="px-2 py-2 text-left">Name</th>
                              <th className="px-2 py-2 text-left">Class</th>
                              <th className="px-2 py-2 text-left">Roll</th>
                              <th className="px-2 py-2 text-left">Marks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {message.payload.rows.map((row, i) => (
                              <tr key={`${message.id}-row-${i}`} className="border-t border-indigo-100 align-top">
                                <td className="px-2 py-1.5">{String(row.name ?? '-')}</td>
                                <td className="px-2 py-1.5">{String(row.class ?? '-')}</td>
                                <td className="px-2 py-1.5">{String(row.roll ?? '-')}</td>
                                <td className="px-2 py-1.5">
                                  <pre className="whitespace-pre-wrap break-words text-[11px] text-slate-700">{JSON.stringify(row.marks ?? {}, null, 2)}</pre>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <button
                        onClick={() => {
                          if (message.payload.kind !== 'table') return;
                          handleApproveTableSave(message, message.payload.rows);
                        }}
                        disabled={busyActionId === message.id}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                      >
                        <Database size={14} />
                        {busyActionId === message.id ? 'Saving...' : 'Approve & Save to Database'}
                      </button>
                    </div>
                  )}

                  {message.payload.kind === 'action' && (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">Action Command Preview</p>
                      <pre className="rounded-md bg-white p-2 text-[11px] text-slate-700 border border-emerald-100 overflow-auto">{JSON.stringify(message.payload.command, null, 2)}</pre>
                      <button
                        onClick={() => {
                          if (message.payload.kind !== 'action') return;
                          handleConfirmCommand(message, message.payload.command);
                        }}
                        disabled={busyActionId === message.id}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <PlayCircle size={14} />
                        {busyActionId === message.id ? 'Executing...' : 'Confirm & Execute'}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <footer className="border-t border-slate-200 bg-white p-3">
            {imagePreview && (
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                <img src={imagePreview} alt="selected" className="h-14 w-14 rounded-md border object-cover" />
                <div className="flex-1 text-xs text-slate-600">Image attached. You can still send text-only by removing it.</div>
                <button
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                  }}
                  className="rounded-md p-1 text-slate-500 hover:bg-slate-200"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button onClick={() => fileRef.current?.click()} className="h-10 w-10 shrink-0 rounded-lg border border-slate-300 text-slate-700 grid place-content-center hover:bg-slate-100" title="Attach image">
                <ImagePlus size={17} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setImageFile(file);
                  if (file) setImagePreview(URL.createObjectURL(file));
                  else setImagePreview('');
                }}
              />

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                placeholder="Ask anything, extract marks, or request record updates..."
                className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
              />

              <button
                onClick={onSend}
                disabled={!canSend || sending}
                className="h-10 w-10 shrink-0 rounded-lg bg-indigo-600 text-white grid place-content-center hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-55"
                title="Send"
              >
                <Send size={16} />
              </button>
            </div>

            <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
              <CheckCircle2 size={12} className="text-emerald-600" />
              Human-in-the-loop mode enabled: AI outputs require your confirmation before DB writes.
            </div>
          </footer>
        </section>
      )}
    </>
  );
}
