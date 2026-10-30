import { TargetMachine } from '../types';
import {
  AchievementDefinition,
  MachineCompletionSummary,
  ProgressionStats,
  RankTier,
} from '../types/progression';
import { ALL_FLAGS, FlagRegistry } from './flagRegistry';

export const RANK_TIERS: RankTier[] = [
  {
    title: 'Script Kiddie',
    minScore: 0,
    badgeColor: 'text-slate-400',
    description: 'Initial entry operative. Basic reconnaissance and exploration.',
  },
  {
    title: 'Hacker',
    minScore: 20,
    badgeColor: 'text-emerald-400',
    description: 'Initial foothold confirmed. Skilled in service enumeration and exploitation.',
  },
  {
    title: 'Pro Hacker',
    minScore: 55,
    badgeColor: 'text-cyan-400',
    description: 'Privilege escalation specialist. Navigating internal networks and databases.',
  },
  {
    title: 'Elite',
    minScore: 105,
    badgeColor: 'text-purple-400',
    description: 'Master offensive technician. Compromising Active Directory forests and pivots.',
  },
  {
    title: 'Omni God',
    minScore: 155,
    badgeColor: 'text-amber-400',
    description: 'Legendary range mastery. 100% full compromise of all infrastructure targets.',
  },
];

export class ProgressionCalculator {
  /**
   * Determine the user's rank tier based on cumulative score.
   */
  public static calculateRank(score: number): RankTier {
    let currentRank = RANK_TIERS[0];
    for (const tier of RANK_TIERS) {
      if (score >= tier.minScore) {
        currentRank = tier;
      }
    }
    return currentRank;
  }

  /**
   * Calculate next rank requirements and percentage completion.
   */
  public static getNextRankInfo(score: number): {
    nextRank: RankTier | null;
    xpNeeded: number;
    progressPercent: number;
  } {
    const currentTier = this.calculateRank(score);
    const currentIndex = RANK_TIERS.findIndex((t) => t.title === currentTier.title);

    if (currentIndex >= RANK_TIERS.length - 1) {
      // Max rank reached
      return {
        nextRank: null,
        xpNeeded: 0,
        progressPercent: 100,
      };
    }

    const nextTier = RANK_TIERS[currentIndex + 1];
    const rangeSpan = nextTier.minScore - currentTier.minScore;
    const currentProgress = score - currentTier.minScore;
    const progressPercent = Math.min(
      100,
      Math.max(0, Math.round((currentProgress / rangeSpan) * 100))
    );
    const xpNeeded = Math.max(0, nextTier.minScore - score);

    return {
      nextRank: nextTier,
      xpNeeded,
      progressPercent,
    };
  }

  /**
   * Derive comprehensive progression stats from store state.
   */
  public static calculateStats(
    score: number,
    claimedFlags: string[],
    machines: TargetMachine[],
    achievements: AchievementDefinition[]
  ): ProgressionStats {
    const currentRank = this.calculateRank(score);
    const { nextRank, xpNeeded, progressPercent } = this.getNextRankInfo(score);

    const claimedFlagDefs = claimedFlags
      .map((f) => FlagRegistry.getFlagByValue(f))
      .filter((f): f is NonNullable<typeof f> => Boolean(f));

    const userFlagsClaimed = claimedFlagDefs.filter((f) => f.type === 'user').length;
    const rootFlagsClaimed = claimedFlagDefs.filter((f) => f.type === 'root').length;
    const challengeFlagsClaimed = claimedFlagDefs.filter((f) => f.type === 'challenge').length;
    const finalFlagsClaimed = claimedFlagDefs.filter((f) => f.type === 'final').length;

    const rootedMachinesCount = machines.filter((m) => m.rootClaimed).length;
    const unlockedAchievementsCount = achievements.filter((a) => a.unlocked).length;

    return {
      currentXp: score,
      currentRank: currentRank.title,
      nextRank: nextRank ? nextRank.title : null,
      xpToNextRank: xpNeeded,
      progressPercent,
      totalFlagsCount: ALL_FLAGS.length,
      claimedFlagsCount: claimedFlags.length,
      userFlagsClaimed,
      rootFlagsClaimed,
      challengeFlagsClaimed,
      finalFlagsClaimed,
      rootedMachinesCount,
      totalMachinesCount: machines.length,
      unlockedAchievementsCount,
      totalAchievementsCount: achievements.length,
    };
  }

  /**
   * Calculate completion summary for an individual machine.
   */
  public static calculateMachineSummary(
    machine: TargetMachine,
    claimedFlags: string[]
  ): MachineCompletionSummary {
    const machineFlags = FlagRegistry.getFlagsForMachine(machine.id);
    const capturedMachineFlags = machineFlags.filter((f) => claimedFlags.includes(f.flag));

    const earnedXp = capturedMachineFlags.reduce((acc, f) => acc + f.points, 0);
    const totalXp = machineFlags.reduce((acc, f) => acc + f.points, 0);

    const isFullyCompromised = machine.userClaimed && machine.rootClaimed;

    return {
      machineId: machine.id,
      machineName: machine.name,
      userClaimed: machine.userClaimed,
      rootClaimed: machine.rootClaimed,
      isFullyCompromised,
      flagsCaptured: capturedMachineFlags.length,
      totalFlags: machineFlags.length,
      earnedXp,
      totalXp,
      cvesExploited: machine.cves || [],
    };
  }
}
