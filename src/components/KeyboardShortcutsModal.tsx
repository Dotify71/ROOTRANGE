import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  action: string;
  category: 'NAVIGATION' | 'TERMINAL' | 'REPEATER' | 'GENERAL';
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ['Ctrl', 'K'], action: 'Open Keyboard Shortcuts Manual', category: 'GENERAL' },
  { keys: ['Esc'], action: 'Close active modal / dialog', category: 'GENERAL' },
  { keys: ['Ctrl', 'Enter'], action: 'Send HTTP Request in Repeater', category: 'REPEATER' },
  { keys: ['Cmd', 'Enter'], action: 'Send HTTP Request (macOS)', category: 'REPEATER' },
  { keys: ['Tab'], action: 'Autocomplete command or path in Terminal', category: 'TERMINAL' },
  { keys: ['ArrowUp'], action: 'Cycle backwards through terminal command history', category: 'TERMINAL' },
  { keys: ['ArrowDown'], action: 'Cycle forwards through terminal command history', category: 'TERMINAL' },
  { keys: ['Ctrl', 'C'], action: 'Cancel command or break process in Terminal', category: 'TERMINAL' },
  { keys: ['Alt', '1'], action: 'Jump to Dashboard view', category: 'NAVIGATION' },
  { keys: ['Alt', '2'], action: 'Launch Pwnbox Terminal', category: 'NAVIGATION' },
  { keys: ['Alt', '3'], action: 'Open Machine Catalog', category: 'NAVIGATION' },
  { keys: ['Alt', '4'], action: 'Open Attack Graph', category: 'NAVIGATION' },
  { keys: ['Alt', '5'], action: 'Open HTTP Web Repeater', category: 'NAVIGATION' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono select-none"
    >
      <div className="w-full max-w-lg bg-[#0c1017] border border-slate-800 rounded-xl shadow-2xl p-6 text-xs relative space-y-4">
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playKey();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-500 hover:text-white p-1 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
          aria-label="Close shortcuts dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-2 text-white font-bold border-b border-slate-800 pb-3">
          <Keyboard className="w-5 h-5 text-cyan-400" />
          <span id="shortcuts-modal-title" className="text-sm tracking-wider uppercase">
            KEYBOARD SHORTCUTS MANUAL
          </span>
        </div>

        <p className="text-slate-400 leading-relaxed text-xs">
          ROOTRANGE provides full keyboard accessibility across the terminal engine, HTTP repeater, and global workstation routes.
        </p>

        {/* Shortcuts List */}
        <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/60">
          {SHORTCUTS.map((item, idx) => (
            <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
              <span className="text-slate-300">{item.action}</span>
              <div className="flex items-center gap-1">
                {item.keys.map((k, kIdx) => (
                  <kbd
                    key={kIdx}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-bold text-[10px] shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Command className="w-3.5 h-3.5 text-slate-400" />
            <span>Accessible Navigation Standard</span>
          </span>
          <button
            onClick={() => {
              soundManager.playKey();
              onClose();
            }}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold transition"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
