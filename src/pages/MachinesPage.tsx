import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, ArrowRight, ShieldCheck, Key, Skull } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../audio/soundManager';

export const MachinesPage: React.FC = () => {
  const navigate = useNavigate();
  const { machines, activeMachineId, setActiveMachine } = useGameStore();

  const handleSelectAndLaunch = (id: string) => {
    soundManager.playConnect();
    setActiveMachine(id);
    navigate('/range');
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 font-mono text-xs select-none">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <span>SIMULATED TARGET MACHINES CATALOG</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Select an isolated virtual target to spawn within your local network range.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {machines.map((machine) => {
          const isCurrentActive = activeMachineId === machine.id;

          return (
            <div
              key={machine.id}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all backdrop-blur-md ${
                isCurrentActive
                  ? 'border-emerald-500 bg-[#0e1522] shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  : 'border-slate-800 bg-[#0c1017] hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-300 font-bold">
                    {machine.os}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      machine.difficulty === 'Easy'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : machine.difficulty === 'Medium'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-red-950 text-red-400 border border-red-800'
                    }`}
                  >
                    {machine.difficulty} // {machine.points.user + machine.points.root} PTS
                  </span>
                </div>

                <h2 className="text-base font-bold text-white mb-1">{machine.name}</h2>
                <div className="text-emerald-400 font-mono text-xs mb-3">{machine.ip}</div>
                <p className="text-slate-400 text-xs leading-relaxed mb-4">{machine.description}</p>

                {/* Ports list */}
                <div className="bg-black/40 border border-slate-800/80 rounded-lg p-3 space-y-1.5 mb-4">
                  <span className="text-[10px] text-slate-500 font-bold block">DISCOVERED OPEN PORTS</span>
                  {machine.ports.map((p) => (
                    <div key={p.port} className="flex justify-between text-[11px]">
                      <span className="text-cyan-400 font-bold">{p.port}/TCP</span>
                      <span className="text-slate-300 truncate max-w-[150px]">{p.version}</span>
                    </div>
                  ))}
                </div>

                {/* Flags Claimed Status */}
                <div className="flex items-center space-x-2 text-[11px] mb-4">
                  <div
                    className={`flex-1 p-2 rounded border flex items-center justify-center gap-1.5 ${
                      machine.userClaimed
                        ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300'
                        : 'bg-slate-900/40 border-slate-800 text-slate-600'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>USER [{machine.userClaimed ? 'CLAIMED' : 'LOCKED'}]</span>
                  </div>

                  <div
                    className={`flex-1 p-2 rounded border flex items-center justify-center gap-1.5 ${
                      machine.rootClaimed
                        ? 'bg-red-950/60 border-red-600/60 text-red-300 font-bold'
                        : 'bg-slate-900/40 border-slate-800 text-slate-600'
                    }`}
                  >
                    <Skull className="w-3.5 h-3.5" />
                    <span>ROOT [{machine.rootClaimed ? 'PWNED' : 'LOCKED'}]</span>
                  </div>
                </div>
              </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/machines/${machine.id}`)}
                    className="flex-1 py-2 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-300 transition text-xs font-bold"
                  >
                    BRIEFING
                  </button>

                  <button
                    onClick={() => handleSelectAndLaunch(machine.id)}
                    className={`flex-[2] py-2 rounded font-bold text-xs transition flex items-center justify-center gap-2 ${
                      isCurrentActive
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/60'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-black shadow-lg shadow-emerald-950/40'
                    }`}
                  >
                    {isCurrentActive ? (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>ACTIVE</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        <span>SPAWN</span>
                      </>
                    )}
                  </button>
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
