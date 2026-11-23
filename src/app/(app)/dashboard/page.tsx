import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getUserSubscription } from "@/services/subscription";
import { prisma } from "@/lib/db";
import { SubscriptionBanner } from "@/components/ui/Banner";
import {
  KeyRound,
  PlayCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Award,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const subStatus = await getUserSubscription(session.userId);

  // Ambil progres materi user
  const [totalMaterials, userCompletedMaterials, latestAttempt] = await Promise.all([
    prisma.material.count({ where: { status: "PUBLISHED" } }),
    prisma.materialProgress.count({ where: { userId: session.userId } }),
    prisma.attempt.findFirst({
      where: { userId: session.userId, status: "SUBMITTED" },
      orderBy: { submittedAt: "desc" },
      include: { tryout: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy">
            Dashboard Siswa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Selamat datang, <span className="font-semibold text-slate-800">{session.user.name}</span>. Pantau modul belajar dan latihan tryout kamu di sini.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {subStatus.isActive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Langganan Aktif
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
              <XCircle className="w-3.5 h-3.5 text-slate-500" /> Belum Berlangganan
            </span>
          )}
        </div>
      </div>

      {/* Banner Langganan Segera Berakhir (<= 7 hari) */}
      {subStatus.subscription && (
        <SubscriptionBanner daysLeft={subStatus.subscription.daysLeft} />
      )}

      {/* STATUS LANGGANAN CARD - Solid Navy Brand */}
      <div className="bg-brand-navy text-white rounded-lg p-6 sm:p-7 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-brand-blue-50 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-brand-blue" /> Status Akun & Akses
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {subStatus.isActive ? "Paket Langganan Premium Aktif" : "Akses Terkunci (Belum Berlangganan)"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {subStatus.isActive
                ? `Masa aktif langganan kamu berlaku hingga ${new Date(
                    subStatus.subscription!.endsAt
                  ).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })} (tersisa ${subStatus.subscription!.daysLeft} hari). Seluruh video kurasi dan simulasi tryout dapat kamu akses tanpa batas.`
                : "Kamu belum memiliki langganan aktif. Materi belajar video dan simulasi tryout terkunci sampai kamu menukarkan kode redeem."}
            </p>
          </div>

          <div className="flex-shrink-0">
            <Link
              href="/redeem"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-brand-blue hover:bg-blue-600 text-white font-semibold text-xs sm:text-sm transition shadow-sm"
            >
              <KeyRound className="w-4 h-4" />
              {subStatus.isActive ? "Perpanjang Masa Aktif" : "Redeem Kode Voucher"}
            </Link>
          </div>
        </div>
      </div>

      {/* MENU AKSI CEPAT / FITUR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Modul Materi */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-md bg-brand-navy text-white flex items-center justify-center font-bold">
              <PlayCircle className="w-5 h-5 text-brand-blue-50" />
            </div>
            <h3 className="text-base font-bold text-brand-navy">Materi Video</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pelajari konsep dasar penalaran dan literasi lewat video kurasi berkualitas.
            </p>
            <div className="pt-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                <span>Progres Belajar</span>
                <span>{userCompletedMaterials} / {totalMaterials} Modul</span>
              </div>
              <div className="w-full bg-slate-100 rounded-sm h-2 overflow-hidden border border-slate-200">
                <div
                  className="bg-brand-blue h-2 rounded-sm transition-all duration-300"
                  style={{
                    width: `${totalMaterials > 0 ? (userCompletedMaterials / totalMaterials) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <Link
            href="/materi"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand-blue hover:text-blue-800 transition pt-2 border-t border-slate-100"
          >
            Buka Materi Belajar <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Simulasi Tryout */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-md bg-brand-navy text-white flex items-center justify-center font-bold">
              <Clock className="w-5 h-5 text-brand-blue-50" />
            </div>
            <h3 className="text-base font-bold text-brand-navy">Simulasi Tryout</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              10 Soal stimulus, 30 butir Benar/Salah, berbatas waktu 20 menit dengan penyimpanan berkala.
            </p>
            <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200 text-[11px] text-slate-600">
              Uji kesiapan pemahamanmu dan raih evaluasi hasil mendalam seketika.
            </div>
          </div>
          <Link
            href="/tryout"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand-blue hover:text-blue-800 transition pt-2 border-t border-slate-100"
          >
            Mulai / Lanjutkan Tryout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Riwayat & Evaluasi */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-md bg-brand-navy text-white flex items-center justify-center font-bold">
              <Award className="w-5 h-5 text-brand-blue-50" />
            </div>
            <h3 className="text-base font-bold text-brand-navy">Riwayat Hasil</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pantau perkembangan nilai dari setiap sesi tryout yang telah kamu selesaikan.
            </p>
            {latestAttempt ? (
              <div className="bg-emerald-50 p-2.5 rounded-md border border-emerald-200 text-[11px] text-emerald-800">
                Nilai Terakhir: <span className="font-bold">{latestAttempt.score} / 30 Poin</span> (
                {((latestAttempt.score! / 30) * 100).toFixed(1)}%)
              </div>
            ) : (
              <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200 text-[11px] text-slate-500">
                Kamu belum menyelesaikan sesi tryout.
              </div>
            )}
          </div>
          <Link
            href="/riwayat"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand-blue hover:text-blue-800 transition pt-2 border-t border-slate-100"
          >
            Lihat Riwayat Lengkap <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
