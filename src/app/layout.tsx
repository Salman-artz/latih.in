import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "latih.in | Latihan Soal dan Tryout Online",
  description: "Belajar dari video, latihan lewat tryout. Platform persiapan ujian komprehensif dengan pembahasan interaktif.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "latih.in | Latihan Soal dan Tryout Online",
    description: "Belajar dari video, latihan lewat tryout. Platform persiapan ujian komprehensif dengan pembahasan interaktif.",
    url: "https://latih.in",
    siteName: "latih.in",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${poppins.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col bg-white text-brand-navy antialiased">
        {children}
      </body>
    </html>
  );
}
