import { describe, it, expect } from 'vitest';
import { VirtualFileSystem } from '../services/virtualFs';
import { CommandInterpreter, CommandContext } from '../services/commandInterpreter';
import { INITIAL_MACHINES } from '../store/gameStore';

describe('Virtual File System', () => {
  it('reads default /etc/passwd file correctly', () => {
    const fs = new VirtualFileSystem();
    const res = fs.readFile('/home/kali', '/etc/passwd');
    expect(res.success).toBe(true);
    expect(res.content).toContain('root:x:0:0:root');
    expect(res.content).toContain('kali:x:1000:1000');
  });

  it('lists /bin tools correctly', () => {
    const fs = new VirtualFileSystem();
    const res = fs.listDirectory('/home/kali', '/bin');
    expect(res.success).toBe(true);
    const names = res.entries?.map((e) => e.name) || [];
    expect(names).toContain('nmap');
    expect(names).toContain('gobuster');
    expect(names).toContain('nc');
  });

  it('handles non-existent paths gracefully', () => {
    const fs = new VirtualFileSystem();
    const res = fs.readFile('/home/kali', 'non_existent_file.txt');
    expect(res.success).toBe(false);
    expect(res.error).toContain('No such file or directory');
  });
});

describe('Command Interpreter & Attack Vectors', () => {
  const getContext = (): CommandContext => ({
    user: 'kali',
    hostname: 'pwnbox',
    cwd: '/home/kali',
    fs: new VirtualFileSystem(),
    activeTarget: INITIAL_MACHINES[0],
    history: [],
    inReverseShell: false,
  });

  it('executes basic linux utility commands', () => {
    const ctx = getContext();
    expect(CommandInterpreter.execute('whoami', ctx).output).toBe('kali');
    expect(CommandInterpreter.execute('pwd', ctx).output).toBe('/home/kali');
    expect(CommandInterpreter.execute('id', ctx).output).toContain('uid=1000(kali)');
  });

  it('supports pipelines with grep', () => {
    const ctx = getContext();
    const res = CommandInterpreter.execute('cat /etc/passwd | grep root', ctx);
    expect(res.output).toContain('root:x:0:0');
    expect(res.output).not.toContain('kali:x:1000');
  });

  it('runs nmap scan against target machine and reveals open ports', () => {
    const ctx = getContext();
    const res = CommandInterpreter.execute('nmap -sV -sC 10.10.11.45', ctx);
    expect(res.output).toContain('Nmap scan report for E-Corp HR Portal');
    expect(res.output).toContain('22/tcp');
    expect(res.output).toContain('80/tcp');
    expect(res.output).toContain('Apache/2.4.49 (Log4j / Spring)');
    expect(res.targetCompromised).toBe('RECON');
  });

  it('runs gobuster to fuzz web endpoints', () => {
    const ctx = getContext();
    const res = CommandInterpreter.execute('gobuster dir -u http://10.10.11.45 -w common.txt', ctx);
    expect(res.output).toContain('/admin');
    expect(res.output).toContain('/login');
    expect(res.output).toContain('/portal');
  });

  it('spawns reverse shell listener and compromises machine to USER', () => {
    const ctx = getContext();
    const res = CommandInterpreter.execute('nc -lvnp 4444', ctx);
    expect(res.enterShell).toBeDefined();
    expect(res.enterShell?.user).toBe('www-data');
    expect(res.enterShell?.host).toBe('ecorp-hr');
    expect(res.targetCompromised).toBe('USER');
  });

  it('executes GTFOBins sudo privilege escalation to ROOT', () => {
    const ctx: CommandContext = {
      ...getContext(),
      inReverseShell: true,
      reverseShellUser: 'www-data',
      reverseShellHost: 'ecorp-hr',
      cwd: '/home/alex',
    };

    // 1. Check sudo privileges
    const sudoCheck = CommandInterpreter.execute('sudo -l', ctx);
    expect(sudoCheck.output).toContain('NOPASSWD: /usr/bin/find');

    // 2. Exploit find binary to spawn root shell
    const privesc = CommandInterpreter.execute('sudo /usr/bin/find . -exec /bin/sh \\; -quit', ctx);
    expect(privesc.enterShell?.user).toBe('root');
    expect(privesc.enterShell?.cwd).toBe('/root');
    expect(privesc.targetCompromised).toBe('ROOT');

    // 3. Cat root flag as root
    const rootCtx: CommandContext = {
      ...ctx,
      reverseShellUser: 'root',
      cwd: '/root',
    };
    const catRoot = CommandInterpreter.execute('cat /root/root.txt', rootCtx);
    expect(catRoot.output).toContain('ROOTRANGE{r00t_pr1v3sc_m4st3r_c0mpr0m1s3}');
  });
});
