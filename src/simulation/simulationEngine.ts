import { CompromiseLevel } from '../types';
import {
  ActiveSession,
  ChallengeObjective,
  EvidenceItem,
  SerializedSimulationState,
  SimulatedMachineConfig,
  SimulationEvent,
  SimulationEventType,
  VirtualProcess,
  VirtualSubnet,
  WebRoute,
} from './types';
import { SIMULATED_MACHINES, SIMULATED_SUBNETS } from './machineDefinitions';

export type SimulationEventListener = (event: SimulationEvent) => void;

export class SimulationEngine {
  private static instance: SimulationEngine;

  private subnets: VirtualSubnet[] = [];
  private machines: Map<string, SimulatedMachineConfig> = new Map();
  private machineCompromiseLevels: Map<string, CompromiseLevel> = new Map();
  private discoveredPorts: Map<string, Set<number>> = new Map();
  private discoveredRoutes: Map<string, Set<string>> = new Map();
  private completedObjectives: Set<string> = new Set();
  private evidence: EvidenceItem[] = [];
  private events: SimulationEvent[] = [];
  private activeSessions: Map<string, ActiveSession> = new Map();
  private listeners: Set<SimulationEventListener> = new Set();
  private score: number = 0;
  private claimedFlags: Set<string> = new Set();
  private activeMachineId?: string;

  private constructor() {
    this.resetRange();
  }

  public static getInstance(): SimulationEngine {
    if (!SimulationEngine.instance) {
      SimulationEngine.instance = new SimulationEngine();
    }
    return SimulationEngine.instance;
  }

  private cloneMachineConfig(m: SimulatedMachineConfig): SimulatedMachineConfig {
    return {
      ...m,
      interfaces: JSON.parse(JSON.stringify(m.interfaces)),
      ports: JSON.parse(JSON.stringify(m.ports)),
      users: JSON.parse(JSON.stringify(m.users)),
      processes: JSON.parse(JSON.stringify(m.processes)),
      objectives: JSON.parse(JSON.stringify(m.objectives)),
      webRoutes: m.webRoutes ? m.webRoutes.map((r) => ({ ...r })) : undefined,
    };
  }

  /**
   * Reset the entire cyber range simulation to pristine initial state
   */
  public resetRange(): void {
    this.subnets = JSON.parse(JSON.stringify(SIMULATED_SUBNETS));
    this.machines.clear();
    this.machineCompromiseLevels.clear();
    this.discoveredPorts.clear();
    this.discoveredRoutes.clear();
    this.completedObjectives.clear();
    this.evidence = [];
    this.events = [];
    this.activeSessions.clear();
    this.score = 0;
    this.claimedFlags.clear();
    this.activeMachineId = undefined;

    for (const m of SIMULATED_MACHINES) {
      const cloned = this.cloneMachineConfig(m);
      this.machines.set(cloned.id, cloned);
      this.machineCompromiseLevels.set(cloned.id, cloned.initialCompromiseLevel);
      this.discoveredPorts.set(cloned.id, new Set());
      this.discoveredRoutes.set(cloned.id, new Set(['/']));
    }
  }

  /**
   * Reset a specific machine back to pristine initial state
   */
  public resetMachine(machineId: string): boolean {
    const original = SIMULATED_MACHINES.find((m) => m.id === machineId);
    if (!original) return false;

    const cloned = this.cloneMachineConfig(original);
    this.machines.set(cloned.id, cloned);
    this.machineCompromiseLevels.set(cloned.id, cloned.initialCompromiseLevel);
    this.discoveredPorts.set(cloned.id, new Set());
    this.discoveredRoutes.set(cloned.id, new Set(['/']));

    // Remove active sessions for this machine
    for (const [sId, sess] of this.activeSessions.entries()) {
      if (sess.machineId === machineId) {
        this.activeSessions.delete(sId);
      }
    }

    // Unmark objectives for this machine
    for (const obj of cloned.objectives) {
      this.completedObjectives.delete(obj.id);
    }

    // Remove claimed flags for this machine
    this.claimedFlags.delete(cloned.userFlag);
    this.claimedFlags.delete(cloned.rootFlag);

    return true;
  }

  // --- Subscriptions & Events ---

