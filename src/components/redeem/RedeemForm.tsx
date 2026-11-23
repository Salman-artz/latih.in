"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";

export function RedeemForm() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState<{
    endsAt: string;
    durationDays: number;
  } | null>(null);

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessData(null);

    const clean = code.trim().toUpperCase().replace(/[-\s]/g, "");
    if (!clean) {
      setErrorMsg("Silakan masukkan kode redeem");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: clean }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error?.message || "Penukaran kode redeem gagal");
        setIsLoading(false);
        return;
      }

      setSuccessData({
        endsAt: data.subscription.endsAt,
        durationDays: data.subscription.durationDays,
      });
      setCode("");
      setIsLoading(false);
    } catch {
      setErrorMsg("Gagal menghubungi server, silakan coba lagi");
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white p-5 sm:p-7 rounded-lg border border-slate-200 shadow-sm">
      {successData ? (
        <div className="space-y-5 text-center py-3">
          <div className="w-12 h-12 rounded-md bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-300">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-brand-navy">Kode Berhasil Diaktifkan!</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Masa aktif paket Premium kamu telah berhasil ditambahkan sebesar{" "}
              <span className="font-semibold text-brand-navy">{successData.durationDays} hari</span>.
            </p>
            <div className="inline-block bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-md mt-2 border border-emerald-300">
              Aktif hingga:{" "}
              {new Date(successData.endsAt).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/materi"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-brand-blue text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
            >
              Mulai Belajar Materi <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/tryout"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md border border-slate-300 text-brand-navy text-xs sm:text-sm font-semibold hover:bg-slate-50 transition"
            >
              Ke Tryout Online
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleRedeem} className="space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-rose-700 font-medium">{errorMsg}</p>
            </div>
          )}

          <div>
            <label htmlFor="code" className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-1.5">
              Kode Voucher / Redeem
            </label>
            <input
              id="code"
              type="text"
              required
              maxLength={20}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Contoh: LATIH-DEMO-0001"
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-md font-mono text-center text-sm sm:text-base tracking-wider font-bold text-brand-navy placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition"
            />
            <p className="mt-1.5 text-[11px] text-slate-500 text-center">
              Format fleksibel: spasi dan tanda hubung (-) akan dibersihkan secara otomatis.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-md text-xs sm:text-sm font-semibold text-white bg-brand-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-50 transition shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Memvalidasi Kode...
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" /> Tukarkan Kode Sekarang
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
