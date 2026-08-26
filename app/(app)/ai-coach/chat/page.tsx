"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PageLoader from "@/components/ui/PageLoader";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMsg {
  id: string;
  role: "user" | "coach";
  content: string;
  timestamp: string;
}

// ── Rule-based coach responses ────────────────────────────────────────────────

function getCoachResponse(input: string): string {
  const lower = input.toLowerCase();

  if (lower.includes("eat") || lower.includes("nutrition") || lower.includes("food") || lower.includes("diet")) {
    return "Focus on whole foods and hit your protein target. Aim for lean proteins at every meal, plenty of vegetables, and complex carbs around your workouts. Need a specific meal suggestion?";
  }
  if (lower.includes("workout") || lower.includes("train") || lower.includes("exercise")) {
    return "If you haven't trained in a few days, start with your weakest muscle group or a compound movement session. Progressive overload is key — try adding 1 rep or 2.5kg from last time.";
  }
  if (lower.includes("tired") || lower.includes("exhausted") || lower.includes("energy")) {
    return "Low energy can come from poor sleep, undereating, or overtraining. Check: Are you sleeping 7-8 hours? Eating enough carbs? Taking rest days? Sometimes a light walk or stretching session is better than pushing through.";
  }
  if (lower.includes("motivat") || lower.includes("lazy") || lower.includes("don't want")) {
    return "Motivation is temporary — discipline is what builds results. On tough days, commit to just 10 minutes. Once you start, you usually finish. Remember: showing up is 90% of the battle.";
  }
  if (lower.includes("weight") || lower.includes("fat") || lower.includes("lose") || lower.includes("gain")) {
    return "For weight management, track your weekly average weight rather than daily fluctuations. A 300-500 calorie deficit for fat loss or 200-300 surplus for muscle gain is sustainable. Patience is key!";
  }
  if (lower.includes("sleep") || lower.includes("rest") || lower.includes("recover")) {
    return "Sleep is your #1 recovery tool. Try: consistent sleep/wake times, no screens 30 min before bed, cool dark room, magnesium supplement. Aim for 7-9 hours.";
  }
  if (lower.includes("sore") || lower.includes("pain") || lower.includes("injury")) {
    return "Muscle soreness (DOMS) is normal after new exercises. If pain is sharp or in joints, stop and rest. Light movement, foam rolling, and adequate protein help recovery. Persistent pain needs medical attention.";
  }

  return "Great question! My general advice: stay consistent with training (3-4x/week), hit your protein goals, prioritize sleep, and track your progress. What specific area would you like help with — nutrition, training, or recovery?";
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AiCoachChatPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadChat() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setInitialLoading(false); return; }

      // Load chat history — coach_chat channel only
      const { data } = await supabase
        .from("ai_chat_messages")
        .select("id, role, content, timestamp")
        .eq("user_id", user.id)
        .eq("channel", "coach_chat")
        .order("timestamp", { ascending: true });

      if (data && data.length > 0) {
        setMessages(data.map((m) => ({ id: m.id, role: m.role as "user" | "coach", content: m.content, timestamp: m.timestamp })));
      } else {
        const welcome: ChatMsg = { id: "welcome", role: "coach", content: "Hey! I'm your AI fitness coach. Ask me anything about training, nutrition, recovery, or motivation. I'm here to help!", timestamp: new Date().toISOString() };
        setMessages([welcome]);
        await supabase.from("ai_chat_messages").insert({ user_id: user.id, role: "coach", content: welcome.content, channel: "coach_chat" });
      }

      setInitialLoading(false);
    }
    loadChat();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim()) return;
    const userContent = input.trim();

    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", content: userContent, timestamp: new Date().toISOString() };
    const response = getCoachResponse(userContent);
    const coachMsg: ChatMsg = { id: crypto.randomUUID(), role: "coach", content: response, timestamp: new Date().toISOString() };

    const updated = [...messages, userMsg, coachMsg];
    setMessages(updated);
    setInput("");

    // Persist to Supabase
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("ai_chat_messages").insert([
          { user_id: user.id, role: "user", content: userContent, channel: "coach_chat" },
          { user_id: user.id, role: "coach", content: response, channel: "coach_chat" },
        ]);
      }
    } catch (err) {
      console.error("Failed to save chat:", err);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  async function handleClearChat() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("ai_chat_messages").delete().eq("user_id", user.id).eq("channel", "coach_chat");
      }
    } catch {}

    const welcome: ChatMsg = { id: "welcome", role: "coach", content: "Chat cleared! How can I help you today?", timestamp: new Date().toISOString() };
    setMessages([welcome]);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("ai_chat_messages").insert({ user_id: user.id, role: "coach", content: welcome.content, channel: "coach_chat" });
      }
    } catch {}
  }

  if (initialLoading) {
    return (
      <PageLoader text="Loading chat..." />
    );
  }

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
