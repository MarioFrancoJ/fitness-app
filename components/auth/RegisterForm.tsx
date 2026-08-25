"use client";

/**
 * RegisterForm — Supabase Auth (replaces localStorage-based registration)
 *
 * Creates user via supabase.auth.signUp().
 * Auth trigger creates public.users row.
 * App creates subscription (FREE) + notification_preferences (D3).
 */

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

// ── Types ────────────────────────────────────────────────────────────────────

interface FormFields {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

// ── Validation ───────────────────────────────────────────────────────────────

function validate(fields: FormFields): FormErrors {
  const errors: FormErrors = {};

  if (!fields.name.trim()) {
    errors.name = "Full name is required.";
  }

  if (!fields.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!fields.password) {
    errors.password = "Password is required.";
  } else if (fields.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!fields.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (fields.password !== fields.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (!fields.terms) {
    errors.terms = "You must accept the terms to continue.";
  }

  return errors;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function RegisterForm() {
  const router = useRouter();

  const [fields, setFields] = useState<FormFields>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { id, value, type, checked } = e.target;
    setFields((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
    if (errors[id as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [id]: undefined }));
    }
    if (generalError) setGeneralError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGeneralError("");

    const validationErrors = validate(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: fields.email.trim().toLowerCase(),
      password: fields.password,
      options: {
        data: { name: fields.name.trim() },
      },
    });

    if (authError) {
      setGeneralError(
        authError.message.includes("already registered")
          ? "This email is already registered."
          : authError.message
      );
      setIsSubmitting(false);
      return;
    }

    // 2. Create subscription + notification preferences (D3: app-level)
    if (authData.user) {
      const today = new Date().toISOString().split("T")[0];

      await supabase.from("subscriptions").insert({
        user_id: authData.user.id,
        plan: "FREE",
        status: "Active",
        start_date: today,
      });

      await supabase.from("notification_preferences").insert({
        user_id: authData.user.id,
      });
    }

    // Navigate to onboarding
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
            Create your account
          </h2>
          <p className="mt-1.5 text-sm text-zinc-500">
            Start your fitness journey today. It&apos;s free.
          </p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          {/* General error */}
          {generalError && (
            <div className="rounded-lg bg-red-50 px-4 py-3" role="alert">
              <p className="text-sm font-medium text-red-700">{generalError}</p>
            </div>
          )}

          {/* Full Name */}
          <Input
            id="name"
            type="text"
            label="Full Name"
            placeholder="Alex Johnson"
            autoComplete="name"
            value={fields.name}
            onChange={handleChange}
            error={errors.name}
          />

          {/* Email */}
          <Input
            id="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            autoComplete="email"
            value={fields.email}
            onChange={handleChange}
            error={errors.email}
          />

          {/* Password */}
          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            value={fields.password}
            onChange={handleChange}
            error={errors.password}
          />

          {/* Confirm Password */}
          <Input
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Repeat your password"
            autoComplete="new-password"
            value={fields.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />

          {/* Accept Terms */}
          <div className="flex flex-col gap-1.5">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                id="terms"
                type="checkbox"
                checked={fields.terms}
                onChange={handleChange}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 accent-zinc-900"
              />
              <span className="text-sm text-zinc-600">
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-600"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-600"
                >
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.terms && (
              <p className="text-xs text-red-500" role="alert">
                {errors.terms}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create Account"}
          </Button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-zinc-900 transition-colors hover:text-zinc-600"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
