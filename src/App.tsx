import React, { useState } from 'react';
import { Terminal, Network, Globe, Bot, Shield, Trophy, Flag, CheckCircle2 } from 'lucide-react';
import { PwnboxTerminal } from './components/PwnboxTerminal';
import { AttackGraph } from './components/AttackGraph';
import { HttpRepeater } from './components/HttpRepeater';
import { GhostOpsAi } from './components/GhostOpsAi';
import { FlagSubmissionModal } from './components/FlagSubmissionModal';
import { useGameStore } from './store/gameStore';
import { soundManager } from './audio/soundManager';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TERMINAL' | 'GRAPH' | 'REPEATER' | 'AI'>('TERMINAL');
  const [isFlagModalOpen, setIsFlagModalOpen] = useState<boolean>(false);
  const { score, rank, activeMachineId, setActiveMachine, machines } = useGameStore();

  const activeMachine = machines.find((m) => m.id === activeMachineId) || machines[0];

  const handleTabChange = (tab: typeof activeTab) => {
    soundManager.playKey();
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0d14] text-slate-200 select-none overflow-hidden font-mono text-xs">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#0f141f] border-b border-slate-800/80 z-20">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-emerald-400 font-extrabold tracking-wider">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span className="text-sm tracking-widest text-white">ROOT<span className="text-emerald-400">RANGE</span></span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold">
            v1.0.0-PRO
          </span>

          {/* Machine Target Selector */}
          <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-slate-800">
            <span className="text-[10px] text-slate-500 font-bold">TARGET:</span>
            <select
              value={activeMachineId}
              onChange={(e) => setActiveMachine(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs font-bold text-white rounded px-2.5 py-1 outline-none focus:border-emerald-500 cursor-pointer"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.ip}) - {m.difficulty}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Workspace Mode Tabs */}
        <div className="flex items-center space-x-1 bg-[#0a0d14] p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => handleTabChange('TERMINAL')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs transition ${
              activeTab === 'TERMINAL' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>PWNBOX</span>
          </button>
          <button
            onClick={() => handleTabChange('GRAPH')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs transition ${
              activeTab === 'GRAPH' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>ATTACK GRAPH</span>
          </button>
          <button
            onClick={() => handleTabChange('REPEATER')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs transition ${
              activeTab === 'REPEATER' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>HTTP REPEATER</span>
          </button>
          <button
            onClick={() => handleTabChange('AI')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs transition ${
              activeTab === 'AI' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span>GHOSTOPS AI</span>
          </button>
        </div>

        {/* User Stats, Flag Submitter & Rank */}
        <div className="flex items-center space-x-3">
          {/* Submit Flag Button */}
          <button
            onClick={() => setIsFlagModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded text-xs transition shadow-lg shadow-emerald-950/40"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>SUBMIT FLAG</span>
          </button>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">SCORE:</span>
            <span className="text-amber-400 font-bold">{score} PTS</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded">
            <span className="text-slate-400">RANK:</span>
            <span className="text-emerald-400 font-bold">{rank}</span>
          </div>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="flex-1 overflow-hidden relative p-2">
        {activeTab === 'TERMINAL' && <PwnboxTerminal />}
        {activeTab === 'GRAPH' && <AttackGraph />}
        {activeTab === 'REPEATER' && <HttpRepeater />}
        {activeTab === 'AI' && <GhostOpsAi />}
      </main>

      {/* Footer Status Bar with Flag Completion Indicators */}
      <footer className="flex items-center justify-between px-4 py-1.5 bg-[#0a0d14] border-t border-slate-800/80 text-[10px] text-slate-500">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span className="text-emerald-400">PWNBOX: ONLINE (10.10.14.22)</span>
          </span>
          <span>GATEWAY: 10.10.10.1</span>
          <span>TUN0: CONNECTED</span>
        </div>

        {/* Machine Flag Badges */}
        <div className="flex items-center space-x-3">
          <span className="text-slate-400 font-bold">{activeMachine.name}:</span>
          <span className={`flex items-center gap-1 ${activeMachine.userClaimed ? 'text-emerald-400' : 'text-slate-600'}`}>
            <CheckCircle2 className="w-3 h-3" /> USER FLAG [{activeMachine.userClaimed ? 'CAPTURED' : 'UNCLAIMED'}]
          </span>
          <span className={`flex items-center gap-1 ${activeMachine.rootClaimed ? 'text-red-400 font-bold' : 'text-slate-600'}`}>
            <CheckCircle2 className="w-3 h-3" /> ROOT FLAG [{activeMachine.rootClaimed ? 'PWNED' : 'UNCLAIMED'}]
          </span>
        </div>
      </footer>

      {/* Flag Submission Modal */}
      <FlagSubmissionModal
        isOpen={isFlagModalOpen}
        onClose={() => setIsFlagModalOpen(false)}
      />
    </div>
  );
};

export default App;
