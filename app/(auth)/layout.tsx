/**
 * Auth Layout
 *
 * Shared layout for login, register, forgot-password, reset-password pages.
 * Centers content vertically and horizontally with a clean background.
 */

import Link from "next/link";
import PublicLanguageSwitcher from "@/components/i18n/PublicLanguageSwitcher";
import Logo from "@/components/ui/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="absolute right-4 top-4">
        <PublicLanguageSwitcher />
      </div>
      <div className="flex w-full max-w-md flex-col items-center">
        {/* Movive brand — full lockup (isologo) above the auth card */}
        <Link
          href="/"
          aria-label="Movive"
          className="mb-8 inline-flex transition-opacity hover:opacity-80"
        >
          <Logo variant="isologo" className="h-8" priority />
        </Link>
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
