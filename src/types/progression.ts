import { EvidenceItem, SimulationEvent } from '../simulation/types';

export type FlagType = 'user' | 'root' | 'challenge' | 'final';

export interface FlagDefinition {
  id: string;
  flag: string;
  machineId?: string;
  type: FlagType;
  title: string;
  description: string;
  points: number;
}

export type AchievementCategory = 'RECON' | 'EXPLOIT' | 'PRIVESC' | 'DOMAIN' | 'MASTERY';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  points: number;
  category: AchievementCategory;
  iconName: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface RankTier {
  title: string;
  minScore: number;
  badgeColor: string;
  description: string;
}

export interface ProgressionStats {
  currentXp: number;
  currentRank: string;
  nextRank: string | null;
  xpToNextRank: number;
  progressPercent: number;
  totalFlagsCount: number;
  claimedFlagsCount: number;
  userFlagsClaimed: number;
  rootFlagsClaimed: number;
  challengeFlagsClaimed: number;
  finalFlagsClaimed: number;
  rootedMachinesCount: number;
  totalMachinesCount: number;
  unlockedAchievementsCount: number;
  totalAchievementsCount: number;
}

export interface MachineCompletionSummary {
  machineId: string;
  machineName: string;
  userClaimed: boolean;
  rootClaimed: boolean;
  isFullyCompromised: boolean;
  flagsCaptured: number;
  totalFlags: number;
  earnedXp: number;
  totalXp: number;
  cvesExploited: string[];
  completionTimestamp?: number;
}

export interface RootrangeSaveState {
  version: 1;
  timestamp: number;
  score: number;
  rank: string;
  claimedFlags: string[];
  unlockedAchievements: string[];
  activeMachineId: string;
  machines: Array<{
    id: string;
    compromiseLevel: 'NONE' | 'RECON' | 'USER' | 'ROOT';
    userClaimed: boolean;
    rootClaimed: boolean;
  }>;
  evidence: EvidenceItem[];
  events: SimulationEvent[];
}
