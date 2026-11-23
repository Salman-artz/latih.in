import { getSession } from "@/lib/auth";
import { getAttemptResult } from "@/services/tryout";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Award, Clock, ArrowLeft, RotateCcw, Check, X, BookOpen, Layers } from "lucide-react";

export default async function TryoutResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { attemptId } = await params;

  let result;
  try {
    result = await getAttemptResult(session.userId, attemptId);
  } catch {
    notFound();
  }

  // Hitung durasi pengerjaan dalam menit & detik
  let durationMin = 0;
  let durationSec = 0;
  if (result.submittedAt && result.startedAt) {
    const diffSeconds = Math.max(
      0,
      Math.floor(
        (new Date(result.submittedAt).getTime() - new Date(result.startedAt).getTime()) / 1000
      )
    );
    durationMin = Math.floor(diffSeconds / 60);
    durationSec = diffSeconds % 60;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* SCORE HEADER HERO - Solid Navy */}
      <div className="bg-brand-navy text-white rounded-lg p-6 sm:p-8 shadow-sm border border-slate-800 text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-white/20 bg-white/10 text-brand-blue-50 text-xs font-semibold uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5 text-brand-blue-50" /> Hasil Evaluasi Simulasi
        </div>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
            {result.tryoutTitle}
          </h1>
          <p className="text-slate-300 text-xs">
            Diselesaikan pada{" "}
            {result.submittedAt
              ? new Date(result.submittedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-"}
          </p>
        </div>

        {/* Big Score Box */}
        <div className="inline-block bg-white/5 px-8 py-5 rounded-md border border-white/10">
          <div className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold mb-1">
            Skor Total
          </div>
          <div className="text-4xl sm:text-5xl font-extrabold text-white">
            {result.score}{" "}
            <span className="text-lg sm:text-xl font-normal text-slate-400">/ {result.maxScore}</span>
          </div>
          <div className="mt-1.5 text-xs sm:text-sm font-bold text-amber-300">
            Nilai Akhir: {result.percent}%
          </div>
        </div>

        {/* Durasi & Statistik Mini */}
        <div className="flex items-center justify-center gap-6 text-xs text-slate-300 border-t border-white/10 pt-4 max-w-sm mx-auto">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand-blue-50" />
            <span>Durasi: {durationMin}m {durationSec}s</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>Total: 30 Butir Soal</span>
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/tryout"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-brand-blue hover:bg-blue-600 text-white font-semibold text-xs transition shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Ulangi Tryout
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard
          </Link>
        </div>
      </div>

      {/* RINCIAN PEMBAHASAN PER SOAL */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-blue" /> Pembahasan Soal & Kunci Jawaban
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            10 Stimulus Soal
          </span>
        </div>

        {result.questions.map((q) => (
          <div
            key={q.id}
            className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-5"
          >
            {/* Header Soal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-brand-navy text-sm uppercase tracking-wider">
                Soal #{q.order}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                Skor Soal: {q.correctCount} / 3 Benar
              </span>
            </div>

            {/* Stimulus Bacaan */}
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium">
              {q.stem}
            </div>

            {/* List 3 Pernyataan & Pembahasan */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Rincian 3 Pernyataan:
              </h4>

              <div className="space-y-3">
                {q.statements.map((stmt) => (
                  <div
                    key={stmt.id}
                    className={`p-4 rounded-md border ${
                      stmt.isCorrect
                        ? "bg-emerald-50/40 border-emerald-300"
                        : "bg-rose-50/40 border-rose-300"
                    }`}
                  >
                    {/* Statement Text & Result Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-900 flex-grow">
                        <span className="w-5 h-5 rounded bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-300">
                          {stmt.order}
                        </span>
                        <span className="font-medium leading-snug">{stmt.text}</span>
                      </div>

                      {stmt.isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex-shrink-0">
                          <Check className="w-3 h-3" /> Benar (+1)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 flex-shrink-0">
                          <X className="w-3 h-3" /> Salah (0)
                        </span>
                      )}
                    </div>

                    {/* Answers Comparison */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap items-center gap-4 text-xs">
                      <div>
                        <span className="text-slate-500">Jawaban Kamu: </span>
                        <span
                          className={`font-bold ${
                            stmt.userAnswer === null
                              ? "text-slate-400 italic"
                              : stmt.isCorrect
                              ? "text-emerald-700"
                              : "text-rose-700"
                          }`}
                        >
                          {stmt.userAnswer === null
                            ? "Tidak Dijawab"
                            : stmt.userAnswer
                            ? "Benar"
                            : "Salah"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500">Kunci Jawaban: </span>
                        <span className="font-bold text-slate-800">
                          {stmt.isTrue ? "Benar" : "Salah"}
                        </span>
                      </div>
                    </div>

                    {/* Explanation */}
                    {stmt.explanation && (
                      <div className="mt-3 bg-white p-3 rounded border border-slate-200 text-xs text-slate-700 leading-relaxed">
                        <span className="font-bold text-brand-navy block mb-0.5">
                          💡 Pembahasan:
                        </span>
                        {stmt.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
