"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { UserPlus, AlertCircle, Loader2, ArrowLeft, Check, X } from "lucide-react";
import { validatePassword } from "@/lib/validators/auth";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Status kriteria password
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setErrorMsg("Nama minimal 2 karakter");
      return;
    }
    if (trimmedName.length > 80) {
      setErrorMsg("Nama maksimal 80 karakter");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg("Alamat email wajib diisi");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg("Format email tidak valid");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setErrorMsg(passwordValidation.error || "Password belum memenuhi syarat");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error?.message || "Pendaftaran gagal");
        setIsLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setErrorMsg("Gagal menghubungi server, periksa koneksi internet kamu");
      setIsLoading(false);
    }
  }

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
          Daftar Akun Baru
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-gray-600">
          Sudah memiliki akun?{" "}
          <Link href="/login" className="font-semibold text-brand-blue hover:underline">
            Masuk sekarang
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 sm:py-8 px-4 sm:px-8 shadow-sm border border-slate-200 rounded-lg">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-md bg-rose-50 border border-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-rose-700 font-medium">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama kamu"
                className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-brand-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
              />
            </div>

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
                placeholder="Minimal 8 karakter kombinasi"
                className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-brand-navy placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
              />
              
              {/* Syarat Keamanan Password */}
              <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-md space-y-1 text-[11px]">
                <p className="font-semibold text-slate-700">Ketentuan password:</p>
                <div className="grid grid-cols-2 gap-1 text-slate-600">
                  <span className={`inline-flex items-center gap-1.5 ${hasMinLength ? "text-emerald-700 font-medium" : ""}`}>
                    {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    Min. 8 karakter
                  </span>
                  <span className={`inline-flex items-center gap-1.5 ${hasUppercase ? "text-emerald-700 font-medium" : ""}`}>
                    {hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    1 huruf besar (A-Z)
                  </span>
                  <span className={`inline-flex items-center gap-1.5 ${hasLowercase ? "text-emerald-700 font-medium" : ""}`}>
                    {hasLowercase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    1 huruf kecil (a-z)
                  </span>
                  <span className={`inline-flex items-center gap-1.5 ${hasNumber ? "text-emerald-700 font-medium" : ""}`}>
                    {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    1 angka (0-9)
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md text-xs sm:text-sm font-semibold text-white bg-brand-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-50 transition shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Mendaftarkan...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Daftar Akun Sekarang
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
