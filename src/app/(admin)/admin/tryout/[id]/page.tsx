"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  FileQuestion,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Clock,
  Download,
  Upload,
} from "lucide-react";
import { ModalDialog, ModalDialogState } from "@/components/ui/ModalDialog";

interface AdminStatementItem {
  id: string;
  order: number;
  text: string;
  isTrue: boolean;
  explanation: string;
}

interface AdminQuestionItem {
  id: string;
  order: number;
  stem: string;
  statements: AdminStatementItem[];
}

interface AdminTryoutDetail {
  id: string;
  title: string;
  durationMinutes: number;
  status: "PUBLISHED" | "DRAFT";
  questions: AdminQuestionItem[];
}

export default function AdminTryoutQuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: tryoutId } = use(params);

  const [tryout, setTryout] = useState<AdminTryoutDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestionItem | null>(null);
  const [formStem, setFormStem] = useState("");
  const [formOrder, setFormOrder] = useState(1);
  const [formStatements, setFormStatements] = useState<
    { order: number; text: string; isTrue: boolean; explanation: string }[]
  >([
    { order: 1, text: "", isTrue: true, explanation: "" },
    { order: 2, text: "", isTrue: false, explanation: "" },
    { order: 3, text: "", isTrue: false, explanation: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [dialogState, setDialogState] = useState<ModalDialogState>({
    isOpen: false,
    message: "",
  });

  async function loadDetail() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/tryouts/${tryoutId}`);
      const data = await res.json();
      if (res.ok) {
        setTryout(data.tryout);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
  }, [tryoutId]);

  function handleOpenAdd() {
    setEditingQuestion(null);
    setFormStem("");
    const nextOrder = (tryout?.questions.length || 0) + 1;
    setFormOrder(nextOrder);
    setFormStatements([
      { order: 1, text: "", isTrue: true, explanation: "" },
      { order: 2, text: "", isTrue: false, explanation: "" },
      { order: 3, text: "", isTrue: false, explanation: "" },
    ]);
    setFormError("");
    setShowModal(true);
  }

  function handleOpenEdit(q: AdminQuestionItem) {
    setEditingQuestion(q);
    setFormStem(q.stem);
    setFormOrder(q.order);
    setFormStatements(
      q.statements.map((s, idx) => ({
        order: s.order || idx + 1,
        text: s.text,
        isTrue: s.isTrue,
        explanation: s.explanation,
      }))
    );
    setFormError("");
    setShowModal(true);
  }

  function handleAddStatementRow() {
    if (formStatements.length >= 6) {
      setDialogState({
        isOpen: true,
        type: "danger",
        title: "Batas Maksimal",
        message: "Maksimal 6 pernyataan per butir soal",
      });
      return;
    }
    setFormStatements((prev) => [
      ...prev,
      {
        order: prev.length + 1,
        text: "",
        isTrue: false,
        explanation: "",
      },
    ]);
  }

  function handleRemoveStatementRow(index: number) {
    if (formStatements.length <= 1) {
      setDialogState({
        isOpen: true,
        type: "danger",
        title: "Batas Minimal",
        message: "Minimal harus ada 1 pernyataan per butir soal",
      });
      return;
    }
    setFormStatements((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, idx) => ({ ...s, order: idx + 1 }))
    );
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const stemTrimmed = formStem.trim();
    if (stemTrimmed.length < 5) {
      setFormError("Stimulus / Teks soal minimal 5 karakter");
      return;
    }

    for (let i = 0; i < formStatements.length; i++) {
      const s = formStatements[i];
      if (!s.text.trim()) {
        setFormError(`Teks Pernyataan #${i + 1} wajib diisi`);
        return;
      }
      if (!s.explanation.trim()) {
        setFormError(`Pembahasan kunci jawaban Pernyataan #${i + 1} wajib diisi`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const endpoint = editingQuestion
        ? `/api/admin/tryouts/${tryoutId}/questions/${editingQuestion.id}`
        : `/api/admin/tryouts/${tryoutId}/questions`;
      const method = editingQuestion ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: Number(formOrder),
          stem: stemTrimmed,
          statements: formStatements.map((s, idx) => ({
            order: idx + 1,
            text: s.text.trim(),
            isTrue: s.isTrue,
            explanation: s.explanation.trim(),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error?.message || "Gagal menyimpan soal");
        setIsSubmitting(false);
        return;
      }

      setShowModal(false);
      setIsSubmitting(false);
      loadDetail();
    } catch {
      setFormError("Terjadi kesalahan jaringan");
      setIsSubmitting(false);
    }
  }

  async function executeDeleteQuestion(q: AdminQuestionItem) {
    try {
      const res = await fetch(`/api/admin/tryouts/${tryoutId}/questions/${q.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setDialogState({
          isOpen: true,
          type: "danger",
          title: "Gagal Menghapus Soal",
          message: data.error?.message || "Gagal menghapus soal",
        });
      } else {
        loadDetail();
      }
    } catch {
      setDialogState({
        isOpen: true,
        type: "danger",
        title: "Kendala Jaringan",
        message: "Terjadi kendala jaringan saat menghapus soal",
      });
    }
  }

  function handleDeleteQuestion(q: AdminQuestionItem) {
    setDialogState({
      isOpen: true,
      type: "danger",
      title: "Hapus Butir Soal",
      message: `Apakah kamu yakin ingin menghapus Soal #${q.order}? Seluruh pernyataan dan pembahasan di dalamnya akan ikut terhapus.`,
      confirmLabel: "Hapus Soal",
      onConfirm: () => executeDeleteQuestion(q),
    });
  }

  async function handleImportCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/admin/tryouts/${tryoutId}/questions/import`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setDialogState({
          isOpen: true,
          type: "danger",
          title: "Gagal Impor CSV",
          message: data.error?.message || "Gagal mengimpor file CSV",
        });
      } else {
        setDialogState({
          isOpen: true,
          type: "success",
          title: "Impor Berhasil",
          message: data.message || `Berhasil mengimpor ${data.importedCount} butir soal!`,
        });
        loadDetail();
      }
    } catch {
      setDialogState({
        isOpen: true,
        type: "danger",
        title: "Kendala Jaringan",
        message: "Terjadi kendala jaringan saat mengimpor CSV",
      });
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
  }

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-2">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        <span className="text-xs text-gray-500">Memuat detail butir soal tryout...</span>
      </div>
    );
  }

  if (!tryout) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-gray-600">Paket tryout tidak ditemukan.</p>
        <Link
          href="/admin/tryout"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar Tryout
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="space-y-3">
        <Link
          href="/admin/tryout"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-blue transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar Paket Tryout
        </Link>

        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-lg border border-gray-200/80 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-brand-navy">
                {tryout.title}
              </h1>
              {tryout.status === "PUBLISHED" ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
                  Terbit
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                  Draft
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                Durasi: {tryout.durationMinutes} Menit
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-brand-navy font-semibold">
                <FileQuestion className="w-3.5 h-3.5 text-brand-blue" />
                Total: {tryout.questions.length} Butir Soal
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <a
              href={`/api/admin/tryouts/${tryoutId}/questions/template?format=xlsx`}
              download="template-soal-tryout.xlsx"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 transition shadow-sm"
              title="Unduh format template Excel (.xlsx) rapi lengkap dengan petunjuk pengisian"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" /> Template Excel (.xlsx)
            </a>

            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 transition shadow-sm cursor-pointer">
              {isImporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-blue" /> Mengimpor...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 text-brand-blue" /> Impor Excel / CSV
                </>
              )}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportCsv}
                disabled={isImporting}
                className="hidden"
              />
            </label>

            <a
              href={`/api/admin/tryouts/${tryoutId}/questions/export`}
              download
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 transition shadow-sm"
              title="Ekspor seluruh butir soal paket ini ke file CSV"
            >
              <Download className="w-3.5 h-3.5" /> Ekspor Soal
            </a>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-brand-blue text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Tambah Soal
            </button>
          </div>
        </div>
      </div>

      {/* List Soal */}
      {tryout.questions.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200/80 shadow-sm py-16 text-center space-y-2">
          <FileQuestion className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="font-semibold text-gray-700">Belum ada butir soal dalam paket ini</p>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Klik tombol &quot;Tambah Soal Baru&quot; di atas untuk mulai memasukkan stimulus bacaan dan pernyataan Benar/Salah.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tryout.questions.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-lg border border-gray-200/80 shadow-sm p-5 sm:p-6 space-y-4 hover:border-gray-300 transition"
            >
              {/* Soal Header & Action */}
              <div className="flex justify-between items-start gap-4 pb-3 border-b border-gray-100">
                <span className="inline-flex items-center px-2.5 py-1 rounded bg-brand-navy text-white text-xs font-bold font-mono">
                  Soal #{q.order}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(q)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-gray-200 text-xs font-semibold text-gray-600 hover:text-brand-blue hover:bg-gray-50 transition"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(q)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-3 h-3" /> Hapus
                  </button>
                </div>
              </div>

              {/* Stem / Stimulus Bacaan */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Teks Soal / Stimulus Bacaan:
                </span>
                <p className="text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-line bg-gray-50/80 p-3.5 rounded-md border border-gray-200/60 font-sans">
                  {q.stem}
                </p>
              </div>

              {/* Statements */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Daftar Pernyataan & Kunci Jawaban:
                </span>
                <div className="space-y-2">
                  {q.statements.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      className="p-3 rounded-md border border-gray-100 bg-white hover:bg-slate-50/50 transition space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 text-xs sm:text-sm">
                          <span className="font-semibold text-gray-400 mt-0.5">
                            {idx + 1}.
                          </span>
                          <span className="font-medium text-gray-800 leading-snug">
                            {s.text}
                          </span>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded flex-shrink-0 ${
                            s.isTrue
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                              : "bg-rose-50 text-rose-700 border border-rose-300"
                          }`}
                        >
                          {s.isTrue ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Benar
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600" /> Salah
                            </>
                          )}
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-500 pl-5 bg-gray-50/60 p-2 rounded border border-gray-100">
                        <span className="font-semibold text-gray-700">Pembahasan: </span>
                        {s.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL TAMBAH / EDIT SOAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-brand-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-lg font-bold text-brand-navy">
                {editingQuestion ? `Edit Soal #${editingQuestion.order}` : "Tambah Butir Soal Baru"}
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

            <form onSubmit={handleFormSubmit} className="space-y-5">
              {/* Nomor Urutan */}
              <div className="w-32">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nomor Soal
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formOrder}
                  onChange={(e) => setFormOrder(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              {/* Teks Soal / Stimulus */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Teks Stimulus Bacaan / Teks Soal
                </label>
                <textarea
                  required
                  rows={4}
                  value={formStem}
                  onChange={(e) => setFormStem(e.target.value)}
                  placeholder="Masukkan teks paragraf, narasi informasi, atau stimulus bacaan..."
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue leading-relaxed"
                />
              </div>

              {/* Daftar Pernyataan */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider">
                    Daftar Pernyataan (Benar / Salah)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddStatementRow}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:text-blue-800 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Pernyataan
                  </button>
                </div>

                <div className="space-y-3.5">
                  {formStatements.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 space-y-2.5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-brand-navy">
                          Pernyataan #{idx + 1}
                        </span>
                        {formStatements.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStatementRow(idx)}
                            className="text-[11px] text-red-600 hover:text-red-800 font-semibold transition"
                          >
                            Hapus
                          </button>
                        )}
                      </div>

                      {/* Teks Pernyataan */}
                      <div>
                        <input
                          type="text"
                          required
                          value={s.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormStatements((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, text: val } : item
                              )
                            );
                          }}
                          placeholder={`Teks pernyataan #${idx + 1}...`}
                          className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        />
                      </div>

                      {/* Kunci Jawaban Toggle */}
                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="text-gray-600">Kunci Jawaban:</span>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`isTrue-${idx}`}
                            checked={s.isTrue === true}
                            onChange={() => {
                              setFormStatements((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, isTrue: true } : item
                                )
                              );
                            }}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-emerald-700 font-bold">BENAR</span>
                        </label>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`isTrue-${idx}`}
                            checked={s.isTrue === false}
                            onChange={() => {
                              setFormStatements((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, isTrue: false } : item
                                )
                              );
                            }}
                            className="text-rose-600 focus:ring-rose-500"
                          />
                          <span className="text-rose-700 font-bold">SALAH</span>
                        </label>
                      </div>

                      {/* Pembahasan */}
                      <div>
                        <input
                          type="text"
                          required
                          value={s.explanation}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormStatements((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, explanation: val } : item
                              )
                            );
                          }}
                          placeholder="Penjelasan / Pembahasan mengapa Benar/Salah..."
                          className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
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
                    "Simpan Soal"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ModalDialog
        state={dialogState}
        onClose={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
