"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { UserPlus, AlertCircle, Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (name.trim().length < 2) {
      setErrorMsg("Nama minimal 2 karakter");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password minimal 8 karakter");
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      setErrorMsg("Password harus mengandung kombinasi huruf dan angka");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error?.message || "Pendaftaran gagal");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMsg("Gagal menghubungi server, periksa koneksi internet kamu");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Logo height={34} />
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-brand-navy">
          Daftar Akun Baru
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Sudah memiliki akun?{" "}
          <Link href="/login" className="font-semibold text-brand-blue hover:underline">
            Masuk sekarang
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-lg sm:px-8">
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
                placeholder="Minimal 8 karakter huruf dan angka"
                className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-brand-navy placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Minimal 8 karakter, harus mengandung huruf dan angka.
              </p>
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
