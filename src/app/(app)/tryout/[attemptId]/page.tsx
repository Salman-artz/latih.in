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
  ShieldAlert,
  Maximize2,
} from "lucide-react";
import { ModalDialog, ModalDialogState } from "@/components/ui/ModalDialog";
import type { ViolationType } from "@/core/domain/entities/tryout.entity";

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
  violationCount: number;
  maxViolations: number;
  participant: {
    id: string;
    name: string;
    email: string;
  };
  questions: QuestionItem[];
}

interface ViolationModalState {
  isOpen: boolean;
  count: number;
  max: number;
  reason: string;
  autoSubmitted: boolean;
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
  const [dialogState, setDialogState] = useState<ModalDialogState>({
    isOpen: false,
    message: "",
  });
  const [violationCount, setViolationCount] = useState(0);
  const [maxViolations, setMaxViolations] = useState(3);
  const [needsFullscreenGate, setNeedsFullscreenGate] = useState(false);
  const [proctoringArmed, setProctoringArmed] = useState(false);
  const [violationModal, setViolationModal] = useState<ViolationModalState>({
    isOpen: false,
    count: 0,
    max: 3,
    reason: "",
    autoSubmitted: false,
  });

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const pendingAnswersRef = useRef<Record<string, boolean>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inFlightSaveRef = useRef<Promise<boolean> | null>(null);

  const violationCountRef = useRef(0);
  const maxViolationsRef = useRef(3);
  const lastViolationAtRef = useRef(0);
  const lastFullscreenTransitionRef = useRef(0);
  const isIntentionalExitRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const proctoringArmedRef = useRef(false);
  const baselineViewportRef = useRef<{ width: number; height: number } | null>(null);

  violationCountRef.current = violationCount;
  maxViolationsRef.current = maxViolations;
  isSubmittingRef.current = isSubmitting;
  proctoringArmedRef.current = proctoringArmed;

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
        setViolationCount(data.violationCount ?? 0);
        setMaxViolations(data.maxViolations ?? 3);

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

        // Upayakan auto-fullscreen saat mulai; jika diblokir browser (tanpa gesture), tampilkan gate
        void attemptEnterFullscreen(true);
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

