"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function RegisterForm() {
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

        {/* Form — UI only */}
        <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
          {/* Full Name */}
          <Input
            id="name"
            type="text"
            label="Full Name"
            placeholder="Alex Johnson"
            autoComplete="name"
            required
          />

          {/* Email */}
          <Input
            id="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          {/* Password */}
          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            required
          />

          {/* Confirm Password */}
          <Input
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Repeat your password"
            autoComplete="new-password"
            required
          />

          {/* Accept Terms */}
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 accent-zinc-900"
              required
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

          {/* Submit */}
          <Button type="submit" fullWidth>
            Create Account
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
