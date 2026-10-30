import { CompromiseLevel, Difficulty, MachineOS, TargetPort } from '../types';

export type SimulationEventType =
  | 'SERVICE_DISCOVERED'
  | 'DIRECTORY_DISCOVERED'
  | 'VULNERABILITY_IDENTIFIED'
  | 'CREDENTIAL_DISCOVERED'
  | 'INITIAL_ACCESS_GRANTED'
  | 'SESSION_ESTABLISHED'
  | 'PRIVILEGE_ESCALATED'
  | 'MACHINE_COMPROMISED'
  | 'NETWORK_ROUTE_DISCOVERED'
  | 'FLAG_CAPTURED'
  | 'CHALLENGE_COMPLETED'
  | 'ACHIEVEMENT_UNLOCKED';

export interface SimulationEvent<T = Record<string, unknown>> {
  id: string;
  type: SimulationEventType;
  timestamp: number;
  machineId: string;
  objectiveId?: string;
  xpAwarded: number;
  payload: T;
  description: string;
}

export interface VirtualNetworkInterface {
  name: string;        // e.g. 'eth0', 'tun0'
  ip: string;
  netmask: string;
  mac: string;
  isUp: boolean;
  rxBytes?: number;
  txBytes?: number;
}

export interface VirtualSubnet {
  id: string;
  name: string;
  cidr: string;
  gatewayIp: string;
  isDirectlyAccessible: boolean;
  requiredPivotMachineId?: string;
}

export interface VirtualRoute {
  destination: string;
  gateway: string;
  netmask: string;
  interface: string;
}

export interface VirtualProcess {
  pid: number;
  ppid: number;
  user: string;
  cpu: number;
  mem: number;
  stat: string;
  command: string;
  port?: number;
}

export interface WebRoute {
  path: string;
  methods: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'PATCH')[];
  statusCode: number;
  contentType: string;
  responseBody: string;
  headers?: Record<string, string>;
  handler?: (req: {
    method: string;
    path: string;
    headers: Record<string, string>;
    body?: string;
    queryParams?: Record<string, string>;
  }) => {
    statusCode: number;
    contentType: string;
    body: string;
    headers?: Record<string, string>;
    triggerEvent?: { type: SimulationEventType; payload: Record<string, unknown>; xp: number };
  };
}

export interface ChallengeObjective {
  id: string;
  title: string;
  description: string;
  prerequisites: string[]; // IDs of required previous objectives
  completed: boolean;
  xp: number;
  category: 'RECON' | 'ENUMERATION' | 'EXPLOITATION' | 'PRIVESC' | 'POST_EXPLOIT';
}

export interface EvidenceItem {
  id: string;
  machineId: string;
  type: 'CREDENTIAL' | 'FLAG' | 'HASH' | 'JWT' | 'LOG' | 'EXPLOIT_PAYLOAD' | 'VULNERABILITY' | 'NETWORK';
  name: string;
  source: string;
  value: string;
  description: string;
  discoveredAt: number;
}

export interface VirtualUser {
  username: string;
  uid: number;
  gid: number;
  home: string;
  shell: string;
  password?: string;
  groups: string[];
  sudoPermissions?: string[]; // e.g. ['(ALL : ALL) NOPASSWD: /usr/bin/find']
  sshKeyAuthorized?: boolean;
}

export interface ActiveSession {
  id: string;
  machineId: string;
  type: 'SSH' | 'REVERSE_SHELL' | 'LOCAL';
  user: string;
  uid: number;
  gid: number;
  cwd: string;
  env: Record<string, string>;
  startedAt: number;
}

export interface SimulatedMachineConfig {
  id: string;
  name: string;
  hostname: string;
  ip: string;
  subnetId: string;
  os: MachineOS;
  osVersion: string;
  difficulty: Difficulty;
  points: { user: number; root: number };
  description: string;
  cves: string[];
  interfaces: VirtualNetworkInterface[];
  ports: TargetPort[];
  webRoutes?: WebRoute[];
  users: VirtualUser[];
  processes: VirtualProcess[];
  objectives: ChallengeObjective[];
  userFlag: string;
  rootFlag: string;
  initialCompromiseLevel: CompromiseLevel;
}

export interface SerializedSimulationState {
  version: number;
  timestamp: number;
  machines: {
    id: string;
    compromiseLevel: CompromiseLevel;
    userClaimed: boolean;
    rootClaimed: boolean;
    discoveredPorts: number[];
    discoveredRoutes: string[];
    completedObjectives: string[];
  }[];
  evidence: EvidenceItem[];
  events: SimulationEvent[];
  activeSessions: ActiveSession[];
  discoveredSubnets: string[];
  score: number;
}
