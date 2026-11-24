"use client";

import React from "react";
import { AlertCircle, CheckCircle2, HelpCircle, Info, X } from "lucide-react";

export interface ModalDialogState {
  isOpen: boolean;
  type?: "alert" | "confirm" | "success" | "danger";
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ModalDialogProps {
  state: ModalDialogState;
  onClose: () => void;
}

export function ModalDialog({ state, onClose }: ModalDialogProps) {
  if (!state.isOpen) return null;

  const {
    type = "alert",
    title,
    message,
    confirmLabel = "OK",
    cancelLabel = "Batal",
    onConfirm,
    onCancel,
  } = state;

  const isConfirm = type === "confirm" || type === "danger";

  function handleClose() {
    if (onCancel) onCancel();
    onClose();
  }

  function handleConfirm() {
    if (onConfirm) onConfirm();
    onClose();
  }

  const defaultTitle =
    title ||
    (type === "danger"
      ? "Peringatan"
      : type === "confirm"
      ? "Konfirmasi Tindakan"
      : type === "success"
      ? "Berhasil"
      : "Pemberitahuan");

  return (
    <div className="fixed inset-0 z-50 bg-brand-navy/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              type === "danger"
                ? "bg-red-50 text-red-600 border border-red-200"
                : type === "success"
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : type === "confirm"
                ? "bg-amber-50 text-amber-600 border border-amber-200"
                : "bg-blue-50 text-brand-blue border border-blue-200"
            }`}
          >
            {type === "danger" ? (
              <AlertCircle className="w-5 h-5" />
            ) : type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : type === "confirm" ? (
              <HelpCircle className="w-5 h-5" />
            ) : (
              <Info className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 space-y-1 pt-0.5">
            <h3 className="text-base font-bold text-brand-navy leading-snug">
              {defaultTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>

          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          {isConfirm && (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-md border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-md text-xs sm:text-sm font-semibold text-white transition shadow-sm ${
              type === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-brand-blue hover:bg-blue-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
