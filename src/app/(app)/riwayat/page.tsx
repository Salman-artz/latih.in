import { getSession } from "@/lib/auth";
import { getUserAttemptHistory } from "@/services/tryout";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Award, Clock, ArrowRight, Calendar, CheckCircle2, RotateCcw } from "lucide-react";

export default async function HistoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const history = await getUserAttemptHistory(session.userId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy">
            Riwayat Simulasi Tryout
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Daftar seluruh sesi tryout yang pernah kamu kerjakan beserta rekapitulasi nilai.
          </p>
        </div>
        <Link
          href="/tryout"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 transition shadow-sm self-start sm:self-auto"
        >
          <RotateCcw className="w-4 h-4" /> Mulai Tryout Baru
        </Link>
      </div>

      {history.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200/80 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
            <Award className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-brand-navy">Belum Ada Riwayat Tryout</h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
              Kamu belum pernah menyelesaikan sesi simulasi tryout. Mulai latihan sekarang untuk menguji kemampuanmu.
            </p>
          </div>
          <Link
            href="/tryout"
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-brand-blue text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 transition"
          >
            Mulai Tryout Pertama <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((att, idx) => {
            const minutes = Math.floor(att.durationSeconds / 60);
            const seconds = att.durationSeconds % 60;

            return (
              <div
                key={att.id}
                className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-brand-blue/40 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-blue-50 text-brand-blue">
                      Attempt #{history.length - idx}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {att.submittedAt
                        ? new Date(att.submittedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </span>
                  </div>
                  <h3 className="font-bold text-brand-navy text-base">
                    {att.tryoutTitle}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" /> {minutes}m {seconds}s
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {att.score} / {att.maxScore} Benar
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <div className="text-xl font-extrabold text-brand-navy">
                      {att.score} <span className="text-xs font-normal text-gray-400">/ 30</span>
                    </div>
                    <div className="text-xs font-bold text-brand-blue">
                      {att.percent}%
                    </div>
                  </div>

                  <Link
                    href={`/tryout/${att.id}/hasil`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-brand-navy hover:bg-brand-blue-50 hover:text-brand-blue transition"
                  >
                    Lihat Hasil <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
