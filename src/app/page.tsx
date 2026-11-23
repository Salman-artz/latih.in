import Link from "next/link";
import { getSession } from "@/lib/auth";
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
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();

  return (
    <>
      <Navbar user={session?.user} />

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-blue-50/60 via-white to-white py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-blue/10 text-brand-blue text-xs sm:text-sm font-semibold">
                <Sparkles className="w-4 h-4" /> Solusi Cerdas Persiapan Ujian Online
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-brand-navy leading-tight">
                Belajar dari video, latihan lewat <span className="text-brand-blue">tryout</span>.
              </h1>

              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Tingkatkan pemahaman konsep kamu lewat video pembelajaran ringkas dan uji kesiapan dengan simulasi tryout berwaktu dengan format soal Benar/Salah majemuk.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                {session ? (
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-brand-blue text-white font-semibold shadow-lg shadow-brand-blue/25 hover:bg-blue-700 transition"
                  >
                    Buka Dashboard <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-brand-blue text-white font-semibold shadow-lg shadow-brand-blue/25 hover:bg-blue-700 transition"
                    >
                      Mulai Sekarang Gratis <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link
                      href="/login"
                      className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl border border-gray-300 text-brand-navy font-semibold hover:bg-gray-50 transition"
                    >
                      Masuk ke Akun
                    </Link>
                  </>
                )}
              </div>

              {/* USP mini icons */}
              <div className="pt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 text-left max-w-xl mx-auto border-t border-gray-200/80">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>10 Soal (30 Pernyataan)</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700">
                  <Clock className="w-4 h-4 text-brand-blue flex-shrink-0" />
                  <span>Timer 20 Menit Nyata</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 col-span-2 sm:col-span-1">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>Akses Kode Redeem</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FITUR UTAMA */}
        <section id="fitur" className="py-16 sm:py-24 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-navy">
                Fitur Unggulan untuk Belajar Efektif
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Dirancang khusus agar kamu fokus memahami materi dan mengevaluasi kelemahan dengan cepat.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Card 1 */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200/90 hover:border-brand-blue/50 hover:shadow-lg transition space-y-4">
                <div className="w-12 h-12 rounded-xl bg-brand-blue-50 text-brand-blue flex items-center justify-center font-bold">
                  <PlayCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-brand-navy">Materi Video Ringkas</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Video kurasi YouTube yang langsung pada inti konsep literasi dan penalaran umum tanpa berbelit-belit.
                </p>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200/90 hover:border-brand-blue/50 hover:shadow-lg transition space-y-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-brand-navy">Simulasi Tryout</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Format soal Benar/Salah majemuk: 10 stimulus soal dengan masing-masing 3 pernyataan berbobot.
                </p>
              </div>

              {/* Card 3 */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200/90 hover:border-brand-blue/50 hover:shadow-lg transition space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-brand-navy">Skor & Pembahasan</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Perhitungan otomatis transparan, persentase nilai, dan pembahasan mendalam di setiap butir pernyataan.
                </p>
              </div>

              {/* Card 4 */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200/90 hover:border-brand-blue/50 hover:shadow-lg transition space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-brand-navy">Akses Kode Redeem</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Aktivasi langganan instan lewat kode promo atau bonus buku terbitan tanpa perlu ribet dengan kartu kredit.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CARA KERJA */}
        <section id="cara-kerja" className="py-16 sm:py-24 bg-brand-blue-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-navy">
                4 Langkah Mudah Memulai
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Mulai latihan dalam hitungan menit dari mana saja.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative space-y-3">
                <div className="text-3xl font-extrabold text-brand-blue">01</div>
                <h3 className="text-base font-bold text-brand-navy">Daftar Akun</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Buat akun dengan nama dan email kamu dalam 30 detik.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative space-y-3">
                <div className="text-3xl font-extrabold text-brand-blue">02</div>
                <h3 className="text-base font-bold text-brand-navy">Redeem Kode</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Masukkan kode redeem yang kamu peroleh untuk mengaktifkan akses premium.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative space-y-3">
                <div className="text-3xl font-extrabold text-brand-blue">03</div>
                <h3 className="text-base font-bold text-brand-navy">Pelajari Video</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Tonton materi video yang disajikan untuk memperkuat pondasi penalaran.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative space-y-3">
                <div className="text-3xl font-extrabold text-brand-blue">04</div>
                <h3 className="text-base font-bold text-brand-navy">Kerjakan Tryout</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Uji kemampuanmu pada simulasi berwaktu dan evaluasi hasilnya secara instan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CUPLIKAN MATERI */}
        <section id="materi" className="py-16 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-brand-navy">
                  Cuplikan Materi Pembelajaran
                </h2>
                <p className="text-gray-600 text-sm sm:text-base mt-2">
                  Daftar modul belajar yang siap kamu akses setelah mengaktifkan langganan.
                </p>
              </div>
              <Link
                href="/materi"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline"
              >
                Lihat Semua Materi <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Cuplikan 1 */}
              <div className="rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
                <div className="aspect-video bg-gray-900 relative flex items-center justify-center text-white">
                  <img
                    src="https://img.youtube.com/vi/Wn6p_y7m15M/mqdefault.jpg"
                    alt="Thumbnail Materi 1"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-brand-navy/30 flex items-center justify-center">
                    <PlayCircle className="w-12 h-12 text-white/90 drop-shadow-md" />
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <span className="text-xs font-semibold px-2 py-0.5 bg-brand-blue-50 text-brand-blue rounded">
                    Modul 1
                  </span>
                  <h3 className="font-bold text-brand-navy text-base">
                    Teknik Membaca Kritis dan Menemukan Ide Pokok
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    Pelajari strategi membaca cepat dan efektif untuk menemukan gagasan utama dalam paragraf panjang.
                  </p>
                </div>
              </div>

              {/* Cuplikan 2 */}
              <div className="rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
                <div className="aspect-video bg-gray-900 relative flex items-center justify-center text-white">
                  <img
                    src="https://img.youtube.com/vi/8nhZ_9u9b7U/mqdefault.jpg"
                    alt="Thumbnail Materi 2"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-brand-navy/30 flex items-center justify-center">
                    <PlayCircle className="w-12 h-12 text-white/90 drop-shadow-md" />
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <span className="text-xs font-semibold px-2 py-0.5 bg-brand-blue-50 text-brand-blue rounded">
                    Modul 2
                  </span>
                  <h3 className="font-bold text-brand-navy text-base">
                    Analisis Logika dan Silogisme dalam Penalaran Umum
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    Pahami dasar-dasar logika proposisional, modus ponens, modus tollens, dan penarikan kesimpulan valid.
                  </p>
                </div>
              </div>

              {/* Cuplikan 3 */}
              <div className="rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
                <div className="aspect-video bg-gray-900 relative flex items-center justify-center text-white">
                  <img
                    src="https://img.youtube.com/vi/GS_z1n8zI1g/mqdefault.jpg"
                    alt="Thumbnail Materi 3"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-brand-navy/30 flex items-center justify-center">
                    <PlayCircle className="w-12 h-12 text-white/90 drop-shadow-md" />
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <span className="text-xs font-semibold px-2 py-0.5 bg-brand-blue-50 text-brand-blue rounded">
                    Modul 3
                  </span>
                  <h3 className="font-bold text-brand-navy text-base">
                    Membedakan Fakta, Opini, dan Asumsi Penulis
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    Cara membedakan klaim berbasis data objektif versus asumsi implisit dalam teks argumentatif.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 sm:py-24 bg-gray-50 border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-navy">
                Pertanyaan yang Sering Diajukan (FAQ)
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Punya pertanyaan seputar latih.in? Simak jawaban atas pertanyaan umum berikut.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="font-bold text-brand-navy text-base mb-2">
                  Bagaimana cara memperoleh kode redeem?
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Kode redeem biasanya diberikan bersamaan dengan pembelian buku terbitan Liniswara atau program promosi tertentu. Untuk pengujian aplikasi ini, kode demo gratis telah disediakan di halaman panduan.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="font-bold text-brand-navy text-base mb-2">
                  Berapa lama masa aktif langganan setelah memasukkan kode?
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Secara umum kode redeem berlaku selama 30 hari. Jika kamu memasukkan kode baru saat langgananmu masih aktif, masa aktif akan diperpanjang secara otomatis dihitung dari tanggal berakhir langganan sebelumnya.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="font-bold text-brand-navy text-base mb-2">
                  Bagaimana format soal simulasi tryout?
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Setiap paket berisi 10 soal stimulus dengan masing-masing 3 pernyataan (total 30 butir). Kamu memilih opsi Benar atau Salah untuk setiap pernyataan, dan memiliki batas waktu 20 menit.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="font-bold text-brand-navy text-base mb-2">
                  Apakah kunci jawaban aman dari kebocoran sebelum dikumpulkan?
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Sangat aman. Server tidak pernah mengirimkan kunci jawaban atau penjelasan kepada peramban saat tryout masih berlangsung. Kunci dan penjelasan baru dikirim setelah kamu menekan tombol Submit.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="font-bold text-brand-navy text-base mb-2">
                  Apakah saya bisa mengulang tryout setelah submit?
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Ya, selama masa aktif langgananmu masih berlaku, kamu dapat memulai sesi tryout baru tanpa batasan jumlah percobaan untuk terus melatih kemampuanmu.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA AKHIR */}
        <section className="py-16 sm:py-20 bg-brand-navy text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Siap Raih Skor Ujian Maksimal Bersama latih.in?
            </h2>
            <p className="text-gray-300 text-sm sm:text-base max-w-xl mx-auto">
              Daftar sekarang, redeem kodemu, dan rasakan pengalaman belajar mandiri terstruktur dan terukur.
            </p>
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-brand-blue text-white font-semibold shadow-lg hover:bg-blue-600 transition"
              >
                Daftar Akun Sekarang <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
