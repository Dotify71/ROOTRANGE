import React, { useState, useRef } from 'react';
import {
  Settings,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  Download,
  Upload,
  AlertCircle,
  FileJson,
  Shield,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../audio/soundManager';
import { PersistenceService } from '../services/persistenceService';
import { RootrangeSaveState } from '../types/progression';

export const SettingsPage: React.FC = () => {
  const { exportState, importState, resetGame } = useGameStore();
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [resetDone, setResetDone] = useState<boolean>(false);
  const [importFeedback, setImportFeedback] = useState<{
    success: boolean;
    message: string;
    preview?: RootrangeSaveState;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleResetRange = () => {
    soundManager.playKey();
    if (window.confirm('Are you sure you want to completely reset your cyber range progress? All captured flags and scores will be purged.')) {
      resetGame();
      setResetDone(true);
      setTimeout(() => setResetDone(false), 3000);
    }
  };

  const handleExportSave = () => {
    soundManager.playKey();
    const saveState = exportState();
    const jsonStr = PersistenceService.exportStateToJson(saveState);

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rootrange-save-v1-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundManager.playKey();
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = PersistenceService.importStateFromJson(content);

      if (validation.valid && validation.validatedState) {
        const ok = importState(validation.validatedState);
        if (ok) {
          soundManager.playConnect();
          setImportFeedback({
            success: true,
            message: `Save state successfully restored! Rank: ${validation.validatedState.rank}, Score: ${validation.validatedState.score} XP, Flags: ${validation.validatedState.claimedFlags.length}.`,
            preview: validation.validatedState,
          });
        } else {
          setImportFeedback({
            success: false,
            message: 'Failed to import save into game engine state.',
          });
        }
      } else {
        soundManager.playKey();
        setImportFeedback({
          success: false,
          message: validation.error || 'Failed to validate imported file schema.',
        });
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 font-mono text-xs select-none max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-400" />
            <span>WORKSTATION & RANGE CONFIGURATION</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Configure local audio feedback, persist progress to IndexedDB, and export versioned backup archives.
          </p>
        </div>
      </div>

      {/* Save State Management */}
      <div className="bg-[#0c1017] border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>PROGRESS PERSISTENCE & VERSIONED SAVES</span>
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 font-bold">
            SCHEMA VERSION 1 // INDEXEDDB
          </span>
        </div>

        <p className="text-slate-400 text-xs leading-relaxed">
          Your progress, machine compromise levels, captured flags, and evidence records are automatically persisted to your browser&apos;s IndexedDB buffer. You can also export a validated portable JSON snapshot or restore a previously saved engagement.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Export */}
          <div className="p-3 rounded bg-slate-900/60 border border-slate-800 space-y-2 flex flex-col justify-between">
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Export Save Archive</span>
              </div>
              <p className="text-slate-500 text-[11px] mt-1">
                Download a cryptographically validated, schema-compliant JSON file containing your active engagement.
              </p>
            </div>
            <button
              onClick={handleExportSave}
              className="w-full py-2 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 font-bold transition flex items-center justify-center gap-1.5"
            >
              <FileJson className="w-4 h-4" />
              <span>DOWNLOAD SAVE (.JSON)</span>
            </button>
          </div>

          {/* Import */}
          <div className="p-3 rounded bg-slate-900/60 border border-slate-800 space-y-2 flex flex-col justify-between">
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-purple-400" />
                <span>Restore From Backup</span>
              </div>
              <p className="text-slate-500 text-[11px] mt-1">
                Upload a verified save file. Data integrity is strictly validated before applying state changes.
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json,application/json"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 rounded bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 font-bold transition flex items-center justify-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              <span>SELECT FILE TO RESTORE</span>
            </button>
          </div>
        </div>

        {/* Import Feedback */}
        {importFeedback && (
          <div
            className={`p-3 rounded-lg border flex items-start space-x-2.5 ${
              importFeedback.success
                ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300'
                : 'bg-red-950/40 border-red-800 text-red-300'
            }`}
          >
            {importFeedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-xs">{importFeedback.message}</div>
            </div>
          </div>
        )}
      </div>

      {/* Audio & Synthesizer Settings */}
      <div className="bg-[#0c1017] border border-slate-800 rounded-xl p-4 space-y-3">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">AUDIO & SYNTHESIZER SETTINGS</h2>

        <div className="flex items-center justify-between p-3 rounded bg-slate-900/60 border border-slate-800">
          <div>
            <div className="font-bold text-white">Tactical Web Audio Synthesizer</div>
            <div className="text-[11px] text-slate-500">Procedural keystroke chatter, scan sweeps, and shell triggers</div>
          </div>
          <button
            onClick={handleToggleMute}
            className={`px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 transition ${
              isMuted
                ? 'bg-red-950 text-red-300 border border-red-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isMuted ? 'AUDIO MUTED' : 'AUDIO ENABLED'}</span>
          </button>
        </div>
      </div>

      {/* Range State Management */}
      <div className="bg-[#0c1017] border border-slate-800 rounded-xl p-4 space-y-3">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">CYBER RANGE STATE CONTROLS</h2>

        <div className="flex items-center justify-between p-3 rounded bg-slate-900/60 border border-slate-800">
          <div>
            <div className="font-bold text-white">Reset Penetration Test Engagement</div>
            <div className="text-[11px] text-slate-500">Purges all captured flags, scores, and resets machines to locked state</div>
          </div>
          <button
            onClick={handleResetRange}
            className="px-3 py-1.5 rounded font-bold text-xs bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET RANGE</span>
          </button>
        </div>

        {resetDone && (
          <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-600/60 text-emerald-300 flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Range successfully restored to factory clean baseline!</span>
          </div>
        )}
      </div>
    </div>
  );
};
