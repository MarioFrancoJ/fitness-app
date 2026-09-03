"use client";

/**
 * Forgot Password Page
 *
 * Sends a password reset email via Supabase Auth.
 * The email contains a link to /reset-password with a code.
 */

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useDictionary } from "@/lib/i18n/DictionaryProvider";

export default function ForgotPasswordPage() {
  const { dict } = useDictionary();
  const t = dict.auth.forgotPassword;
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError(t.validationEmailRequired);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t.validationEmailInvalid);
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-zinc-900">{t.successTitle}</h2>
          <p className="mt-2 text-sm text-zinc-500">
            {t.successDescription.split("{email}")[0]}<span className="font-medium text-zinc-700">{email}</span>{t.successDescription.split("{email}")[1]}
          </p>
          <Link href="/login" className="mt-6 inline-block text-sm font-medium text-zinc-900 hover:text-zinc-600">{t.backToLogin}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{t.title}</h1>
        <p className="mt-1.5 text-sm text-zinc-500">{t.subtitle}</p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        {error && (<div className="rounded-lg bg-red-50 px-4 py-3" role="alert"><p className="text-sm font-medium text-red-700">{error}</p></div>)}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-zinc-700">{t.fieldEmail}</label>
          <input id="email" type="email" placeholder={t.fieldEmailPlaceholder} autoComplete="email" value={email}
            onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
            className="rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" />
        </div>

        <button type="submit" disabled={loading}
          className="mt-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? t.sending : t.submitButton}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link href="/login" className="font-semibold text-zinc-900 hover:text-zinc-600">{t.backToLogin}</Link>
      </p>
    </div>
  );
}
