import { describe, it, expect } from 'vitest';
import { ShellParser } from '../services/shellParser';
import { VirtualFileSystem } from '../services/virtualFs';
import { CommandRegistry, ExecutionContext } from '../services/commandRegistry';
import { CommandInterpreter, CommandContext } from '../services/commandInterpreter';
import { INITIAL_MACHINES } from '../store/gameStore';

describe('Phase 2: ShellParser Unit Tests', () => {
  it('tokenizes commands with spaces and tabs safely without eval()', () => {
    const tokens = ShellParser.tokenize('ls   -la   /var/log');
    expect(tokens).toEqual(['ls', '-la', '/var/log']);
  });

  it('handles single and double quoted arguments', () => {
    const tokens = ShellParser.tokenize('grep "admin user" \'some log file.txt\'');
    expect(tokens).toEqual(['grep', 'admin user', 'some log file.txt']);
  });

  it('handles escaped spaces and quotes', () => {
    const tokens = ShellParser.tokenize('cat file\\ with\\ spaces.txt "quoted \\"nested\\" string"');
    expect(tokens).toEqual(['cat', 'file with spaces.txt', 'quoted "nested" string']);
  });

  it('parses multi-stage pipelines', () => {
    const parsed = ShellParser.parse('cat /etc/passwd | grep -i www-data | head -n 1');
    expect(parsed.commands).toHaveLength(3);
    expect(parsed.commands[0]).toEqual({ command: 'cat', args: ['/etc/passwd'], raw: 'cat /etc/passwd' });
    expect(parsed.commands[1]).toEqual({ command: 'grep', args: ['-i', 'www-data'], raw: 'grep -i www-data' });
    expect(parsed.commands[2]).toEqual({ command: 'head', args: ['-n', '1'], raw: 'head -n 1' });
    expect(parsed.redirectOutputFile).toBeUndefined();
  });

  it('parses overwrite redirection (> file)', () => {
    const parsed = ShellParser.parse('echo "hello offensive world" > /tmp/out.txt');
    expect(parsed.commands).toHaveLength(1);
    expect(parsed.commands[0].command).toBe('echo');
    expect(parsed.commands[0].args).toEqual(['hello offensive world']);
    expect(parsed.redirectOutputFile).toBe('/tmp/out.txt');
    expect(parsed.appendOutput).toBe(false);
  });

  it('parses append redirection (>> file)', () => {
    const parsed = ShellParser.parse('cat /etc/passwd | grep root >> /tmp/roots.txt');
    expect(parsed.commands).toHaveLength(2);
    expect(parsed.redirectOutputFile).toBe('/tmp/roots.txt');
    expect(parsed.appendOutput).toBe(true);
  });

  it('does not split pipes inside quotes', () => {
    const parsed = ShellParser.parse('grep "foo|bar" /var/log/syslog');
    expect(parsed.commands).toHaveLength(1);
    expect(parsed.commands[0].command).toBe('grep');
    expect(parsed.commands[0].args).toEqual(['foo|bar', '/var/log/syslog']);
  });
});

