import AppShell from "@/components/app/AppShell";
import AuthGuard from "@/components/auth/AuthGuard";
import { getLocaleCookie } from "@/lib/i18n/actions";
import { getDictionary } from "@/lib/i18n/getDictionary";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocaleCookie();
  const dict = await getDictionary(locale);

  return (
    <AuthGuard>
      <AppShell locale={locale} dict={dict}>{children}</AppShell>
    </AuthGuard>
  );
}
