"use client";

import { useState, useEffect, useCallback } from "react";
import {
  KeyRound,
  Download,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Edit2,
} from "lucide-react";
import { ModalDialog, ModalDialogState } from "@/components/ui/ModalDialog";

interface RedeemCodeItem {
  id: string;
  code: string;
  durationDays: number;
  maxUses: number;
  usedCount: number;
  label: string | null;
  tryoutId: string | null;
  tryoutTitle: string | null;
  status: "AVAILABLE" | "USED" | "REVOKED" | "EXPIRED";
  expiresAt: string | null;
  usedAt: string | null;
  usedBy: { name: string; email: string } | null;
  createdAt: string;
}

export default function AdminRedeemCodesPage() {
  const [codes, setCodes] = useState<RedeemCodeItem[]>([]);
  const [tryouts, setTryouts] = useState<{ id: string; title: string }[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Form Generate Batch State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [batchCount, setBatchCount] = useState(5);
  const [batchDuration, setBatchDuration] = useState(30);
  const [batchMaxUses, setBatchMaxUses] = useState(1);
  const [batchLabel, setBatchLabel] = useState("");
  const [batchTryoutId, setBatchTryoutId] = useState("");
  const [batchExpires, setBatchExpires] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<string[] | null>(null);

  // Form Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RedeemCodeItem | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editDuration, setEditDuration] = useState(30);
  const [editMaxUses, setEditMaxUses] = useState(1);
  const [editLabel, setEditLabel] = useState("");
  const [editTryoutId, setEditTryoutId] = useState("");
  const [editExpires, setEditExpires] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState("");

  // Action State
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<ModalDialogState>({
    isOpen: false,
    message: "",
  });

  const loadCodes = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "20",
        status: statusFilter,
        search,
      });
      const res = await fetch(`/api/admin/redeem-codes?${query.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setCodes(data.codes);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  useEffect(() => {
    async function loadTryouts() {
      try {
        const res = await fetch("/api/admin/tryouts");
        const data = await res.json();
        if (res.ok && data.tryouts) {
          setTryouts(data.tryouts);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadTryouts();
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadCodes();
  }

  async function handleGenerateBatch(e: React.FormEvent) {
    e.preventDefault();

    const countNum = Number(batchCount);
    if (isNaN(countNum) || countNum < 1 || countNum > 100) {
      setDialogState({
        isOpen: true,
        type: "danger",
        title: "Input Tidak Valid",
        message: "Jumlah kode harus antara 1 sampai 100",
      });
      return;
    }

    const durationNum = Number(batchDuration);
    if (isNaN(durationNum) || durationNum < 1 || durationNum > 730) {
      setDialogState({
        isOpen: true,
        type: "danger",
        title: "Input Tidak Valid",
        message: "Durasi masa aktif harus antara 1 sampai 730 hari",
      });
      return;
    }

    const maxUsesNum = Number(batchMaxUses);
    if (isNaN(maxUsesNum) || maxUsesNum < 1 || maxUsesNum > 1000) {
      setDialogState({
        isOpen: true,
        type: "danger",
        title: "Input Tidak Valid",
        message: "Jatah kuota pengguna harus antara 1 sampai 1000 pengguna",
      });
      return;
    }

    if (batchLabel && batchLabel.trim().length > 100) {
      setDialogState({
        isOpen: true,
        type: "danger",
        title: "Input Tidak Valid",
        message: "Label batch maksimal 100 karakter",
      });
      return;
    }

    setIsGenerating(true);
    setGenerateResult(null);

    try {
      const res = await fetch("/api/admin/redeem-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: countNum,
          durationDays: durationNum,
          maxUses: maxUsesNum,
          label: batchLabel || undefined,
          tryoutId: batchTryoutId || undefined,
          expiresAt: batchExpires ? new Date(batchExpires).toISOString() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDialogState({
          isOpen: true,
          type: "danger",
          title: "Gagal Generate Kode",
          message: data.error?.message || "Gagal generate kode",
        });
        setIsGenerating(false);
        return;
      }

      setGenerateResult(data.codes);
      setIsGenerating(false);
      loadCodes();
    } catch {
      setDialogState({
        isOpen: true,
        type: "danger",
        title: "Kendala Jaringan",
        message: "Terjadi kesalahan koneksi saat generate kode",
      });
      setIsGenerating(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;
    setEditError("");

    const durationNum = Number(editDuration);
    if (isNaN(durationNum) || durationNum < 1 || durationNum > 730) {
      setEditError("Durasi masa aktif harus antara 1 sampai 730 hari");
      return;
    }

    const maxUsesNum = Number(editMaxUses);
    if (isNaN(maxUsesNum) || maxUsesNum < 1 || maxUsesNum > 10000) {
      setEditError("Jatah kuota pengguna harus antara 1 sampai 10.000 pengguna");
      return;
    }

    if (maxUsesNum < editingItem.usedCount) {
      setEditError(`Kuota tidak boleh lebih kecil dari jumlah pengguna yang sudah terdaftar (${editingItem.usedCount} pengguna)`);
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/redeem-codes/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editCode.trim().toUpperCase(),
          durationDays: durationNum,
          maxUses: maxUsesNum,
          label: editLabel.trim() || null,
          tryoutId: editTryoutId || null,
          expiresAt: editExpires ? new Date(editExpires).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error?.message || "Gagal memperbarui kode");
        setIsUpdating(false);
        return;
      }

      setShowEditModal(false);
      setEditingItem(null);
      loadCodes();
    } catch {
      setEditError("Terjadi kesalahan jaringan");
    } finally {
      setIsUpdating(false);
    }
  }

  async function executeRevoke(id: string) {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/redeem-codes/${id}/revoke`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setDialogState({
          isOpen: true,
          type: "danger",
          title: "Gagal Mencabut Kode",
          message: data.error?.message || "Gagal mencabut kode",
        });
      } else {
        loadCodes();
      }
    } catch {
      setDialogState({
        isOpen: true,
        type: "danger",
        title: "Kendala Jaringan",
        message: "Terjadi kendala jaringan saat mencabut kode",
      });
    } finally {
      setActionLoadingId(null);
    }
  }

  function handleRevoke(id: string) {
    setDialogState({
      isOpen: true,
      type: "confirm",
      title: "Konfirmasi Cabut Kode",
      message: "Apakah kamu yakin ingin mencabut kode redeem ini? Kode yang dicabut tidak dapat digunakan lagi oleh pengguna.",
      confirmLabel: "Cabut Kode",
      onConfirm: () => executeRevoke(id),
    });
  }

  function handleExportCSV() {
    const query = new URLSearchParams({
      status: statusFilter,
      search,
    });
    window.location.href = `/api/admin/redeem-codes/export?${query.toString()}`;
  }

  return (
    <div className="space-y-6">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy">
            Kelola Kode Redeem
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate batch kode baru, pantau status penggunaan, cabut kode, dan ekspor ke format CSV.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-xs sm:text-sm font-semibold hover:bg-gray-50 transition shadow-sm"
          >
            <Download className="w-4 h-4" /> Ekspor CSV
          </button>
          <button
            onClick={() => {
              setGenerateResult(null);
              setShowGenerateModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-brand-blue text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Generate Batch
          </button>
        </div>
      </div>

      {/* FILTER & PENCARIAN */}
      <div className="bg-white p-4 rounded-lg border border-gray-200/80 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs font-semibold">
          {[
            { key: "ALL", label: "Semua" },
            { key: "AVAILABLE", label: "Tersedia" },
            { key: "USED", label: "Terpakai" },
            { key: "REVOKED", label: "Dicabut" },
            { key: "EXPIRED", label: "Kedaluwarsa" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setStatusFilter(item.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                statusFilter === item.key
                  ? "bg-brand-navy text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-grow sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode atau label..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-brand-navy text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition"
          >
            Cari
          </button>
        </form>
      </div>

      {/* TABLE DATA */}
      <div className="bg-white rounded-lg border border-gray-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
            <span className="text-xs text-gray-500">Memuat data kode...</span>
          </div>
        ) : codes.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500 space-y-1">
            <KeyRound className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="font-semibold text-gray-700">Tidak ada kode yang sesuai</p>
            <p className="text-xs">Coba ubah filter atau kata kunci pencarian kamu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Kode Redeem</th>
                  <th className="py-3 px-4">Durasi</th>
                  <th className="py-3 px-4">Kuota Pengguna</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Label Batch</th>
                  <th className="py-3 px-4">Pemakai</th>
                  <th className="py-3 px-4">Batas Expired</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {codes.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-navy">
                      <div>{item.code}</div>
                      <div className="font-sans font-normal text-[11px] mt-0.5">
                        {item.tryoutTitle ? (
                          <span className="inline-block text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            {item.tryoutTitle}
                          </span>
                        ) : (
                          <span className="text-slate-400">Semua Paket Tryout</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {item.durationDays} Hari
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-brand-navy">
                          {item.usedCount}
                        </span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600 font-medium">
                          {item.maxUses}
                        </span>
                        <span className="text-[11px] text-gray-400">pengguna</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.status === "AVAILABLE" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tersedia ({item.maxUses - item.usedCount} sisa)
                        </span>
                      )}
                      {item.status === "USED" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-brand-blue border border-brand-blue/30">
                          <Clock className="w-3 h-3 text-brand-blue" /> {item.maxUses > 1 ? "Kuota Penuh" : "Terpakai"}
                        </span>
                      )}
                      {item.status === "REVOKED" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-300">
                          <XCircle className="w-3 h-3 text-rose-600" /> Dicabut
                        </span>
                      )}
                      {item.status === "EXPIRED" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                          Kedaluwarsa
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {item.label || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 text-xs">
                      {item.usedCount > 1 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">
                          {item.usedCount} Pengguna terdaftar
                        </span>
                      ) : item.usedBy ? (
                        <div>
                          <span className="font-semibold text-brand-navy block">{item.usedBy.name}</span>
                          <span className="text-gray-400">{item.usedBy.email}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 text-xs">
                      {item.expiresAt
                        ? new Date(item.expiresAt).toLocaleDateString("id-ID")
                        : "Permanen"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        {item.status !== "REVOKED" && (
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setEditCode(item.code);
                              setEditDuration(item.durationDays);
                              setEditMaxUses(item.maxUses);
                              setEditLabel(item.label || "");
                              setEditTryoutId(item.tryoutId || "");
                              setEditExpires(
                                item.expiresAt
                                  ? new Date(item.expiresAt).toISOString().slice(0, 16)
                                  : ""
                              );
                              setEditError("");
                              setShowEditModal(true);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:text-blue-800 transition"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                        )}
                        {item.status === "AVAILABLE" && (
                          <button
                            onClick={() => handleRevoke(item.id)}
                            disabled={actionLoadingId === item.id}
                            className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-40 transition"
                          >
                            {actionLoadingId === item.id ? "Memproses..." : "Cabut"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            Total: <strong>{totalCount}</strong> kode (Halaman {page} dari {totalPages || 1})
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL GENERATE BATCH */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-brand-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-lg font-bold text-brand-navy">Generate Batch Kode Redeem</h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {generateResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800">
                  ✅ Berhasil membuat <strong>{generateResult.length} kode unik</strong> baru!
                </div>
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200 font-mono text-xs max-h-48 overflow-y-auto space-y-1">
                  {generateResult.map((c, i) => (
                    <div key={i} className="py-0.5 select-all">
                      {c}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowGenerateModal(false)}
                    className="px-5 py-2.5 bg-brand-blue text-white rounded-md text-xs sm:text-sm font-semibold"
                  >
                    Selesai & Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGenerateBatch} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Jumlah Kode (1 - 100)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={batchCount}
                    onChange={(e) => setBatchCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Durasi Masa Aktif (1 - 730 Hari)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={730}
                    required
                    value={batchDuration}
                    onChange={(e) => setBatchDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Jatah Kuota Pengguna per Kode (1 - 1000 Pengguna)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    required
                    value={batchMaxUses}
                    onChange={(e) => setBatchMaxUses(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Berapa banyak pengguna yang dapat menukarkan kode ini (misal: 1 untuk privat/eksklusif, atau 10/100 pengguna untuk kelas/buku promo).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Label Batch (Opsional, misal: Buku Literasi 2026)
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={batchLabel}
                    onChange={(e) => setBatchLabel(e.target.value)}
                    placeholder="Contoh: Promo Buku Liniswara Batch 1"
                    className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Pilihan Paket Tryout
                  </label>
                  <select
                    value={batchTryoutId}
                    onChange={(e) => setBatchTryoutId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="">Semua Paket Tryout (Akses Penuh)</option>
                    {tryouts.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Pilih tryout tertentu jika voucher ini khusus untuk paket tryout tersebut, atau biarkan &quot;Semua Paket Tryout&quot; untuk akses penuh.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Batas Akhir Penukaran / Expired (Opsional)
                  </label>
                  <input
                    type="datetime-local"
                    value={batchExpires}
                    onChange={(e) => setBatchExpires(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-brand-blue hover:bg-blue-700 text-white rounded-md text-xs sm:text-sm font-semibold shadow disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Menghasilkan Kode...
                      </>
                    ) : (
                      "Generate Sekarang"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL EDIT KODE REDEEM */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 z-50 bg-brand-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-brand-navy">Edit Kode Redeem</h3>
                <p className="text-xs text-gray-500">Sesuaikan kode voucher, durasi, dan kuota pengguna.</p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  String Kode Redeem
                </label>
                <input
                  type="text"
                  required
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Durasi Masa Aktif (Hari)
                </label>
                <input
                  type="number"
                  min={1}
                  max={730}
                  required
                  value={editDuration}
                  onChange={(e) => setEditDuration(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Jatah Kuota Pengguna
                </label>
                <input
                  type="number"
                  min={editingItem.usedCount || 1}
                  max={10000}
                  required
                  value={editMaxUses}
                  onChange={(e) => setEditMaxUses(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Sudah terpakai oleh <strong>{editingItem.usedCount} pengguna</strong>. Kuota minimal adalah {editingItem.usedCount}.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Label Batch / Keterangan
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="Contoh: Promo Buku 2026"
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Pilihan Paket Tryout
                </label>
                <select
                  value={editTryoutId}
                  onChange={(e) => setEditTryoutId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="">Semua Paket Tryout (Akses Penuh)</option>
                  {tryouts.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  Pilih paket tryout yang berhak diakses pengguna yang menukarkan kode ini.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Batas Expired (Opsional, kosongkan jika permanen)
                </label>
                <input
                  type="datetime-local"
                  value={editExpires}
                  onChange={(e) => setEditExpires(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-brand-blue hover:bg-blue-700 text-white rounded-md text-xs sm:text-sm font-semibold shadow disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    "Simpan Perubahan"
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
