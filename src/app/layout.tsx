import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-white text-brand-navy antialiased">
        {children}
      </body>
    </html>
  );
}
