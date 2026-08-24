import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import AdminGuard from "@/components/admin/AdminGuard";
import AuthGuard from "@/components/auth/AuthGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AdminGuard>
        <div className="flex h-screen overflow-hidden bg-zinc-50">
          <AdminSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <AdminTopbar />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </AdminGuard>
    </AuthGuard>
  );
}
