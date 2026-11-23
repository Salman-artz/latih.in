import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { KeyRound, Shield, ArrowLeft } from "lucide-react";
import { RedeemForm } from "@/components/redeem/RedeemForm";

export const dynamic = "force-dynamic";

export default async function RedeemPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Jika Administrator: Tampilkan penjelasan bahwa Admin tidak bisa redeem/berlangganan
  if (session.user.role === "ADMIN") {
    return (
      <div className="max-w-xl mx-auto py-6 sm:py-12 space-y-6">
        <div className="bg-white p-6 sm:p-8 rounded-lg border border-slate-200 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-md bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-300">
            <Shield className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold text-brand-navy">
              Administrator Tidak Dapat Menukarkan Kode
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Fitur redeem kode voucher dan aktivasi paket langganan secara eksklusif diperuntukkan bagi akun <strong>Siswa</strong>. Sebagai Administrator, tugas Anda adalah mengatur, membuat (*generate*), dan membagikan kode voucher kepada siswa melalui Panel Admin.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-xs text-slate-600 text-left space-y-1.5">
            <p className="font-semibold text-slate-800">Petunjuk Pengujian Akun:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>Untuk mengelola kode voucher: Buka menu <strong>Kelola Kode</strong> di Panel Admin.</li>
              <li>Untuk menguji alur penukaran kode & simulasi siswa: Masuk menggunakan akun Siswa demo (<code className="bg-slate-200 px-1 py-0.5 rounded text-brand-navy">user@demo.test</code> / <code className="bg-slate-200 px-1 py-0.5 rounded text-brand-navy">Demo#12345</code>).</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/admin/kode"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-brand-blue text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
            >
              <KeyRound className="w-4 h-4" /> Kelola Kode di Panel Admin
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md border border-slate-300 text-brand-navy text-xs sm:text-sm font-semibold hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Jika Siswa: Tampilkan formulir penukaran kode
  return (
    <div className="max-w-xl mx-auto py-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-2.5 rounded-md bg-brand-blue-50 text-brand-blue mb-1 border border-brand-blue/20">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-brand-navy">
          Aktivasi / Perpanjang Langganan
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Masukkan kode redeem voucher untuk mengaktifkan seluruh akses materi dan simulasi tryout.
        </p>
      </div>

      <RedeemForm />

      {/* Info demo box */}
      <div className="bg-brand-blue-50/70 border border-brand-blue/30 p-4 rounded-md text-xs text-brand-navy space-y-1">
        <p className="font-bold text-brand-blue">Kode Redeem Demo:</p>
        <p className="font-mono text-[11px] break-words">LATIH-DEMO-0001, LATIH-DEMO-0002, LATIH-DEMO-0003, LATIH-DEMO-0004, LATIH-DEMO-0005</p>
        <p className="text-slate-600 text-[11px]">Setiap kode mengaktifkan masa langganan 30 hari secara kumulatif.</p>
      </div>
    </div>
  );
}
