"use client";

import { useState, useEffect } from "react";
import {
  Video,
  Plus,
  Edit2,
  Archive,
  AlertCircle,
  Loader2,
  ExternalLink,
  UploadCloud,
  CheckCircle2,
} from "lucide-react";

interface AdminMaterialItem {
  id: string;
  title: string;
  description: string;
  youtubeId?: string | null;
  videoType?: string;
  videoUrl?: string | null;
  order: number;
  status: "PUBLISHED" | "DRAFT";
  _count: {
    progress: number;
  };
}

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<AdminMaterialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminMaterialItem | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [videoSource, setVideoSource] = useState<"YOUTUBE" | "CLOUDINARY">("YOUTUBE");
  const [formYoutube, setFormYoutube] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");
  const [formOrder, setFormOrder] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadMaterials() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/materials");
      const data = await res.json();
      if (res.ok) {
        setMaterials(data.materials);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMaterials();
  }, []);

  function handleOpenAdd() {
    setEditingItem(null);
    setFormTitle("");
    setFormDesc("");
    setVideoSource("YOUTUBE");
    setFormYoutube("");
    setFormVideoUrl("");
    setUploadSuccessMsg("");
    setFormOrder(materials.length + 1);
    setFormError("");
    setShowModal(true);
  }

  function handleOpenEdit(item: AdminMaterialItem) {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDesc(item.description);
    if (item.videoType === "CLOUDINARY" || item.videoUrl) {
      setVideoSource("CLOUDINARY");
      setFormVideoUrl(item.videoUrl || "");
      setFormYoutube("");
    } else {
      setVideoSource("YOUTUBE");
      setFormYoutube(item.youtubeId ? `https://www.youtube.com/watch?v=${item.youtubeId}` : "");
      setFormVideoUrl("");
    }
    setUploadSuccessMsg("");
    setFormOrder(item.order);
    setFormError("");
    setShowModal(true);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 300 * 1024 * 1024) {
      setFormError("Ukuran file video melebihi batas maksimal 300MB");
      return;
    }

    setIsUploading(true);
    setFormError("");
    setUploadSuccessMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload-video", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error?.message || "Gagal mengunggah video ke Cloudinary");
        setIsUploading(false);
        return;
      }

      setFormVideoUrl(data.url);
      setUploadSuccessMsg("Video berhasil diunggah ke Cloudinary!");
    } catch {
      setFormError("Gagal mengunggah video karena kendala koneksi");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const titleTrimmed = formTitle.trim();
    if (titleTrimmed.length < 3) {
      setFormError("Judul materi minimal 3 karakter");
      return;
    }
    if (titleTrimmed.length > 200) {
      setFormError("Judul materi maksimal 200 karakter");
      return;
    }

    const descTrimmed = formDesc.trim();
    if (descTrimmed.length < 5) {
      setFormError("Deskripsi materi minimal 5 karakter");
      return;
    }

    if (videoSource === "YOUTUBE" && !formYoutube.trim()) {
      setFormError("URL atau ID video YouTube wajib diisi");
      return;
    }

    if (videoSource === "CLOUDINARY" && !formVideoUrl.trim()) {
      setFormError("Silakan unggah video atau masukkan URL video Cloudinary");
      return;
    }

    const orderNum = Number(formOrder);
    if (isNaN(orderNum) || orderNum < 1) {
      setFormError("Nomor urut tampilan minimal 1");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = editingItem
        ? `/api/admin/materials/${editingItem.id}`
        : "/api/admin/materials";
      const method = editingItem ? "PUT" : "POST";

      const bodyPayload: {
        title: string;
        description: string;
        videoType: string;
        order: number;
        youtubeUrl?: string | null;
        videoUrl?: string | null;
      } = {
        title: formTitle,
        description: formDesc,
        videoType: videoSource,
        order: Number(formOrder),
      };

      if (videoSource === "YOUTUBE") {
        bodyPayload.youtubeUrl = formYoutube;
        bodyPayload.videoUrl = null;
      } else {
        bodyPayload.videoUrl = formVideoUrl;
        bodyPayload.youtubeUrl = null;
      }

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error?.message || "Gagal menyimpan materi");
        setIsSubmitting(false);
        return;
      }

      setShowModal(false);
      setIsSubmitting(false);
      loadMaterials();
    } catch {
      setFormError("Terjadi kesalahan jaringan");
      setIsSubmitting(false);
    }
  }

  async function handleArchive(item: AdminMaterialItem) {
    const actionText = item.status === "PUBLISHED" ? "mengarsipkan" : "mengaktifkan kembali";
    if (!confirm(`Apakah kamu yakin ingin ${actionText} materi "${item.title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/materials/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
        }),
      });

      if (res.ok) {
        loadMaterials();
      } else {
        alert("Gagal memperbarui status materi");
      }
    } catch {
      alert("Terjadi kendala jaringan");
    }
  }

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy">
            Kelola Materi Video
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tambah kurikulum video YouTube, atur urutan tampilan, dan arsipkan konten.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-brand-blue text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Tambah Materi Baru
        </button>
      </div>

      {/* LIST MATERI */}
      <div className="bg-white rounded-lg border border-gray-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
            <span className="text-xs text-gray-500">Memuat kurikulum materi...</span>
          </div>
        ) : materials.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500 space-y-1">
            <Video className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="font-semibold text-gray-700">Belum ada materi terdaftar</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {materials.map((item) => (
              <div
                key={item.id}
                className="p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-gray-50/50 transition"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-md bg-brand-blue-50 text-brand-blue flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    #{item.order}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-brand-navy text-base">
                        {item.title}
                      </h3>
                      {item.status === "PUBLISHED" ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
                          Terbit
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                          Diarsipkan
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 max-w-2xl">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
                      {item.videoType === "CLOUDINARY" || item.videoUrl ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          <UploadCloud className="w-3 h-3" /> Cloudinary Video
                        </span>
                      ) : (
                        <span className="font-mono">YouTube ID: {item.youtubeId || "-"}</span>
                      )}
                      <span>• Ditonton oleh {item._count.progress} pengguna</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  {item.videoUrl ? (
                    <a
                      href={item.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:text-brand-blue hover:bg-gray-50 transition"
                      title="Buka Video"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : item.youtubeId ? (
                    <a
                      href={`https://www.youtube.com/watch?v=${item.youtubeId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:text-brand-blue hover:bg-gray-50 transition"
                      title="Buka di YouTube"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : null}
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:text-brand-blue hover:bg-gray-50 transition"
                    title="Ubah Materi"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleArchive(item)}
                    className={`p-2 rounded-lg border transition ${
                      item.status === "PUBLISHED"
                        ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    }`}
                    title={item.status === "PUBLISHED" ? "Arsipkan Materi" : "Terbitkan Kembali"}
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL TAMBAH / UBAH MATERI */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-brand-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-lg font-bold text-brand-navy">
                {editingItem ? "Ubah Materi Pembelajaran" : "Tambah Materi Pembelajaran"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Judul Materi
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Teknik Membaca Kritis..."
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Deskripsi / Ringkasan Materi
                </label>
                <textarea
                  required
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Tuliskan poin-poin utama materi..."
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              {/* Pilihan Sumber Video */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Format / Sumber Video Materi
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setVideoSource("YOUTUBE");
                      setFormError("");
                    }}
                    className={`py-2 px-3 rounded-md border text-center transition ${
                      videoSource === "YOUTUBE"
                        ? "bg-brand-navy text-white border-brand-navy shadow-sm"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    YouTube Link / ID
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoSource("CLOUDINARY");
                      setFormError("");
                    }}
                    className={`py-2 px-3 rounded-md border text-center transition ${
                      videoSource === "CLOUDINARY"
                        ? "bg-brand-navy text-white border-brand-navy shadow-sm"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    Upload Video (Cloudinary)
                  </button>
                </div>
              </div>

              {videoSource === "YOUTUBE" ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    URL Video YouTube atau ID
                  </label>
                  <input
                    type="text"
                    required={videoSource === "YOUTUBE"}
                    value={formYoutube}
                    onChange={(e) => setFormYoutube(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... atau youtu.be/..."
                    className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                  <p className="mt-1 text-[11px] text-gray-500">
                    ID video 11 karakter akan diekstrak secara otomatis dari URL YouTube.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Unggah File Video ke Cloudinary
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center bg-gray-50/50 hover:bg-gray-50 transition">
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                        id="cloudinary-video-upload"
                      />
                      <label
                        htmlFor="cloudinary-video-upload"
                        className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
                            <span className="text-xs font-semibold text-brand-blue">
                              Sedang mengunggah video ke Cloudinary...
                            </span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-6 h-6 text-gray-400" />
                            <span className="text-xs font-semibold text-brand-navy">
                              Klik untuk pilih file video (.mp4, .webm)
                            </span>
                            <span className="text-[11px] text-gray-400">
                              Maksimal 300MB
                            </span>
                          </>
                        )}
                      </label>
                    </div>

                    {uploadSuccessMsg && (
                      <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{uploadSuccessMsg}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      URL Video Cloudinary (atau paste link video langsung)
                    </label>
                    <input
                      type="url"
                      required={videoSource === "CLOUDINARY"}
                      value={formVideoUrl}
                      onChange={(e) => setFormVideoUrl(e.target.value)}
                      placeholder="https://res.cloudinary.com/.../video/upload/..."
                      className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nomor Urutan Tampil
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formOrder}
                  onChange={(e) => setFormOrder(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
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
                    "Simpan Materi"
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
