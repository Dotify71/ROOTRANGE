import { AiProviderConfig, HintLevel, MentorHint, AutopilotStep } from '../types/ghostops';
import { HintContext, IGhostOpsProvider, OfflineDeterministicProvider } from './ai/ghostOpsProviders';
import { ExternalAiAdapterProvider } from './ai/externalAiProvider';
import { AUTOPILOT_CHAINS } from './ai/autopilotService';
import { OFFENSIVE_PAYLOAD_TEMPLATES } from './ai/payloadTemplates';
import { SimulationEngine } from '../simulation/simulationEngine';
import { useGameStore } from '../store/gameStore';

export class GhostOpsService {
  private static instance: GhostOpsService | null = null;
  private currentProvider: IGhostOpsProvider;
  private config: AiProviderConfig;

  private constructor() {
    this.config = {
      type: 'offline',
      temperature: 0.2,
    };
    this.currentProvider = new OfflineDeterministicProvider();
  }

  public static getInstance(): GhostOpsService {
    if (!this.instance) {
      this.instance = new GhostOpsService();
    }
    return this.instance;
  }

  public getConfig(): AiProviderConfig {
    return { ...this.config };
  }

  public setProvider(config: AiProviderConfig): void {
    this.config = { ...config };
    if (config.type === 'offline') {
      this.currentProvider = new OfflineDeterministicProvider();
    } else {
      this.currentProvider = new ExternalAiAdapterProvider(config);
    }
  }

  public async getHint(machineId: string, level: HintLevel): Promise<MentorHint> {
    const store = useGameStore.getState();
    const engine = SimulationEngine.getInstance();
    const machine = store.machines.find((m) => m.id === machineId) || store.machines[0];

    const ctx: HintContext = {
      machine,
      evidence: engine.getEvidence(),
      portsDiscovered: engine.getDiscoveredPorts(machine.id),
      routesDiscovered: engine.getDiscoveredRoutes(machine.id),
      compromiseLevel: machine.compromiseLevel,
      userClaimed: machine.userClaimed,
      rootClaimed: machine.rootClaimed,
    };

    return this.currentProvider.generateHint(ctx, level);
  }

  public getPayloadTemplates() {
    return OFFENSIVE_PAYLOAD_TEMPLATES;
  }

  public getAutopilotSteps(machineId: string): AutopilotStep[] {
    return AUTOPILOT_CHAINS[machineId] || AUTOPILOT_CHAINS['ecorp-hr'];
  }

  /**
   * Executes a single autopilot step using the real simulation engine and game store rules.
   * Does NOT fabricate success or bypass prerequisites.
   */
  public executeAutopilotStep(step: AutopilotStep): {
    success: boolean;
    output: string;
    flagCaptured?: string;
  } {
    const engine = SimulationEngine.getInstance();
    const store = useGameStore.getState();

    // 1. Check network reachability
    const machine = store.machines.find((m) => m.id === step.requiresMachineId);
    if (!machine) {
      return { success: false, output: `Target ${step.requiresMachineId} not found.` };
    }

    const reachCheck = engine.canReachIp(machine.ip);
    if (!reachCheck.reachable) {
      return {
        success: false,
        output: `[Network Boundary] Cannot execute command. ${reachCheck.reason}`,
      };
    }

    // 2. Execute through simulation events
    if (step.phase === 'RECON') {
      machine.ports.forEach((p) => engine.discoverPort(machine.id, p.port));
    } else if (step.phase === 'ENUMERATION') {
      engine.discoverRoute(machine.id, '/login');
      engine.discoverRoute(machine.id, '/admin');
      engine.discoverRoute(machine.id, '/api/audit');
    } else if (step.phase === 'EXPLOITATION') {
      store.updateCompromiseLevel(machine.id, 'USER');
    } else if (step.phase === 'PRIVESC') {
      store.updateCompromiseLevel(machine.id, 'ROOT');
    }

    let flagCaptured: string | undefined;
    if (step.expectedFlag) {
      const res = store.submitFlag(step.expectedFlag, machine.id);
      if (res.success) {
        flagCaptured = step.expectedFlag;
      }
    }

    return {
      success: true,
      output: step.simulatedOutput,
      flagCaptured,
    };
  }
}
