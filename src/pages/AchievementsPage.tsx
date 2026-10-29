import React from 'react';
import { Award, Trophy, Shield, Skull, Zap } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { RANKS } from '../types';

interface Badge {
  id: string;
  title: string;
  description: string;
  points: number;
  unlocked: boolean;
  category: 'RECON' | 'EXPLOIT' | 'PRIVESC' | 'RANK';
}

export const AchievementsPage: React.FC = () => {
  const { score, rank, claimedFlags, machines } = useGameStore();

  const isUserCompromised = machines.some((m) => m.userClaimed);
  const isRootCompromised = machines.some((m) => m.rootClaimed);
  const allRooted = machines.every((m) => m.rootClaimed);

  const badges: Badge[] = [
    {
      id: 'b1',
      title: 'First Blood (Foothold)',
      description: 'Captured your first user flag on any simulated target container.',
      points: 20,
      unlocked: isUserCompromised || claimedFlags.length > 0,
      category: 'EXPLOIT',
    },
    {
      id: 'b2',
      title: 'Root Commander',
      description: 'Successfully escalated privileges to UID 0 (root) on a target machine.',
      points: 30,
      unlocked: isRootCompromised,
      category: 'PRIVESC',
    },
    {
      id: 'b3',
      title: 'Port Whisperer',
      description: 'Completed comprehensive Nmap reconnaissance and service enumeration.',
      points: 10,
      unlocked: true,
      category: 'RECON',
    },
    {
      id: 'b4',
      title: 'Hacker Elite Tier',
      description: 'Accumulated over 100 points across the cyber range.',
      points: 50,
      unlocked: score >= 105,
      category: 'RANK',
    },
    {
      id: 'b5',
      title: 'Domain Annihilator',
      description: 'Fully rooted all target systems including the Active Directory Domain Controller.',
      points: 100,
      unlocked: allRooted,
      category: 'PRIVESC',
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 font-mono text-xs select-none">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>OPERATIVE BADGES & MILESTONES</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Track your progression across offensive tradecraft and capture-the-flag milestones.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-white font-bold">{score} PTS ACCUMULATED</span>
        </div>
      </div>

      {/* Rank Ladder Progression Bar */}
      <div className="bg-[#0c1017] border border-slate-800 rounded-xl p-4 space-y-3">
        <span className="text-slate-400 font-bold block text-xs">OFFENSIVE RANK LADDER</span>
        <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
          {RANKS.map((r) => {
            const isCurrent = rank === r.title;
            const isPassed = score >= r.minScore;

            return (
              <div
                key={r.title}
                className={`p-2.5 rounded-lg border transition ${
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : isPassed
                    ? 'border-slate-700 bg-slate-900/60 text-slate-300'
                    : 'border-slate-800 bg-[#080c12] text-slate-600'
                }`}
              >
                <div className="truncate font-bold mb-1">{r.title}</div>
                <div className="text-[9px] text-slate-500">{r.minScore} PTS</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {badges.map((b) => (
          <div
            key={b.id}
            className={`p-4 rounded-xl border flex items-start space-x-3 transition ${
              b.unlocked
                ? 'bg-[#0e141f] border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                : 'bg-[#090d14] border-slate-800/80 opacity-60'
            }`}
          >
            <div
              className={`p-2.5 rounded-lg border shrink-0 ${
                b.unlocked
                  ? 'bg-emerald-950/80 border-emerald-600 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-600'
              }`}
            >
              {b.category === 'PRIVESC' ? (
                <Skull className="w-5 h-5" />
              ) : b.category === 'EXPLOIT' ? (
                <Zap className="w-5 h-5" />
              ) : (
                <Shield className="w-5 h-5" />
              )}
            </div>

            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{b.title}</span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                    b.unlocked
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-slate-900 text-slate-600 border border-slate-800'
                  }`}
                >
                  {b.unlocked ? 'UNLOCKED (+ ' + b.points + ' PTS)' : 'LOCKED'}
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{b.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
