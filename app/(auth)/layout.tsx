/**
 * Auth Layout
 *
 * Shared layout for login, register, forgot-password, reset-password pages.
 * Centers content vertically and horizontally with a clean background.
 */

import PublicLanguageSwitcher from "@/components/i18n/PublicLanguageSwitcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="absolute right-4 top-4">
        <PublicLanguageSwitcher />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
