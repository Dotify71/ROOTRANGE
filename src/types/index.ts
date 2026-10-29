export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Insane';
export type MachineOS = 'Linux' | 'Windows' | 'ActiveDirectory';
export type CompromiseLevel = 'NONE' | 'RECON' | 'USER' | 'ROOT';

export interface TargetPort {
  port: number;
  service: string;
  version: string;
  state: 'open' | 'closed' | 'filtered';
  banner?: string;
}

export interface TargetMachine {
  id: string;
  name: string;
  ip: string;
  os: MachineOS;
  difficulty: Difficulty;
  points: { user: number; root: number };
  ports: TargetPort[];
  description: string;
  cves: string[];
  userFlag: string;
  rootFlag: string;
  userClaimed: boolean;
  rootClaimed: boolean;
  compromiseLevel: CompromiseLevel;
  webEndpoint?: string;
}

export interface NetworkNode {
  id: string;
  label: string;
  ip: string;
  subnet: string;
  type: 'gateway' | 'target' | 'pivot' | 'dc';
  status: 'locked' | 'discovered' | 'user' | 'root';
  parentId?: string;
}

export interface FlagSubmissionResult {
  success: boolean;
  message: string;
  pointsAwarded: number;
  flagType?: 'user' | 'root';
  machineName?: string;
}

export interface UserRank {
  title: 'Script Kiddie' | 'Hacker' | 'Pro Hacker' | 'Elite' | 'Omni God';
  minScore: number;
  badgeColor: string;
}

export const RANKS: UserRank[] = [
  { title: 'Script Kiddie', minScore: 0, badgeColor: 'text-slate-400' },
  { title: 'Hacker', minScore: 20, badgeColor: 'text-emerald-400' },
  { title: 'Pro Hacker', minScore: 55, badgeColor: 'text-cyan-400' },
  { title: 'Elite', minScore: 105, badgeColor: 'text-purple-400' },
  { title: 'Omni God', minScore: 155, badgeColor: 'text-amber-400' },
];
