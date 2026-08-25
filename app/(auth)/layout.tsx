/**
 * Auth Layout
 *
 * Shared layout for login, register, forgot-password, reset-password pages.
 * Centers content vertically and horizontally with a clean background.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
