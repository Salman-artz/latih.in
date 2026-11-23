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
    <div className="space-y-8">
      {/* Greeting Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy">
            Halo, {session.user.name}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Selamat datang kembali di platform latihan dan tryout mandiri kamu.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {subStatus.isActive ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Langganan Premium Aktif
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
              <XCircle className="w-4 h-4 text-gray-500" /> Belum Berlangganan
            </span>
          )}
        </div>
      </div>

      {/* Banner Langganan Segera Berakhir (<= 7 hari) */}
      {subStatus.subscription && (
        <SubscriptionBanner daysLeft={subStatus.subscription.daysLeft} />
      )}

      {/* STATUS LANGGANAN CARD */}
      <div className="bg-gradient-to-br from-brand-navy to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-brand-blue-50 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-brand-blue" /> Status Paket
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {subStatus.isActive ? "Paket Premium Aktif" : "Akses Terkunci (Belum Berlangganan)"}
            </h2>
            <p className="text-sm text-gray-300 max-w-xl leading-relaxed">
              {subStatus.isActive
                ? `Masa aktif langganan kamu berlaku hingga ${new Date(
                    subStatus.subscription!.endsAt
                  ).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })} (tersisa ${subStatus.subscription!.daysLeft} hari). Seluruh video dan simulasi tryout dapat kamu akses tanpa batas.`
                : "Kamu belum memiliki langganan aktif. Materi belajar dan simulasi tryout terkunci sampai kamu menukarkan kode redeem."}
            </p>
          </div>

          <div className="flex-shrink-0">
            <Link
              href="/redeem"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-semibold text-sm shadow-lg transition"
            >
              <KeyRound className="w-4 h-4" />
              {subStatus.isActive ? "Perpanjang Masa Aktif" : "Redeem Kode Sekarang"}
            </Link>
          </div>
        </div>
      </div>

      {/* MENU AKSI CEPAT / FITUR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Modul Materi */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blue-50 text-brand-blue flex items-center justify-center font-bold">
              <PlayCircle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-brand-navy">Materi Video</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Pelajari konsep dasar penalaran dan literasi lewat video kurasi berkualitas.
            </p>
            <div className="pt-2">
              <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1.5">
                <span>Progres Belajar</span>
                <span>{userCompletedMaterials} dari {totalMaterials} Selesai</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand-blue h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${totalMaterials > 0 ? (userCompletedMaterials / totalMaterials) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <Link
            href="/materi"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:underline pt-2"
          >
            Buka Materi Belajar <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Simulasi Tryout */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-brand-navy">Simulasi Tryout</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              10 Soal stimulus, 30 butir Benar/Salah, berbatas waktu 20 menit dengan autosave real-time.
            </p>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-600">
              Uji pemahaman kamu dan raih evaluasi skor detail segera setelah selesai.
            </div>
          </div>
          <Link
            href="/tryout"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:underline pt-2"
          >
            Mulai / Lanjutkan Tryout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Riwayat & Evaluasi */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-brand-navy">Riwayat Hasil</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Pantau perkembangan nilai dari setiap percobaan tryout yang telah kamu selesaikan.
            </p>
            {latestAttempt ? (
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-xs text-emerald-800">
                Percobaan Terakhir: <span className="font-bold">{latestAttempt.score} / 30 Poin</span> (
                {((latestAttempt.score! / 30) * 100).toFixed(1)}%)
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-500">
                Kamu belum menyelesaikan sesi tryout.
              </div>
            )}
          </div>
          <Link
            href="/riwayat"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:underline pt-2"
          >
            Lihat Riwayat Lengkap <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
