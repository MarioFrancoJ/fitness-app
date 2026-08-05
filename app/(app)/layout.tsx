import Sidebar from "@/components/app/Sidebar";
import Topbar from "@/components/app/Topbar";
import { getLocaleCookie } from "@/lib/i18n/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocaleCookie();

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar locale={locale} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
