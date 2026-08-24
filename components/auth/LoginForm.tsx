"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { seedSuperAdmin, getSuperAdmin } from "@/lib/auth/seed-admin";

// Simple inline Google icon
function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Seed super admin on component mount
  useEffect(() => {
    seedSuperAdmin();
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      // Check super admin account first
      const admin = getSuperAdmin();
      if (admin && admin.email === normalizedEmail) {
        if (admin.password !== password) {
          setError("Invalid email or password.");
          setIsSubmitting(false);
          return;
        }
        // Create admin session
        const session = {
          isAuthenticated: true,
          loginAt: Date.now(),
          userId: admin.email,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        };
        localStorage.setItem("fitnessapp_session", JSON.stringify(session));
        router.push("/admin");
        return;
      }

      // Check regular user
      const stored = localStorage.getItem("fitnessapp_user");
      if (!stored) {
        setError("Invalid email or password.");
        setIsSubmitting(false);
        return;
      }

      const user = JSON.parse(stored);

      if (user.email !== normalizedEmail) {
        setError("Invalid email or password.");
        setIsSubmitting(false);
        return;
      }

      if (user.password !== password) {
        setError("Invalid email or password.");
        setIsSubmitting(false);
        return;
      }

      // Create session with role
      const session = {
        isAuthenticated: true,
        loginAt: Date.now(),
        userId: user.email,
        name: user.name,
        email: user.email,
        role: user.role || "USER",
      };
      localStorage.setItem("fitnessapp_session", JSON.stringify(session));

      // Redirect based on role
      if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
            Sign in to your account
          </h2>
          <p className="mt-1.5 text-sm text-zinc-500">
            Welcome back! Please enter your details.
          </p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3" role="alert">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* Email */}
          <Input
            id="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
          />

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-zinc-700">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
            />
          </div>

          {/* Remember me */}
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
            />
            <span className="text-sm text-zinc-600">Remember me</span>
          </label>

          {/* Sign in button */}
          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign In"}
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs text-zinc-400">OR</span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          {/* Google button — UI only */}
          <Button type="button" variant="outline" fullWidth>
            <GoogleIcon />
            Continue with Google
          </Button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-zinc-900 transition-colors hover:text-zinc-600"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
