"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { loadChatHistory, saveChatHistory, getCoachResponse, type ChatMessage } from "@/lib/ai-coach";

export default function AiCoachChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const history = loadChatHistory();
    if (history.length === 0) {
      // Welcome message
      const welcome: ChatMessage = {
        id: "welcome",
        role: "coach",
        content: "Hey! I'm your AI fitness coach. Ask me anything about training, nutrition, recovery, or motivation. I'm here to help!",
        timestamp: new Date().toISOString(),
      };
      setMessages([welcome]);
      saveChatHistory([welcome]);
    } else {
      setMessages(history);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const response = getCoachResponse(input.trim());
    const coachMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "coach",
      content: response,
      timestamp: new Date().toISOString(),
    };

    const updated = [...messages, userMsg, coachMsg];
    setMessages(updated);
    saveChatHistory(updated);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClearChat() {
    const welcome: ChatMessage = {
      id: "welcome",
      role: "coach",
      content: "Chat cleared! How can I help you today?",
      timestamp: new Date().toISOString(),
    };
    setMessages([welcome]);
    saveChatHistory([welcome]);
  }

  if (!hydrated) return null;

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/ai-coach" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">&larr;</Link>
          <div>
            <h1 className="text-lg font-bold text-zinc-900">AI Coach Chat</h1>
            <p className="text-xs text-zinc-400">Rule-based responses · No external AI</p>
          </div>
        </div>
        <button type="button" onClick={handleClearChat} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50">
          Clear Chat
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={[
                "max-w-[80%] rounded-2xl px-4 py-3",
                msg.role === "user"
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 bg-white text-zinc-800 shadow-sm",
              ].join(" ")}>
                {msg.role === "coach" && (
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-[10px]">🤖</span>
                    <span className="text-[10px] font-semibold text-zinc-400">Coach</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className={`mt-1 text-[10px] ${msg.role === "user" ? "text-zinc-400" : "text-zinc-300"}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-zinc-100 pt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about training, nutrition, recovery..."
            aria-label="Message"
            className="h-10 flex-1 rounded-lg border border-zinc-200 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim()}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
          >
            Send
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {["How should I eat today?", "What workout should I do?", "I feel tired", "Help me stay motivated"].map((q) => (
            <button key={q} type="button" onClick={() => { setInput(q); }}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600 hover:border-zinc-400">
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
