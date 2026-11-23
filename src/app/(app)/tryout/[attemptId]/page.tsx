"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Check,
  X,
} from "lucide-react";

interface StatementItem {
  id: string;
  order: number;
  text: string;
  userAnswer: boolean | null;
}

interface QuestionItem {
  id: string;
  order: number;
  stem: string;
  statements: StatementItem[];
}

interface ExamData {
  attemptId: string;
  tryoutTitle: string;
  startedAt: string;
  durationMinutes: number;
  remainingSeconds: number;
  questions: QuestionItem[];
}

export default function TryoutExamPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = use(params);
  const router = useRouter();

  const [exam, setExam] = useState<ExamData | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [saveStatus, setSaveStatus] = useState<"SAVED" | "SAVING" | "ERROR">("SAVED");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const answersRef = useRef(answers);
  answersRef.current = answers;

  // 1. Fetch Lembar Soal dari server
  useEffect(() => {
    async function loadExam() {
      try {
        const res = await fetch(`/api/tryout/${attemptId}`);
        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error?.message || "Gagal memuat lembar tryout");
          setInitialLoading(false);
          return;
        }

        setExam(data);
        setRemainingTime(data.remainingSeconds);

        // Inisialisasi peta jawaban dari database
        const initialMap: Record<string, boolean> = {};
        for (const q of data.questions) {
          for (const s of q.statements) {
            if (s.userAnswer !== null && s.userAnswer !== undefined) {
              initialMap[s.id] = s.userAnswer;
            }
          }
        }
        setAnswers(initialMap);
        setInitialLoading(false);
      } catch {
        setErrorMsg("Koneksi gagal saat memuat tryout");
        setInitialLoading(false);
      }
    }

    loadExam();
  }, [attemptId]);

  // 2. Timer hitung mundur server-synchronized & Auto-submit
  useEffect(() => {
    if (!exam || remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam]);

  async function handleAutoSubmit() {
    setIsSubmitting(true);
    try {
      await fetch(`/api/tryout/${attemptId}/submit`, { method: "POST" });
      router.push(`/tryout/${attemptId}/hasil`);
    } catch {
      router.push(`/tryout/${attemptId}/hasil`);
    }
  }

  // 3. Simpan jawaban otomatis (debounce)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  function handleSelectAnswer(statementId: string, value: boolean) {
    const updated = { ...answers, [statementId]: value };
    setAnswers(updated);
    setSaveStatus("SAVING");

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const payload = [{ statementId, answer: value }];
        const res = await fetch(`/api/tryout/${attemptId}/answers`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: payload }),
        });
        if (res.ok) {
          setSaveStatus("SAVED");
        } else {
          setSaveStatus("ERROR");
        }
      } catch {
        setSaveStatus("ERROR");
      }
    }, 400);
  }

  // 4. Submit manual
  async function handleConfirmSubmit() {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tryout/${attemptId}/submit`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error?.message || "Gagal mengumpulkan tryout");
        setIsSubmitting(false);
        return;
      }
      router.push(`/tryout/${attemptId}/hasil`);
    } catch {
      alert("Terjadi kendala jaringan saat submit");
      setIsSubmitting(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        <p className="text-sm font-medium text-gray-600">Memuat lembar simulasi tryout...</p>
      </div>
    );
  }

  if (errorMsg || !exam) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-brand-navy">Kendala Memuat Tryout</h2>
        <p className="text-sm text-gray-600">{errorMsg || "Data tidak ditemukan"}</p>
        <button
          onClick={() => router.push("/tryout")}
          className="px-5 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-semibold"
        >
          Kembali ke Menu Tryout
        </button>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQIndex];
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isTimeLow = remainingTime < 180; // kurang dari 3 menit

  // Hitung total terjawab dari 30 pernyataan
  const totalStatements = 30;
  const answeredCount = Object.keys(answers).length;
  const emptyCount = totalStatements - answeredCount;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* TOP BAR: TIMER & AUTOSAVE STATUS */}
      <div className="bg-white px-4 sm:px-6 py-3.5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between sticky top-16 z-30 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold px-2.5 py-1 bg-brand-blue-50 text-brand-blue rounded-lg">
            Soal {currentQIndex + 1} / {exam.questions.length}
          </span>
          <span className="hidden sm:inline-block text-xs text-gray-500">
            {saveStatus === "SAVING" && "Menyimpan perubahan..."}
            {saveStatus === "SAVED" && "Semua jawaban tersimpan"}
            {saveStatus === "ERROR" && "Gagal menyimpan, periksa koneksi"}
          </span>
        </div>

        {/* Timer display */}
        <div
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold border transition ${
            isTimeLow
              ? "bg-red-50 text-red-600 border-red-200 animate-pulse"
              : "bg-gray-50 text-brand-navy border-gray-200"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{timeFormatted}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* AREA SOAL & PERNYATAAN (KIRI) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200/80 shadow-sm space-y-6">
            {/* Stimulus / Stem Soal */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Stimulus Bacaan / Teks Soal #{currentQuestion.order}
              </span>
              <div className="p-4 sm:p-5 rounded-xl bg-gray-50/80 border border-gray-100 text-sm sm:text-base text-gray-800 leading-relaxed font-normal">
                {currentQuestion.stem}
              </div>
            </div>

            {/* 3 Pernyataan Benar/Salah */}
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-brand-navy">
                  Pilihlah Benar (B) atau Salah (S) untuk setiap pernyataan berikut:
                </h3>
                <span className="text-xs text-gray-400">3 Butir</span>
              </div>

              <div className="space-y-3.5">
                {currentQuestion.statements.map((stmt) => {
                  const currentAnswer = answers[stmt.id];
                  const isAnswered = currentAnswer !== undefined;

                  return (
                    <div
                      key={stmt.id}
                      className={`p-4 rounded-xl border transition ${
                        isAnswered
                          ? "bg-brand-blue-50/20 border-brand-blue/30"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5 text-sm text-slate-800 flex-grow">
                          <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-200">
                            {stmt.order}
                          </span>
                          <p className="leading-snug">{stmt.text}</p>
                        </div>

                        {/* Toggle Tombol Benar / Salah */}
                        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleSelectAnswer(stmt.id, true)}
                            className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-bold transition border ${
                              currentAnswer === true
                                ? "bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-500/30"
                                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" /> Benar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectAnswer(stmt.id, false)}
                            className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-bold transition border ${
                              currentAnswer === false
                                ? "bg-rose-600 text-white border-rose-700 ring-2 ring-rose-500/30"
                                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300"
                            }`}
                          >
                            <X className="w-3.5 h-3.5" /> Salah
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigasi Bawah Soal */}
            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQIndex === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronLeft className="w-4 h-4" /> Sebelumnya
              </button>

              <div className="flex items-center gap-2">
                {currentQIndex < exam.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQIndex((prev) => Math.min(exam.questions.length - 1, prev + 1))}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
                  >
                    Berikutnya <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition shadow-sm"
                  >
                    <Send className="w-4 h-4" /> Submit Tryout
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PETA NOMOR SOAL & SUBMIT BUTTON (KANAN) */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider">
                Navigasi Soal
              </h4>
              <span className="text-[11px] font-semibold text-brand-blue">
                {answeredCount} / {totalStatements} Terjawab
              </span>
            </div>

            {/* Grid 10 Nomor */}
            <div className="grid grid-cols-5 gap-2">
              {exam.questions.map((q, idx) => {
                const isActive = idx === currentQIndex;
                const answeredStatementsInQ = q.statements.filter((s) => answers[s.id] !== undefined).length;
                const isFullyAnswered = answeredStatementsInQ === 3;
                const isPartiallyAnswered = answeredStatementsInQ > 0 && answeredStatementsInQ < 3;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-11 rounded-xl text-xs font-bold flex flex-col items-center justify-center border transition relative ${
                      isActive
                        ? "bg-brand-blue text-white border-brand-blue shadow-sm ring-2 ring-brand-blue/30"
                        : isFullyAnswered
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                        : isPartiallyAnswered
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <span>{idx + 1}</span>
                    <span className="text-[9px] opacity-75 font-normal">
                      {answeredStatementsInQ}/3
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Keterangan Warna */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 flex-shrink-0" />
                <span>3/3 Terjawab Lengkap</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 flex-shrink-0" />
                <span>Sebagian Terjawab</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 flex-shrink-0" />
                <span>Belum Terjawab</span>
              </div>
            </div>

            {/* Tombol Selesaikan */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-md bg-brand-navy hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition"
              >
                <Send className="w-3.5 h-3.5" /> Kumpulkan Tryout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL KONFIRMASI SUBMIT */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-brand-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-md bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-navy">Konfirmasi Pengumpulan</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Pastikan kamu telah memeriksa seluruh butir pernyataan sebelum menyelesaikan ujian.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Pernyataan Terjawab:</span>
                <span className="font-bold text-emerald-700">{answeredCount} butir</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pernyataan Kosong:</span>
                <span className={`font-bold ${emptyCount > 0 ? "text-amber-700" : "text-gray-700"}`}>
                  {emptyCount} butir
                </span>
              </div>
              {emptyCount > 0 && (
                <div className="pt-2 border-t border-gray-200 text-xs text-amber-800 leading-relaxed">
                  ⚠️ <strong>Perhatian:</strong> {emptyCount} butir pernyataan yang dikosongkan tidak memperoleh poin (dihitung 0).
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Kembali Periksa
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menilai...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Kumpulkan Sekarang
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
