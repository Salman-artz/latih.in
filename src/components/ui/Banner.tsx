import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";

interface BannerProps {
  daysLeft: number;
}

export function SubscriptionBanner({ daysLeft }: BannerProps) {
  if (daysLeft > 7 || daysLeft <= 0) return null;

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-800">
            Masa aktif langganan kamu tersisa <span className="font-bold">{daysLeft} hari</span> lagi. Perpanjang sekarang agar akses materi dan tryout tidak terputus!
          </p>
        </div>
        <Link
          href="/redeem"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition"
        >
          Perpanjang Sekarang <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
