import React, { useState } from 'react';
import {
  Award,
  Trophy,
  Flame,
  Radar,
  Globe,
  TrendingUp,
  Network,
  Terminal,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { RANK_TIERS, ProgressionCalculator } from '../services/progressionCalculator';

export const AchievementsPage: React.FC = () => {
  const { score, rank, achievements, claimedFlags, machines } = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const stats = ProgressionCalculator.calculateStats(score, claimedFlags, machines, achievements);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-5 h-5 text-amber-400" />;
      case 'Radar':
        return <Radar className="w-5 h-5 text-cyan-400" />;
      case 'Globe':
        return <Globe className="w-5 h-5 text-emerald-400" />;
      case 'TrendingUp':
        return <TrendingUp className="w-5 h-5 text-purple-400" />;
      case 'Network':
        return <Network className="w-5 h-5 text-blue-400" />;
      case 'Terminal':
        return <Terminal className="w-5 h-5 text-emerald-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5 text-red-400" />;
      case 'Trophy':
      default:
        return <Trophy className="w-5 h-5 text-amber-400" />;
    }
  };

  const filteredAchievements = achievements.filter((a) => {
    if (selectedCategory === 'ALL') return true;
    return a.category === selectedCategory;
  });

  const categories: Array<{ id: string; label: string }> = [
    { id: 'ALL', label: 'All Achievements' },
    { id: 'EXPLOIT', label: 'Exploitation' },
    { id: 'PRIVESC', label: 'Privilege Escalation' },
    { id: 'RECON', label: 'Reconnaissance' },
    { id: 'DOMAIN', label: 'Active Directory' },
    { id: 'MASTERY', label: 'Mastery' },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 font-mono text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>OPERATIVE BADGES & MILESTONES</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Track offensive milestones, privilege escalations, and tactical tradecraft verified by the simulation engine.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-400 font-bold flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{score} XP TOTAL</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{stats.unlockedAchievementsCount} / {achievements.length} UNLOCKED</span>
          </div>
        </div>
      </div>

      {/* Rank Ladder Progression Bar */}
      <div className="bg-[#0c1017] border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-bold block text-xs">OPERATIVE RANK LADDER</span>
          <span className="text-[11px] text-slate-500">
            Current Tier: <strong className="text-emerald-400">{rank}</strong> ({score} XP)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-[10px]">
          {RANK_TIERS.map((tier, idx) => {
            const isCurrent = rank === tier.title;
            const isPassed = score >= tier.minScore;

            return (
              <div
                key={tier.title}
                className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                    : isPassed
                    ? 'border-slate-700 bg-slate-900/60 text-slate-300'
                    : 'border-slate-800 bg-[#080c12] text-slate-600'
                }`}
              >
                <div>
                  <div className="text-[10px] text-slate-500 mb-1">TIER {idx + 1}</div>
                  <div className={`font-bold text-xs mb-1 ${isCurrent ? 'text-emerald-400' : isPassed ? 'text-white' : 'text-slate-500'}`}>
                    {tier.title}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight mb-2">
                    {tier.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 font-bold flex items-center justify-between text-[10px]">
                  <span>{tier.minScore}+ XP</span>
                  <span>{isPassed ? (isCurrent ? 'ACTIVE' : 'ACHIEVED') : 'LOCKED'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800/80">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Achievements Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredAchievements.map((badge) => {
          return (
            <div
              key={badge.id}
              className={`p-4 rounded-xl border transition flex items-start space-x-3.5 relative ${
                badge.unlocked
                  ? 'bg-[#0c1017] border-slate-700 hover:border-emerald-500/60'
                  : 'bg-[#080c12] border-slate-800/80 opacity-70'
              }`}
            >
              <div
                className={`p-2.5 rounded-lg border shrink-0 ${
                  badge.unlocked
                    ? 'bg-emerald-950/40 border-emerald-700/50'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                {badge.unlocked ? getIcon(badge.iconName) : <Lock className="w-5 h-5 text-slate-600" />}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className={`font-bold text-xs ${badge.unlocked ? 'text-white' : 'text-slate-400'}`}>
                    {badge.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60 font-bold">
                      +{badge.points} XP
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {badge.category}
                    </span>
                  </div>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed">
                  {badge.description}
                </p>

                <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Requirement: Event/State Driven</span>
                  <span className={`font-bold flex items-center gap-1 ${badge.unlocked ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {badge.unlocked ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>UNLOCKED</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-slate-600" />
                        <span>LOCKED</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
