import { getSession } from "@/lib/auth";
import { getAttemptResult } from "@/services/tryout";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  Award,
  Clock,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  LayoutDashboard,
  Check,
  X,
} from "lucide-react";

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
    result = await getAttemptResult(session.userId, attemptId, session.user.role);
  } catch {
    notFound();
  }

  const durationMin = Math.floor(result.durationSeconds / 60);
  const durationSec = result.durationSeconds % 60;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* SCORE HEADER HERO */}
      <div className="bg-gradient-to-br from-brand-navy via-slate-900 to-brand-navy text-white rounded-3xl p-6 sm:p-10 shadow-xl text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 text-brand-blue-50 text-xs font-semibold">
          <Award className="w-4 h-4 text-amber-400" /> Hasil Evaluasi Simulasi
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            {result.tryoutTitle}
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm">
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
        <div className="inline-block bg-white/10 backdrop-blur-md px-8 py-6 rounded-2xl border border-white/10 shadow-inner">
          <div className="text-xs uppercase tracking-wider text-gray-300 font-semibold mb-1">
            Skor Total
          </div>
          <div className="text-4xl sm:text-6xl font-extrabold text-white">
            {result.score}{" "}
            <span className="text-xl sm:text-2xl font-normal text-gray-400">/ {result.maxScore}</span>
          </div>
          <div className="mt-2 text-sm sm:text-base font-bold text-amber-400">
            Nilai Akhir: {result.percent}%
          </div>
        </div>

        {/* Durasi & Statistik Mini */}
        <div className="flex items-center justify-center gap-6 text-xs sm:text-sm text-gray-300 border-t border-white/10 pt-4 max-w-sm mx-auto">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-brand-blue" />
            <span>Durasi: {durationMin}m {durationSec}s</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{result.score} Butir Benar</span>
          </div>
        </div>

        {/* Action Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/tryout"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-semibold text-xs sm:text-sm shadow-md transition"
          >
            <RotateCcw className="w-4 h-4" /> Kerjakan Ulang Tryout
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm transition"
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
          <Link
            href="/riwayat"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm transition"
          >
            Lihat Riwayat <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* PEMBAHASAN DETAIL 10 SOAL */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-brand-navy">
              Pembahasan & Analisis Soal
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Pelajari kunci jawaban dan penjelasan di setiap butir pernyataan di bawah ini.
            </p>
          </div>
          <span className="text-xs font-bold text-gray-400">10 Soal</span>
        </div>

        <div className="space-y-6">
          {result.questions.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden"
            >
              {/* Question Header */}
              <div className="p-5 sm:p-6 bg-gray-50/60 border-b border-gray-100 flex justify-between items-center">
                <span className="text-xs font-bold px-3 py-1 bg-brand-navy text-white rounded-lg">
                  Soal #{q.order}
                </span>
                <span className="text-xs font-bold text-gray-700">
                  Benar: <span className="text-brand-blue">{q.correctCount}</span> dari 3 Pernyataan
                </span>
              </div>

              {/* Stem / Stimulus */}
              <div className="p-5 sm:p-6 border-b border-gray-100">
                <p className="text-sm sm:text-base text-gray-800 leading-relaxed font-normal">
                  {q.stem}
                </p>
              </div>

              {/* Statements & Explanations */}
              <div className="p-5 sm:p-6 space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Rincian 3 Pernyataan:
                </h4>

                <div className="space-y-4">
                  {q.statements.map((stmt) => (
                    <div
                      key={stmt.id}
                      className={`p-4 sm:p-5 rounded-xl border ${
                        stmt.isCorrect
                          ? "bg-emerald-50/30 border-emerald-200"
                          : "bg-rose-50/30 border-rose-200"
                      }`}
                    >
                      {/* Statement Text & Result Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 text-sm sm:text-base text-gray-900 flex-grow">
                          <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                            {stmt.order}
                          </span>
                          <span className="font-medium leading-snug">{stmt.text}</span>
                        </div>

                        {stmt.isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex-shrink-0">
                            <Check className="w-3.5 h-3.5" /> Benar (+1)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 flex-shrink-0">
                            <X className="w-3.5 h-3.5" /> Salah (0)
                          </span>
                        )}
                      </div>

                      {/* Answers Comparison */}
                      <div className="mt-3 pt-3 border-t border-gray-200/60 flex flex-wrap items-center gap-4 text-xs">
                        <div>
                          <span className="text-gray-500">Jawaban Kamu: </span>
                          <span
                            className={`font-bold ${
                              stmt.userAnswer === null
                                ? "text-gray-400 italic"
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
                          <span className="text-gray-500">Kunci Jawaban: </span>
                          <span className="font-bold text-brand-navy">
                            {stmt.isTrue ? "Benar" : "Salah"}
                          </span>
                        </div>
                      </div>

                      {/* Explanation */}
                      <div className="mt-3 p-3 rounded-lg bg-white border border-gray-100 text-xs text-gray-700 leading-relaxed">
                        <span className="font-bold text-brand-blue">Pembahasan: </span>
                        {stmt.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
