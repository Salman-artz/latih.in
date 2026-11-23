import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getUserSubscription } from "@/services/subscription";
import { getMaterialsForUser } from "@/services/material";
import { Lock, PlayCircle, CheckCircle2, ArrowRight, KeyRound, Sparkles } from "lucide-react";

export default async function MateriListPage() {
  const session = await getSession();
  if (!session) return null;

  const sub = await getUserSubscription(session.userId);

  // Jika belum berlangganan: Tampilkan state terkunci dengan pesan edukatif & tombol redeem
  if (!sub.isActive) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy">
            Materi Belajar Masih Terkunci
          </h1>
          <p className="text-gray-600 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Seluruh kurikulum materi video dan simulasi tryout hanya dapat diakses oleh pengguna dengan paket langganan aktif.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm max-w-md mx-auto space-y-4">
          <p className="text-xs text-gray-500">
            Punya kode redeem dari buku atau program promosi? Aktifkan sekarang tanpa biaya tambahan.
          </p>
          <Link
            href="/redeem"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-blue text-white font-semibold text-sm hover:bg-blue-700 transition shadow-sm"
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
    <div className="space-y-8">
      {/* Header & Progres Belajar */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue-50 text-brand-blue text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Modul Belajar Mandiri
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy">
            Materi Video Pembelajaran
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tonton dan pahami konsep penalaran umum dan literasi sebelum mengerjakan tryout.
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 min-w-[220px]">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-600 mb-2">
            <span>Progres Kamu</span>
            <span className="text-brand-blue">{completedCount} / {totalCount} Selesai</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-brand-blue h-2 rounded-full transition-all duration-300"
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
            className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              {/* Thumbnail Container */}
              <div className="aspect-video bg-gray-900 relative group overflow-hidden">
                <img
                  src={`https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-90"
                />
                <div className="absolute inset-0 bg-brand-navy/30 flex items-center justify-center">
                  <PlayCircle className="w-12 h-12 text-white/90 drop-shadow-md group-hover:scale-110 transition" />
                </div>
                {item.isCompleted && (
                  <div className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                  </div>
                )}
              </div>

              {/* Detail Text */}
              <div className="p-5 space-y-2">
                <div className="text-xs font-bold text-brand-blue uppercase tracking-wider">
                  Materi #{item.order}
                </div>
                <h3 className="font-bold text-brand-navy text-base line-clamp-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>

            {/* Action Link */}
            <div className="p-5 pt-0">
              <Link
                href={`/materi/${item.id}`}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-300 text-sm font-semibold text-brand-navy hover:bg-brand-blue-50 hover:text-brand-blue hover:border-brand-blue/30 transition"
              >
                {item.isCompleted ? "Tonton Ulang" : "Mulai Belajar"} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
