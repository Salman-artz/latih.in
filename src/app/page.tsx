import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma, ensureDbSchema } from "@/lib/db";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  BookOpen,
  Award,
  KeyRound,
  CheckCircle2,
  PlayCircle,
  ArrowRight,
  ShieldCheck,
  Clock,
  HelpCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureDbSchema().catch(() => {});

  let session = null;
  try {
    session = await getSession();
  } catch (e) {
    console.error("HomePage getSession error:", e);
  }

  let dbMaterials: Array<{
    id: string;
    title: string;
    description: string;
    videoType?: string;
    videoUrl?: string | null;
    youtubeId?: string | null;
  }> = [];

  try {
    dbMaterials = await prisma.material.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
      take: 3,
    });
  } catch (e) {
    console.error("HomePage findMany materials error:", e);
  }

  const displayMaterials =
    dbMaterials.length > 0
      ? dbMaterials.map((m, idx) => ({
          id: m.id,
          orderText: `Modul 0${idx + 1}`,
          title: m.title,
          description: m.description,
          thumbnailUrl:
            m.videoType === "CLOUDINARY" && m.videoUrl
              ? m.videoUrl.replace(/\.[^/.]+$/, ".jpg")
              : m.youtubeId
              ? `https://img.youtube.com/vi/${m.youtubeId}/hqdefault.jpg`
              : "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80",
        }))
      : [
          {
            id: "m1",
            orderText: "Modul 01",
            title: "Teknik Membaca Kritis dan Menemukan Ide Pokok",
            description: "Strategi membaca cepat dan terarah untuk menemukan gagasan utama dalam stimulus teks panjang.",
            thumbnailUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80",
          },
          {
            id: "m2",
            orderText: "Modul 02",
            title: "Analisis Logika dan Silogisme dalam Penalaran Umum",
            description: "Pahami dasar-dasar logika proposisional, modus ponens, modus tollens, dan penarikan simpulan valid.",
            thumbnailUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80",
          },
          {
            id: "m3",
            orderText: "Modul 03",
            title: "Membedakan Fakta, Opini, dan Asumsi Penulis",
            description: "Kupas tuntas perbedaan bukti berbasis fakta objektif dibandingkan opini subyektif pada teks ujian.",
            thumbnailUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80",
          },
        ];

  return (
    <>
      <Navbar user={session?.user} />

      <main className="flex-grow bg-slate-50/50">
        {/* HERO SECTION */}
        <section className="border-b border-slate-200 bg-white py-12 sm:py-16 lg:py-20">
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-center">
              <div className="lg:col-span-7 space-y-6">
                <h1 className="text-3xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-brand-navy leading-[1.15]">
                  Belajar dari video, <br />
                  latihan lewat <span className="text-brand-blue underline decoration-brand-blue/30 decoration-wavy">tryout</span>.
                </h1>

                <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                  Platform latihan terpadu untuk menguji penalaran dan literasi. Pahami konsep inti lewat video kurasi berkualitas, lalu uji kesiapanmu melalui paket tryout 10 stimulus berwaktu.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  {session ? (
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-brand-blue text-white font-semibold text-sm hover:bg-blue-700 transition"
                    >
                      Buka Dashboard Pengguna <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/register"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-brand-blue text-white font-semibold text-sm hover:bg-blue-700 transition shadow-sm"
                      >
                        Daftar Akun Baru <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        href="/login"
                        className="inline-flex items-center justify-center px-6 py-3.5 rounded-lg border border-slate-300 bg-white text-brand-navy font-semibold text-sm hover:bg-slate-50 transition"
                      >
                        Masuk ke Akun
                      </Link>
                    </>
                  )}
                </div>

                {/* USP Specification List - Crisp & Utilitarian */}
                <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700">
                    <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span>10 Soal (30 Pernyataan B/S)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700">
                    <div className="w-6 h-6 rounded-md bg-brand-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-brand-blue/20">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span>Timer 20 Menit Nyata</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700">
                    <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <span>Aktivasi Kode Redeem</span>
                  </div>
                </div>
              </div>

              {/* HERO VISUAL SUMMARY - Menyeimbangkan layar 15.6" & 24" tanpa simulasi soal */}
              <div className="lg:col-span-5">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                      <p className="text-xs font-bold text-brand-blue uppercase tracking-wider">
                        Ekosistem Belajar
                      </p>
                      <h3 className="text-base sm:text-lg font-bold text-brand-navy">
                        Persiapan Terarah dalam 1 Platform
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                      Terpadu
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md bg-brand-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-brand-blue/20">
                        <PlayCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-navy">Video Materi Kurasi</p>
                        <p className="text-xs text-slate-600">
                          Pahami konsep inti penalaran &amp; literasi secara bertahap.
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md bg-slate-100 text-brand-navy flex items-center justify-center flex-shrink-0 border border-slate-200">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-navy">Tryout Berwaktu Nyata</p>
                        <p className="text-xs text-slate-600">
                          Timer tersinkron server dengan penyimpanan jawaban otomatis.
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-200">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-navy">Evaluasi &amp; Pembahasan Instan</p>
                        <p className="text-xs text-slate-600">
                          Lihat skor akhir, status jawaban, dan pembahasan lengkap tiap butir.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
                    <div className="bg-white border border-slate-200 rounded-lg py-2.5 px-2">
                      <p className="text-sm font-extrabold text-brand-navy">Video</p>
                      <p className="text-[11px] text-slate-500">Materi Terarah</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg py-2.5 px-2">
                      <p className="text-sm font-extrabold text-brand-blue">20 Menit</p>
                      <p className="text-[11px] text-slate-500">Durasi Nyata</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg py-2.5 px-2">
                      <p className="text-sm font-extrabold text-emerald-700">100%</p>
                      <p className="text-[11px] text-slate-500">Pembahasan</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FITUR UTAMA - Clean Cards */}
        <section id="fitur" className="py-16 sm:py-20 border-b border-slate-200">
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
            <div className="max-w-2xl mb-12 space-y-2">
              <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">
                Struktur Pembelajaran
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-navy">
                Fitur Inti yang Sederhana & Tepat Sasaran
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                Setiap komponen dirancang agar kamu fokus belajar dan mengukur kesiapan tanpa distraksi visual.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-lg bg-white border border-slate-200 hover:border-brand-blue/60 transition space-y-4">
                <div className="w-10 h-10 rounded-md bg-brand-navy text-white flex items-center justify-center font-bold">
                  <PlayCircle className="w-5 h-5 text-brand-blue-50" />
                </div>
                <h3 className="text-base font-bold text-brand-navy">Materi Video Terarah</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Video kurasi pembelajaran berfokus pada teknik literasi dan pemahaman penalaran umum.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-lg bg-white border border-slate-200 hover:border-brand-blue/60 transition space-y-4">
                <div className="w-10 h-10 rounded-md bg-brand-navy text-white flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5 text-brand-blue-50" />
                </div>
                <h3 className="text-base font-bold text-brand-navy">Format Soal Majemuk</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  1 paket simulasi memuat 10 stimulus soal yang terbagi menjadi 30 butir pernyataan Benar atau Salah.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-lg bg-white border border-slate-200 hover:border-brand-blue/60 transition space-y-4">
                <div className="w-10 h-10 rounded-md bg-brand-navy text-white flex items-center justify-center font-bold">
                  <Award className="w-5 h-5 text-brand-blue-50" />
                </div>
                <h3 className="text-base font-bold text-brand-navy">Skor & Pembahasan</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Penilaian otomatis 1 poin per butir benar (maks 30), persentase akurat, dan kunci serta pembahasan lengkap.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-lg bg-white border border-slate-200 hover:border-brand-blue/60 transition space-y-4">
                <div className="w-10 h-10 rounded-md bg-brand-navy text-white flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5 text-brand-blue-50" />
                </div>
                <h3 className="text-base font-bold text-brand-navy">Aktivasi Kode Redeem</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Tukarkan kode voucher untuk membuka akses tanpa perlu integrasi pembayaran yang rumit.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CARA KERJA - Clean 4 Steps */}
        <section id="cara-kerja" className="py-16 sm:py-20 bg-white border-b border-slate-200">
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
            <div className="max-w-2xl mb-12 space-y-2">
              <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">
                Alur Pengerjaan
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-navy">
                4 Langkah Menggunakan latih.in
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                Proses cepat mulai dari registrasi akun hingga penyelesaian ujian.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-navy text-white inline-block">
                  TAHAP 01
                </div>
                <h3 className="text-base font-bold text-brand-navy">Registrasi Akun</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Daftarkan diri dengan nama dan email valid untuk membuat identitas pengerjaan.
                </p>
              </div>

              <div className="p-6 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-blue text-white inline-block">
                  TAHAP 02
                </div>
                <h3 className="text-base font-bold text-brand-navy">Tukarkan Kode</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Masukkan kode voucher di menu Redeem untuk mengaktifkan status langganan aktif.
                </p>
              </div>

              <div className="p-6 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-navy text-white inline-block">
                  TAHAP 03
                </div>
                <h3 className="text-base font-bold text-brand-navy">Tonton Materi</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Pelajari modul video pembelajaran dan tandai video yang telah selesai kamu simak.
                </p>
              </div>

              <div className="p-6 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-blue text-white inline-block">
                  TAHAP 04
                </div>
                <h3 className="text-base font-bold text-brand-navy">Simulasi Tryout</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Kerjakan tryout 20 menit dengan autosave berkala, kumpulkan, dan telaah hasil skormu.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CUPLIKAN MATERI */}
        <section id="materi" className="py-16 sm:py-20 border-b border-slate-200">
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">
                  Kurikulum
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-brand-navy mt-1">
                  Cuplikan Modul Video
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Materi yang dapat kamu akses penuh setelah mengaktifkan langganan.
                </p>
              </div>
              <Link
                href="/materi"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand-blue hover:text-blue-800 transition"
              >
                Lihat Seluruh Modul <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayMaterials.map((mod) => (
                <Link
                  key={mod.id}
                  href="/login"
                  className="rounded-lg border border-slate-200 bg-white overflow-hidden hover:border-brand-blue/60 hover:shadow-lg transition block group cursor-pointer"
                >
                  <div className="aspect-video bg-gradient-to-br from-brand-navy via-slate-800 to-slate-900 relative flex items-center justify-center overflow-hidden">
                    {mod.thumbnailUrl ? (
                      <img
                        src={mod.thumbnailUrl}
                        alt={mod.title}
                        className="w-full h-full object-cover opacity-75 group-hover:opacity-90 group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-8 h-8 rounded-full bg-brand-blue/20 flex items-center justify-center text-brand-blue mb-2">
                          <PlayCircle className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-[11px] font-medium text-slate-300 line-clamp-1">{mod.title}</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/80 via-brand-navy/20 to-transparent" />

                    <div className="relative z-10 w-12 h-12 rounded-full bg-white/95 text-brand-navy flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-brand-blue group-hover:text-white transition">
                      <PlayCircle className="w-6 h-6" />
                    </div>

                    <div className="absolute bottom-2.5 left-3 z-10 flex items-center gap-1.5 text-white text-[11px] font-semibold">
                      <PlayCircle className="w-3.5 h-3.5 text-blue-400" />
                      <span>Klik untuk Tonton Video</span>
                    </div>

                    <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded bg-brand-navy/85 text-blue-200 border border-blue-400/30 text-[10px] font-semibold">
                      Masuk untuk Akses
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="inline-block text-[11px] font-bold px-2 py-0.5 rounded bg-brand-blue-50 text-brand-blue border border-brand-blue/20">
                      {mod.orderText}
                    </div>
                    <h3 className="font-bold text-brand-navy text-sm sm:text-base line-clamp-1 group-hover:text-brand-blue transition">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {mod.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ - Utilitarian Accordion Style */}
        <section id="faq" className="py-16 sm:py-20 bg-white border-b border-slate-200">
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              <div className="lg:col-span-4 space-y-2">
                <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">
                  Bantuan &amp; Informasi
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-brand-navy">
                  Pertanyaan yang Sering Diajukan (FAQ)
                </h2>
                <p className="text-sm text-slate-600">
                  Informasi singkat mengenai kode redeem, format simulasi, dan keamanan jawaban.
                </p>
              </div>

              <div className="lg:col-span-8 divide-y divide-slate-200 border-y border-slate-200">
              <div className="py-5 space-y-1.5">
                <h3 className="font-bold text-brand-navy text-sm sm:text-base flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-brand-blue flex-shrink-0" />
                  Bagaimana cara memperoleh kode redeem?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-6">
                  Kode redeem diperoleh melalui pembelian buku penerbit Liniswara atau program kemitraan resmi. Untuk demonstrasi pengujian, 5 kode demo telah disediakan di dokumentasi.
                </p>
              </div>

              <div className="py-5 space-y-1.5">
                <h3 className="font-bold text-brand-navy text-sm sm:text-base flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-brand-blue flex-shrink-0" />
                  Bagaimana sistem akumulasi masa aktif kode redeem?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-6">
                  Jika kamu memasukkan kode baru saat langgananmu masih aktif, masa berlaku akan ditambahkan secara kumulatif dari tanggal berakhir langganan sebelumnya (tidak hangus).
                </p>
              </div>

              <div className="py-5 space-y-1.5">
                <h3 className="font-bold text-brand-navy text-sm sm:text-base flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-brand-blue flex-shrink-0" />
                  Bagaimana format soal simulasi tryout?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-6">
                  Setiap paket memuat 10 stimulus soal. Tiap stimulus memiliki 3 butir pernyataan yang wajib dijawab Benar atau Salah (total 30 butir). Waktu pengerjaan adalah 20 menit nyata.
                </p>
              </div>

              <div className="py-5 space-y-1.5">
                <h3 className="font-bold text-brand-navy text-sm sm:text-base flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-brand-blue flex-shrink-0" />
                  Apakah kunci jawaban aman dari kebocoran sebelum dikumpulkan?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-6">
                  Sangat aman. Server secara selektif tidak mengirimkan kunci jawaban (`isTrue`) atau pembahasan ke peramban saat status attempt masih `IN_PROGRESS`.
                </p>
              </div>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM ACTION BANNER - Solid Navy Brand */}
        <section className="py-12 sm:py-16 bg-brand-navy text-white">
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Mulai Evaluasi Kemampuanmu Hari Ini
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm">
                Akses materi video dan kerjakan simulasi tryout berwaktu dengan akun latih.in.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-blue text-white font-semibold text-sm hover:bg-blue-600 transition"
              >
                Buat Akun Sekarang <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
