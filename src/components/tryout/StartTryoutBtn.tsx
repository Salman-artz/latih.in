"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, ArrowRight, Loader2 } from "lucide-react";

interface StartTryoutBtnProps {
  tryoutId?: string;
  activeAttemptId?: string | null;
  label?: string;
}

export function StartTryoutBtn({
  tryoutId,
  activeAttemptId,
  label,
}: StartTryoutBtnProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleStart() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tryout/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tryoutId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error?.message || "Gagal memulai tryout");
        setIsLoading(false);
        return;
      }
      router.push(`/tryout/${data.attemptId}`);
    } catch {
      alert("Terjadi kendala jaringan, silakan coba lagi");
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleStart}
      disabled={isLoading}
      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-brand-blue hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition disabled:opacity-50 shadow-sm"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Menyiapkan Lembar Soal...
        </>
      ) : label ? (
        <>
          <PlayCircle className="w-4 h-4" /> {label}
        </>
      ) : activeAttemptId ? (
        <>
          Lanjutkan Pengerjaan <ArrowRight className="w-4 h-4" />
        </>
      ) : (
        <>
          <PlayCircle className="w-4 h-4" /> Mulai Simulasi Sekarang
        </>
      )}
    </button>
  );
}
