"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getAIService, buildAIContext, buildChatPrompt, type AIMessage } from "@/lib/ai";

const CHAT_KEY = "fitnessapp_ai_chat_history";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

function loadChat(): ChatMsg[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveChat(msgs: ChatMsg[]) {
  localStorage.setItem(CHAT_KEY, JSON.stringify(msgs));
}

function timeStr(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const history = loadChat();
    if (history.length === 0) {
      const welcome: ChatMsg = { id: "welcome", role: "assistant", content: "Hey! I'm your AI fitness coach. I have access to your profile, nutrition, training, and progress data — ask me anything and I'll give you personalized advice.", timestamp: new Date().toISOString() };
      setMessages([welcome]);
      saveChat([welcome]);
    } else {
      setMessages(history);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", content: input.trim(), timestamp: new Date().toISOString() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      // Build context from user data
      const context = buildAIContext();

      // Build prompt with history
      const aiHistory: AIMessage[] = messages.slice(-8).map((m) => ({ role: m.role === "assistant" ? "assistant" as const : "user" as const, content: m.content }));
      const promptMessages = buildChatPrompt(aiHistory, userMsg.content, context);

      // Call AI service
      const service = getAIService();
      const response = await service.complete({ messages: promptMessages, context });

      const assistantMsg: ChatMsg = { id: crypto.randomUUID(), role: "assistant", content: response.content, timestamp: new Date().toISOString() };
      const final = [...updated, assistantMsg];
      setMessages(final);
      saveChat(final);
    } catch {
      const errorMsg: ChatMsg = { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I encountered an error. Please try again.", timestamp: new Date().toISOString() };
      const final = [...updated, errorMsg];
      setMessages(final);
      saveChat(final);
    }

    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleClear() {
    const welcome: ChatMsg = { id: "welcome", role: "assistant", content: "Chat cleared! How can I help you today?", timestamp: new Date().toISOString() };
    setMessages([welcome]);
    saveChat([welcome]);
  }

  if (!hydrated) return null;

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/ai" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">&larr;</Link>
          <div>
            <h1 className="text-lg font-bold text-zinc-900">AI Coach</h1>
            <p className="text-xs text-zinc-400">Context-aware • Provider-agnostic</p>
          </div>
        </div>
        <button type="button" onClick={handleClear} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50">
          Clear Chat
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={["max-w-[80%] rounded-2xl px-4 py-3",
                msg.role === "user" ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white text-zinc-800 shadow-sm",
              ].join(" ")}>
                {msg.role === "assistant" && (
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-blue-100 text-[10px]">AI</span>
                    <span className="text-[10px] font-semibold text-zinc-400">Coach</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <p className={`mt-1 text-[10px] ${msg.role === "user" ? "text-zinc-400" : "text-zinc-300"}`}>{timeStr(msg.timestamp)}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-zinc-100 pt-4">
        <div className="flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Ask about nutrition, training, recovery..." aria-label="Message" disabled={loading}
            className="h-10 flex-1 rounded-lg border border-zinc-200 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50" />
          <button type="button" onClick={handleSend} disabled={!input.trim() || loading}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50">
            Send
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {["What should I eat today?", "Suggest a workout", "How's my progress?", "I need motivation"].map((q) => (
            <button key={q} type="button" onClick={() => setInput(q)}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600 hover:border-zinc-400">
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
