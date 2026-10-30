import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono select-none"
    >
      <div className="w-full max-w-md bg-[#0c1017] border border-slate-800 rounded-xl shadow-2xl p-6 text-xs relative space-y-4">
        <button
          onClick={() => {
            soundManager.playKey();
            onCancel();
          }}
          className="absolute top-4 right-4 text-slate-500 hover:text-white p-1 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2 text-white font-bold border-b border-slate-800 pb-3">
          <AlertTriangle className={`w-5 h-5 ${isDestructive ? 'text-red-400' : 'text-amber-400'}`} />
          <span id="confirm-dialog-title" className="text-sm tracking-wider uppercase">
            {title}
          </span>
        </div>

        <p id="confirm-dialog-message" className="text-slate-300 leading-relaxed text-xs">
          {message}
        </p>

        <div className="pt-2 flex items-center justify-end space-x-2">
          <button
            onClick={() => {
              soundManager.playKey();
              onCancel();
            }}
            className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              soundManager.playKey();
              onConfirm();
            }}
            className={`px-4 py-2 rounded font-bold transition focus:outline-none focus:ring-1 ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-400 shadow-lg shadow-red-950/40'
                : 'bg-emerald-600 hover:bg-emerald-500 text-black focus:ring-emerald-400 shadow-lg shadow-emerald-950/40'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
