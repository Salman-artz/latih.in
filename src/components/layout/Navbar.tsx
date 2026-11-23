"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Menu, X, LogOut, Shield } from "lucide-react";

interface NavbarProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: "USER" | "ADMIN";
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  }

  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/register";

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Logo height={30} priority />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {isPublicPage ? (
              <>
                <Link href="/#fitur" className="text-sm font-medium text-gray-600 hover:text-brand-blue transition">
                  Fitur
                </Link>
                <Link href="/#cara-kerja" className="text-sm font-medium text-gray-600 hover:text-brand-blue transition">
                  Cara Kerja
                </Link>
                <Link href="/#materi" className="text-sm font-medium text-gray-600 hover:text-brand-blue transition">
                  Materi
                </Link>
                <Link href="/#faq" className="text-sm font-medium text-gray-600 hover:text-brand-blue transition">
                  FAQ
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium transition ${
                    pathname === "/dashboard" ? "text-brand-blue font-semibold" : "text-gray-600 hover:text-brand-blue"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/materi"
                  className={`text-sm font-medium transition ${
                    pathname.startsWith("/materi") ? "text-brand-blue font-semibold" : "text-gray-600 hover:text-brand-blue"
                  }`}
                >
                  Materi
                </Link>
                <Link
                  href="/tryout"
                  className={`text-sm font-medium transition ${
                    pathname.startsWith("/tryout") ? "text-brand-blue font-semibold" : "text-gray-600 hover:text-brand-blue"
                  }`}
                >
                  Tryout
                </Link>
                <Link
                  href="/riwayat"
                  className={`text-sm font-medium transition ${
                    pathname === "/riwayat" ? "text-brand-blue font-semibold" : "text-gray-600 hover:text-brand-blue"
                  }`}
                >
                  Riwayat
                </Link>
                {user?.role !== "ADMIN" && (
                  <Link
                    href="/redeem"
                    className={`text-sm font-medium transition ${
                      pathname === "/redeem" ? "text-brand-blue font-semibold" : "text-gray-600 hover:text-brand-blue"
                    }`}
                  >
                    Redeem Kode
                  </Link>
                )}
                {user?.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded hover:bg-amber-100 transition"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-600" /> Panel Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* User Auth Buttons Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <Link
                  href="/profil"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-brand-blue transition"
                >
                  <div className="w-8 h-8 rounded-md bg-brand-navy text-white flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-600 rounded-lg transition"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-brand-navy hover:text-brand-blue px-3 py-2 transition"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-semibold text-white bg-brand-blue hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm transition"
                >
                  Daftar Akun
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-brand-blue hover:bg-gray-100 transition"
              aria-label="Buka navigasi"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-gray-200 bg-white px-4 pt-2 pb-6 space-y-3">
          {isPublicPage ? (
            <div className="flex flex-col space-y-2">
              <Link
                href="/#fitur"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand-blue-50 rounded-md"
              >
                Fitur
              </Link>
              <Link
                href="/#cara-kerja"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand-blue-50 rounded-md"
              >
                Cara Kerja
              </Link>
              <Link
                href="/#materi"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand-blue-50 rounded-md"
              >
                Materi
              </Link>
              <Link
                href="/#faq"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand-blue-50 rounded-md"
              >
                FAQ
              </Link>
            </div>
          ) : (
            <div className="flex flex-col space-y-1">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand-blue-50 rounded-md"
              >
                Dashboard
              </Link>
              <Link
                href="/materi"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand-blue-50 rounded-md"
              >
                Materi Belajar
              </Link>
              <Link
                href="/tryout"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand-blue-50 rounded-md"
              >
                Tryout Online
              </Link>
              <Link
                href="/riwayat"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand-blue-50 rounded-md"
              >
                Riwayat Tryout
              </Link>
              {user?.role !== "ADMIN" && (
                <Link
                  href="/redeem"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand-blue-50 rounded-md"
                >
                  Redeem Kode
                </Link>
              )}
              <Link
                href="/profil"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand-blue-50 rounded-md"
              >
                Profil Akun
              </Link>
              {user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 text-sm font-semibold text-amber-700 bg-amber-50 rounded-md flex items-center gap-1.5"
                >
                  <Shield className="w-4 h-4 text-amber-600" /> Panel Admin
                </Link>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-gray-100">
            {user ? (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 text-xs text-red-600 font-semibold px-3 py-1.5 bg-red-50 rounded-md"
                >
                  <LogOut className="w-3.5 h-3.5" /> Keluar
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-center text-sm font-semibold text-brand-navy py-2 border border-gray-300 rounded-lg"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="text-center text-sm font-semibold text-white bg-brand-blue py-2 rounded-lg"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
