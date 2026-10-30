import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, INITIAL_MACHINES } from '../store/gameStore';
import { CommandInterpreter, CommandContext } from '../services/commandInterpreter';
import { VirtualFileSystem } from '../services/virtualFs';

describe('ROOTRANGE Full End-to-End Penetration Test Kill Chain', () => {
  beforeEach(() => {
    useGameStore.setState({
      score: 0,
      rank: 'Script Kiddie',
      activeMachineId: 'ecorp-hr',
      machines: JSON.parse(JSON.stringify(INITIAL_MACHINES)),
      claimedFlags: [],
    });
  });

  it('completes the entire offensive kill chain on E-Corp HR from recon to root pwnage', () => {
    const fs = new VirtualFileSystem();
    let ctx: CommandContext = {
      user: 'kali',
      hostname: 'pwnbox',
      cwd: '/home/kali',
      fs,
      activeTarget: useGameStore.getState().machines[0],
      history: [],
      inReverseShell: false,
    };

    // 1. RECONNAISSANCE: Run Nmap Port Scan
    const nmapRes = CommandInterpreter.execute('nmap -sV -sC 10.10.11.45', ctx);
    expect(nmapRes.output).toContain('Apache/2.4.49 (Log4j / Spring)');
    expect(nmapRes.output).toContain('22/tcp');
    expect(nmapRes.output).toContain('80/tcp');
    useGameStore.getState().updateCompromiseLevel('ecorp-hr', 'RECON');

    // 2. ENUMERATION: Run Gobuster Directory Fuzzing
    const gobusterRes = CommandInterpreter.execute('gobuster dir -u http://10.10.11.45 -w common.txt', ctx);
    expect(gobusterRes.output).toContain('/admin');
    expect(gobusterRes.output).toContain('/portal');

    // 3. EXPLOITATION: Spawn Netcat Listener and Catch Log4j Reverse Shell
    const ncRes = CommandInterpreter.execute('nc -lvnp 4444', ctx);
    expect(ncRes.enterShell).toBeDefined();
    expect(ncRes.enterShell?.user).toBe('www-data');
    expect(ncRes.enterShell?.host).toBe('ecorp-hr');

    // Update context to represent connected remote target shell
    ctx = {
      ...ctx,
      user: ncRes.enterShell!.user,
      hostname: ncRes.enterShell!.host,
      cwd: ncRes.enterShell!.cwd,
      inReverseShell: true,
      reverseShellUser: ncRes.enterShell!.user,
      reverseShellHost: ncRes.enterShell!.host,
    };

    // Verify whoami on target
    expect(CommandInterpreter.execute('whoami', ctx).output).toBe('www-data');

    // 4. LOOT USER FLAG: Read user.txt and Submit Flag
    const catUser = CommandInterpreter.execute('cat /home/alex/user.txt', ctx);
    expect(catUser.output).toContain('ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}');

    const userFlagRes = useGameStore.getState().submitFlag('ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}');
    expect(userFlagRes.success).toBe(true);
    expect(userFlagRes.pointsAwarded).toBe(20);
    expect(useGameStore.getState().score).toBe(20);
    expect(useGameStore.getState().rank).toBe('Hacker');

    // 5. PRIVILEGE ESCALATION: Check Sudo Rights
    const sudoL = CommandInterpreter.execute('sudo -l', ctx);
    expect(sudoL.output).toContain('NOPASSWD: /usr/bin/find');

    // 6. ROOT EXPLOIT: Execute GTFOBins Find Root Shell
    const rootSpawn = CommandInterpreter.execute('sudo /usr/bin/find . -exec /bin/sh \\; -quit', ctx);
    expect(rootSpawn.enterShell?.user).toBe('root');

    ctx = {
      ...ctx,
      user: 'root',
      cwd: '/root',
      reverseShellUser: 'root',
    };

    expect(CommandInterpreter.execute('whoami', ctx).output).toBe('root');
    expect(CommandInterpreter.execute('id', ctx).output).toContain('uid=0(root)');

    // 7. LOOT ROOT FLAG: Read root.txt and Submit Flag
    const catRoot = CommandInterpreter.execute('cat /root/root.txt', ctx);
    expect(catRoot.output).toContain('ROOTRANGE{r00t_pr1v3sc_m4st3r_c0mpr0m1s3}');

    const rootFlagRes = useGameStore.getState().submitFlag('ROOTRANGE{r00t_pr1v3sc_m4st3r_c0mpr0m1s3}');
    expect(rootFlagRes.success).toBe(true);
    expect(rootFlagRes.pointsAwarded).toBe(30);
    expect(useGameStore.getState().score).toBe(50);

    // 8. VERIFY TOPOLOGY GRAPH SYNCHRONIZATION
    const ecorpNode = useGameStore.getState().networkNodes.find((n) => n.id === 'ecorp-hr');
    expect(ecorpNode?.status).toBe('root');

    const machineState = useGameStore.getState().machines.find((m) => m.id === 'ecorp-hr');
    expect(machineState?.userClaimed).toBe(true);
    expect(machineState?.rootClaimed).toBe(true);
    expect(machineState?.compromiseLevel).toBe('ROOT');
  });
});
