import { Node, Edge, MarkerType } from 'reactflow';
import { SimulationEngine } from './simulationEngine';
import { useGameStore } from '../store/gameStore';
import { AttackGraphNodeData, AttackGraphNodeState } from '../types/attackGraph';

export interface TopologyBuildOptions {
  searchQuery?: string;
  stateFilter?: string; // 'ALL' | 'UNKNOWN' | 'REACHABLE' | 'VULNERABLE' | 'INITIAL_ACCESS' | 'PRIVILEGED' | 'COMPROMISED' | 'COMPLETED'
  instructorMode?: boolean; // If true, reveals fog-of-war for debugging/instructor demo
}

export interface AttackGraphTopologyResult {
  nodes: Node<AttackGraphNodeData>[];
  edges: Edge[];
  stats: {
    total: number;
    unknown: number;
    discovered: number;
    reachable: number;
    vulnerable: number;
    initialAccess: number;
    privileged: number;
    compromised: number;
    completed: number;
  };
}

/**
 * Pure deterministic derivation function:
 * Converts SimulationEngine state + configured machines into typed React Flow nodes & edges.
 */
export function buildAttackGraphTopology(
  engine: SimulationEngine,
  options: TopologyBuildOptions = {}
): AttackGraphTopologyResult {
  const { searchQuery = '', stateFilter = 'ALL', instructorMode = false } = options;
  const activeMachineId = engine.getActiveMachineId();
  const allEvidence = engine.getEvidence();
  const engineClaimed = engine.getClaimedFlags();
  let storeClaimed: string[] = [];
  try {
    storeClaimed = useGameStore.getState().claimedFlags || [];
  } catch {
    // In environments where store is uninitialized
  }
  const claimedFlags = Array.from(new Set([...engineClaimed, ...storeClaimed]));

  // Track counts across all 8 states
  const stats = {
    total: 0,
    unknown: 0,
    discovered: 0,
    reachable: 0,
    vulnerable: 0,
    initialAccess: 0,
    privileged: 0,
    compromised: 0,
    completed: 0,
  };

  const nodes: Node<AttackGraphNodeData>[] = [];
  const edges: Edge[] = [];

  // --- 1. Perimeter Gateway Node ---
  const gwState: AttackGraphNodeState = 'reachable';
  stats.total++;
  stats.reachable++;

  nodes.push({
    id: 'gw',
    type: 'attackNode',
    position: { x: 50, y: 220 },
    data: {
      id: 'gw',
      name: 'Perimeter Gateway Router',
      hostname: 'edge-gw-01',
      ip: '10.10.10.1',
      displayIp: '10.10.10.1',
      displayName: 'Perimeter Gateway',
      subnet: 'Perimeter Gateway (10.10.10.0/24)',
      type: 'gateway',
      state: gwState,
      os: 'RouterOS',
      osVersion: 'EdgeOS v2.0.9 (Ingress NAT)',
      discoveredPorts: [
        { port: 22, service: 'ssh', version: 'OpenSSH (Perimeter Management)', state: 'open' },
        { port: 80, service: 'http', version: 'Router Ingress WebGUI', state: 'open' },
      ],
      totalPortsCount: 2,
      knownCves: [],
      userFlagClaimed: false,
      rootFlagClaimed: false,
      completedObjectivesCount: 0,
      totalObjectivesCount: 0,
      isPivot: false,
      isTargetedInPwnbox: activeMachineId === 'gw',
      isFogOfWar: false,
      evidenceCount: 0,
      description: 'Perimeter routing gateway providing external entry point and NAT translation to the corporate DMZ.',
    },
  });

  // --- 2. DMZ Server: E-Corp HR Portal ---
  const ecorpConfig = engine.getMachine('ecorp-hr');
  const ecorpCompLevel = engine.getMachineCompromiseLevel('ecorp-hr');
  const ecorpDiscoveredPorts = engine.getDiscoveredPorts('ecorp-hr');
  const ecorpObjectives = engine.getObjectives('ecorp-hr');
  const ecorpUserClaimed = ecorpConfig ? claimedFlags.includes(ecorpConfig.userFlag) : false;
  const ecorpRootClaimed = ecorpConfig ? claimedFlags.includes(ecorpConfig.rootFlag) : false;
  const ecorpCompletedCount = ecorpObjectives.filter((o) => o.completed).length;

  let ecorpState: AttackGraphNodeState = 'reachable';
  if (ecorpObjectives.length > 0 && ecorpObjectives.every((o) => o.completed) && ecorpUserClaimed && ecorpRootClaimed) {
    ecorpState = 'completed';
  } else if (ecorpCompLevel === 'ROOT' || ecorpRootClaimed) {
    ecorpState = 'compromised';
  } else if (ecorpObjectives.some((o) => o.category === 'PRIVESC' && o.completed)) {
    ecorpState = 'privileged';
  } else if (ecorpCompLevel === 'USER' || ecorpUserClaimed || ecorpObjectives.some((o) => o.id === 'ecorp-obj-3' && o.completed)) {
    ecorpState = 'initial-access';
  } else if (ecorpDiscoveredPorts.length > 0 && ecorpObjectives.some((o) => o.completed)) {
    ecorpState = 'vulnerable';
  } else if (ecorpDiscoveredPorts.length > 0) {
    ecorpState = 'discovered';
  }

  incrementStats(stats, ecorpState);

  const ecorpKnownPorts = (ecorpConfig?.ports || []).filter((p) => ecorpDiscoveredPorts.includes(p.port));

  nodes.push({
    id: 'ecorp-hr',
    type: 'attackNode',
    position: { x: 400, y: 220 },
    data: {
      id: 'ecorp-hr',
      name: ecorpConfig?.name || 'E-Corp HR Portal',
      hostname: ecorpConfig?.hostname || 'ecorp-hr',
      ip: ecorpConfig?.ip || '10.10.11.45',
      displayIp: ecorpConfig?.ip || '10.10.11.45',
      displayName: ecorpConfig?.name || 'E-Corp HR Portal',
      subnet: 'Corporate DMZ Subnet (10.10.11.0/24)',
      type: 'target',
      state: ecorpState,
      os: ecorpConfig?.os || 'Linux',
      osVersion: ecorpConfig?.osVersion,
      difficulty: ecorpConfig?.difficulty,
      points: ecorpConfig?.points,
      discoveredPorts: ecorpKnownPorts,
      totalPortsCount: ecorpConfig?.ports.length || 3,
      knownCves: ecorpState === 'vulnerable' || ecorpState === 'initial-access' || ecorpState === 'privileged' || ecorpState === 'compromised' || ecorpState === 'completed'
        ? ecorpConfig?.cves || []
        : [],
      userFlagClaimed: ecorpUserClaimed,
      rootFlagClaimed: ecorpRootClaimed,
      completedObjectivesCount: ecorpCompletedCount,
      totalObjectivesCount: ecorpObjectives.length,
      isPivot: true,
      isTargetedInPwnbox: activeMachineId === 'ecorp-hr',
      isFogOfWar: false,
      evidenceCount: allEvidence.filter((e) => e.machineId === 'ecorp-hr').length,
      description: ecorpConfig?.description,
    },
  });

  // Edge from GW to E-Corp
  edges.push({
    id: 'edge-gw-ecorp',
    source: 'gw',
    target: 'ecorp-hr',
    animated: true,
    style: { stroke: '#06b6d4', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' },
    label: 'WAN / NAT Ingress',
  });

  // --- 3. Pivot Router Node ---
  const isEcorpFoothold = ecorpState === 'initial-access' || ecorpState === 'privileged' || ecorpState === 'compromised' || ecorpState === 'completed';
  const isPivotRouterUnlocked = isEcorpFoothold || instructorMode;

  let pivotRouterState: AttackGraphNodeState = 'unknown';
  if (!isPivotRouterUnlocked) {
    pivotRouterState = 'unknown';
  } else if (ecorpState === 'compromised' || ecorpState === 'completed') {
    pivotRouterState = 'compromised';
  } else {
    pivotRouterState = 'reachable';
  }

  incrementStats(stats, pivotRouterState);

  nodes.push({
    id: 'pivot-router',
    type: 'attackNode',
    position: { x: 750, y: 220 },
    data: {
      id: 'pivot-router',
      name: isPivotRouterUnlocked ? 'Internal Core Pivot Router' : 'Unknown Pivot Router',
      hostname: isPivotRouterUnlocked ? 'pivot-gw-02' : '?.?.?.?',
      ip: isPivotRouterUnlocked ? '10.10.12.1' : '10.10.?.? [MASKED]',
      displayIp: isPivotRouterUnlocked ? '10.10.12.1' : '10.10.?.? [MASKED]',
      displayName: isPivotRouterUnlocked ? 'Core Pivot Router' : 'Locked Pivot Router',
      subnet: isPivotRouterUnlocked ? 'Internal Banking Subnet (10.10.12.0/24)' : 'Classified Internal Subnet',
      type: 'pivot',
      state: pivotRouterState,
      os: 'RouterOS',
      osVersion: isPivotRouterUnlocked ? 'Cisco IOS-XE (Internal Transit)' : undefined,
      discoveredPorts: isPivotRouterUnlocked
        ? [{ port: 22, service: 'ssh', version: 'OpenSSH (Transit Management)', state: 'open' }]
        : [],
      totalPortsCount: 1,
      knownCves: [],
      userFlagClaimed: false,
      rootFlagClaimed: false,
      completedObjectivesCount: 0,
      totalObjectivesCount: 0,
      isPivot: true,
      requiresPivotFrom: 'ecorp-hr',
      isTargetedInPwnbox: activeMachineId === 'pivot-router',
      isFogOfWar: !isPivotRouterUnlocked,
      evidenceCount: 0,
      description: isPivotRouterUnlocked
        ? 'Internal transit router bridging the DMZ into the isolated financial banking network.'
        : 'Classified internal routing gateway. Penetrate upstream DMZ server to reveal topology.',
    },
  });

  // Edge from E-Corp to Pivot Router
  edges.push({
    id: 'edge-ecorp-pivot',
    source: 'ecorp-hr',
    target: 'pivot-router',
    animated: isPivotRouterUnlocked,
    style: {
      stroke: isPivotRouterUnlocked ? (ecorpState === 'compromised' || ecorpState === 'completed' ? '#10b981' : '#06b6d4') : '#334155',
      strokeWidth: isPivotRouterUnlocked ? 2.5 : 1.5,
      strokeDasharray: isPivotRouterUnlocked ? undefined : '5,5',
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: isPivotRouterUnlocked ? (ecorpState === 'compromised' || ecorpState === 'completed' ? '#10b981' : '#06b6d4') : '#475569',
    },
    label: isPivotRouterUnlocked ? 'DMZ Pivot Tunnel (Active)' : '[PIVOT LOCKED - FOOTHOLD REQUIRED]',
  });

  // --- 4. Internal Server: IronBank Vault ---
  const ironConfig = engine.getMachine('iron-vault');
  const ironCompLevel = engine.getMachineCompromiseLevel('iron-vault');
  const ironDiscoveredPorts = engine.getDiscoveredPorts('iron-vault');
  const ironObjectives = engine.getObjectives('iron-vault');
  const ironUserClaimed = ironConfig ? claimedFlags.includes(ironConfig.userFlag) : false;
  const ironRootClaimed = ironConfig ? claimedFlags.includes(ironConfig.rootFlag) : false;
  const ironCompletedCount = ironObjectives.filter((o) => o.completed).length;

  const isIronUnlocked = isEcorpFoothold || instructorMode;

  let ironState: AttackGraphNodeState = 'unknown';
  if (!isIronUnlocked) {
    ironState = 'unknown';
  } else if (ironObjectives.length > 0 && ironObjectives.every((o) => o.completed) && ironUserClaimed && ironRootClaimed) {
    ironState = 'completed';
  } else if (ironCompLevel === 'ROOT' || ironRootClaimed) {
    ironState = 'compromised';
  } else if (ironObjectives.some((o) => o.id === 'iron-obj-4' && o.completed) || ironObjectives.some((o) => o.category === 'PRIVESC' && o.completed)) {
    ironState = 'privileged';
  } else if (ironCompLevel === 'USER' || ironUserClaimed || ironObjectives.some((o) => (o.id === 'iron-obj-2' || o.id === 'iron-obj-3') && o.completed)) {
    ironState = 'initial-access';
  } else if (ironDiscoveredPorts.length > 0 && ironObjectives.some((o) => o.completed)) {
    ironState = 'vulnerable';
  } else if (ironDiscoveredPorts.length > 0) {
    ironState = 'discovered';
  } else {
    ironState = 'reachable';
  }

  incrementStats(stats, ironState);

  const ironKnownPorts = isIronUnlocked
    ? (ironConfig?.ports || []).filter((p) => ironDiscoveredPorts.includes(p.port))
    : [];

  nodes.push({
    id: 'iron-vault',
    type: 'attackNode',
    position: { x: 1100, y: 140 },
    data: {
      id: 'iron-vault',
      name: isIronUnlocked ? ironConfig?.name || 'IronBank Vault' : 'Internal Banking Vault',
      hostname: isIronUnlocked ? ironConfig?.hostname || 'iron-vault' : '?.?.?.?',
      ip: isIronUnlocked ? ironConfig?.ip || '10.10.11.82' : '10.10.?.? [CLASSIFIED]',
      displayIp: isIronUnlocked ? ironConfig?.ip || '10.10.11.82' : '10.10.?.? [CLASSIFIED]',
      displayName: isIronUnlocked ? ironConfig?.name || 'IronBank Vault' : 'Locked Banking Target',
      subnet: isIronUnlocked ? 'Internal Banking Subnet (10.10.12.0/24)' : 'Classified Internal Subnet',
      type: 'target',
      state: ironState,
      os: isIronUnlocked ? ironConfig?.os || 'Linux' : undefined,
      osVersion: isIronUnlocked ? ironConfig?.osVersion : undefined,
      difficulty: isIronUnlocked ? ironConfig?.difficulty : undefined,
      points: isIronUnlocked ? ironConfig?.points : undefined,
      discoveredPorts: ironKnownPorts,
      totalPortsCount: ironConfig?.ports.length || 3,
      knownCves: isIronUnlocked && (ironState === 'vulnerable' || ironState === 'initial-access' || ironState === 'privileged' || ironState === 'compromised' || ironState === 'completed')
        ? ironConfig?.cves || []
        : [],
      userFlagClaimed: ironUserClaimed,
      rootFlagClaimed: ironRootClaimed,
      completedObjectivesCount: ironCompletedCount,
      totalObjectivesCount: ironObjectives.length,
      isPivot: true,
      requiresPivotFrom: 'ecorp-hr',
      isTargetedInPwnbox: activeMachineId === 'iron-vault',
      isFogOfWar: !isIronUnlocked,
      evidenceCount: allEvidence.filter((e) => e.machineId === 'iron-vault').length,
      description: isIronUnlocked ? ironConfig?.description : 'Hidden internal financial database. Pivot through DMZ to reveal.',
    },
  });

  // Edge from Pivot Router to IronBank Vault
  edges.push({
    id: 'edge-pivot-iron',
    source: 'pivot-router',
    target: 'iron-vault',
    animated: isIronUnlocked,
    style: {
      stroke: isIronUnlocked ? (ironState === 'compromised' || ironState === 'completed' ? '#10b981' : '#06b6d4') : '#334155',
      strokeWidth: isIronUnlocked ? 2.5 : 1.5,
      strokeDasharray: isIronUnlocked ? undefined : '5,5',
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: isIronUnlocked ? (ironState === 'compromised' || ironState === 'completed' ? '#10b981' : '#06b6d4') : '#475569',
    },
    label: isIronUnlocked ? 'VLAN 12 Internal Transit' : '[TRANSIT LOCKED]',
  });

  // --- 5. Active Directory Domain Controller: Corp-DC01 ---
  const dcConfig = engine.getMachine('corp-dc01');
  const dcCompLevel = engine.getMachineCompromiseLevel('corp-dc01');
  const dcDiscoveredPorts = engine.getDiscoveredPorts('corp-dc01');
  const dcObjectives = engine.getObjectives('corp-dc01');
  const dcUserClaimed = dcConfig ? claimedFlags.includes(dcConfig.userFlag) : false;
  const dcRootClaimed = dcConfig ? claimedFlags.includes(dcConfig.rootFlag) : false;
  const dcCompletedCount = dcObjectives.filter((o) => o.completed).length;

  // Corp-DC01 requires foothold on IronBank Vault (or instructor mode)
  const isIronFoothold = ironState === 'initial-access' || ironState === 'privileged' || ironState === 'compromised' || ironState === 'completed';
  const isDcUnlocked = isIronFoothold || instructorMode;

  let dcState: AttackGraphNodeState = 'unknown';
  if (!isDcUnlocked) {
    dcState = 'unknown';
  } else if (dcObjectives.length > 0 && dcObjectives.every((o) => o.completed) && dcUserClaimed && dcRootClaimed) {
    dcState = 'completed';
  } else if (dcCompLevel === 'ROOT' || dcRootClaimed) {
    dcState = 'compromised';
  } else if (dcObjectives.some((o) => o.id === 'dc-obj-4' && o.completed) || dcObjectives.some((o) => o.category === 'PRIVESC' && o.completed)) {
    dcState = 'privileged';
  } else if (dcCompLevel === 'USER' || dcUserClaimed || dcObjectives.some((o) => (o.id === 'dc-obj-2' || o.id === 'dc-obj-3') && o.completed)) {
    dcState = 'initial-access';
  } else if (dcDiscoveredPorts.length > 0 && dcObjectives.some((o) => o.completed)) {
    dcState = 'vulnerable';
  } else if (dcDiscoveredPorts.length > 0) {
    dcState = 'discovered';
  } else {
    dcState = 'reachable';
  }

  incrementStats(stats, dcState);

  const dcKnownPorts = isDcUnlocked
    ? (dcConfig?.ports || []).filter((p) => dcDiscoveredPorts.includes(p.port))
    : [];

  nodes.push({
    id: 'corp-dc01',
    type: 'attackNode',
    position: { x: 1450, y: 220 },
    data: {
      id: 'corp-dc01',
      name: isDcUnlocked ? dcConfig?.name || 'Corp-DC01' : 'Active Directory Domain Controller',
      hostname: isDcUnlocked ? dcConfig?.hostname || 'corp-dc01' : '?.?.?.?',
      ip: isDcUnlocked ? dcConfig?.ip || '10.10.11.99' : '10.10.?.? [CLASSIFIED]',
      displayIp: isDcUnlocked ? dcConfig?.ip || '10.10.11.99' : '10.10.?.? [CLASSIFIED]',
      displayName: isDcUnlocked ? dcConfig?.name || 'Corp-DC01' : 'Core Domain Controller [LOCKED]',
      subnet: isDcUnlocked ? 'Enterprise Active Directory Forest (10.10.13.0/24)' : 'Enterprise AD Forest',
      type: 'dc',
      state: dcState,
      os: isDcUnlocked ? dcConfig?.os || 'ActiveDirectory' : undefined,
      osVersion: isDcUnlocked ? dcConfig?.osVersion : undefined,
      difficulty: isDcUnlocked ? dcConfig?.difficulty : undefined,
      points: isDcUnlocked ? dcConfig?.points : undefined,
      discoveredPorts: dcKnownPorts,
      totalPortsCount: dcConfig?.ports.length || 4,
      knownCves: isDcUnlocked && (dcState === 'vulnerable' || dcState === 'initial-access' || dcState === 'privileged' || dcState === 'compromised' || dcState === 'completed')
        ? dcConfig?.cves || []
        : [],
      userFlagClaimed: dcUserClaimed,
      rootFlagClaimed: dcRootClaimed,
      completedObjectivesCount: dcCompletedCount,
      totalObjectivesCount: dcObjectives.length,
      isPivot: false,
      requiresPivotFrom: 'iron-vault',
      isTargetedInPwnbox: activeMachineId === 'corp-dc01',
      isFogOfWar: !isDcUnlocked,
      evidenceCount: allEvidence.filter((e) => e.machineId === 'corp-dc01').length,
      description: isDcUnlocked ? dcConfig?.description : 'Windows Server 2019 Active Directory Root Forest. Breach internal vault to discover trust credentials.',
    },
  });

  // Edge from IronBank Vault to Corp-DC01
  edges.push({
    id: 'edge-iron-dc01',
    source: 'iron-vault',
    target: 'corp-dc01',
    animated: isDcUnlocked,
    style: {
      stroke: isDcUnlocked ? (dcState === 'compromised' || dcState === 'completed' ? '#10b981' : '#8b5cf6') : '#334155',
      strokeWidth: isDcUnlocked ? 2.5 : 1.5,
      strokeDasharray: isDcUnlocked ? undefined : '5,5',
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: isDcUnlocked ? (dcState === 'compromised' || dcState === 'completed' ? '#10b981' : '#8b5cf6') : '#475569',
    },
    label: isDcUnlocked ? 'Core Forest Trust (Kerberos / LDAP)' : '[FOREST TRUST LOCKED]',
  });

  // --- Filtering & Search Highlight Logic ---
  const query = searchQuery.trim().toLowerCase();

  const filteredNodes = nodes.map((node) => {
    let isMatch = true;

    // Filter by State if not ALL
    if (stateFilter !== 'ALL') {
      const targetState = stateFilter.toLowerCase().replace('_', '-');
      if (node.data.state !== targetState) {
        isMatch = false;
      }
    }

    // Filter by Search Query
    if (query) {
      const matchName = node.data.displayName.toLowerCase().includes(query);
      const matchIp = node.data.displayIp.toLowerCase().includes(query);
      const matchSubnet = node.data.subnet.toLowerCase().includes(query);
      const matchOs = `${node.data.os || ''} ${node.data.osVersion || ''}`.toLowerCase().includes(query);
      const matchState = node.data.state.toLowerCase().includes(query);

      if (!matchName && !matchIp && !matchSubnet && !matchOs && !matchState) {
        isMatch = false;
      }
    }

    return {
      ...node,
      className: isMatch ? 'opacity-100' : 'opacity-25 transition-opacity duration-300',
    };
  });

  return {
    nodes: filteredNodes,
    edges,
    stats,
  };
}

function incrementStats(stats: AttackGraphTopologyResult['stats'], state: AttackGraphNodeState) {
  stats.total++;
  switch (state) {
    case 'unknown':
      stats.unknown++;
      break;
    case 'discovered':
      stats.discovered++;
      break;
    case 'reachable':
      stats.reachable++;
      break;
    case 'vulnerable':
      stats.vulnerable++;
      break;
    case 'initial-access':
      stats.initialAccess++;
      break;
    case 'privileged':
      stats.privileged++;
      break;
    case 'compromised':
      stats.compromised++;
      break;
    case 'completed':
      stats.completed++;
      break;
  }
}
