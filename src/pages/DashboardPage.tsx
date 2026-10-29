import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Terminal,
  Server,
  Network,
  Globe,
  Bot,
  Shield,
  Trophy,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../audio/soundManager';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { score, rank, machines, claimedFlags } = useGameStore();

  const totalPoints = machines.reduce((acc, m) => acc + m.points.user + m.points.root, 0);

  const handleNavigate = (path: string) => {
    soundManager.playKey();
    navigate(path);
  };

  return (
    <div className="h-full overflow-y-auto space-y-4 p-4 font-mono text-xs select-none">
      {/* Welcome Banner */}
      <div className="bg-[#0e131e] border border-slate-800 rounded-xl p-5 flex items-center justify-between shadow-xl relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
              SYSTEM STATUS: READY
            </span>
            <span className="text-slate-500 text-[10px]">LOCAL KALI PWNBOX ENGINE // x86_64</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-wider">
            ROOTRANGE // OFFENSIVE CYBER WORKSTATION
          </h1>
          <p className="text-slate-400 max-w-2xl text-xs leading-relaxed">
            Welcome to the open-source penetration testing battleground. Select an active target, fuzz endpoints in the HTTP Repeater, inspect the multi-subnet attack graph, or launch your Pwnbox terminal.
          </p>
        </div>

        <div className="hidden lg:flex items-center space-x-3 z-10">
          <button
            onClick={() => handleNavigate('/range')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs transition shadow-lg shadow-emerald-950/40"
          >
            <Terminal className="w-4 h-4" />
            <span>LAUNCH PWNBOX</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#0c1017] border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-slate-500 text-[10px] block font-bold">CURRENT SCORE</span>
          <div className="text-xl font-bold text-amber-400 flex items-center gap-1.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>{score} / {totalPoints} PTS</span>
          </div>
          <span className="text-[10px] text-slate-500">Global range standing</span>
        </div>

        <div className="bg-[#0c1017] border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-slate-500 text-[10px] block font-bold">OPERATIVE RANK</span>
          <div className="text-xl font-bold text-emerald-400 flex items-center gap-1.5">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>{rank}</span>
          </div>
          <span className="text-[10px] text-slate-500">Tier progression active</span>
        </div>

        <div className="bg-[#0c1017] border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-slate-500 text-[10px] block font-bold">TARGET MACHINES</span>
          <div className="text-xl font-bold text-cyan-400 flex items-center gap-1.5">
            <Server className="w-5 h-5 text-cyan-400" />
            <span>{machines.length} SIMULATED</span>
          </div>
          <span className="text-[10px] text-slate-500">Linux, Windows, AD Forest</span>
        </div>

        <div className="bg-[#0c1017] border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-slate-500 text-[10px] block font-bold">FLAGS CAPTURED</span>
          <div className="text-xl font-bold text-purple-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-purple-400" />
            <span>{claimedFlags.length} / {machines.length * 2}</span>
          </div>
          <span className="text-[10px] text-slate-500">User & Root hashes claimed</span>
        </div>
      </div>

      {/* Target Machines Laboratory Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-slate-400 font-bold text-xs border-b border-slate-800/80 pb-2">
          <span>ACTIVE SIMULATED TARGET RANGE</span>
          <button
            onClick={() => handleNavigate('/machines')}
            className="text-cyan-400 hover:text-white flex items-center gap-1 text-[11px]"
          >
            <span>VIEW ALL MACHINES</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {machines.map((machine) => {
            const isRooted = machine.rootClaimed;
            const isUser = machine.userClaimed;

            return (
              <div
                key={machine.id}
                className="bg-[#0c1017] border border-slate-800 p-4 rounded-xl flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-400 font-bold">
                      {machine.os}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        machine.difficulty === 'Easy'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          : machine.difficulty === 'Medium'
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                          : 'bg-red-950/80 text-red-400 border border-red-800/60'
                      }`}
                    >
                      {machine.difficulty}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white mb-1">{machine.name}</h3>
                  <div className="text-emerald-400 font-mono text-[11px] mb-2">{machine.ip}</div>
                  <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed mb-3">
                    {machine.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] ${isUser ? 'text-emerald-400' : 'text-slate-600'}`}>
                      USER [{isUser ? '✓' : '—'}]
                    </span>
                    <span className={`text-[10px] ${isRooted ? 'text-red-400 font-bold' : 'text-slate-600'}`}>
                      ROOT [{isRooted ? '✓' : '—'}]
                    </span>
                  </div>

                  <button
                    onClick={() => handleNavigate('/range')}
                    className="text-xs text-cyan-400 hover:text-white font-bold flex items-center gap-1"
                  >
                    <span>ATTACK</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Access Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        <button
          onClick={() => handleNavigate('/graph')}
          className="p-4 rounded-xl bg-[#0a0f17] border border-slate-800 hover:border-emerald-500/50 text-left transition space-y-1.5"
        >
          <Network className="w-5 h-5 text-emerald-400 mb-1" />
          <div className="font-bold text-white text-xs">BloodHound Attack Graph</div>
          <p className="text-slate-500 text-[11px]">Inspect Active Directory domain trusts, perimeter DMZs, and pivoting pathways.</p>
        </button>

        <button
          onClick={() => handleNavigate('/repeater')}
          className="p-4 rounded-xl bg-[#0a0f17] border border-slate-800 hover:border-cyan-500/50 text-left transition space-y-1.5"
        >
          <Globe className="w-5 h-5 text-cyan-400 mb-1" />
          <div className="font-bold text-white text-xs">HTTP Web Repeater</div>
          <p className="text-slate-500 text-[11px]">Fuzz web headers, inject Log4j JNDI referral strings, and test SQL injection payloads.</p>
        </button>

        <button
          onClick={() => handleNavigate('/ai')}
          className="p-4 rounded-xl bg-[#0a0f17] border border-slate-800 hover:border-purple-500/50 text-left transition space-y-1.5"
        >
          <Bot className="w-5 h-5 text-purple-400 mb-1" />
          <div className="font-bold text-white text-xs">GhostOps AI Copilot</div>
          <p className="text-slate-500 text-[11px]">Obtain progressive Socratic hints and craft tailored reverse shells.</p>
        </button>
      </div>
    </div>
  );
};
