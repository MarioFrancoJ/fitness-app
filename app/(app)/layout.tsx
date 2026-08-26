import AppShell from "@/components/app/AppShell";
import AuthGuard from "@/components/auth/AuthGuard";
import { getLocaleCookie } from "@/lib/i18n/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocaleCookie();

  return (
    <AuthGuard>
      <AppShell locale={locale}>{children}</AppShell>
    </AuthGuard>
  );
}
