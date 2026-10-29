import { VirtualFileSystem, FsNode } from './virtualFs';
import { TargetMachine } from '../types';

export interface ExecutionContext {
  user: string;
  uid: number;
  group: string;
  gid: number;
  groups: string[];
  hostname: string;
  cwd: string;
  env: Record<string, string>;
  fs: VirtualFileSystem;
  stdin: string;
  history: string[];
  activeTarget: TargetMachine | null;
  inReverseShell: boolean;
}

export interface ExecutionOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  newCwd?: string;
  newEnv?: Record<string, string>;
  clear?: boolean;
  soundTrigger?: 'connect' | 'scan' | 'flag';
  targetCompromised?: 'RECON' | 'USER' | 'ROOT';
  enterShell?: { user: string; uid: number; group: string; gid: number; host: string; cwd: string };
  exitShell?: boolean;
}

export type CommandHandler = (args: string[], ctx: ExecutionContext) => ExecutionOutput;

export class CommandRegistry {
  private static handlers: Map<string, CommandHandler> = new Map();

  static {
    this.registerDefaults();
  }

  public static register(name: string, handler: CommandHandler) {
    this.handlers.set(name.toLowerCase(), handler);
  }

  public static get(name: string): CommandHandler | undefined {
    return this.handlers.get(name.toLowerCase());
  }

  public static getAllCommands(): string[] {
    return Array.from(this.handlers.keys());
  }

