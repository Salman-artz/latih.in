import { getSession } from "@/lib/auth";
import { getUserSubscription } from "@/services/subscription";
import { prisma } from "@/lib/db";
import { StartTryoutBtn } from "@/components/tryout/StartTryoutBtn";
import Link from "next/link";
import {
  Lock,
  Clock,
  Award,
  KeyRound,
  CheckCircle2,
  FileQuestion,
  BookOpen,
  ArrowRight,
} from "lucide-react";

export default async function TryoutIndexPage() {
  const session = await getSession();
  if (!session) return null;

  const sub = await getUserSubscription(session.userId);

  // Jika belum berlangganan: Kunci akses
  if (!sub.isActive && session.user.role !== "ADMIN") {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6">
        <div className="w-14 h-14 rounded-lg bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy">
            Simulasi Tryout Terkunci
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            Kamu membutuhkan status langganan aktif untuk dapat mengerjakan simulasi tryout online berwaktu dengan evaluasi skor otomatis.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm max-w-md mx-auto space-y-4">
          <p className="text-xs text-slate-500">
            Aktivasi akses dengan kode redeem yang kamu peroleh dari buku atau promosi.
          </p>
          <Link
            href="/redeem"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-brand-blue text-white font-semibold text-xs sm:text-sm hover:bg-blue-700 transition"
          >
            <KeyRound className="w-4 h-4" /> Masukkan Kode Redeem
          </Link>
        </div>
      </div>
    );
  }

  // Ambil seluruh paket tryout terbit
  const publishedTryouts = await prisma.tryout.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: { questions: true },
      },
      attempts: {
        where: { userId: session.userId },
        orderBy: { startedAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          score: true,
          submittedAt: true,
        },
      },
    },
  });

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy">
          Paket Simulasi Tryout Mandiri
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
          Pilih paket latihan yang ingin kamu kerjakan. Satu akun dapat mengakses seluruh paket tryout yang tersedia tanpa batasan.
        </p>
      </div>

      {/* Petunjuk & Aturan Singkat */}
      <div className="bg-white p-5 sm:p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-brand-navy uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-brand-blue" /> Petunjuk Pengerjaan Tryout
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-0.5">
            <span className="font-semibold text-brand-navy block">Format Soal</span>
            <span className="text-slate-500">Stimulus bacaan + 3 butir pernyataan Benar/Salah.</span>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-0.5">
            <span className="font-semibold text-brand-navy block">Hitung Mundur</span>
            <span className="text-slate-500">Timer berjalan otomatis dengan batas waktu masing-masing paket.</span>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-0.5">
            <span className="font-semibold text-brand-navy block">Evaluasi & Pembahasan</span>
            <span className="text-slate-500">Kunci jawaban dan pembahasan komprehensif setelah submit.</span>
          </div>
        </div>
      </div>

      {/* Daftar Paket Tryout */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base sm:text-lg font-bold text-brand-navy flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-blue" /> Daftar Paket Tersedia ({publishedTryouts.length})
          </h2>
          <Link
            href="/riwayat"
            className="text-xs font-semibold text-brand-blue hover:text-blue-800 transition flex items-center gap-1"
          >
            Lihat Riwayat Skor <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {publishedTryouts.length === 0 ? (
          <div className="bg-white p-12 rounded-lg border border-slate-200 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-brand-navy">Belum ada paket tryout aktif</p>
            <p className="text-xs text-slate-500">
              Paket latihan sedang disiapkan oleh administrator. Silakan periksa kembali berkala.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {publishedTryouts.map((item, idx) => {
              const latestAttempt = item.attempts[0];
              const isInProgress = latestAttempt?.status === "IN_PROGRESS";
              const isCompleted = latestAttempt?.status === "SUBMITTED";
              const hasAccess =
                session.user.role === "ADMIN" ||
                (sub.packages || []).some(
                  (p) => p.isActive && (!p.tryoutId || p.tryoutId === item.id)
                );

              return (
                <div
                  key={item.id}
                  className="bg-white p-5 sm:p-6 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition flex flex-col md:flex-row justify-between md:items-center gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-brand-blue-50 text-brand-blue flex items-center justify-center font-bold text-xs font-mono">
                        #{idx + 1}
                      </span>
                      <h3 className="font-bold text-brand-navy text-base sm:text-lg">
                        {item.title}
                      </h3>
                      {!hasAccess && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          <Lock className="w-3 h-3 text-slate-400" /> Terkunci
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {item.durationMinutes} Menit
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <FileQuestion className="w-3.5 h-3.5 text-slate-400" />
                        {item._count.questions} Butir Soal
                      </span>
                      <span>•</span>
                      {isInProgress ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Sedang Dikerjakan
                        </span>
                      ) : isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Selesai • Skor Terakhir: {latestAttempt.score} Poin
                        </span>
                      ) : (
                        <span className="text-slate-400">Belum pernah dikerjakan</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 self-start md:self-center">
                    {isCompleted && (
                      <Link
                        href={`/tryout/${latestAttempt.id}/hasil`}
                        className="px-3.5 py-2 rounded-md border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Lihat Pembahasan
                      </Link>
                    )}

                    {hasAccess ? (
                      <StartTryoutBtn
                        tryoutId={item.id}
                        activeAttemptId={isInProgress ? latestAttempt.id : null}
                        label={
                          isInProgress
                            ? "Lanjutkan Pengerjaan"
                            : isCompleted
                            ? "Ulangi Latihan"
                            : "Mulai Tryout"
                        }
                      />
                    ) : (
                      <Link
                        href="/redeem"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold hover:bg-amber-100 transition"
                      >
                        <Lock className="w-3.5 h-3.5" /> Tukar Kode Paket
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
