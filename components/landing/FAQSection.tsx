"use client";

import { useState } from "react";

type FAQItem = {
  question: string;
  answer: string;
};

const faqs: FAQItem[] = [
  {
    question: "Can I use FitnessApp without a coach?",
    answer:
      "Yes. You can self-register as a client and use all the core features — workout programs, nutrition tracking, progress photos, and the AI Coach — independently. You can always connect with a coach later if you want a more personalised experience.",
  },
  {
    question: "How does the AI Coach work?",
    answer:
      "The AI Coach is a conversational assistant powered by GPT-4o. It has access to your current program, recent measurements, and dietary goals so it can answer questions, suggest recipe alternatives, modify exercises, and keep you on track — all within the context of your actual data.",
  },
  {
    question: "Can I switch plans at any time?",
    answer:
      "Absolutely. You can upgrade or downgrade your plan at any point from your account settings. Upgrades take effect immediately. When downgrading, you retain Pro features until the end of the current billing period.",
  },
  {
    question: "How do coaches manage their clients?",
    answer:
      "Coaches get a dedicated dashboard where they can invite clients via email, assign custom workout programs and meal plans, monitor compliance metrics, and schedule check-in events. Each client's data is isolated — coaches only see the clients assigned to their account.",
  },
];

function FAQItem({ question, answer }: FAQItem) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-zinc-100">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-base font-medium text-zinc-900">{question}</span>
        <span
          className={`ml-4 shrink-0 text-zinc-400 transition-transform ${
            open ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>
      {open && (
        <p className="pb-5 text-sm leading-relaxed text-zinc-500">{answer}</p>
      )}
    </div>
  );
}

export default function FAQSection() {
  return (
    <section id="faq" className="bg-zinc-50 py-24">
      <div className="mx-auto max-w-3xl px-6">
        {/* Heading */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-zinc-400">
            FAQ
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
            Common questions
          </h2>
        </div>

        {/* Accordion */}
        <div>
          {faqs.map((faq) => (
            <FAQItem key={faq.question} {...faq} />
          ))}
        </div>
      </div>
    </section>
  );
}
