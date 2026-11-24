"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Users,
  Loader2,
  AlertCircle,
  FileQuestion,
  ArrowRight,
} from "lucide-react";

interface AdminTryoutItem {
  id: string;
  title: string;
  durationMinutes: number;
  status: "PUBLISHED" | "DRAFT";
  createdAt: string;
  _count: {
    questions: number;
    attempts: number;
  };
}

export default function AdminTryoutListPage() {
  const [tryouts, setTryouts] = useState<AdminTryoutItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminTryoutItem | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDuration, setFormDuration] = useState(20);
  const [formStatus, setFormStatus] = useState<"PUBLISHED" | "DRAFT">("PUBLISHED");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadTryouts() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/tryouts");
      const data = await res.json();
      if (res.ok) {
        setTryouts(data.tryouts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTryouts();
  }, []);

  function handleOpenAdd() {
    setEditingItem(null);
    setFormTitle("");
    setFormDuration(20);
    setFormStatus("PUBLISHED");
    setFormError("");
    setShowModal(true);
  }

  function handleOpenEdit(item: AdminTryoutItem) {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDuration(item.durationMinutes);
    setFormStatus(item.status);
    setFormError("");
    setShowModal(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const titleTrimmed = formTitle.trim();
    if (titleTrimmed.length < 3) {
      setFormError("Judul tryout minimal 3 karakter");
      return;
    }

    const durationNum = Number(formDuration);
    if (isNaN(durationNum) || durationNum < 1 || durationNum > 180) {
      setFormError("Durasi tryout harus antara 1 sampai 180 menit");
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = editingItem
        ? `/api/admin/tryouts/${editingItem.id}`
        : "/api/admin/tryouts";
      const method = editingItem ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleTrimmed,
          durationMinutes: durationNum,
          status: formStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error?.message || "Gagal menyimpan paket tryout");
        setIsSubmitting(false);
        return;
      }

      setShowModal(false);
      setIsSubmitting(false);
      loadTryouts();
    } catch {
      setFormError("Terjadi kesalahan jaringan");
      setIsSubmitting(false);
    }
  }

  async function handleDelete(item: AdminTryoutItem) {
    if (
      !confirm(
        `Apakah kamu yakin ingin menghapus paket tryout "${item.title}"? Seluruh soal dan riwayat attempt di dalamnya akan ikut terhapus.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/tryouts/${item.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error?.message || "Gagal menghapus tryout");
      } else {
        loadTryouts();
      }
    } catch {
      alert("Terjadi kendala koneksi");
    }
  }

  return (
    <div className="space-y-6">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy">
            Kelola Paket Tryout & Soal
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Buat paket simulasi ujian baru, atur durasi waktu, dan kelola butir soal beserta kunci pernyataan.
          </p>
        </div>

        <div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-brand-blue text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Tambah Paket Tryout
          </button>
        </div>
      </div>

      {/* Tryout List Cards */}
      <div className="bg-white rounded-lg border border-gray-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
            <span className="text-xs text-gray-500">Memuat data paket tryout...</span>
          </div>
        ) : tryouts.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500 space-y-2">
            <BookOpen className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="font-semibold text-gray-700">Belum ada paket tryout terdaftar</p>
            <p className="text-xs text-gray-400">
              Klik tombol &quot;Tambah Paket Tryout&quot; di atas untuk membuat paket tryout pertama kamu.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tryouts.map((item) => (
              <div
                key={item.id}
                className="p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-gray-50/50 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-brand-navy text-base sm:text-lg">
                      {item.title}
                    </h3>
                    {item.status === "PUBLISHED" ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
                        Terbit
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                        Draft / Arsip
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {item.durationMinutes} Menit
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 font-medium text-brand-navy">
                      <FileQuestion className="w-3.5 h-3.5 text-brand-blue" />
                      <strong>{item._count.questions}</strong> butir soal
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      {item._count.attempts} kali dikerjakan
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 self-start md:self-center">
                  <Link
                    href={`/admin/tryout/${item.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-brand-navy text-white text-xs font-semibold hover:bg-slate-800 transition shadow-sm"
                  >
                    <FileQuestion className="w-3.5 h-3.5" />
                    Kelola Soal ({item._count.questions}) <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 rounded-md border border-gray-200 text-gray-600 hover:text-brand-blue hover:bg-gray-50 transition"
                    title="Edit Info Tryout"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(item)}
                    className="p-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition"
                    title="Hapus Tryout"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL TAMBAH / EDIT TRYOUT */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-brand-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-lg font-bold text-brand-navy">
                {editingItem ? "Edit Paket Tryout" : "Tambah Paket Tryout Baru"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Judul Paket Tryout
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Tryout Literasi Mandiri Paket 1"
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Durasi Pengerjaan (Menit)
                </label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  required
                  value={formDuration}
                  onChange={(e) => setFormDuration(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Waktu hitung mundur saat pengguna mengerjakan tryout ini (standar: 20 menit).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Status Publikasi
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as "PUBLISHED" | "DRAFT")}
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="PUBLISHED">Terbit (Dapat diakses pengguna)</option>
                  <option value="DRAFT">Draft / Arsip (Hanya terlihat oleh admin)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-brand-blue hover:bg-blue-700 text-white rounded-md text-xs sm:text-sm font-semibold shadow disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    "Simpan Tryout"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
