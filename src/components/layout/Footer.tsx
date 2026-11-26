import { Logo } from "@/components/ui/Logo";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-brand-navy text-white mt-auto border-t border-gray-800">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Tagline */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white/10 p-2.5 rounded-lg inline-block">
              <Logo height={28} />
            </div>
            <p className="text-gray-300 text-sm max-w-sm leading-relaxed">
              Belajar dari video, latihan lewat tryout. Platform persiapan ujian terpadu dengan materi ringkas dan simulasi tryout berwaktu.
            </p>
          </div>

          {/* Navigasi */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Navigasi</h4>
            <ul className="space-y-2.5 text-sm text-gray-300">
              <li>
                <Link href="/#fitur" className="hover:text-white transition">Fitur Utama</Link>
              </li>
              <li>
                <Link href="/#cara-kerja" className="hover:text-white transition">Cara Kerja</Link>
              </li>
              <li>
                <Link href="/#materi" className="hover:text-white transition">Materi Belajar</Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-white transition">FAQ</Link>
              </li>
            </ul>
          </div>

          {/* Legal / Info */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Informasi</h4>
            <p className="text-xs text-gray-400 leading-relaxed mb-3">
              Proyek Technical Test Full Stack Developer untuk PT Lini Suara Nusantara (Penerbit Buku Liniswara).
            </p>
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} latih.in. Hak cipta dilindungi.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