  async function sendAnswersBatch(payload: { statementId: string; answer: boolean }[]): Promise<boolean> {
    try {
      const res = await fetch(`/api/tryout/${attemptId}/answers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function flushPendingAnswers(): Promise<boolean> {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (inFlightSaveRef.current) {
      await inFlightSaveRef.current;
    }

    const batch = { ...pendingAnswersRef.current };
    const entries = Object.entries(batch);
    if (entries.length === 0) return true;

    pendingAnswersRef.current = {};
    const payload = entries.map(([statementId, answer]) => ({ statementId, answer }));

    const savePromise = sendAnswersBatch(payload);
    inFlightSaveRef.current = savePromise;
    const ok = await savePromise;
    if (inFlightSaveRef.current === savePromise) {
      inFlightSaveRef.current = null;
    }

    if (ok) {
      if (Object.keys(pendingAnswersRef.current).length === 0) {
        setSaveStatus("SAVED");
      }
      return true;
    }

    // Kembalikan batch yang gagal agar tidak hilang dan bisa dicoba ulang
    pendingAnswersRef.current = { ...batch, ...pendingAnswersRef.current };
    setSaveStatus("ERROR");
    return false;
  }

  async function flushAllAnswersBeforeSubmit(): Promise<boolean> {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (inFlightSaveRef.current) {
      await inFlightSaveRef.current;
    }

    const allEntries = Object.entries(answersRef.current);
    if (allEntries.length === 0) return true;

    pendingAnswersRef.current = {};
    const payload = allEntries.map(([statementId, answer]) => ({ statementId, answer }));

    const savePromise = sendAnswersBatch(payload);
    inFlightSaveRef.current = savePromise;
    const ok = await savePromise;
    if (inFlightSaveRef.current === savePromise) {
      inFlightSaveRef.current = null;
    }

    if (ok) {
      setSaveStatus("SAVED");
    } else {
      setSaveStatus("ERROR");
    }
    return ok;
  }

  async function attemptEnterFullscreen(initialCheck = false) {
    if (typeof document === "undefined") return;
    const rootEl = document.documentElement;
    const fsSupported = Boolean(rootEl.requestFullscreen);

    if (!fsSupported) {
      // Browser seperti iOS Safari tidak mendukung Fullscreen API pada elemen;
      // aktifkan pengawasan langsung tanpa mengunci user di gate fullscreen.
      baselineViewportRef.current = { width: window.innerWidth, height: window.innerHeight };
      setNeedsFullscreenGate(false);
      setProctoringArmed(true);
      return;
    }

    if (document.fullscreenElement) {
      baselineViewportRef.current = { width: window.innerWidth, height: window.innerHeight };
      setNeedsFullscreenGate(false);
      setProctoringArmed(true);
      await lockEscapeKey();
      return;
    }

    try {
      lastFullscreenTransitionRef.current = Date.now();
      await rootEl.requestFullscreen();
      await lockEscapeKey();
      baselineViewportRef.current = { width: window.innerWidth, height: window.innerHeight };
      setNeedsFullscreenGate(false);
      setProctoringArmed(true);
    } catch {
      if (initialCheck) {
        setNeedsFullscreenGate(true);
        setProctoringArmed(false);
      }
    }
  }

  async function lockEscapeKey() {
    try {
      const nav = navigator as Navigator & {
        keyboard?: { lock?: (keyCodes?: string[]) => Promise<void>; unlock?: () => void };
      };
      if (nav.keyboard?.lock) {
        await nav.keyboard.lock(["Escape"]);
      }
    } catch {
      // Abaikan jika browser tidak mendukung Keyboard Lock API
    }
  }

  function releaseFullscreenAndLocks() {
    isIntentionalExitRef.current = true;
    try {
      const nav = navigator as Navigator & {
        keyboard?: { unlock?: () => void };
      };
      nav.keyboard?.unlock?.();
      if (typeof document !== "undefined" && document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {});
      }
    } catch {
      // Abaikan
    }
  }

  async function reportViolation(type: ViolationType, reason: string) {
    if (isIntentionalExitRef.current || isSubmittingRef.current || !proctoringArmedRef.current) {
      return;
    }

    const now = Date.now();
    // Debounce 1,5 detik agar beberapa event bersamaan hanya dihitung 1x
    if (now - lastViolationAtRef.current < 1500) {
      return;
    }
    lastViolationAtRef.current = now;

    // Jika ini akan menjadi strike terakhir, flush jawaban terlebih dahulu sebelum server auto-submit
    if (violationCountRef.current + 1 >= maxViolationsRef.current) {
      isIntentionalExitRef.current = true;
      await flushAllAnswersBeforeSubmit();
    }

    try {
      const res = await fetch(`/api/tryout/${attemptId}/violations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, detail: reason }),
      });

      if (!res.ok) return;
      const data = await res.json();

      setViolationCount(data.violationCount);
      setMaxViolations(data.maxViolations);

      if (data.autoSubmitted) {
        releaseFullscreenAndLocks();
        setViolationModal({
          isOpen: true,
          count: data.violationCount,
          max: data.maxViolations,
          reason,
          autoSubmitted: true,
        });
        setTimeout(() => {
          router.push(`/tryout/${attemptId}/hasil`);
        }, 1800);
        return;
      }

      setViolationModal({
        isOpen: true,
        count: data.violationCount,
        max: data.maxViolations,
        reason,
        autoSubmitted: false,
      });
    } catch {
      // Tetap tampilkan modal peringatan jika offline sesaat
      setViolationModal({
        isOpen: true,
        count: violationCountRef.current,
        max: maxViolationsRef.current,
        reason,
        autoSubmitted: false,
      });
    }
  }

  // 2b. Penguncian Navigasi, Deteksi Pelanggaran Real-Time, & Proteksi Shortcut
  useEffect(() => {
    if (!exam) return;

    // Blokir tombol Back browser / gesture swipe
    window.history.pushState({ examLock: true }, "", window.location.href);
    function handlePopState() {
      if (isIntentionalExitRef.current) return;
      window.history.pushState({ examLock: true }, "", window.location.href);
      setDialogState({
        isOpen: true,
        type: "alert",
        title: "Navigasi Dinonaktifkan",
        message: "Tombol kembali dinonaktifkan selama ujian berlangsung. Gunakan tombol Kumpulkan Tryout jika sudah selesai.",
      });
    }

    // Peringatan tutup/refresh tab
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isIntentionalExitRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    }

    // Deteksi pindah tab / aplikasi
    function handleVisibilityChange() {
      if (document.hidden) {
        void reportViolation("TAB_SWITCH", "Berpindah tab browser atau meminimalkan aplikasi.");
      }
    }

    // Deteksi kehilangan fokus jendela
    function handleWindowBlur() {
      void reportViolation("WINDOW_BLUR", "Jendela ujian kehilangan fokus (klik di luar layar ujian).");
    }

    // Deteksi keluar mode layar penuh
    function handleFullscreenChange() {
      lastFullscreenTransitionRef.current = Date.now();
      if (document.fullscreenElement) {
        baselineViewportRef.current = { width: window.innerWidth, height: window.innerHeight };
        return;
      }
      if (!isIntentionalExitRef.current && proctoringArmedRef.current) {
        void reportViolation("EXIT_FULLSCREEN", "Keluar dari mode layar penuh (fullscreen).");
      }
    }

    // Deteksi split-screen / perubahan dimensi layar mendadak
    function handleResize() {
      if (Date.now() - lastFullscreenTransitionRef.current < 600) return;
      const base = baselineViewportRef.current;
      if (!base) {
        baselineViewportRef.current = { width: window.innerWidth, height: window.innerHeight };
        return;
      }
      const widthDrop = base.width - window.innerWidth;
      const heightDrop = base.height - window.innerHeight;
      if (widthDrop > 180 || heightDrop > 180) {
        baselineViewportRef.current = { width: window.innerWidth, height: window.innerHeight };
        void reportViolation("SPLIT_SCREEN", "Terdeteksi perubahan ukuran layar mendadak (split-screen).");
      }
    }

    // Blokir shortcut DevTools, Print, Save, View Source
    function handleKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      const isDevTools =
        e.key === "F12" ||
        (ctrlOrMeta && e.shiftKey && ["i", "j", "c"].includes(key)) ||
        (ctrlOrMeta && ["u", "p", "s"].includes(key));

      if (isDevTools) {
        e.preventDefault();
        e.stopPropagation();
        void reportViolation("DEVTOOLS_OR_PRINT", "Mencoba membuka DevTools, mencetak, atau menyimpan halaman soal.");
      }
    }

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [exam]);

  async function handleAutoSubmit() {
    isIntentionalExitRef.current = true;
    setIsSubmitting(true);
    try {
      await flushAllAnswersBeforeSubmit();
      await fetch(`/api/tryout/${attemptId}/submit`, { method: "POST" });
      releaseFullscreenAndLocks();
      router.push(`/tryout/${attemptId}/hasil`);
    } catch {
      releaseFullscreenAndLocks();
      router.push(`/tryout/${attemptId}/hasil`);
    }
  }

  // 3. Simpan jawaban otomatis (debounce + batching agar klik cepat tidak menimpa)
  function handleSelectAnswer(statementId: string, value: boolean) {
    const updated = { ...answersRef.current, [statementId]: value };
    answersRef.current = updated;
    setAnswers(updated);
    pendingAnswersRef.current[statementId] = value;
    setSaveStatus("SAVING");

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      void flushPendingAnswers();
    }, 400);
  }

  // 4. Submit manual
  async function handleConfirmSubmit() {
    setIsSubmitting(true);
    try {
      const savedAll = await flushAllAnswersBeforeSubmit();
      if (!savedAll) {
        setDialogState({
          isOpen: true,
          type: "danger",
          title: "Gagal Menyimpan Jawaban Terakhir",
          message: "Pastikan koneksi internet stabil lalu coba kumpulkan kembali.",
        });
        setIsSubmitting(false);
        return;
      }

      const res = await fetch(`/api/tryout/${attemptId}/submit`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setDialogState({
          isOpen: true,
          type: "danger",
          title: "Gagal Mengumpulkan Tryout",
          message: data.error?.message || "Gagal mengumpulkan tryout",
        });
        setIsSubmitting(false);
        return;
      }
      releaseFullscreenAndLocks();
      router.push(`/tryout/${attemptId}/hasil`);
    } catch {
      setDialogState({
        isOpen: true,
        type: "danger",
        title: "Kendala Jaringan",
        message: "Terjadi kendala jaringan saat submit, silakan coba lagi.",
      });
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
          className="px-5 py-2.5 rounded-md bg-brand-blue text-white text-sm font-semibold"
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

  const watermarkText = `${exam.participant.name} • ${exam.participant.email} • ${exam.participant.id}`;

  return (
    <div
      className="max-w-5xl mx-auto space-y-6 pb-12 select-none relative"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => {
        e.preventDefault();
        void reportViolation("COPY_ATTEMPT", "Mencoba menyalin teks soal.");
      }}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
    >
      {/* DYNAMIC WATERMARK OVERLAY */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-20 overflow-hidden select-none opacity-[0.06] flex flex-wrap items-center justify-center gap-12 -rotate-12 scale-125"
      >
        {Array.from({ length: 18 }).map((_, idx) => (
          <span
            key={idx}
            className="text-xs sm:text-sm font-bold text-slate-900 whitespace-nowrap tracking-wider"
          >
            {watermarkText}
          </span>
        ))}
      </div>

      {/* TOP BAR: TIMER, STRIKE COUNTER & AUTOSAVE STATUS */}
      <div className="bg-white px-4 sm:px-6 py-3.5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between sticky top-16 z-30 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold px-2.5 py-1 bg-brand-blue-50 text-brand-blue rounded-md border border-brand-blue/20">
            Soal {currentQIndex + 1} / {exam.questions.length}
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
              violationCount > 0
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-slate-50 text-slate-600 border-slate-200"
            }`}
          >
            Pelanggaran: {violationCount}/{maxViolations}
          </span>
          <span className="hidden sm:inline-block text-xs text-slate-500">
            {saveStatus === "SAVING" && "Menyimpan perubahan..."}
            {saveStatus === "SAVED" && "Semua jawaban tersimpan"}
            {saveStatus === "ERROR" && "Gagal menyimpan, periksa koneksi"}
          </span>
        </div>

        {/* Timer display */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs sm:text-sm font-bold border transition ${
            isTimeLow
              ? "bg-rose-50 text-rose-600 border-rose-300 animate-pulse"
              : "bg-slate-50 text-brand-navy border-slate-200"
          }`}
        >
          <Clock className="w-4 h-4 text-brand-blue" />
          <span>{timeFormatted}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* AREA SOAL & PERNYATAAN (KIRI) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-5 sm:p-8 rounded-lg border border-slate-200 shadow-sm space-y-6">
            {/* Stimulus / Stem Soal */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Stimulus Bacaan / Teks Soal #{currentQuestion.order}
              </span>
              <div className="p-4 sm:p-5 rounded-md bg-slate-50 border border-slate-200 text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
                {currentQuestion.stem}
              </div>
            </div>

            {/* 3 Pernyataan Benar/Salah */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-brand-navy">
                  Pilihlah Benar (B) atau Salah (S) untuk setiap pernyataan berikut:
                </h3>
                <span className="text-xs text-slate-400">3 Butir</span>
              </div>

              <div className="space-y-3.5">
                {currentQuestion.statements.map((stmt) => {
                  const currentAnswer = answers[stmt.id];
                  const isAnswered = currentAnswer !== undefined;

                  return (
                    <div
                      key={stmt.id}
                      className={`p-3.5 sm:p-4 rounded-md border transition ${
                        isAnswered
                          ? "bg-brand-blue-50/20 border-brand-blue/30"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 flex-grow">
                          <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-200">
                            {stmt.order}
                          </span>
                          <p className="leading-relaxed">{stmt.text}</p>
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
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQIndex === 0}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-md border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronLeft className="w-4 h-4" /> Sebelumnya
              </button>

              <div className="flex items-center gap-2">
                {currentQIndex < exam.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQIndex((prev) => Math.min(exam.questions.length - 1, prev + 1))}
                    className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-md bg-brand-blue text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
                  >
                    Berikutnya <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-md bg-emerald-600 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-700 transition shadow-sm"
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
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
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
                    className={`h-11 rounded-md text-xs font-bold flex flex-col items-center justify-center border transition relative ${
                      isActive
                        ? "bg-brand-blue text-white border-brand-blue shadow-sm ring-2 ring-brand-blue/30"
                        : isFullyAnswered
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                        : isPartiallyAnswered
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
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

            <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Pernyataan Terjawab:</span>
                <span className="font-bold text-emerald-700">{answeredCount} butir</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Pernyataan Kosong:</span>
                <span className={`font-bold ${emptyCount > 0 ? "text-amber-700" : "text-slate-700"}`}>
                  {emptyCount} butir
                </span>
              </div>
              {emptyCount > 0 && (
                <div className="pt-2 border-t border-slate-200 text-xs text-amber-800 leading-relaxed">
                  ⚠️ <strong>Perhatian:</strong> {emptyCount} butir pernyataan yang dikosongkan tidak memperoleh poin (dihitung 0).
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-md border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Kembali Periksa
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow transition disabled:opacity-50"
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

      <ModalDialog
        state={dialogState}
        onClose={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* GATE MODE LAYAR PENUH */}
      {needsFullscreenGate && !violationModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-brand-navy/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-md bg-brand-blue-50 text-brand-blue mx-auto flex items-center justify-center border border-brand-blue/20">
              <Maximize2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-brand-navy">Mode Layar Penuh Wajib Aktif</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Untuk menjaga integritas tryout, ujian hanya dapat dikerjakan dalam mode layar penuh.
              Berpindah tab, keluar layar penuh, atau membuka split-screen akan dicatat sebagai pelanggaran
              (maksimal <strong>{maxViolations}x</strong> sebelum otomatis dikumpulkan).
            </p>
            <button
              type="button"
              onClick={() => void attemptEnterFullscreen(false)}
              className="w-full py-2.5 px-4 rounded-md bg-brand-blue hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition"
            >
              Aktifkan Layar Penuh &amp; Lanjutkan Ujian
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM MODAL PERINGATAN PELANGGARAN */}
      {violationModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-brand-navy/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-rose-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-md bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-rose-700">
              {violationModal.autoSubmitted
                ? "Batas Pelanggaran Tercapai"
                : `Peringatan Pelanggaran (${violationModal.count}/${violationModal.max})`}
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {violationModal.reason}
            </p>
            {violationModal.autoSubmitted ? (
              <p className="text-xs text-rose-600 font-semibold">
                Ujian otomatis dikumpulkan dan skor sedang dihitung. Mengalihkan ke halaman hasil...
              </p>
            ) : (
              <>
                <p className="text-xs text-slate-500">
                  Sisa kesempatan: <strong>{Math.max(0, violationModal.max - violationModal.count)}x</strong>. Jika mencapai{" "}
                  <strong>{violationModal.max}x</strong>, ujian akan otomatis disubmit.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setViolationModal((prev) => ({ ...prev, isOpen: false }));
                    void attemptEnterFullscreen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-sm transition"
                >
                  Kembali ke Ujian (Layar Penuh)
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
