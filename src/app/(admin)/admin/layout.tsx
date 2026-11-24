import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import {
  LayoutDashboard,
  KeyRound,
  Video,
  ArrowLeft,
  Shield,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Pengecekan Server-Side Wajib: Tolak role non-ADMIN
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-brand-navy">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Logo height={28} />
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-md">
                <Shield className="w-3.5 h-3.5" /> Administrator
              </span>
            </div>

            {/* Admin Nav */}
            <nav className="flex items-center space-x-1 sm:space-x-3 text-xs sm:text-sm font-semibold">
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-4 h-4 text-brand-blue" />
                <span className="hidden sm:inline">Statistik</span>
              </Link>
              <Link
                href="/admin/kode"
                className="px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center gap-1.5"
              >
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Kode Redeem</span>
              </Link>
              <Link
                href="/admin/materi"
                className="px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center gap-1.5"
              >
                <Video className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Materi Video</span>
              </Link>

              <div className="h-4 w-px bg-gray-300 mx-1" />

              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-lg text-brand-blue hover:bg-brand-blue-50 transition flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mode Pengguna</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
