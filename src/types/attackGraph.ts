import { Difficulty, MachineOS, TargetPort } from './index';

export type AttackGraphNodeState =
  | 'unknown'
  | 'discovered'
  | 'reachable'
  | 'vulnerable'
  | 'initial-access'
  | 'privileged'
  | 'compromised'
  | 'completed';

export type AttackGraphNodeType = 'gateway' | 'target' | 'pivot' | 'dc' | 'router';

export interface AttackGraphNodeData {
  id: string;
  name: string;
  hostname: string;
  ip: string;
  displayIp: string;
  displayName: string;
  subnet: string;
  type: AttackGraphNodeType;
  state: AttackGraphNodeState;
  os?: MachineOS | 'RouterOS';
  osVersion?: string;
  difficulty?: Difficulty;
  points?: { user: number; root: number };
  discoveredPorts: TargetPort[];
  totalPortsCount: number;
  knownCves: string[];
  userFlagClaimed: boolean;
  rootFlagClaimed: boolean;
  completedObjectivesCount: number;
  totalObjectivesCount: number;
  isPivot: boolean;
  requiresPivotFrom?: string;
  isTargetedInPwnbox: boolean;
  isFogOfWar: boolean;
  evidenceCount: number;
  description?: string;
}

export interface AttackGraphEdgeData {
  id: string;
  source: string;
  target: string;
  label?: string;
  protocol?: string;
  isUnlocked: boolean;
  isCompromised: boolean;
}