describe('Phase 2: VirtualFileSystem & POSIX Security', () => {
  it('prevents directory traversal escaping the root filesystem', () => {
    const fs = new VirtualFileSystem();
    const resolved = fs.resolvePath('/home/kali', '../../../../../../etc/passwd');
    expect(resolved).toEqual(['etc', 'passwd']);
  });

  it('enforces POSIX mode permissions on sensitive root-owned files', () => {
    const fs = new VirtualFileSystem();

    // /etc/shadow is mode 0640 (root:shadow)
    const shadowKali = fs.readFile('/home/kali', '/etc/shadow', 1000, 1000);
    expect(shadowKali.success).toBe(false);
    expect(shadowKali.error).toContain('Permission denied');

    // /root/root.txt is mode 0600 (root:root)
    const rootTxtKali = fs.readFile('/home/kali', '/root/root.txt', 1000, 1000);
    expect(rootTxtKali.success).toBe(false);
    expect(rootTxtKali.error).toContain('Permission denied');

    // Root (UID 0) has access
    const rootTxtRoot = fs.readFile('/root', '/root/root.txt', 0, 0);
    expect(rootTxtRoot.success).toBe(true);
    expect(rootTxtRoot.content).toContain('ROOTRANGE{');

    const shadowRoot = fs.readFile('/root', '/etc/shadow', 0, 0);
    expect(shadowRoot.success).toBe(true);
    expect(shadowRoot.content).toContain('root:$6$');
  });

  it('denies directory listing for protected directories', () => {
    const fs = new VirtualFileSystem();
    const listRootKali = fs.listDirectory('/home/kali', '/root', 1000, 1000);
    expect(listRootKali.success).toBe(false);
    expect(listRootKali.error).toContain('Permission denied');

    const listRootRoot = fs.listDirectory('/root', '/root', 0, 0);
    expect(listRootRoot.success).toBe(true);
    expect(listRootRoot.entries?.map((e) => e.name)).toContain('root.txt');
  });

  it('allows file writing and appending in permitted directories (/tmp)', () => {
    const fs = new VirtualFileSystem();
    const writeRes = fs.writeFile('/home/kali', '/tmp/payload.sh', '#!/bin/sh\nwhoami\n', 1000, 1000, false);
    expect(writeRes.success).toBe(true);

    const appendRes = fs.writeFile('/home/kali', '/tmp/payload.sh', 'id\n', 1000, 1000, true);
    expect(appendRes.success).toBe(true);

    const readRes = fs.readFile('/home/kali', '/tmp/payload.sh', 1000, 1000);
    expect(readRes.success).toBe(true);
    expect(readRes.content).toBe('#!/bin/sh\nwhoami\nid\n');
  });

  it('denies writing to root-owned protected directories as unprivileged user', () => {
    const fs = new VirtualFileSystem();
    const writeRes = fs.writeFile('/home/kali', '/etc/backdoor.conf', 'malicious=true', 1000, 1000, false);
    expect(writeRes.success).toBe(false);
    expect(writeRes.error).toContain('Permission denied');
  });

  it('creates new directories with createDirectory()', () => {
    const fs = new VirtualFileSystem();
    const mkdirRes = fs.createDirectory('/tmp', 'recon_output', 1000, 1000);
    expect(mkdirRes.success).toBe(true);

    const checkDir = fs.listDirectory('/tmp', 'recon_output', 1000, 1000);
    expect(checkDir.success).toBe(true);
    expect(checkDir.entries).toEqual([]);
  });

  it('provides accurate tab completion suggestions via getCompletions()', () => {
    const fs = new VirtualFileSystem();
    const matches = fs.getCompletions('/', '/etc/p');
    expect(matches).toContain('/etc/passwd');

    const binMatches = fs.getCompletions('/', '/bin/nm');
    expect(binMatches).toContain('/bin/nmap');
  });
});

describe('Phase 2: CommandRegistry Typed Handlers', () => {
  const createMockContext = (user = 'kali'): ExecutionContext => {
    const uid = user === 'root' ? 0 : 1000;
    const gid = user === 'root' ? 0 : 1000;
    return {
      user,
      uid,
      group: user,
      gid,
      groups: [user],
      hostname: 'pwnbox',
      cwd: user === 'root' ? '/root' : '/home/kali',
      env: { USER: user, HOME: user === 'root' ? '/root' : `/home/${user}`, PWD: user === 'root' ? '/root' : `/home/${user}` },
      fs: new VirtualFileSystem(),
      stdin: '',
      history: ['ls', 'whoami'],
      activeTarget: INITIAL_MACHINES[0],
      inReverseShell: false,
    };
  };

  it('executes whoami, id, uname, pwd, and env', () => {
    const ctx = createMockContext();
    expect(CommandRegistry.get('whoami')!([], ctx).stdout).toBe('kali');
    expect(CommandRegistry.get('id')!([], ctx).stdout).toContain('uid=1000(kali)');
    expect(CommandRegistry.get('pwd')!([], ctx).stdout).toBe('/home/kali');
    expect(CommandRegistry.get('uname')!([], ctx).stdout).toBe('Linux');
    expect(CommandRegistry.get('uname')!(['-a'], ctx).stdout).toContain('Debian');
    expect(CommandRegistry.get('env')!([], ctx).stdout).toContain('USER=kali');
  });

  it('executes history and clear commands', () => {
    const ctx = createMockContext();
    const historyOut = CommandRegistry.get('history')!([], ctx);
    expect(historyOut.stdout).toContain('ls');
    expect(historyOut.stdout).toContain('whoami');

    const clearOut = CommandRegistry.get('clear')!([], ctx);
    expect(clearOut.clear).toBe(true);
  });

  it('executes ls with -l and -la flags', () => {
    const ctx = createMockContext();
    const lsStandard = CommandRegistry.get('ls')!([], ctx);
    expect(lsStandard.exitCode).toBe(0);

    const lsDetailed = CommandRegistry.get('ls')!(['-la', '/bin'], ctx);
    expect(lsDetailed.exitCode).toBe(0);
    expect(lsDetailed.stdout).toContain('-rwxr-xr-x');
    expect(lsDetailed.stdout).toContain('nmap');
  });

  it('executes cd and updates newCwd', () => {
    const ctx = createMockContext();
    const cdVar = CommandRegistry.get('cd')!(['/var/log'], ctx);
    expect(cdVar.exitCode).toBe(0);
    expect(cdVar.newCwd).toBe('/var/log');

    // Denies cd into protected /root as kali
    const cdRoot = CommandRegistry.get('cd')!(['/root'], ctx);
    expect(cdRoot.exitCode).toBe(1);
    expect(cdRoot.stderr).toContain('Permission denied');
  });

  it('executes head and tail commands', () => {
    const ctx = createMockContext();
    const headRes = CommandRegistry.get('head')!(['-n', '2', '/etc/passwd'], ctx);
    expect(headRes.exitCode).toBe(0);
    expect(headRes.stdout.split('\n')).toHaveLength(2);

    const tailRes = CommandRegistry.get('tail')!(['-n', '1', '/etc/passwd'], ctx);
    expect(tailRes.exitCode).toBe(0);
    expect(tailRes.stdout.split('\n')).toHaveLength(1);
    expect(tailRes.stdout).toContain('alex:x:1001');
  });

  it('executes grep with flags (-i, -v, -n)', () => {
    const ctx = createMockContext();
    const grepI = CommandRegistry.get('grep')!(['-i', 'KALI', '/etc/passwd'], ctx);
    expect(grepI.exitCode).toBe(0);
    expect(grepI.stdout).toContain('kali:x:1000');

    const grepV = CommandRegistry.get('grep')!(['-v', 'root', '/etc/passwd'], ctx);
    expect(grepV.exitCode).toBe(0);
    expect(grepV.stdout).not.toContain('root:x:0');

    const grepN = CommandRegistry.get('grep')!(['-n', 'www-data', '/etc/passwd'], ctx);
    expect(grepN.exitCode).toBe(0);
    expect(grepN.stdout).toMatch(/^\d+:www-data/);
  });

  it('executes find and stat commands', () => {
    const ctx = createMockContext();
    const findRes = CommandRegistry.get('find')!(['/var', '-name', 'auth.log'], ctx);
    expect(findRes.exitCode).toBe(0);
    expect(findRes.stdout).toContain('/var/log/auth.log');

    const statRes = CommandRegistry.get('stat')!(['/etc/passwd'], ctx);
    expect(statRes.exitCode).toBe(0);
    expect(statRes.stdout).toContain('File: passwd');
    expect(statRes.stdout).toContain('Access: (0644/-rw-r--r--)');
  });
});

