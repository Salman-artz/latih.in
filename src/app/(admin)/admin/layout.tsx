import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import {
  LayoutDashboard,
  KeyRound,
  Video,
  ArrowLeft,
  BookOpen,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await getSession();
  } catch (err) {
    console.error("AdminLayout getSession error:", err);
  }

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
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Logo height={28} />
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
              <Link
                href="/admin/tryout"
                className="px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center gap-1.5"
              >
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span className="hidden sm:inline">Tryout & Soal</span>
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
      <main className="flex-grow w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-8">
        {children}
      </main>
    </div>
  );
}
