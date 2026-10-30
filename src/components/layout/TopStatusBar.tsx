import React, { useState } from 'react';
import { Volume2, VolumeX, Flag, Trophy, Shield, Activity, Monitor } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { soundManager } from '../../audio/soundManager';

interface TopStatusBarProps {
  onOpenFlagModal: () => void;
  crtActive: boolean;
  onToggleCrt: () => void;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  onOpenFlagModal,
  crtActive,
  onToggleCrt,
}) => {
  const { score, rank, activeMachineId, setActiveMachine, machines } = useGameStore();
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());

  const activeMachine = machines.find((m) => m.id === activeMachineId) || machines[0];

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-[#0d121c] border-b border-slate-800/80 font-mono text-xs select-none z-20">
      {/* Target Selector & Ingress Telemetry */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>VPN TUN0:</span>
          <span className="text-emerald-400 font-bold">10.10.14.22</span>
        </div>

        <div className="flex items-center space-x-2 pl-3 border-l border-slate-800">
          <span className="text-[10px] text-slate-500 font-bold hidden sm:inline">TARGET BOX:</span>
          <select
            value={activeMachineId}
            onChange={(e) => {
              soundManager.playKey();
              setActiveMachine(e.target.value);
            }}
            className="bg-slate-900 border border-slate-800 text-xs font-bold text-slate-100 rounded px-2.5 py-1 outline-none focus:border-emerald-500 cursor-pointer"
          >
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.ip}) [{m.difficulty}]
              </option>
            ))}
          </select>
        </div>

        <span className="text-[10px] text-slate-500 hidden md:inline">
          OS: <strong className="text-slate-300">{activeMachine.os}</strong>
        </span>
      </div>

      {/* Right Controls: Score, Flags, Sound, CRT, Submit */}
      <div className="flex items-center space-x-2.5">
        {/* CRT Scanline Toggle */}
        <button
          onClick={() => {
            soundManager.playKey();
            onToggleCrt();
          }}
          className={`p-1.5 rounded border text-xs transition flex items-center gap-1 ${
            crtActive
              ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
          title="Toggle CRT Retro Scanline Shader"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="text-[9px] hidden lg:inline">CRT FX</span>
        </button>

        {/* Audio Toggle */}
        <button
          onClick={handleToggleMute}
          className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          )}
        </button>

        {/* Score Badge */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400 text-[10px]">PTS:</span>
          <span className="text-amber-400 font-bold">{score}</span>
        </div>

        {/* Rank Badge */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-cyan-300 font-bold">{rank}</span>
        </div>

        {/* Submit Flag Button */}
        <button
          onClick={() => {
            soundManager.playKey();
            onOpenFlagModal();
          }}
          className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded text-xs transition shadow-lg shadow-emerald-950/40"
        >
          <Flag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SUBMIT FLAG</span>
        </button>
      </div>
    </header>
  );
};
