"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";

export default function RedeemPage() {
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
    <div className="max-w-xl mx-auto py-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-brand-blue-50 text-brand-blue mb-2">
          <KeyRound className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy">
          Aktivasi / Perpanjang Langganan
        </h1>
        <p className="text-sm text-gray-600">
          Masukkan kode redeem yang kamu miliki untuk membuka seluruh akses materi dan simulasi tryout.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200/80 shadow-sm">
        {successData ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-brand-navy">Kode Berhasil Diaktifkan!</h2>
              <p className="text-sm text-gray-600">
                Masa aktif paket Premium kamu telah berhasil ditambahkan sebesar{" "}
                <span className="font-semibold text-brand-navy">{successData.durationDays} hari</span>.
              </p>
              <div className="inline-block bg-emerald-50 text-emerald-800 text-xs font-semibold px-4 py-2 rounded-xl mt-2 border border-emerald-200">
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
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-semibold hover:bg-blue-700 transition"
              >
                Mulai Belajar Materi <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/tryout"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-gray-300 text-brand-navy text-sm font-semibold hover:bg-gray-50 transition"
              >
                Ke Tryout Online
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRedeem} className="space-y-5">
            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
              </div>
            )}

            <div>
              <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-1">
                Kode Redeem
              </label>
              <input
                id="code"
                type="text"
                required
                maxLength={20}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Contoh: LATIH-DEMO-0001"
                className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl font-mono text-center text-lg tracking-wider font-bold text-brand-navy placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition"
              />
              <p className="mt-1.5 text-xs text-gray-500 text-center">
                Spasi dan tanda hubung (-) akan dibersihkan secara otomatis.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !code.trim()}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-brand-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-50 transition shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Memvalidasi Kode...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" /> Tukarkan Kode
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Info demo box */}
      <div className="bg-brand-blue-50/70 border border-brand-blue/20 p-4 rounded-xl text-xs text-brand-navy space-y-1.5">
        <p className="font-semibold text-brand-blue">Kode Redeem Demo Tersedia:</p>
        <p className="font-mono">LATIH-DEMO-0001, LATIH-DEMO-0002, LATIH-DEMO-0003, LATIH-DEMO-0004, LATIH-DEMO-0005</p>
        <p className="text-gray-600">Setiap kode memberikan akses langganan Premium selama 30 hari.</p>
      </div>
    </div>
  );
}
