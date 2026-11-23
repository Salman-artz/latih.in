"use client";

import { useState, useEffect } from "react";
import { User, KeyRound, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    role: string;
    createdAt: string;
  } | null>(null);

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
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadMe();
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsgSuccess("");
    setMsgError("");

    if (newPassword.length < 8) {
      setMsgError("Password baru minimal 8 karakter");
      return;
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
      setMsgError("Password baru harus mengandung huruf dan angka");
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
              placeholder="Minimal 8 karakter huruf dan angka"
              className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-brand-navy placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
            />
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