  public subscribe(listener: SimulationEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public emitEvent<T = Record<string, unknown>>(
    type: SimulationEventType,
    machineId: string,
    payload: T,
    description: string,
    xpAwarded: number = 0,
    objectiveId?: string
  ): SimulationEvent<T> {
    const event: SimulationEvent<T> = {
      id: 'evt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      type,
      timestamp: Date.now(),
      machineId,
      objectiveId,
      xpAwarded,
      payload,
      description,
    };

    this.events.push(event as SimulationEvent);
    this.score += xpAwarded;

    // Update compromise level on specific events
    if (type === 'INITIAL_ACCESS_GRANTED' || type === 'SESSION_ESTABLISHED') {
      const current = this.machineCompromiseLevels.get(machineId) || 'NONE';
      if (current === 'NONE' || current === 'RECON') {
        this.setMachineCompromiseLevel(machineId, 'USER');
      }
    } else if (type === 'FLAG_CAPTURED' && (payload as Record<string, unknown>)?.type === 'root') {
      this.setMachineCompromiseLevel(machineId, 'ROOT');
    } else if (type === 'SERVICE_DISCOVERED') {
      const current = this.machineCompromiseLevels.get(machineId) || 'NONE';
      if (current === 'NONE') {
        this.setMachineCompromiseLevel(machineId, 'RECON');
      }
    }

    // Notify listeners
    this.listeners.forEach((listener) => {
      try {
        listener(event as SimulationEvent);
      } catch (err) {
        console.error('Error in simulation event listener:', err);
      }
    });

    return event;
  }

  // --- Machine & Network Queries ---

  public getMachines(): SimulatedMachineConfig[] {
    return Array.from(this.machines.values());
  }

  public getMachine(idOrIp: string): SimulatedMachineConfig | undefined {
    return (
      this.machines.get(idOrIp) ||
      Array.from(this.machines.values()).find((m) => m.ip === idOrIp || m.hostname === idOrIp)
    );
  }

  public setActiveMachineId(id: string | undefined): void {
    this.activeMachineId = id;
  }

  public getActiveMachineId(): string | undefined {
    return this.activeMachineId;
  }

  public getSubnets(): VirtualSubnet[] {
    return this.subnets;
  }

  public getMachineCompromiseLevel(machineId: string): CompromiseLevel {
    return this.machineCompromiseLevels.get(machineId) || 'NONE';
  }

  public setMachineCompromiseLevel(machineId: string, level: CompromiseLevel): void {
    const previous = this.machineCompromiseLevels.get(machineId);
    if (previous === level) return;
    this.machineCompromiseLevels.set(machineId, level);

    if (previous !== level) {
      this.emitEvent(
        level === 'ROOT' ? 'MACHINE_COMPROMISED' : 'PRIVILEGE_ESCALATED',
        machineId,
        { previousLevel: previous, newLevel: level },
        `Machine ${machineId} compromise level updated to ${level}`,
        level === 'ROOT' ? 40 : 20
      );

      // Pivot route discovery on USER or ROOT
      if (level === 'USER' || level === 'ROOT') {
        for (const subnet of this.subnets) {
          if (subnet.requiredPivotMachineId === machineId) {
            this.emitEvent(
              'NETWORK_ROUTE_DISCOVERED',
              machineId,
              { subnetId: subnet.id, subnetCidr: subnet.cidr, gatewayIp: subnet.gatewayIp },
              `Pivot route unlocked: Subnet ${subnet.name} (${subnet.cidr}) is now reachable via ${machineId}!`,
              15
            );
          }
        }
      }
    }
  }

  /**
   * Determine whether a network IP is reachable from source (e.g. attacker 10.10.14.22)
   * Enforces realistic pivot prerequisites.
   */
  public canReachIp(targetIp: string, sourceIp: string = '10.10.14.22'): { reachable: boolean; reason?: string } {
    if (targetIp === sourceIp || targetIp === '127.0.0.1') {
      return { reachable: true };
    }

    const targetMachine = this.getMachine(targetIp);
    if (!targetMachine) {
      return { reachable: false, reason: `Destination host unreachable: No route to host (${targetIp})` };
    }

    // Direct access if this machine is currently selected as active target in pwnbox
    if (this.activeMachineId && (targetMachine.id === this.activeMachineId || targetMachine.ip === this.activeMachineId)) {
      return { reachable: true };
    }

    const subnet = this.subnets.find((s) => s.id === targetMachine.subnetId);
    if (!subnet) {
      return { reachable: false, reason: `Unknown subnet for target IP ${targetIp}` };
    }

    // Direct access to perimeter and DMZ
    if (subnet.isDirectlyAccessible) {
      return { reachable: true };
    }

    // Pivoting required
    if (subnet.requiredPivotMachineId) {
      const pivotCompromise = this.getMachineCompromiseLevel(subnet.requiredPivotMachineId);
      if (pivotCompromise === 'USER' || pivotCompromise === 'ROOT') {
        return { reachable: true };
      }
      return {
        reachable: false,
        reason: `Target subnet ${subnet.name} (${subnet.cidr}) is isolated. Requires an initial foothold on pivot host '${subnet.requiredPivotMachineId}'.`,
      };
    }

    return { reachable: true };
  }

  // --- Service Discovery ---

  public discoverPort(machineId: string, portNumber: number): boolean {
    const ports = this.discoveredPorts.get(machineId);
    if (!ports) return false;

    if (!ports.has(portNumber)) {
      ports.add(portNumber);
      const machine = this.machines.get(machineId);
      const portInfo = machine?.ports.find((p) => p.port === portNumber);
      this.emitEvent(
        'SERVICE_DISCOVERED',
        machineId,
        { port: portNumber, service: portInfo?.service, banner: portInfo?.banner },
        `Service discovered on ${machine?.name || machineId}: port ${portNumber}/${portInfo?.service || 'tcp'}`,
        5
      );
      return true;
    }
    return false;
  }

  public getDiscoveredPorts(machineId: string): number[] {
    return Array.from(this.discoveredPorts.get(machineId) || []);
  }

  public getDiscoveredRoutes(machineId: string): string[] {
    return Array.from(this.discoveredRoutes.get(machineId) || []);
  }

  public getCompletedObjectives(machineId?: string): string[] {
    if (machineId) {
      const machine = this.machines.get(machineId);
      if (!machine) return [];
      return machine.objectives.filter((o) => this.completedObjectives.has(o.id)).map((o) => o.id);
    }
    return Array.from(this.completedObjectives);
  }

  // --- Web Route Discovery & Execution ---

  public discoverRoute(machineId: string, path: string): boolean {
    const routes = this.discoveredRoutes.get(machineId);
    if (!routes) return false;

    if (!routes.has(path)) {
      routes.add(path);
      this.emitEvent(
        'DIRECTORY_DISCOVERED',
        machineId,
        { path },
        `Directory route discovered: ${path}`,
        5
      );
      return true;
    }
    return false;
  }

  public handleHttpRequest(
    targetIp: string,
    req: { method: string; path: string; headers: Record<string, string>; body?: string }
  ): { statusCode: number; contentType: string; body: string; headers: Record<string, string> } {
    const reachableCheck = this.canReachIp(targetIp);
    if (!reachableCheck.reachable) {
      return {
        statusCode: 504,
        contentType: 'text/plain',
        body: `504 Gateway Timeout: ${reachableCheck.reason}`,
        headers: {},
      };
    }

    const machine = this.getMachine(targetIp);
    if (!machine || !machine.webRoutes) {
      return {
        statusCode: 502,
        contentType: 'text/plain',
        body: '502 Bad Gateway: Connection refused to port 80/tcp',
        headers: {},
      };
    }

    // Record route as discovered
    this.discoverRoute(machine.id, req.path);

    // Match route
    const route = machine.webRoutes.find(
      (r) => r.path === req.path && r.methods.includes(req.method.toUpperCase() as WebRoute['methods'][number])
    );

    if (!route) {
      return {
        statusCode: 404,
        contentType: 'text/html',
        body: `<!DOCTYPE html><html><body><h1>404 Not Found</h1><p>The requested URL ${req.path} was not found on this server.</p></body></html>`,
        headers: { Server: 'Apache/2.4.49' },
      };
    }

    if (route.handler) {
      const result = route.handler({
        method: req.method,
        path: req.path,
        headers: req.headers,
        body: req.body,
      });

      if (result.triggerEvent) {
        this.emitEvent(
          result.triggerEvent.type,
          machine.id,
          result.triggerEvent.payload,
          `HTTP Trigger: ${result.triggerEvent.type} on ${req.path}`,
          result.triggerEvent.xp
        );
      }

      return {
        statusCode: result.statusCode,
        contentType: result.contentType,
        body: result.body,
        headers: { ...(route.headers || {}), ...(result.headers || {}) },
      };
    }

    return {
      statusCode: route.statusCode,
      contentType: route.contentType,
      body: route.responseBody,
      headers: route.headers || { Server: 'Apache/2.4.49' },
    };
  }

  // --- Objectives & Prerequisites ---

  public getObjectives(machineId: string): ChallengeObjective[] {
    const machine = this.machines.get(machineId);
    if (!machine) return [];

    return machine.objectives.map((obj) => ({
      ...obj,
      completed: this.completedObjectives.has(obj.id),
    }));
  }

  public isObjectiveUnlocked(objectiveId: string): boolean {
    for (const machine of this.machines.values()) {
      const targetObj = machine.objectives.find((o) => o.id === objectiveId);
      if (targetObj) {
        return targetObj.prerequisites.every((prereqId) => this.completedObjectives.has(prereqId));
      }
    }
    return false;
  }

  public completeObjective(
    machineId: string,
    objectiveId: string
  ): { success: boolean; event?: SimulationEvent; error?: string } {
    const machine = this.machines.get(machineId);
    if (!machine) return { success: false, error: `Machine ${machineId} not found` };

    const objective = machine.objectives.find((o) => o.id === objectiveId);
    if (!objective) return { success: false, error: `Objective ${objectiveId} not found` };

    if (this.completedObjectives.has(objectiveId)) {
      return { success: false, error: `Objective '${objective.title}' already completed` };
    }

    // Check prerequisites
    const unmet = objective.prerequisites.filter((p) => !this.completedObjectives.has(p));
    if (unmet.length > 0) {
      return {
        success: false,
        error: `Prerequisite objectives must be completed first: [${unmet.join(', ')}]`,
      };
    }

    this.completedObjectives.add(objectiveId);

    const event = this.emitEvent(
      'CHALLENGE_COMPLETED',
      machineId,
      { objectiveId, title: objective.title },
      `Completed Objective: ${objective.title}`,
      objective.xp,
      objectiveId
    );

    return { success: true, event };
  }

  // --- Evidence & Inventory ---

  public addEvidence(evidenceData: Omit<EvidenceItem, 'id' | 'discoveredAt'>): EvidenceItem {
    const existing = this.evidence.find(
      (e) => e.machineId === evidenceData.machineId && e.value === evidenceData.value
    );
    if (existing) return existing;

    const item: EvidenceItem = {
      ...evidenceData,
      id: 'ev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      discoveredAt: Date.now(),
    };

    this.evidence.push(item);
    this.emitEvent(
      'CREDENTIAL_DISCOVERED',
      item.machineId,
      { evidenceId: item.id, type: item.type, name: item.name },
      `Discovered Evidence: ${item.name}`,
      15
    );

    return item;
  }

  public getEvidence(): EvidenceItem[] {
    return [...this.evidence];
  }

  // --- Sessions ---

  public createSession(
    machineId: string,
    type: ActiveSession['type'],
    user: string,
    cwd: string = '/home/kali'
  ): ActiveSession {
    const session: ActiveSession = {
      id: 'sess-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      machineId,
      type,
      user,
      uid: user === 'root' ? 0 : user === 'www-data' ? 33 : 1000,
      gid: user === 'root' ? 0 : user === 'www-data' ? 33 : 1000,
      cwd,
      env: {
        USER: user,
        HOME: user === 'root' ? '/root' : `/home/${user}`,
        PWD: cwd,
        PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
      },
      startedAt: Date.now(),
    };

    this.activeSessions.set(session.id, session);
    this.emitEvent(
      'SESSION_ESTABLISHED',
      machineId,
      { sessionId: session.id, user, type },
      `Session established on ${machineId} as ${user} (${type})`,
      10
    );

    return session;
  }

  public getActiveSessions(): ActiveSession[] {
    return Array.from(this.activeSessions.values());
  }

  public terminateSession(sessionId: string): boolean {
    return this.activeSessions.delete(sessionId);
  }

  // --- Processes ---

  public getProcesses(machineId: string): VirtualProcess[] {
    const machine = this.machines.get(machineId);
    return machine ? machine.processes : [];
  }

  // --- Score & Flags ---

  public getScore(): number {
    return this.score;
  }

  public getClaimedFlags(): string[] {
    return Array.from(this.claimedFlags);
  }

  public claimFlag(flag: string): { success: boolean; points: number; message: string; machineId?: string } {
    const trimmed = flag.trim();
    if (this.claimedFlags.has(trimmed)) {
      return { success: false, points: 0, message: 'Flag has already been submitted!' };
    }

    for (const machine of this.machines.values()) {
      if (machine.userFlag === trimmed) {
        this.claimedFlags.add(trimmed);
        const points = machine.points.user;
        this.emitEvent(
          'FLAG_CAPTURED',
          machine.id,
          { flag: trimmed, type: 'user', points },
          `User Flag captured on ${machine.name}! (+${points} PTS)`,
          points
        );
        return {
          success: true,
          points,
          message: `User Flag Captured on ${machine.name}! +${points} PTS`,
          machineId: machine.id,
        };
      }

      if (machine.rootFlag === trimmed) {
        this.claimedFlags.add(trimmed);
        const points = machine.points.root;
        this.emitEvent(
          'FLAG_CAPTURED',
          machine.id,
          { flag: trimmed, type: 'root', points },
          `SYSTEM ROOTED! Root Flag captured on ${machine.name}! (+${points} PTS)`,
          points
        );
        return {
          success: true,
          points,
          message: `SYSTEM ROOTED! Root Flag Captured on ${machine.name}! +${points} PTS`,
          machineId: machine.id,
        };
      }
    }

    return { success: false, points: 0, message: 'Invalid flag token. Try again.' };
  }

  // --- Save / Load Versioned State ---

  public exportState(): SerializedSimulationState {
    return {
      version: 1,
      timestamp: Date.now(),
      score: this.score,
      evidence: [...this.evidence],
      events: [...this.events],
      activeSessions: Array.from(this.activeSessions.values()),
      discoveredSubnets: this.subnets.filter((s) => s.isDirectlyAccessible).map((s) => s.id),
      machines: Array.from(this.machines.values()).map((m) => ({
        id: m.id,
        compromiseLevel: this.machineCompromiseLevels.get(m.id) || 'NONE',
        userClaimed: this.claimedFlags.has(m.userFlag),
        rootClaimed: this.claimedFlags.has(m.rootFlag),
        discoveredPorts: Array.from(this.discoveredPorts.get(m.id) || []),
        discoveredRoutes: Array.from(this.discoveredRoutes.get(m.id) || []),
        completedObjectives: m.objectives.filter((o) => this.completedObjectives.has(o.id)).map((o) => o.id),
      })),
    };
  }

  public importState(serialized: SerializedSimulationState): boolean {
    if (!serialized || typeof serialized.version !== 'number' || serialized.version !== 1) {
      return false;
    }

    this.score = serialized.score || 0;
    this.evidence = serialized.evidence || [];
    this.events = serialized.events || [];
    this.activeSessions.clear();

    if (serialized.activeSessions) {
      for (const s of serialized.activeSessions) {
        this.activeSessions.set(s.id, s);
      }
    }

    if (serialized.machines) {
      for (const mData of serialized.machines) {
        this.machineCompromiseLevels.set(mData.id, mData.compromiseLevel);
        this.discoveredPorts.set(mData.id, new Set(mData.discoveredPorts));
        this.discoveredRoutes.set(mData.id, new Set(mData.discoveredRoutes));

        if (mData.completedObjectives) {
          for (const objId of mData.completedObjectives) {
            this.completedObjectives.add(objId);
          }
        }

        const machine = this.machines.get(mData.id);
        if (machine) {
          if (mData.userClaimed) this.claimedFlags.add(machine.userFlag);
          if (mData.rootClaimed) this.claimedFlags.add(machine.rootFlag);
        }
      }
    }

    return true;
  }
}
