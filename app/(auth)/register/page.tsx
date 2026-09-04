"use client";

/**
 * Register Page
 *
 * Creates a new user via Supabase Auth.
 * The auth trigger (00004) automatically creates the public.users row.
 * After signup, creates subscription (FREE) and notification_preferences.
 * Redirects to /onboarding on success.
 */

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    // Validation
    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: name.trim(),
        },
      },
    });

    if (authError) {
      setError(
        authError.message.includes("already registered")
          ? "This email is already registered."
          : authError.message
      );
      setLoading(false);
      return;
    }

    // 2. Create subscription (FREE plan) — D3: app-level, not trigger
    if (authData.user) {
      const today = new Date().toISOString().split("T")[0];

      await supabase.from("subscriptions").insert({
        user_id: authData.user.id,
        plan: "FREE",
        status: "Active",
        start_date: today,
      });

      // 3. Create notification preferences (defaults)
      await supabase.from("notification_preferences").insert({
        user_id: authData.user.id,
      });
    }

    // Success — redirect to onboarding
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Start your transformation today. It&apos;s free.
        </p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3" role="alert">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-zinc-700">Full name</label>
          <input id="name" type="text" placeholder="John Doe" autoComplete="name" value={name}
            onChange={(e) => { setName(e.target.value); if (error) setError(""); }}
            className="rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-zinc-700">Email</label>
          <input id="email" type="email" placeholder="you@example.com" autoComplete="email" value={email}
            onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
            className="rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-zinc-700">Password</label>
          <input id="password" type="password" placeholder="Minimum 8 characters" autoComplete="new-password" value={password}
            onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
            className="rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" />
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-700">Confirm password</label>
          <input id="confirmPassword" type="password" placeholder="Repeat your password" autoComplete="new-password" value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(""); }}
            className="rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" />
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading}
          className="mt-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-zinc-900 hover:text-zinc-600">Sign in</Link>
      </p>
    </div>
  );
}
