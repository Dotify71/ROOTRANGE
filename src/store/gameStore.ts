import { create } from 'zustand';
import { TargetMachine, FlagSubmissionResult, NetworkNode } from '../types';
import { SimulationEngine } from '../simulation/simulationEngine';
import { EvidenceItem, SimulationEvent } from '../simulation/types';
import { AchievementDefinition, RootrangeSaveState } from '../types/progression';
import { BASE_ACHIEVEMENTS, AchievementRegistry } from '../services/achievementRegistry';
import { FlagRegistry } from '../services/flagRegistry';
import { ProgressionCalculator, RANK_TIERS } from '../services/progressionCalculator';
import { PersistenceService } from '../services/persistenceService';

export { RANK_TIERS as RANKS };

export interface GameState {
  score: number;
  rank: string;
  activeMachineId: string;
  machines: TargetMachine[];
  networkNodes: NetworkNode[];
  claimedFlags: string[];
  events: SimulationEvent[];
  evidence: EvidenceItem[];
  achievements: AchievementDefinition[];
  unlockedAchievements: string[];

  // Actions
  setActiveMachine: (id: string) => void;
  submitFlag: (flag: string, expectedMachineId?: string) => FlagSubmissionResult;
  updateCompromiseLevel: (machineId: string, level: 'RECON' | 'USER' | 'ROOT') => void;
  resetMachine: (machineId: string) => void;
  resetGame: () => void;
  exportState: () => RootrangeSaveState;
  importState: (state: unknown) => boolean;
  hydrateFromPersistence: () => Promise<void>;
  evaluateAchievements: () => void;
}

export const INITIAL_MACHINES: TargetMachine[] = [
  {
    id: 'ecorp-hr',
    name: 'E-Corp HR Portal',
    ip: '10.10.11.45',
    os: 'Linux',
    difficulty: 'Easy',
    points: { user: 20, root: 30 },
    ports: [
      { port: 22, service: 'ssh', version: 'OpenSSH 8.9p1 Ubuntu', state: 'open' },
      { port: 80, service: 'http', version: 'Apache/2.4.49 (Log4j / Spring)', state: 'open', banner: 'HTTP/1.1 200 OK - E-Corp Employee Portal' },
      { port: 8080, service: 'http-proxy', version: 'JNDI / LDAP Injection Endpoint', state: 'open' },
    ],
    description: 'Internal human resources payroll application running on an unpatched Linux container with Log4j remote code execution and sudo privilege escalation.',
    cves: ['CVE-2021-44228 (Log4j)', 'GTFOBins /usr/bin/find'],
    userFlag: 'ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}',
    rootFlag: 'ROOTRANGE{r00t_pr1v3sc_m4st3r_c0mpr0m1s3}',
    userClaimed: false,
    rootClaimed: false,
    compromiseLevel: 'NONE',
    webEndpoint: 'http://10.10.11.45:80',
  },
  {
    id: 'iron-vault',
    name: 'IronBank Vault',
    ip: '10.10.11.82',
    os: 'Linux',
    difficulty: 'Medium',
    points: { user: 25, root: 35 },
    ports: [
      { port: 22, service: 'ssh', version: 'OpenSSH 8.4p1 Debian', state: 'open' },
      { port: 8080, service: 'http', version: 'Node.js / Express JWT Auth', state: 'open' },
      { port: 3306, service: 'mysql', version: 'MySQL 8.0.28', state: 'open' },
    ],
    description: 'Financial ledger API vulnerable to SQL injection authentication bypass, forged JWT token privilege escalation, and root cronjob hijacking.',
    cves: ['CWE-89 (SQLi Auth Bypass)', 'CWE-347 (JWT Alg None)'],
    userFlag: 'ROOTRANGE{u53r_jwt_f0rg3ry_b4nk_l00t}',
    rootFlag: 'ROOTRANGE{r00t_cr0n_ov3rwr1t3_pwn4g3}',
    userClaimed: false,
    rootClaimed: false,
    compromiseLevel: 'NONE',
    webEndpoint: 'http://10.10.11.82:8080',
  },
  {
    id: 'corp-dc01',
    name: 'Corp-DC01',
    ip: '10.10.11.99',
    os: 'ActiveDirectory',
    difficulty: 'Hard',
    points: { user: 30, root: 40 },
    ports: [
      { port: 53, service: 'domain', version: 'Simple DNS Plus', state: 'open' },
      { port: 88, service: 'kerberos-sec', version: 'Microsoft Windows Kerberos', state: 'open' },
      { port: 445, service: 'microsoft-ds', version: 'Windows Server 2019 SMB', state: 'open' },
      { port: 389, service: 'ldap', version: 'Microsoft Windows Active Directory LDAP', state: 'open' },
    ],
    description: 'Enterprise Windows Domain Controller vulnerable to SMB relay, Kerberoasting, and domain admin ticket hijacking via Mimikatz.',
    cves: ['CVE-2020-1472 (ZeroLogon)', 'MS17-010 (EternalBlue)'],
    userFlag: 'ROOTRANGE{u53r_k3rb3r04st_t1ck3t_h4sh}',
    rootFlag: 'ROOTRANGE{r00t_d0m41n_4dm1n_g0d_m0d3}',
    userClaimed: false,
    rootClaimed: false,
    compromiseLevel: 'NONE',
  },
];

