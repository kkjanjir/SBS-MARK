'use client'

import { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';

type ChatMessage = { role: 'user' | 'assistant'; text: string };

const SYSTEM_INSTRUCTION =
  'You are EduPrime AI, a helpful assistant for a school management system. Answer user queries kindly.';

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'Hi! I am EduPrime AI. How can I help you today?' },
  ]);
  const [isSending, setIsSending] = useState(false);
  const chatRef = useRef<any>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const initChatIfNeeded = async () => {
    if (chatRef.current) return chatRef.current;
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Missing NEXT_PUBLIC_GEMINI_API_KEY in .env');

    const importFromUrl = new Function('u', 'return import(u)');
    const sdk = await (importFromUrl as any)('https://esm.sh/@google/generative-ai');
    const genAI = new sdk.GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    chatRef.current = model.startChat({
      history: [],
      generationConfig: { temperature: 0.5 },
    });

    return chatRef.current;
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setIsSending(true);

    try {
      const chat = await initChatIfNeeded();
      const result = await chat.sendMessage(text);
      const reply = result?.response?.text?.() || 'Sorry, I could not generate a response.';
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch (error: any) {
      setMessages((prev) => [...prev, { role: 'assistant', text: error.message || 'Failed to contact AI assistant.' }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[70]">
      {isOpen ? (
        <div className="w-[340px] h-[480px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="bg-schoolBlue text-white px-4 py-3 flex items-center justify-between">
            <div className="font-bold flex items-center gap-2"><Bot size={18}/> EduPrime AI</div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded"><X size={18} /></button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {messages.map((m, idx) => (
              <div key={idx} className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${m.role === 'user' ? 'ml-auto bg-schoolBlue text-white' : 'mr-auto bg-white border border-gray-200 text-gray-800'}`}>
                {m.text}
              </div>
            ))}
            {isSending && <div className="text-xs text-gray-500">EduPrime AI is typing...</div>}
          </div>

          <div className="p-3 border-t bg-white flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
              placeholder="Ask anything..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-schoolBlue"
            />
            <button onClick={sendMessage} disabled={isSending} className="bg-schoolBlue text-white px-3 rounded-lg disabled:opacity-50">
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="bg-schoolBlue text-white rounded-full w-14 h-14 shadow-2xl flex items-center justify-center hover:bg-blue-800">
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
}
