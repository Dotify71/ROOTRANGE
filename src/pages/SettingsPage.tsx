import React, { useState } from 'react';
import { Settings, Volume2, VolumeX, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useGameStore, INITIAL_MACHINES } from '../store/gameStore';
import { soundManager } from '../audio/soundManager';

export const SettingsPage: React.FC = () => {
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [resetDone, setResetDone] = useState<boolean>(false);

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleResetRange = () => {
    soundManager.playKey();
    useGameStore.setState({
      score: 0,
      rank: 'Script Kiddie',
      activeMachineId: 'ecorp-hr',
      machines: JSON.parse(JSON.stringify(INITIAL_MACHINES)),
      claimedFlags: [],
    });
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 font-mono text-xs select-none max-w-3xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-400" />
            <span>WORKSTATION & RANGE CONFIGURATION</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Configure local audio feedback, terminal emulation parameters, and state buffers.
          </p>
        </div>
      </div>

      {/* Audio & Visuals */}
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
