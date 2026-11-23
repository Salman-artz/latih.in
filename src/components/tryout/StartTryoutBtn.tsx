"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, ArrowRight, Loader2 } from "lucide-react";

interface StartTryoutBtnProps {
  activeAttemptId: string | null;
}

export function StartTryoutBtn({ activeAttemptId }: StartTryoutBtnProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleStart() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tryout/start", {
        method: "POST",
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
      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition disabled:opacity-50"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Menyiapkan Lembar Soal...
        </>
      ) : activeAttemptId ? (
        <>
          Lanjutkan Pengerjaan <ArrowRight className="w-4 h-4" />
        </>
      ) : (
        <>
          <PlayCircle className="w-5 h-5" /> Mulai Simulasi Sekarang
        </>
      )}
    </button>
  );
}
