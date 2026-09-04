"use client";

/**
 * Reset Password Page
 *
 * Allows users to set a new password after clicking the reset link.
 * The user arrives here with a valid session (code was exchanged in /auth/callback).
 * Calls supabase.auth.updateUser({ password }) to set the new password.
 */

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDictionary } from "@/lib/i18n/DictionaryProvider";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { dict } = useDictionary();
  const t = dict.auth.resetPassword;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(t.validationPasswordLength);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.validationPasswordsMismatch);
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 2000);
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-zinc-900">{t.successTitle}</h2>
          <p className="mt-2 text-sm text-zinc-500">{t.successDescription}</p>
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
          <label htmlFor="password" className="text-sm font-medium text-zinc-700">{t.fieldNewPassword}</label>
          <input id="password" type="password" placeholder={t.fieldNewPasswordPlaceholder} autoComplete="new-password" value={password}
            onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
            className="rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-700">{t.fieldConfirmPassword}</label>
          <input id="confirmPassword" type="password" placeholder={t.fieldConfirmPasswordPlaceholder} autoComplete="new-password" value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(""); }}
            className="rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" />
        </div>

        <button type="submit" disabled={loading}
          className="mt-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? t.updating : t.submitButton}
        </button>
      </form>
    </div>
  );
}
