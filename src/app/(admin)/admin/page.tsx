import { getAdminStats } from "@/services/admin";
import Link from "next/link";
import {
  Users,
  KeyRound,
  ShieldCheck,
  Award,
  ArrowRight,
  TrendingUp,
  Clock,
  PlusCircle,
  CheckCircle2,
} from "lucide-react";

export default async function AdminDashboardPage() {
  let stats = {
    totalUsers: 0,
    newUsersLast7Days: 0,
    activeSubscriptions: 0,
    expiringSubscriptions: 0,
    totalCodes: 0,
    availableCodes: 0,
    usedCodes: 0,
    revokedCodes: 0,
    totalAttempts: 0,
    avgScore: 0,
  };

  try {
    stats = await getAdminStats();
  } catch (err) {
    console.error("AdminDashboardPage getAdminStats error:", err);
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy">
            Panel Administrator
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ringkasan data pengguna, peredaran kode redeem, dan performa simulasi tryout.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/kode"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-brand-blue text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" /> Generate Kode
          </Link>
          <Link
            href="/admin/materi"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-slate-300 bg-white text-brand-navy text-xs sm:text-sm font-semibold hover:bg-slate-50 transition shadow-sm"
          >
            Kelola Materi
          </Link>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Pengguna */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Total Pengguna</span>
            <Users className="w-4 h-4 text-brand-blue" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-brand-navy">
            {stats.totalUsers}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-emerald-700">{stats.newUsersLast7Days}</span> baru 7 hari terakhir
          </div>
        </div>

        {/* Langganan Aktif */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Langganan Aktif</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
            {stats.activeSubscriptions}
          </div>
          <div className="text-xs text-amber-700 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{stats.expiringSubscriptions} berakhir dlm 7 hari</span>
          </div>
        </div>

        {/* Kode Redeem Tersedia */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Kode Tersedia</span>
            <KeyRound className="w-4 h-4 text-brand-blue" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-brand-navy">
            {stats.availableCodes}
          </div>
          <div className="text-xs text-slate-500">
            Dari total {stats.totalCodes} ({stats.usedCodes} terpakai)
          </div>
        </div>

        {/* Total Attempt & Skor Rata-rata */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Total Attempt Tryout</span>
            <Award className="w-4 h-4 text-brand-blue" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-brand-navy">
            {stats.totalAttempts}
          </div>
          <div className="text-xs text-slate-500">
            Rata-rata skor: <span className="font-bold text-brand-blue">{stats.avgScore} / 30</span> (
            {((stats.avgScore / 30) * 100).toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS & NOTICES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Modul Kode Redeem Card */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-brand-navy text-white flex items-center justify-center font-bold">
              <KeyRound className="w-4 h-4 text-brand-blue-50" />
            </div>
            <div>
              <h3 className="font-bold text-brand-navy text-base">Manajemen Kode Redeem</h3>
              <p className="text-xs text-slate-500">Generate batch 1-100 kode, filter status, cabut, dan ekspor CSV.</p>
            </div>
          </div>
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs text-slate-500">{stats.availableCodes} kode siap dibagikan</span>
            <Link
              href="/admin/kode"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"
            >
              Buka Kelola Kode <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Modul Materi Video Card */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-brand-navy text-white flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4 text-brand-blue-50" />
            </div>
            <div>
              <h3 className="font-bold text-brand-navy text-base">Manajemen Materi Video</h3>
              <p className="text-xs text-slate-500">Tambah konten YouTube baru, edit deskripsi, dan arsipkan materi.</p>
            </div>
          </div>
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs text-slate-500">Video terintegrasi YouTube nocookie</span>
            <Link
              href="/admin/materi"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"
            >
              Buka Kelola Materi <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