  private static registerDefaults() {
    // 1. HELP
    this.register('help', () => ({
      stdout: `ROOTRANGE COMMAND REGISTRY // OFFENSIVE CYBER ENGINE
SYSTEM UTILITIES:
  pwd                      Print name of current/working directory
  cd <dir>                 Change the shell working directory
  ls [-l|-la|-a] [path]    List directory contents with permissions
  cat [file ...]           Concatenate FILE(s) to standard output
  echo [text ...]          Write arguments to standard output
  head [-n <num>] [file]   Output the first part of files
  tail [-n <num>] [file]   Output the last part of files
  grep [-i|-v|-n] <pat>    Print lines that match patterns
  find [path] [criteria]   Search for files in a directory hierarchy
  stat <path>              Display file or file system status
  mkdir <dir>              Create directory
  touch <file>             Update file timestamp or create empty file
  env                      Display all active environment variables
  whoami                   Print effective userid
  id                       Print real and effective user and group IDs
  uname [-a]               Print system information
  clear                    Clear the terminal screen
  history                  Display command history list with line numbers

OFFENSIVE SECURITY TOOLS:
  nmap [flags] <target>    Network exploration tool and port scanner
  gobuster dir -u <url>    Directory/file enumeration tool
  hydra -l <usr> -P <wl>   Fast network logon cracker
  curl [flags] <url>       Transfer a URL
  nc -lvnp <port>          Arbitrary TCP and UDP connections and listens
  sudo [-l] [command]      Execute a command as another user / root

PIPELINE & REDIRECTION:
  command1 | command2      Pipe stdout of command1 to stdin of command2
  command > file           Redirect stdout to overwrite file
  command >> file          Redirect stdout to append to file`,
      stderr: '',
      exitCode: 0,
    }));

    // 2. CLEAR
    this.register('clear', () => ({
      stdout: '',
      stderr: '',
      exitCode: 0,
      clear: true,
    }));

    // 3. PWD
    this.register('pwd', (_args, ctx) => ({
      stdout: ctx.cwd,
      stderr: '',
      exitCode: 0,
    }));

    // 4. WHOAMI
    this.register('whoami', (_args, ctx) => ({
      stdout: ctx.user,
      stderr: '',
      exitCode: 0,
    }));

    // 5. ID
    this.register('id', (_args, ctx) => ({
      stdout: `uid=${ctx.uid}(${ctx.user}) gid=${ctx.gid}(${ctx.group}) groups=${ctx.gid}(${ctx.group})${
        ctx.groups.length > 0 ? ',' + ctx.groups.map((g) => `${g}`).join(',') : ''
      }`,
      stderr: '',
      exitCode: 0,
    }));

    // 6. UNAME
    this.register('uname', (args, ctx) => {
      const isAll = args.includes('-a');
      if (isAll) {
        return {
          stdout: `Linux ${ctx.hostname} 6.5.0-kali3-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.5.6-1kali1 (2023-10-09) x86_64 GNU/Linux`,
          stderr: '',
          exitCode: 0,
        };
      }
      return { stdout: 'Linux', stderr: '', exitCode: 0 };
    });

    // 6b. HOSTNAME
    this.register('hostname', (_args, ctx) => ({
      stdout: ctx.hostname,
      stderr: '',
      exitCode: 0,
    }));

    // 6c. IFCONFIG / IP
    const ifconfigHandler: CommandHandler = () => ({
      stdout: `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 10.10.14.22  netmask 255.255.254.0  broadcast 10.10.15.255
        ether 08:00:27:4a:3e:21  txqueuelen 1000  (Ethernet)

tun0: flags=4305<UP,POINTOPOINT,RUNNING,NOARP,MULTICAST>  mtu 1500
        inet 10.10.14.22  netmask 255.255.254.0  destination 10.10.14.22`,
      stderr: '',
      exitCode: 0,
    });
    this.register('ifconfig', ifconfigHandler);
    this.register('ip', ifconfigHandler);

    // 7. ENV
    this.register('env', (_args, ctx) => {
      const rows = Object.entries(ctx.env).map(([k, v]) => `${k}=${v}`);
      return { stdout: rows.join('\n'), stderr: '', exitCode: 0 };
    });

    // 8. HISTORY
    this.register('history', (_args, ctx) => ({
      stdout: ctx.history.map((h, i) => `  ${(i + 1).toString().padStart(4)}  ${h}`).join('\n'),
      stderr: '',
      exitCode: 0,
    }));

    // 9. CD
    this.register('cd', (args, ctx) => {
      let target = args[0] || (ctx.user === 'root' ? '/root' : '/home/kali');
      if (target === '~') {
        target = ctx.user === 'root' ? '/root' : '/home/kali';
      }

      const segments = ctx.fs.resolvePath(ctx.cwd, target);
      const node = ctx.fs.getNode(segments);

      if (!node) {
        return { stdout: '', stderr: `cd: ${target}: No such file or directory`, exitCode: 1 };
      }
      if (node.type !== 'dir') {
        return { stdout: '', stderr: `cd: ${target}: Not a directory`, exitCode: 1 };
      }

      // Check execute permission on directory
      if (!ctx.fs.checkPermission(node, ctx.uid, ctx.gid, 'x')) {
        return { stdout: '', stderr: `cd: ${target}: Permission denied`, exitCode: 1 };
      }

      const newPath = '/' + segments.join('/');
      return {
        stdout: '',
        stderr: '',
        exitCode: 0,
        newCwd: newPath || '/',
      };
    });

    // 10. LS
    this.register('ls', (args, ctx) => {
      const isDetailed = args.some((a) => a.includes('l'));
      const showAll = args.some((a) => a.includes('a'));
      const targetPath = args.find((a) => !a.startsWith('-')) || '';

      const res = ctx.fs.listDirectory(ctx.cwd, targetPath, ctx.uid, ctx.gid);
      if (!res.success || !res.entries) {
        return { stdout: '', stderr: res.error || 'ls error', exitCode: 1 };
      }

      let entries = res.entries;
      if (!showAll) {
        entries = entries.filter((e) => !e.name.startsWith('.'));
      }

      if (isDetailed) {
        const rows = entries.map((e) => {
          const dateStr = e.mtime.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ' 06:00';
          return `${e.permissions.padEnd(11)} 1 ${e.owner.padEnd(6)} ${e.group.padEnd(6)} ${e.size
            .toString()
            .padStart(6)} ${dateStr} ${e.name}`;
        });
        return { stdout: `total ${entries.length * 4}\n` + rows.join('\n'), stderr: '', exitCode: 0 };
      }

      return { stdout: entries.map((e) => e.name).join('   '), stderr: '', exitCode: 0 };
    });

    // 11. CAT
    this.register('cat', (args, ctx) => {
      // If no file arguments, read from stdin
      if (args.length === 0 || args[0] === '-') {
        return { stdout: ctx.stdin, stderr: '', exitCode: 0 };
      }

      const outputs: string[] = [];
      const errors: string[] = [];

      for (const file of args) {
        const res = ctx.fs.readFile(ctx.cwd, file, ctx.uid, ctx.gid);
        if (res.success) {
          outputs.push(res.content || '');
        } else {
          errors.push(res.error || `cat: ${file}: Error reading file`);
        }
      }

      return {
        stdout: outputs.join('\n'),
        stderr: errors.join('\n'),
        exitCode: errors.length > 0 ? 1 : 0,
      };
    });

    // 11b. ECHO
    this.register('echo', (args) => ({
      stdout: args.join(' '),
      stderr: '',
      exitCode: 0,
    }));

    // 11c. TOUCH
    this.register('touch', (args, ctx) => {
      if (args.length === 0) {
        return { stdout: '', stderr: 'touch: missing file operand', exitCode: 1 };
      }
      for (const file of args) {
        const res = ctx.fs.writeFile(ctx.cwd, file, '', ctx.uid, ctx.gid, true);
        if (!res.success) {
          return { stdout: '', stderr: `touch: cannot touch '${file}': ${res.error || 'Permission denied'}`, exitCode: 1 };
        }
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    });

    // 11d. MKDIR
    this.register('mkdir', (args, ctx) => {
      if (args.length === 0) {
        return { stdout: '', stderr: 'mkdir: missing operand', exitCode: 1 };
      }
      for (const dir of args) {
        const res = ctx.fs.createDirectory(ctx.cwd, dir, ctx.uid, ctx.gid);
        if (!res.success) {
          return { stdout: '', stderr: res.error || `mkdir: cannot create directory '${dir}'`, exitCode: 1 };
        }
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    });

    // 12. HEAD
    this.register('head', (args, ctx) => {
      let count = 10;
      let fileArg: string | undefined;

      for (let i = 0; i < args.length; i++) {
        if (args[i] === '-n' && args[i + 1]) {
          count = parseInt(args[i + 1], 10) || 10;
          i++;
        } else if (!args[i].startsWith('-')) {
          fileArg = args[i];
        }
      }

      let text = ctx.stdin;
      if (fileArg) {
        const res = ctx.fs.readFile(ctx.cwd, fileArg, ctx.uid, ctx.gid);
        if (!res.success) {
          return { stdout: '', stderr: res.error || `head: ${fileArg}: Error reading file`, exitCode: 1 };
        }
        text = res.content || '';
      }

      const lines = text.split('\n').slice(0, count);
      return { stdout: lines.join('\n'), stderr: '', exitCode: 0 };
    });

    // 13. TAIL
    this.register('tail', (args, ctx) => {
      let count = 10;
      let fileArg: string | undefined;

      for (let i = 0; i < args.length; i++) {
        if (args[i] === '-n' && args[i + 1]) {
          count = parseInt(args[i + 1], 10) || 10;
          i++;
        } else if (!args[i].startsWith('-')) {
          fileArg = args[i];
        }
      }

      let text = ctx.stdin;
      if (fileArg) {
        const res = ctx.fs.readFile(ctx.cwd, fileArg, ctx.uid, ctx.gid);
        if (!res.success) {
          return { stdout: '', stderr: res.error || `tail: ${fileArg}: Error reading file`, exitCode: 1 };
        }
        text = res.content || '';
      }

      const allLines = text.split('\n');
      const lines = allLines.slice(Math.max(0, allLines.length - count));
      return { stdout: lines.join('\n'), stderr: '', exitCode: 0 };
    });

    // 14. GREP
    this.register('grep', (args, ctx) => {
      let caseInsensitive = false;
      let invertMatch = false;
      let lineNumbers = false;
      let pattern = '';
      let fileArg: string | undefined;

      for (const arg of args) {
        if (arg === '-i') caseInsensitive = true;
        else if (arg === '-v') invertMatch = true;
        else if (arg === '-n') lineNumbers = true;
        else if (!pattern) pattern = arg.replace(/['"]/g, '');
        else if (!fileArg) fileArg = arg;
      }

      if (!pattern) {
        return { stdout: '', stderr: 'Usage: grep [-i] [-v] [-n] <pattern> [file]', exitCode: 2 };
      }

      let text = ctx.stdin;
      if (fileArg) {
        const res = ctx.fs.readFile(ctx.cwd, fileArg, ctx.uid, ctx.gid);
        if (!res.success) {
          return { stdout: '', stderr: res.error || `grep: ${fileArg}: No such file`, exitCode: 2 };
        }
        text = res.content || '';
      }

      const regex = new RegExp(pattern, caseInsensitive ? 'i' : '');
      const lines = text.split('\n');
      const matched: string[] = [];

      lines.forEach((line, index) => {
        const isMatch = regex.test(line);
        const shouldInclude = invertMatch ? !isMatch : isMatch;
        if (shouldInclude) {
          matched.push(lineNumbers ? `${index + 1}:${line}` : line);
        }
      });

      return {
        stdout: matched.join('\n'),
        stderr: '',
        exitCode: matched.length > 0 ? 0 : 1,
      };
    });

    // 15. FIND
    this.register('find', (args, ctx) => {
      let startPath = '.';
      let namePattern = '';
      let typeFilter: 'f' | 'd' | undefined;

      for (let i = 0; i < args.length; i++) {
        if (args[i] === '-name' && args[i + 1]) {
          namePattern = args[i + 1].replace(/['"]/g, '');
          i++;
        } else if (args[i] === '-type' && args[i + 1]) {
          typeFilter = args[i + 1] === 'f' || args[i + 1] === 'd' ? (args[i + 1] as 'f' | 'd') : undefined;
          i++;
        } else if (!args[i].startsWith('-')) {
          startPath = args[i];
        }
      }

      const segments = ctx.fs.resolvePath(ctx.cwd, startPath);
      const rootNode = ctx.fs.getNode(segments);

      if (!rootNode) {
        return { stdout: '', stderr: `find: '${startPath}': No such file or directory`, exitCode: 1 };
      }

      const results: string[] = [];
      const traverse = (node: FsNode, currentPath: string) => {
        let match = true;
        if (typeFilter === 'f' && node.type !== 'file') match = false;
        if (typeFilter === 'd' && node.type !== 'dir') match = false;
        if (namePattern) {
          const reg = new RegExp('^' + namePattern.replace(/\*/g, '.*') + '$');
          if (!reg.test(node.name)) match = false;
        }

        if (match) {
          results.push(currentPath);
        }

        if (node.type === 'dir' && node.children) {
          // Check permission to read directory before traversing
          if (ctx.fs.checkPermission(node, ctx.uid, ctx.gid, 'r')) {
            for (const child of Object.values(node.children)) {
              traverse(child, currentPath === '/' ? `/${child.name}` : `${currentPath}/${child.name}`);
            }
          }
        }
      };

      traverse(rootNode, startPath);
      return { stdout: results.join('\n'), stderr: '', exitCode: 0 };
    });

    // 16. STAT
    this.register('stat', (args, ctx) => {
      if (args.length === 0) {
        return { stdout: '', stderr: 'stat: missing operand', exitCode: 1 };
      }

      const targetPath = args[0];
      const segments = ctx.fs.resolvePath(ctx.cwd, targetPath);
      const node = ctx.fs.getNode(segments);

      if (!node) {
        return { stdout: '', stderr: `stat: cannot stat '${targetPath}': No such file or directory`, exitCode: 1 };
      }

      return {
        stdout: `  File: ${node.name}
  Size: ${node.size}        Blocks: ${Math.ceil(node.size / 512)}       IO Block: 4096   ${node.type === 'dir' ? 'directory' : 'regular file'}
Device: 0/42        Inode: 1048576     Links: 1
Access: (0${node.mode.toString(8)}/${node.permissions})  Uid: ( ${node.uid}/    ${node.owner})   Gid: ( ${node.gid}/    ${node.group})
Access: ${node.mtime.toISOString()}
Modify: ${node.mtime.toISOString()}
Change: ${node.mtime.toISOString()}`,
        stderr: '',
        exitCode: 0,
      };
    });

    // 17. SUDO
    this.register('sudo', (args, ctx) => {
      const fullArgs = args.join(' ');

      if (fullArgs.includes('-l')) {
        return {
          stdout: `Matching Defaults entries for ${ctx.user} on ${ctx.hostname}:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\\:/usr/local/bin\\:/usr/sbin\\:/usr/bin

User ${ctx.user} may run the following commands on ${ctx.hostname}:
    (ALL : ALL) NOPASSWD: /usr/bin/find`,
          stderr: '',
          exitCode: 0,
        };
      }

      // GTFOBins Privilege Escalation via find
      if (fullArgs.includes('/usr/bin/find') && fullArgs.includes('/bin/sh')) {
        return {
          stdout: `[+] Sudo privilege escalation successful!\n# Spawning interactive root shell (euid=0)...`,
          stderr: '',
          exitCode: 0,
          enterShell: { user: 'root', uid: 0, group: 'root', gid: 0, host: ctx.hostname, cwd: '/root' },
          soundTrigger: 'connect',
          targetCompromised: 'ROOT',
        };
      }

      return {
        stdout: '',
        stderr: `[sudo] password for ${ctx.user}: \nsudo: a password is required`,
        exitCode: 1,
      };
    });

    // 18. NMAP
    this.register('nmap', (args, ctx) => {
      const targetIp = args.find((a) => a.includes('10.10.') || a === '127.0.0.1' || a.includes('.htb'));

      if (!targetIp) {
        return { stdout: '', stderr: 'Failed to resolve IP or target. Usage: nmap -sV -sC <ip>', exitCode: 1 };
      }

      const machine = ctx.activeTarget;
      if (!machine || (machine.ip !== targetIp && !targetIp.includes(machine.id))) {
        return {
          stdout: `Starting Nmap 7.94 ( https://nmap.org ) at 2026-10-29 07:08 UTC
Note: Host seems down. If it is really up, but blocking our ping probes, try -Pn
Nmap done: 1 IP address (0 hosts up) scanned in 2.14 seconds`,
          stderr: '',
          exitCode: 0,
        };
      }

      const portRows = machine.ports
        .map((p) => `${(p.port.toString() + '/tcp').padEnd(10)} ${p.state.padEnd(8)} ${p.service.padEnd(16)} ${p.version}`)
        .join('\n');

      return {
        stdout: `Starting Nmap 7.94 ( https://nmap.org ) at 2026-10-29 07:08 UTC
Nmap scan report for ${machine.name} (${machine.ip})
Host is up (0.024s latency).
Not shown: 997 closed tcp ports (reset)

PORT       STATE    SERVICE          VERSION
${portRows}

Service Info: OS: ${machine.os}; CPE: cpe:/o:linux:linux_kernel

Nmap done: 1 IP address (1 host up) scanned in 3.42 seconds`,
        stderr: '',
        exitCode: 0,
        soundTrigger: 'scan',
        targetCompromised: 'RECON',
      };
    });

    // 19. GOBUSTER
    this.register('gobuster', (args) => {
      const urlArg = args.find((_, i) => args[i - 1] === '-u') || '';

      if (!urlArg) {
        return { stdout: '', stderr: 'Error: required flag `-u` missing. Usage: gobuster dir -u http://10.10.11.45 -w common.txt', exitCode: 1 };
      }

      if (urlArg.includes('10.10.11.45') || urlArg.includes('ecorp-hr')) {
        return {
          stdout: `===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     ${urlArg}
[+] Method:                  GET
[+] Wordlist:                common.txt
===============================================================
Starting gobuster directory enumeration mode
===============================================================
/admin                (Status: 403) [Size: 284]
/api                  (Status: 200) [Size: 1042]
/login                (Status: 200) [Size: 4210]
/portal               (Status: 200) [Size: 1820]
/uploads              (Status: 301) [Size: 312]
===============================================================
Finished
===============================================================`,
          stderr: '',
          exitCode: 0,
          soundTrigger: 'scan',
        };
      }

      return { stdout: '', stderr: 'Error: unable to connect to host.', exitCode: 1 };
    });

    // 20. NETCAT (NC)
    this.register('nc', (args) => {
      const raw = args.join(' ');
      if (raw.includes('-l') && (raw.includes('4444') || raw.includes('9001'))) {
        return {
          stdout: `listening on [any] 4444 ...
connect to [10.10.14.22] from (UNKNOWN) [10.10.11.45] 48290
Linux ecorp-hr 5.15.0-89-generic #99-Ubuntu SMP x86_64
uid=33(www-data) gid=33(www-data) groups=33(www-data)
$ whoami
www-data
$ `,
          stderr: '',
          exitCode: 0,
          enterShell: { user: 'www-data', uid: 33, group: 'www-data', gid: 33, host: 'ecorp-hr', cwd: '/home/alex' },
          soundTrigger: 'connect',
          targetCompromised: 'USER',
        };
      }
      return { stdout: '', stderr: 'usage: nc -lvnp <port>', exitCode: 1 };
    });

    // 21. CURL
    this.register('curl', (args) => {
      const raw = args.join(' ');
      if (raw.includes('jndi:ldap') || raw.includes('jndi:rmi')) {
        return {
          stdout: `HTTP/1.1 200 OK
Server: Apache/2.4.49 (Unix)
Content-Type: text/html;charset=UTF-8

[+] JNDI Lookup Triggered! Connecting back to LDAP referral server...
[+] Remote bytecode loaded into JVM volatile memory!
[+] Spawning reverse shell socket to 10.10.14.22:4444...`,
          stderr: '',
          exitCode: 0,
          soundTrigger: 'connect',
        };
      }

      const url = args.find((a) => a.startsWith('http://') || a.startsWith('https://'));
      if (url && (url.includes('10.10.11.45') || url.includes('ecorp-hr'))) {
        return {
          stdout: `<!DOCTYPE html>
<html><head><title>E-Corp Employee Portal</title></head>
<body><h1>E-Corp Internal HR v2.4.1</h1>
<p>Auditing via Log4j Enterprise Subsystem.</p>
</body></html>`,
          stderr: '',
          exitCode: 0,
        };
      }

      return { stdout: '', stderr: `curl: (7) Failed to connect to host: Connection refused`, exitCode: 7 };
    });

    // 22. HYDRA
    this.register('hydra', (args) => {
      const raw = args.join(' ');
      if (raw.includes('admin') && raw.includes('10.10.11.')) {
        return {
          stdout: `Hydra v9.5 (c) 2023 by van Hauser / THC & David Maciejak
[DATA] attacking ssh://10.10.11.45:22/
[STATUS] 10.00 tries/min, 10 tries in 00:01h, 8 to_do...
[22][ssh] host: 10.10.11.45   login: admin   password: password123
1 of 1 target completed, 1 valid password found`,
          stderr: '',
          exitCode: 0,
          soundTrigger: 'scan',
        };
      }
      return { stdout: '', stderr: 'Hydra: missing parameters. Usage: hydra -l admin -P rockyou.txt ssh://<ip>', exitCode: 1 };
    });

    // 23. EXIT
    this.register('exit', (_args, ctx) => {
      if (ctx.inReverseShell) {
        return {
          stdout: `[!] Connection closed by foreign host.`,
          stderr: '',
          exitCode: 0,
          exitShell: true,
        };
      }
      return {
        stdout: `logout`,
        stderr: '',
        exitCode: 0,
      };
    });
  }
}
