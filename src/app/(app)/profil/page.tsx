"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, KeyRound, CheckCircle2, AlertCircle, Loader2, Check, X, Award, ArrowRight } from "lucide-react";
import { validatePassword } from "@/lib/validators/auth";

interface SubscriptionPackage {
  id: string;
  tryoutId?: string | null;
  tryoutTitle?: string | null;
  startsAt: string;
  endsAt: string;
  daysLeft: number;
  isExpiringSoon: boolean;
  isActive: boolean;
  source?: "REDEEM" | "MANUAL";
  code?: string | null;
  codeLabel?: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    role: string;
    createdAt: string;
  } | null>(null);

  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState("");
  const [msgError, setMsgError] = useState("");

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();
        if (res.ok) {
          setProfile(data.user);
          if (data.subscription?.packages) {
            setPackages(data.subscription.packages);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadMe();
  }, []);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsgSuccess("");
    setMsgError("");

    if (!currentPassword) {
      setMsgError("Password saat ini wajib diisi");
      return;
    }

    const valResult = validatePassword(newPassword);
    if (!valResult.isValid) {
      setMsgError(valResult.error || "Password baru belum memenuhi syarat");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMsgError("Konfirmasi password baru tidak cocok");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsgError(data.error?.message || "Gagal mengubah password");
        setIsLoading(false);
        return;
      }

      setMsgSuccess("Password berhasil diubah!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsLoading(false);
    } catch {
      setMsgError("Gagal menghubungi server");
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-brand-navy">Profil Akun</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Informasi identitas akun dan pengaturan keamanan kata sandi kamu.
        </p>
      </div>

      {/* Info Akun Card */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-brand-navy pb-3 border-b border-slate-100 flex items-center gap-2">
          <User className="w-4 h-4 text-brand-blue" /> Data Pribadi
        </h2>

        {profile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-[11px] text-slate-500 block">Nama Lengkap</span>
              <span className="font-semibold text-brand-navy">{profile.name}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Alamat Email</span>
              <span className="font-semibold text-brand-navy">{profile.email}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Peran / Role Akun</span>
              <span className="inline-block mt-0.5 text-[11px] font-bold px-2 py-0.5 rounded bg-brand-blue-50 text-brand-blue border border-brand-blue/20">
                {profile.role}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Terdaftar Sejak</span>
              <span className="font-semibold text-brand-navy">
                {new Date(profile.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-4 text-xs text-slate-400">Memuat profil...</div>
        )}
      </div>

      {/* Paket Langganan Tryout Card */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-brand-navy flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-blue" /> Paket Langganan Tryout
          </h2>
          <Link
            href="/redeem"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:text-blue-800 transition"
          >
            <KeyRound className="w-3.5 h-3.5" /> Tukar Kode Baru
          </Link>
        </div>

        {packages.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs sm:text-sm text-brand-navy">
                      {pkg.tryoutTitle || "Semua Paket Tryout (Akses Penuh)"}
                    </span>
                    {pkg.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                        Kedaluwarsa
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>
                      Masa Aktif:{" "}
                      <strong className="text-slate-700">
                        {new Date(pkg.startsAt).toLocaleDateString("id-ID")} - {new Date(pkg.endsAt).toLocaleDateString("id-ID")}
                      </strong>
                    </span>
                    {pkg.isActive && (
                      <span className="text-brand-blue font-medium">
                        ({pkg.daysLeft} hari tersisa)
                      </span>
                    )}
                    {pkg.code && (
                      <span className="text-slate-400">
                        Kode: <code className="font-mono text-slate-600 font-semibold">{pkg.code}</code>
                        {pkg.codeLabel ? ` (${pkg.codeLabel})` : ""}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Link
                    href="/tryout"
                    className="px-3 py-1.5 rounded bg-brand-navy hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1 transition"
                  >
                    Buka Tryout <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <KeyRound className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-semibold text-brand-navy">
                Belum Memiliki Paket Langganan Tryout
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Kamu belum memiliki paket langganan tryout yang aktif. Masukkan kode redeem yang kamu miliki untuk mengaktifkan akses tryout.
              </p>
            </div>
            <Link
              href="/redeem"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-blue hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-sm transition"
            >
              <KeyRound className="w-3.5 h-3.5" /> Masukkan Kode Redeem
            </Link>
          </div>
        )}
      </div>

      {/* Form Ganti Password */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-5">
        <h2 className="text-sm font-bold text-brand-navy pb-3 border-b border-slate-100 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-brand-blue" /> Ganti Password
        </h2>

        {msgSuccess && (
          <div className="p-3 rounded-md bg-emerald-50 border border-emerald-300 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-emerald-800 font-medium">{msgSuccess}</p>
          </div>
        )}

        {msgError && (
          <div className="p-3 rounded-md bg-rose-50 border border-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-rose-700 font-medium">{msgError}</p>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password Saat Ini
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-brand-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password Baru
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 8 karakter kombinasi"
              className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-brand-navy placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
            />
            {/* Checklist Syarat Password Baru */}
            <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-md space-y-1 text-[11px]">
              <p className="font-semibold text-slate-700">Ketentuan password baru:</p>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-brand-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-brand-blue text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Memperbarui...
                </>
              ) : (
                "Simpan Password Baru"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
