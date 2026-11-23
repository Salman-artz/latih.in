import { getSession } from "@/lib/auth";
import { getUserSubscription } from "@/services/subscription";
import { prisma } from "@/lib/db";
import { StartTryoutBtn } from "@/components/tryout/StartTryoutBtn";
import Link from "next/link";
import { Lock, Clock, Award, KeyRound, CheckCircle2 } from "lucide-react";

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

  // Cek apakah ada attempt IN_PROGRESS yang sedang berjalan
  const activeAttempt = await prisma.attempt.findFirst({
    where: {
      userId: session.userId,
      status: "IN_PROGRESS",
    },
    orderBy: { startedAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy">
          Simulasi Tryout Literasi & Penalaran
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
          Uji kesiapan ujian kamu melalui latihan berwaktu dengan format stimulus dan butir Benar/Salah.
        </p>
      </div>

      {/* Info Card Paket */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-brand-navy pb-3 border-b border-slate-100">
          Petunjuk & Aturan Pengerjaan
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-brand-blue" /> Durasi Waktu
            </div>
            <div className="text-lg font-bold text-brand-navy">20 Menit</div>
            <div className="text-[11px] text-slate-500">Auto-submit saat waktu habis</div>
          </div>

          <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Jumlah Soal
            </div>
            <div className="text-lg font-bold text-brand-navy">10 Soal (30 Butir)</div>
            <div className="text-[11px] text-slate-500">3 Pernyataan per soal</div>
          </div>

          <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-brand-blue" /> Skoring Maksimal
            </div>
            <div className="text-lg font-bold text-brand-navy">30 Poin (100%)</div>
            <div className="text-[11px] text-slate-500">1 Poin per pernyataan benar</div>
          </div>
        </div>

        <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc pl-5 leading-relaxed">
          <li>Setiap soal menyajikan stimulus bacaan dan <strong>3 butir pernyataan</strong> yang wajib ditentukan apakah <strong>Benar</strong> atau <strong>Salah</strong>.</li>
          <li>Jawaban tersimpan otomatis secara berkala. Kamu bebas berpindah nomor soal sebelum mengumpulkan.</li>
          <li>Pernyataan yang dikosongkan tidak mendapat pengurangan poin (dihitung 0).</li>
          <li>Kunci jawaban dan pembahasan komprehensif akan ditampilkan segera setelah tryout disubmit.</li>
        </ul>

        {/* Start Button Client Component */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {activeAttempt ? (
              <span className="text-amber-800 font-semibold">
                ⚠️ Kamu memiliki sesi yang sedang berjalan. Lanjutkan dari sesi tersebut.
              </span>
            ) : (
              <span>Pastikan koneksi internet stabil sebelum menekan tombol mulai.</span>
            )}
          </div>
          <StartTryoutBtn activeAttemptId={activeAttempt?.id || null} />
        </div>
      </div>
    </div>
  );
}
