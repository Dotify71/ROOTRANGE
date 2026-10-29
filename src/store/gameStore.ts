import { create } from 'zustand';
import { TargetMachine, FlagSubmissionResult, RANKS, NetworkNode } from '../types';
import { SimulationEngine } from '../simulation/simulationEngine';
import { EvidenceItem, SerializedSimulationState, SimulationEvent } from '../simulation/types';

interface GameState {
  score: number;
  rank: string;
  activeMachineId: string;
  machines: TargetMachine[];
  networkNodes: NetworkNode[];
  claimedFlags: string[];
  events: SimulationEvent[];
  evidence: EvidenceItem[];

  // Actions
  setActiveMachine: (id: string) => void;
  submitFlag: (flag: string) => FlagSubmissionResult;
  updateCompromiseLevel: (machineId: string, level: 'RECON' | 'USER' | 'ROOT') => void;
  resetMachine: (machineId: string) => void;
  resetGame: () => void;
  exportState: () => SerializedSimulationState;
  importState: (state: SerializedSimulationState) => boolean;
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
    name: 'IronBank API',
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
    name: 'OmniCorp DC01',
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
  { id: 'iron-vault', label: 'IronBank API (10.10.11.82)', ip: '10.10.11.82', subnet: 'Internal Services', type: 'target', status: 'locked', parentId: 'ecorp-hr' },
  { id: 'corp-dc01', label: 'OmniCorp DC01 (10.10.11.99)', ip: '10.10.11.99', subnet: 'Core AD Forest', type: 'dc', status: 'locked', parentId: 'iron-vault' },
];

export const useGameStore = create<GameState>((set, get) => {
  const engine = SimulationEngine.getInstance();

  // Sync simulation events to game store
  engine.subscribe((event) => {
    set((state) => {
      const updatedEvents = [...state.events, event];
      const updatedEvidence = engine.getEvidence();

      // If event updated machine compromise
      let updatedMachines = state.machines;
      let updatedNodes = state.networkNodes;

      if (event.type === 'INITIAL_ACCESS_GRANTED' || event.type === 'SESSION_ESTABLISHED') {
        updatedMachines = state.machines.map((m) =>
          m.id === event.machineId && m.compromiseLevel === 'NONE' ? { ...m, compromiseLevel: 'USER' } : m
        );
        updatedNodes = state.networkNodes.map((n) =>
          n.id === event.machineId && n.status !== 'root' ? { ...n, status: 'user' } : n
        );
      } else if (event.type === 'PRIVILEGE_ESCALATED' || event.type === 'MACHINE_COMPROMISED') {
        updatedMachines = state.machines.map((m) =>
          m.id === event.machineId ? { ...m, compromiseLevel: 'ROOT' } : m
        );
        updatedNodes = state.networkNodes.map((n) =>
          n.id === event.machineId ? { ...n, status: 'root' } : n
        );
      }

      return {
        events: updatedEvents,
        evidence: updatedEvidence,
        machines: updatedMachines,
        networkNodes: updatedNodes,
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

    setActiveMachine: (id: string) => set({ activeMachineId: id }),

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

    submitFlag: (rawFlag: string): FlagSubmissionResult => {
      const trimmed = rawFlag.trim();
      const { claimedFlags, machines, score } = get();

      if (claimedFlags.includes(trimmed)) {
        return { success: false, message: 'Flag has already been submitted!', pointsAwarded: 0 };
      }

      for (const machine of machines) {
        if (machine.userFlag === trimmed && !machine.userClaimed) {
          const points = machine.points.user;
          const newScore = score + points;
          const newRank = calculateRank(newScore);

          engine.emitEvent(
            'FLAG_CAPTURED',
            machine.id,
            { flag: trimmed, type: 'user', points },
            `User Flag captured on ${machine.name}! (+${points} PTS)`,
            0
          );

          set({
            score: newScore,
            rank: newRank,
            claimedFlags: [...claimedFlags, trimmed],
            machines: machines.map((m) =>
              m.id === machine.id ? { ...m, userClaimed: true, compromiseLevel: m.compromiseLevel === 'ROOT' ? 'ROOT' : 'USER' } : m
            ),
            networkNodes: get().networkNodes.map((n) =>
              n.id === machine.id ? { ...n, status: 'user' } : n
            ),
          });

          return {
            success: true,
            message: `User Flag Captured on ${machine.name}! +${points} PTS`,
            pointsAwarded: points,
            flagType: 'user',
            machineName: machine.name,
          };
        }

        if (machine.rootFlag === trimmed && !machine.rootClaimed) {
          const points = machine.points.root;
          const newScore = score + points;
          const newRank = calculateRank(newScore);

          engine.emitEvent(
            'FLAG_CAPTURED',
            machine.id,
            { flag: trimmed, type: 'root', points },
            `SYSTEM ROOTED! Root Flag captured on ${machine.name}! (+${points} PTS)`,
            0
          );

          set({
            score: newScore,
            rank: newRank,
            claimedFlags: [...claimedFlags, trimmed],
            machines: machines.map((m) =>
              m.id === machine.id ? { ...m, rootClaimed: true, compromiseLevel: 'ROOT' } : m
            ),
            networkNodes: get().networkNodes.map((n) =>
              n.id === machine.id ? { ...n, status: 'root' } : n
            ),
          });

          return {
            success: true,
            message: `SYSTEM ROOTED! Root Flag Captured on ${machine.name}! +${points} PTS`,
            pointsAwarded: points,
            flagType: 'root',
            machineName: machine.name,
          };
        }
      }

      return { success: false, message: 'Invalid flag. Try again.', pointsAwarded: 0 };
    },

    resetMachine: (machineId: string) => {
      engine.resetMachine(machineId);
      const original = INITIAL_MACHINES.find((m) => m.id === machineId);
      if (!original) return;

      set((state) => ({
        machines: state.machines.map((m) => (m.id === machineId ? { ...original } : m)),
        networkNodes: state.networkNodes.map((n) =>
          n.id === machineId ? { ...n, status: 'discovered' } : n
        ),
      }));
    },

    resetGame: () => {
      engine.resetRange();
      set({
        score: 0,
        rank: 'Script Kiddie',
        activeMachineId: 'ecorp-hr',
        machines: INITIAL_MACHINES,
        networkNodes: INITIAL_NETWORK_NODES,
        claimedFlags: [],
        events: [],
        evidence: [],
      });
    },

    exportState: () => {
      return engine.exportState();
    },

    importState: (serializedState: SerializedSimulationState) => {
      const ok = engine.importState(serializedState);
      if (ok) {
        set({
          score: serializedState.score,
          rank: calculateRank(serializedState.score),
          events: serializedState.events,
          evidence: serializedState.evidence,
        });
      }
      return ok;
    },
  };
});

function calculateRank(score: number): string {
  let userRank = RANKS[0].title;
  for (const r of RANKS) {
    if (score >= r.minScore) {
      userRank = r.title;
    }
  }
  return userRank;
}
