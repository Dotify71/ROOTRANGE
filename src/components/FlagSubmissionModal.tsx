import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Flag, X, CheckCircle2, AlertCircle, Trophy, Sparkles, Filter } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../audio/soundManager';
import { FlagSubmissionResult } from '../types';

interface FlagSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMachineId?: string;
}

export const FlagSubmissionModal: React.FC<FlagSubmissionModalProps> = ({
  isOpen,
  onClose,
  defaultMachineId,
}) => {
  const { submitFlag, machines, claimedFlags } = useGameStore();
  const [flagInput, setFlagInput] = useState<string>('');
  const [selectedMachine, setSelectedMachine] = useState<string>(defaultMachineId || 'auto');
  const [result, setResult] = useState<FlagSubmissionResult | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playKey();

    const expectedMachineId = selectedMachine !== 'auto' ? selectedMachine : undefined;
    const res = submitFlag(flagInput, expectedMachineId);
    setResult(res);

    if (res.success) {
      soundManager.playFlagSuccess();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b'],
        });
      } catch {
        // Confetti fails gracefully
      }
      setFlagInput('');
    } else {
      soundManager.playKey();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm font-mono p-4">
      <div className="w-full max-w-md bg-[#0a0f17] border border-slate-800 rounded-xl shadow-2xl p-6 text-xs relative space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-2 text-emerald-400 font-bold border-b border-slate-800 pb-3">
          <Flag className="w-5 h-5 text-emerald-400 animate-bounce" />
          <span className="text-sm tracking-wider uppercase text-white">SUBMIT CAPTURE-THE-FLAG</span>
        </div>

        <p className="text-slate-400 leading-relaxed text-xs">
          Discovered a flag inside a target container or service? Enter the full token (e.g. <code className="text-emerald-400">ROOTRANGE{'{...}'}</code>) to claim points and advance your hacker rank.
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-cyan-400" />
              <span>TARGET MACHINE CONTEXT</span>
            </label>
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              className="w-full bg-[#070a0f] border border-slate-800 text-slate-300 p-2 rounded text-xs outline-none focus:border-cyan-500"
            >
              <option value="auto">Auto-Detect Target Machine</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.ip})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1">
              FLAG TOKEN
            </label>
            <input
              type="text"
              value={flagInput}
              onChange={(e) => setFlagInput(e.target.value)}
              placeholder="ROOTRANGE{user_or_root_token}"
              className="w-full bg-[#070a0f] border border-slate-800 focus:border-emerald-500 text-slate-100 p-2.5 rounded font-mono text-xs outline-none"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/40"
          >
            <Trophy className="w-4 h-4" />
            <span>CLAIM POINTS & SUBMIT FLAG</span>
          </button>
        </form>

        {/* Status Notification */}
        {result && (
          <div
            className={`p-3 rounded-lg border flex items-start space-x-2.5 ${
              result.success
                ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300'
                : 'bg-red-950/40 border-red-800 text-red-300'
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-xs">{result.message}</div>
              {result.success && (
                <div className="text-[10px] text-emerald-400/80 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>
                    Flag registered! Machine: {result.machineName || 'ROOTRANGE'}, Type: {result.flagType?.toUpperCase() || 'FLAG'}, +{result.pointsAwarded} PTS
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-2 flex justify-between">
          <span>Total Captured: <strong className="text-emerald-400">{claimedFlags.length} flags</strong></span>
          <span>Rank progression active</span>
        </div>
      </div>
    </div>
  );
};
