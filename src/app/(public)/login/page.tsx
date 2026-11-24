"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { LogIn, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg("Alamat email wajib diisi");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg("Format email tidak valid");
      return;
    }
    if (!password) {
      setErrorMsg("Password wajib diisi");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error?.message || "Email atau password salah");
        setIsLoading(false);
        return;
      }

      window.location.href = callbackUrl;
    } catch {
      setErrorMsg("Gagal menghubungi server, periksa koneksi internet kamu");
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-lg sm:px-8">
      {errorMsg && (
        <div className="mb-5 p-3.5 rounded-md bg-rose-50 border border-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-rose-700 font-medium">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
            Alamat Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-brand-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-brand-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md text-xs sm:text-sm font-semibold text-white bg-brand-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-50 transition shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" /> Masuk ke Akun
            </>
          )}
        </button>
      </form>

      {/* Akun demo helper */}
      <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
        <p className="font-bold text-slate-700">Akun Demo Pengujian:</p>
        <p>Admin: <span className="font-mono text-slate-900 font-semibold">admin@demo.test</span> / <span className="font-mono text-slate-900 font-semibold">Demo#12345</span></p>
        <p>Siswa: <span className="font-mono text-slate-900 font-semibold">user@demo.test</span> / <span className="font-mono text-slate-900 font-semibold">Demo#12345</span></p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Tombol Kembali ke Landing Page */}
      <div className="w-full max-w-md mx-auto mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-brand-blue transition group px-1 py-1"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Logo height={34} />
        <h2 className="mt-5 sm:mt-6 text-xl sm:text-2xl font-bold tracking-tight text-brand-navy">
          Masuk ke Akun Kamu
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-gray-600">
          Belum punya akun?{" "}
          <Link href="/register" className="font-semibold text-brand-blue hover:underline">
            Daftar sekarang
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">Memuat formulir masuk...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
