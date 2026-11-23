import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getUserSubscription } from "@/services/subscription";
import { getMaterialsForUser } from "@/services/material";
import { Lock, PlayCircle, CheckCircle2, ArrowRight, KeyRound } from "lucide-react";

export default async function MateriListPage() {
  const session = await getSession();
  if (!session) return null;

  const sub = await getUserSubscription(session.userId);

  // Jika belum berlangganan: Tampilkan state terkunci dengan pesan edukatif & tombol redeem (khusus Siswa)
  if (!sub.isActive && session.user.role !== "ADMIN") {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6">
        <div className="w-14 h-14 rounded-lg bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy">
            Materi Belajar Terkunci
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            Seluruh kurikulum materi video dan simulasi tryout hanya dapat diakses oleh pengguna dengan status langganan aktif.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm max-w-md mx-auto space-y-4">
          <p className="text-xs text-slate-500">
            Punya kode redeem voucher dari buku atau kemitraan? Aktifkan sekarang tanpa biaya.
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

  // Jika aktif, ambil daftar materi
  const materials = await getMaterialsForUser(session.userId);
  const completedCount = materials.filter((m) => m.isCompleted).length;
  const totalCount = materials.length;

  return (
    <div className="space-y-6">
      {/* Header & Progres Belajar */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy">
            Materi Video Pembelajaran
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Simak dan pahami materi penalaran dan literasi untuk memperkuat konsep sebelum tryout.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 min-w-[220px]">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-2">
            <span>Progres Kamu</span>
            <span className="text-brand-blue font-bold">{completedCount} / {totalCount} Selesai</span>
          </div>
          <div className="w-full bg-slate-200 rounded-sm h-2 overflow-hidden">
            <div
              className="bg-brand-blue h-2 rounded-sm transition-all duration-300"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid Materi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm hover:border-brand-blue/50 transition flex flex-col justify-between"
          >
            <div>
              {/* Thumbnail Container */}
              <div className="aspect-video bg-slate-900 relative group overflow-hidden">
                <img
                  src={`https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-90"
                />
                <div className="absolute inset-0 bg-brand-navy/30 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-md bg-white/90 text-brand-navy flex items-center justify-center">
                    <PlayCircle className="w-6 h-6" />
                  </div>
                </div>
                {item.isCompleted && (
                  <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                    <CheckCircle2 className="w-3 h-3" /> Selesai
                  </div>
                )}
              </div>

              {/* Detail Text */}
              <div className="p-5 space-y-2">
                <div className="text-[11px] font-bold text-brand-blue uppercase tracking-wider">
                  Materi #{item.order}
                </div>
                <h3 className="font-bold text-brand-navy text-sm sm:text-base line-clamp-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>

            {/* Action Link */}
            <div className="p-5 pt-0">
              <Link
                href={`/materi/${item.id}`}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-md border border-slate-300 text-xs sm:text-sm font-semibold text-brand-navy hover:bg-brand-blue-50 hover:text-brand-blue hover:border-brand-blue/40 transition"
              >
                {item.isCompleted ? "Tonton Ulang" : "Mulai Belajar"} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
