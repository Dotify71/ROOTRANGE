import React, { useState } from 'react';
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
  Flag,
  Activity,
  Clock,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../audio/soundManager';
import { ProgressionCalculator } from '../services/progressionCalculator';
import { FlagSubmissionModal } from '../components/FlagSubmissionModal';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { score, machines, claimedFlags, events, achievements } = useGameStore();
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);

  // Derive all metrics dynamically from progression calculator
  const stats = ProgressionCalculator.calculateStats(score, claimedFlags, machines, achievements);

  const handleNavigate = (path: string) => {
    soundManager.playKey();
    navigate(path);
  };

  // Recent 6 events reversed
  const recentEvents = [...events].reverse().slice(0, 6);

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
            onClick={() => setIsFlagModalOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold text-xs transition"
          >
            <Flag className="w-4 h-4 text-amber-400" />
            <span>SUBMIT FLAG</span>
          </button>

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
        {/* Current Score / XP */}
        <div className="bg-[#0c1017] border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-slate-500 text-[10px] block font-bold">CUMULATIVE XP / SCORE</span>
          <div className="text-xl font-bold text-amber-400 flex items-center gap-1.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>{stats.currentXp} PTS</span>
          </div>
          <span className="text-[10px] text-slate-500">
            {stats.nextRank ? `${stats.xpToNextRank} XP to ${stats.nextRank}` : 'Maximum rank achieved'}
          </span>
        </div>

        {/* Operative Rank with Progress Bar */}
        <div className="bg-[#0c1017] border border-slate-800 p-4 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px] block font-bold">OPERATIVE RANK</span>
            <span className="text-[10px] text-emerald-400 font-bold">{stats.progressPercent}%</span>
          </div>
          <div className="text-xl font-bold text-emerald-400 flex items-center gap-1.5">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>{stats.currentRank}</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Target Machines Compromised */}
        <div className="bg-[#0c1017] border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-slate-500 text-[10px] block font-bold">ROOTED MACHINES</span>
          <div className="text-xl font-bold text-cyan-400 flex items-center gap-1.5">
            <Server className="w-5 h-5 text-cyan-400" />
            <span>{stats.rootedMachinesCount} / {stats.totalMachinesCount} ROOTED</span>
          </div>
          <span className="text-[10px] text-slate-500">
            {stats.totalMachinesCount - stats.rootedMachinesCount} targets remaining
          </span>
        </div>

        {/* Flags Captured */}
        <div className="bg-[#0c1017] border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-slate-500 text-[10px] block font-bold">FLAGS CAPTURED</span>
          <div className="text-xl font-bold text-purple-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-purple-400" />
            <span>{stats.claimedFlagsCount} / {stats.totalFlagsCount}</span>
          </div>
          <span className="text-[10px] text-slate-500">
            {stats.userFlagsClaimed} User, {stats.rootFlagsClaimed} Root, {stats.challengeFlagsClaimed} Special
          </span>
        </div>
      </div>

      {/* Main Grid: Target Machines + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Target Machines Laboratory Cards */}
        <div className="lg:col-span-2 space-y-3">
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
                      <span className={`text-[10px] font-bold ${isUser ? 'text-emerald-400' : 'text-slate-600'}`}>
                        USER [{isUser ? '✓' : '—'}]
                      </span>
                      <span className={`text-[10px] font-bold ${isRooted ? 'text-red-400' : 'text-slate-600'}`}>
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

        {/* Right 1 Col: Recent Activity Stream */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-slate-400 font-bold text-xs border-b border-slate-800/80 pb-2">
            <span className="flex items-center gap-1.5 text-white">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>RECENT ACTIVITY</span>
            </span>
            <span className="text-[10px] text-slate-500">{events.length} EVENTS</span>
          </div>

          <div className="bg-[#0c1017] border border-slate-800 rounded-xl p-3 divide-y divide-slate-800/60 space-y-2.5 max-h-[300px] overflow-y-auto">
            {recentEvents.length > 0 ? (
              recentEvents.map((ev) => (
                <div key={ev.id} className="pt-2 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                        ev.type === 'FLAG_CAPTURED'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                          : ev.type === 'ACHIEVEMENT_UNLOCKED'
                          ? 'bg-purple-950/80 text-purple-300 border border-purple-800'
                          : ev.type === 'PRIVILEGE_ESCALATED' || ev.type === 'MACHINE_COMPROMISED'
                          ? 'bg-red-950/80 text-red-300 border border-red-800'
                          : ev.type === 'INITIAL_ACCESS_GRANTED'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                          : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                      }`}
                    >
                      {ev.type}
                    </span>
                    <span className="text-slate-500 text-[10px] flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-slate-300 text-[11px] leading-tight line-clamp-2">
                    {ev.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                    <span>Target: <strong className="text-slate-400">{ev.machineId}</strong></span>
                    {ev.xpAwarded > 0 && (
                      <span className="text-amber-400 font-bold">+{ev.xpAwarded} XP</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-500 text-xs">
                No active events logged yet. Execute scans, launch exploits, or submit flags to start accumulating activity.
              </div>
            )}
          </div>
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

      {/* Flag Submission Modal */}
      <FlagSubmissionModal
        isOpen={isFlagModalOpen}
        onClose={() => setIsFlagModalOpen(false)}
      />
    </div>
  );
};
