"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

interface ProgressToggleBtnProps {
  materialId: string;
  initialCompleted: boolean;
}

export function ProgressToggleBtn({ materialId, initialCompleted }: ProgressToggleBtnProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [isLoading, setIsLoading] = useState(false);

  async function handleToggle() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/materials/${materialId}/progress`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setIsCompleted(data.isCompleted);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm ${
        isCompleted
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
      }`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
      ) : isCompleted ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
      ) : (
        <Circle className="w-4 h-4 text-gray-400" />
      )}
      <span>{isCompleted ? "Telah Selesai Ditonton" : "Tandai Selesai"}</span>
    </button>
  );
}
