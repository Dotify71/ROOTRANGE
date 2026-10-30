import React, { useState } from 'react';
import { Terminal, Network, Globe, Bot, Shield, Trophy } from 'lucide-react';
import { PwnboxTerminal } from './components/PwnboxTerminal';
import { useGameStore } from './store/gameStore';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TERMINAL' | 'GRAPH' | 'REPEATER' | 'AI'>('TERMINAL');
  const { score, rank } = useGameStore();

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
        </div>

        {/* Workspace Mode Tabs */}
        <div className="flex items-center space-x-1 bg-[#0a0d14] p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('TERMINAL')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs transition ${
              activeTab === 'TERMINAL' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>PWNBOX</span>
          </button>
          <button
            onClick={() => setActiveTab('GRAPH')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs transition ${
              activeTab === 'GRAPH' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>ATTACK GRAPH</span>
          </button>
          <button
            onClick={() => setActiveTab('REPEATER')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs transition ${
              activeTab === 'REPEATER' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>HTTP REPEATER</span>
          </button>
          <button
            onClick={() => setActiveTab('AI')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs transition ${
              activeTab === 'AI' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span>GHOSTOPS AI</span>
          </button>
        </div>

        {/* User Stats & Rank */}
        <div className="flex items-center space-x-3">
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
      </main>

      {/* Footer Status Bar */}
      <footer className="flex items-center justify-between px-4 py-1.5 bg-[#0a0d14] border-t border-slate-800/80 text-[10px] text-slate-500">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span className="text-emerald-400">PWNBOX: ONLINE (10.10.14.22)</span>
          </span>
          <span>GATEWAY: 10.10.10.1</span>
          <span>VPN: TUN0 CONNECTED</span>
        </div>
        <div>
          <span>ROOTRANGE CORE v1.0.0</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