describe('Phase 2: Command Pipelines & Output Redirection', () => {
  const getContext = (): CommandContext => ({
    user: 'kali',
    hostname: 'pwnbox',
    cwd: '/home/kali',
    fs: new VirtualFileSystem(),
    activeTarget: INITIAL_MACHINES[0],
    history: [],
    inReverseShell: false,
  });

  it('pipes output from cat to grep', () => {
    const ctx = getContext();
    const res = CommandInterpreter.execute('cat /etc/passwd | grep www-data', ctx);
    expect(res.exitCode).toBe(0);
    expect(res.output).toContain('www-data:x:33:33');
    expect(res.output).not.toContain('root:x:0:0');
  });

  it('chains 3-stage pipeline: cat | grep | head', () => {
    const ctx = getContext();
    const res = CommandInterpreter.execute('cat /etc/passwd | grep -v root | head -n 1', ctx);
    expect(res.exitCode).toBe(0);
    expect(res.output).toBe('kali:x:1000:1000:kali,,,:/home/kali:/bin/bash');
  });

  it('redirects command output to file (> file) and verifies with cat', () => {
    const ctx = getContext();
    const writeRes = CommandInterpreter.execute('echo "PWNBOX ACTIVE ENGAGEMENT" > /tmp/engagement.txt', ctx);
    expect(writeRes.exitCode).toBe(0);
    expect(writeRes.output).toBe(''); // Redirect suppresses terminal output

    const catRes = CommandInterpreter.execute('cat /tmp/engagement.txt', ctx);
    expect(catRes.exitCode).toBe(0);
    expect(catRes.output).toContain('PWNBOX ACTIVE ENGAGEMENT');
  });

  it('appends command output to file (>> file)', () => {
    const ctx = getContext();
    CommandInterpreter.execute('echo "line 1" > /tmp/log.txt', ctx);
    CommandInterpreter.execute('echo "line 2" >> /tmp/log.txt', ctx);

    const catRes = CommandInterpreter.execute('cat /tmp/log.txt', ctx);
    expect(catRes.output.trim()).toBe('line 1\nline 2');
  });

  it('fails safely when user redirects output to unauthorized path', () => {
    const ctx = getContext();
    const res = CommandInterpreter.execute('echo "malicious" > /root/compromise.txt', ctx);
    expect(res.exitCode).toBe(1);
    expect(res.output).toContain('Permission denied');
  });

  it('handles unknown command with 127 exit code and meaningful error message', () => {
    const ctx = getContext();
    const res = CommandInterpreter.execute('unknown_backdoor_cmd --flag', ctx);
    expect(res.exitCode).toBe(127);
    expect(res.output).toBe('unknown_backdoor_cmd: command not found');
  });
});