export const INITIAL_NETWORK_NODES: NetworkNode[] = [
  { id: 'gw', label: '10.10.10.1', ip: '10.10.10.1', subnet: 'Perimeter Gateway', type: 'gateway', status: 'discovered' },
  { id: 'ecorp-hr', label: 'E-Corp HR (10.10.11.45)', ip: '10.10.11.45', subnet: 'DMZ Subnet', type: 'target', status: 'discovered', parentId: 'gw' },
  { id: 'pivot-router', label: 'Pivot Router (10.10.12.1)', ip: '10.10.12.1', subnet: 'Internal Transit', type: 'pivot', status: 'locked', parentId: 'ecorp-hr' },
  { id: 'iron-vault', label: 'IronBank API (10.10.11.82)', ip: '10.10.11.82', subnet: 'Internal Services', type: 'target', status: 'locked', parentId: 'pivot-router' },
  { id: 'corp-dc01', label: 'OmniCorp DC01 (10.10.11.99)', ip: '10.10.11.99', subnet: 'Core AD Forest', type: 'dc', status: 'locked', parentId: 'iron-vault' },
];

export const useGameStore = create<GameState>((set, get) => {
  const engine = SimulationEngine.getInstance();

  // Sync simulation events to game store
  engine.subscribe((event) => {
    set((state) => {
      const updatedEvents = [...state.events, event];
      const updatedEvidence = engine.getEvidence();

      let updatedMachines = state.machines;
      let updatedNodes = state.networkNodes;

      if (event.type === 'INITIAL_ACCESS_GRANTED' || event.type === 'SESSION_ESTABLISHED') {
        updatedMachines = state.machines.map((m) =>
          m.id === event.machineId && m.compromiseLevel === 'NONE' ? { ...m, compromiseLevel: 'USER' } : m
        );
        updatedNodes = state.networkNodes.map((n) => {
          if (n.id === event.machineId && n.status !== 'root') return { ...n, status: 'user' };
          if (event.machineId === 'ecorp-hr' && (n.id === 'pivot-router' || n.id === 'iron-vault') && n.status === 'locked') {
            return { ...n, status: 'discovered' };
          }
          if (event.machineId === 'iron-vault' && n.id === 'corp-dc01' && n.status === 'locked') {
            return { ...n, status: 'discovered' };
          }
          return n;
        });
      } else if (event.type === 'PRIVILEGE_ESCALATED' || event.type === 'MACHINE_COMPROMISED') {
        updatedMachines = state.machines.map((m) =>
          m.id === event.machineId ? { ...m, compromiseLevel: 'ROOT' } : m
        );
        updatedNodes = state.networkNodes.map((n) => {
          if (n.id === event.machineId) return { ...n, status: 'root' };
          if (event.machineId === 'ecorp-hr' && (n.id === 'pivot-router' || n.id === 'iron-vault') && n.status === 'locked') {
            return { ...n, status: 'discovered' };
          }
          if (event.machineId === 'iron-vault' && n.id === 'corp-dc01' && n.status === 'locked') {
            return { ...n, status: 'discovered' };
          }
          return n;
        });
      } else if (event.type === 'NETWORK_ROUTE_DISCOVERED') {
        updatedNodes = state.networkNodes.map((n) => {
          if (event.machineId === 'ecorp-hr' && (n.id === 'pivot-router' || n.id === 'iron-vault') && n.status === 'locked') {
            return { ...n, status: 'discovered' };
          }
          if (event.machineId === 'iron-vault' && n.id === 'corp-dc01' && n.status === 'locked') {
            return { ...n, status: 'discovered' };
          }
          return n;
        });
      } else if (event.type === 'SERVICE_DISCOVERED') {
        updatedNodes = state.networkNodes.map((n) =>
          n.id === event.machineId && n.status === 'locked' ? { ...n, status: 'discovered' } : n
        );
      }

      // Check achievements after relevant events
      const { updatedAchievements, newlyUnlocked } = AchievementRegistry.evaluateAll(
        {
          score: state.score,
          claimedFlags: state.claimedFlags,
          machines: updatedMachines,
          events: updatedEvents,
          engine,
        },
        new Set(state.unlockedAchievements)
      );

      const newUnlockedIds = [...state.unlockedAchievements, ...newlyUnlocked.map((a) => a.id)];

      // Persist asynchronously
      PersistenceService.saveState({
        version: 1,
        timestamp: Date.now(),
        score: state.score,
        rank: state.rank,
        claimedFlags: state.claimedFlags,
        unlockedAchievements: newUnlockedIds,
        activeMachineId: state.activeMachineId,
        machines: updatedMachines.map((m) => ({
          id: m.id,
          compromiseLevel: m.compromiseLevel,
          userClaimed: m.userClaimed,
          rootClaimed: m.rootClaimed,
        })),
        evidence: updatedEvidence,
        events: updatedEvents,
      }).catch(() => {});

      return {
        events: updatedEvents,
        evidence: updatedEvidence,
        machines: updatedMachines,
        networkNodes: updatedNodes,
        achievements: updatedAchievements,
        unlockedAchievements: newUnlockedIds,
      };
    });
  });

  return {
    score: 0,
    rank: 'Script Kiddie',
    activeMachineId: 'ecorp-hr',
    machines: INITIAL_MACHINES,
    networkNodes: INITIAL_NETWORK_NODES,
    claimedFlags: [],
    events: [],
    evidence: [],
    achievements: BASE_ACHIEVEMENTS,
    unlockedAchievements: [],

    setActiveMachine: (id: string) => {
      engine.setActiveMachineId(id);
      set({ activeMachineId: id });
    },

    updateCompromiseLevel: (machineId: string, level: 'RECON' | 'USER' | 'ROOT') => {
      engine.setMachineCompromiseLevel(machineId, level);

      set((state) => {
        const updatedMachines = state.machines.map((m) => {
          if (m.id === machineId) {
            return { ...m, compromiseLevel: level };
          }
          return m;
        });

        const updatedNodes = state.networkNodes.map((n) => {
          if (n.id === machineId) {
            const status = level === 'ROOT' ? 'root' : level === 'USER' ? 'user' : 'discovered';
            return { ...n, status: status as NetworkNode['status'] };
          }
          return n;
        });

        return { machines: updatedMachines, networkNodes: updatedNodes };
      });
    },

    submitFlag: (rawFlag: string, expectedMachineId?: string): FlagSubmissionResult => {
      const trimmed = rawFlag.trim();
      const { claimedFlags, machines, score, unlockedAchievements, events } = get();

      // 1. Prevent duplicate claims
      if (claimedFlags.includes(trimmed)) {
        return {
          success: false,
          message: 'Flag has already been submitted and claimed!',
          pointsAwarded: 0,
        };
      }

      // 2. Verify with FlagRegistry or machines
      const regVerification = FlagRegistry.verifyFlag(trimmed, expectedMachineId);
      let flagDef = regVerification.flagDef;

      let matchedMachine = machines.find(
        (m) => m.userFlag === trimmed || m.rootFlag === trimmed
      );

      if (!flagDef && matchedMachine) {
        const isRoot = matchedMachine.rootFlag === trimmed;
        flagDef = {
          id: `flag-${matchedMachine.id}-${isRoot ? 'root' : 'user'}`,
          flag: trimmed,
          machineId: matchedMachine.id,
          type: isRoot ? 'root' : 'user',
          title: `${matchedMachine.name} ${isRoot ? 'Root' : 'User'} Flag`,
          description: `Captured from ${matchedMachine.name}`,
          points: isRoot ? matchedMachine.points.root : matchedMachine.points.user,
        };
      }

      if (!flagDef) {
        return {
          success: false,
          message: 'Invalid flag token. Verify format ROOTRANGE{...} and try again.',
          pointsAwarded: 0,
        };
      }

      // 3. Mark in simulation engine
      engine.claimFlag(trimmed);

      const points = flagDef.points;
      const newScore = score + points;
      const newRank = ProgressionCalculator.calculateRank(newScore).title;
      const newClaimedFlags = [...claimedFlags, trimmed];

      // Update machine flags if applicable
      const updatedMachines: TargetMachine[] = machines.map((m) => {
        if (flagDef && m.id === flagDef.machineId) {
          if (flagDef.type === 'user') {
            return {
              ...m,
              userClaimed: true,
              compromiseLevel: (m.compromiseLevel === 'ROOT' ? 'ROOT' : 'USER') as TargetMachine['compromiseLevel'],
            };
          }
          if (flagDef.type === 'root') {
            return {
              ...m,
              rootClaimed: true,
              compromiseLevel: 'ROOT' as TargetMachine['compromiseLevel'],
            };
          }
        }
        return m;
      });

      // Update network nodes
      const updatedNodes = get().networkNodes.map((n) => {
        if (flagDef && n.id === flagDef.machineId) {
          if (flagDef.type === 'root') return { ...n, status: 'root' as const };
          if (flagDef.type === 'user' && n.status !== 'root') return { ...n, status: 'user' as const };
        }
        return n;
      });

      // Emit event
      engine.emitEvent(
        'FLAG_CAPTURED',
        flagDef.machineId || 'global',
        { flag: trimmed, type: flagDef.type, points, title: flagDef.title },
        `${flagDef.title} captured! (+${points} PTS)`,
        0
      );

      // 4. Evaluate achievements
      const { updatedAchievements, newlyUnlocked } = AchievementRegistry.evaluateAll(
        {
          score: newScore,
          claimedFlags: newClaimedFlags,
          machines: updatedMachines,
          events: [...events, {
            id: `flag-evt-${Date.now()}`,
            timestamp: Date.now(),
            type: 'FLAG_CAPTURED',
            machineId: flagDef.machineId || 'global',
            payload: { flag: trimmed, points },
            description: `${flagDef.title} captured!`,
            xpAwarded: points,
          }],
          engine,
        },
        new Set(unlockedAchievements)
      );

      const newUnlockedIds = [...unlockedAchievements, ...newlyUnlocked.map((a) => a.id)];

      // 5. Update state
      set({
        score: newScore,
        rank: newRank,
        claimedFlags: newClaimedFlags,
        machines: updatedMachines,
        networkNodes: updatedNodes,
        achievements: updatedAchievements,
        unlockedAchievements: newUnlockedIds,
      });

      // 6. Persist to storage
      PersistenceService.saveState({
        version: 1,
        timestamp: Date.now(),
        score: newScore,
        rank: newRank,
        claimedFlags: newClaimedFlags,
        unlockedAchievements: newUnlockedIds,
        activeMachineId: get().activeMachineId,
        machines: updatedMachines.map((m) => ({
          id: m.id,
          compromiseLevel: m.compromiseLevel,
          userClaimed: m.userClaimed,
          rootClaimed: m.rootClaimed,
        })),
        evidence: engine.getEvidence(),
        events: get().events,
      }).catch(() => {});

      const targetName = matchedMachine?.name || (flagDef.machineId ? flagDef.machineId.toUpperCase() : 'ROOTRANGE');

      return {
        success: true,
        message: `${flagDef.title} Captured! +${points} PTS`,
        pointsAwarded: points,
        flagType: flagDef.type,
        machineName: targetName,
      };
    },

    evaluateAchievements: () => {
      const state = get();
      const { updatedAchievements, newlyUnlocked } = AchievementRegistry.evaluateAll(
        {
          score: state.score,
          claimedFlags: state.claimedFlags,
          machines: state.machines,
          events: state.events,
          engine,
        },
        new Set(state.unlockedAchievements)
      );

      if (newlyUnlocked.length > 0) {
        const newIds = [...state.unlockedAchievements, ...newlyUnlocked.map((a) => a.id)];
        set({
          achievements: updatedAchievements,
          unlockedAchievements: newIds,
        });
      }
    },

    resetMachine: (machineId: string) => {
      engine.resetMachine(machineId);
      const original = INITIAL_MACHINES.find((m) => m.id === machineId);
      if (!original) return;

      const origNode = INITIAL_NETWORK_NODES.find((n) => n.id === machineId);

      set((state) => {
        const updatedMachines = state.machines.map((m) =>
          m.id === machineId ? { ...original } : m
        );
        const updatedNodes = state.networkNodes.map((n) =>
          n.id === machineId ? { ...n, status: origNode ? origNode.status : 'discovered' } : n
        );

        // Remove claimed flags for this machine
        const updatedClaimedFlags = state.claimedFlags.filter((f) => {
          const def = FlagRegistry.getFlagByValue(f);
          return !def || def.machineId !== machineId;
        });

        // Recalculate score from remaining flags
        const newScore = updatedClaimedFlags.reduce((acc, f) => {
          const def = FlagRegistry.getFlagByValue(f);
          return acc + (def ? def.points : 20);
        }, 0);

        const newRank = ProgressionCalculator.calculateRank(newScore).title;

        PersistenceService.saveState({
          version: 1,
          timestamp: Date.now(),
          score: newScore,
          rank: newRank,
          claimedFlags: updatedClaimedFlags,
          unlockedAchievements: state.unlockedAchievements,
          activeMachineId: state.activeMachineId,
          machines: updatedMachines.map((m) => ({
            id: m.id,
            compromiseLevel: m.compromiseLevel,
            userClaimed: m.userClaimed,
            rootClaimed: m.rootClaimed,
          })),
          evidence: engine.getEvidence(),
          events: state.events,
        }).catch(() => {});

        return {
          score: newScore,
          rank: newRank,
          claimedFlags: updatedClaimedFlags,
          machines: updatedMachines,
          networkNodes: updatedNodes,
        };
      });
    },

    resetGame: () => {
      engine.resetRange();
      PersistenceService.clearState().catch(() => {});

      set({
        score: 0,
        rank: 'Script Kiddie',
        activeMachineId: 'ecorp-hr',
        machines: INITIAL_MACHINES.map((m) => ({ ...m })),
        networkNodes: INITIAL_NETWORK_NODES.map((n) => ({ ...n })),
        claimedFlags: [],
        events: [],
        evidence: [],
        achievements: BASE_ACHIEVEMENTS.map((a) => ({ ...a, unlocked: false })),
        unlockedAchievements: [],
      });
    },

    exportState: (): RootrangeSaveState => {
      const state = get();
      return {
        version: 1,
        timestamp: Date.now(),
        score: state.score,
        rank: state.rank,
        claimedFlags: [...state.claimedFlags],
        unlockedAchievements: [...state.unlockedAchievements],
        activeMachineId: state.activeMachineId,
        machines: state.machines.map((m) => ({
          id: m.id,
          compromiseLevel: m.compromiseLevel,
          userClaimed: m.userClaimed,
          rootClaimed: m.rootClaimed,
        })),
        evidence: [...state.evidence],
        events: [...state.events],
      };
    },

    importState: (data: unknown): boolean => {
      const validation = PersistenceService.validateSaveState(data);
      if (!validation.valid || !validation.validatedState) {
        console.error('[gameStore] importState validation failed:', validation.error);
        return false;
      }

      const validState = validation.validatedState;

      // Update simulation engine
      const legacyState = {
        version: 1,
        timestamp: validState.timestamp,
        score: validState.score,
        evidence: validState.evidence,
        events: validState.events,
        activeSessions: [],
        discoveredSubnets: ['Perimeter Gateway', 'DMZ Subnet'],
        machines: validState.machines.map((m) => ({
          id: m.id,
          compromiseLevel: m.compromiseLevel,
          userClaimed: m.userClaimed,
          rootClaimed: m.rootClaimed,
          discoveredPorts: [],
          discoveredRoutes: [],
          completedObjectives: [],
        })),
      };

      engine.importState(legacyState);

      // Reconcile machines
      const restoredMachines = INITIAL_MACHINES.map((init) => {
        const saved = validState.machines.find((m) => m.id === init.id);
        if (saved) {
          return {
            ...init,
            compromiseLevel: saved.compromiseLevel,
            userClaimed: saved.userClaimed,
            rootClaimed: saved.rootClaimed,
          };
        }
        return { ...init };
      });

      // Reconcile network nodes
      const restoredNodes = INITIAL_NETWORK_NODES.map((node) => {
        const saved = validState.machines.find((m) => m.id === node.id);
        if (saved) {
          return {
            ...node,
            status: saved.rootClaimed ? 'root' : saved.userClaimed ? 'user' : node.status,
          };
        }
        return { ...node };
      });

      const restoredRank = ProgressionCalculator.calculateRank(validState.score).title;

      const restoredAchievements = BASE_ACHIEVEMENTS.map((a) => ({
        ...a,
        unlocked: validState.unlockedAchievements.includes(a.id),
      }));

      set({
        score: validState.score,
        rank: restoredRank,
        claimedFlags: validState.claimedFlags,
        unlockedAchievements: validState.unlockedAchievements,
        achievements: restoredAchievements,
        activeMachineId: validState.activeMachineId || 'ecorp-hr',
        machines: restoredMachines,
        networkNodes: restoredNodes,
        evidence: validState.evidence,
        events: validState.events,
      });

      PersistenceService.saveState(validState).catch(() => {});
      return true;
    },

    hydrateFromPersistence: async () => {
      try {
        const saved = await PersistenceService.loadState();
        if (saved) {
          get().importState(saved);
        }
      } catch (err) {
        console.warn('[gameStore] Error during hydration from persistence:', err);
      }
    },
  };
});
