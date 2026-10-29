import { VirtualFileSystem, FsNode } from './virtualFs';
import { TargetMachine } from '../types';
import { SimulatedCommandAdapters } from '../simulation/adapters/commandAdapters';
import { SimulationEngine } from '../simulation/simulationEngine';

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
  ps [aux]                 Report a snapshot of the current processes
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
  sqlmap -u <url>          Automatic SQL injection & database takeover tool
  curl [flags] <url>       Transfer a URL / API payload delivery
  ssh [user@]host          OpenSSH remote login client
  nc -lvnp <port>          Arbitrary TCP/UDP listener and reverse shell catcher
  sudo [-l] [command]      Execute a command as another user / root
  linpeas.sh               Linux Privilege Escalation Awesome Script
  bash [script]            Execute shell script or trigger scheduled task
  smbclient -L //host      Enumerate SMB shares and inspect shared files
  GetUserSPNs.py -request  Active Directory Kerberoasting ticket harvester
  john --wordlist <hash>   Offline password hash cracking utility
  secretsdump.py <target>  Dump Active Directory domain hashes via DCSync
  psexec.py <target>       Pass-the-hash remote Windows administrative execution
  crackmapexec smb <host>  Swiss army knife for Active Directory enumeration

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
        if (file.includes('root.txt') && ctx.hostname === 'iron-vault') {
          if (ctx.uid === 0) {
            outputs.push('ROOTRANGE{r00t_cr0n_ov3rwr1t3_pwn4g3}\n');
            continue;
          }
        }
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
    this.register('sudo', (args, ctx) => SimulatedCommandAdapters.sudo(args, ctx));

    // 18. NMAP
    this.register('nmap', (args, ctx) => SimulatedCommandAdapters.nmap(args, ctx));

    // 19. GOBUSTER
    this.register('gobuster', (args) => SimulatedCommandAdapters.gobuster(args));

    // 20. NETCAT (NC)
    this.register('nc', (args) => SimulatedCommandAdapters.nc(args));

    // 21. CURL
    this.register('curl', (args) => SimulatedCommandAdapters.curl(args));

    // 22. SSH
    this.register('ssh', (args, ctx) => SimulatedCommandAdapters.ssh(args, ctx));

    // 23. HYDRA
    this.register('hydra', (args) => SimulatedCommandAdapters.hydra(args));

    // 24. SQLMAP
    this.register('sqlmap', (args) => SimulatedCommandAdapters.sqlmap(args));

    // 25. LINPEAS
    const linpeasHandler: CommandHandler = (_args, ctx) => SimulatedCommandAdapters.linpeas(ctx);
    this.register('linpeas', linpeasHandler);
    this.register('linpeas.sh', linpeasHandler);
    this.register('./linpeas.sh', linpeasHandler);

    // 25b. BASH / SH / SCRIPT EXECUTION
    const scriptHandler: CommandHandler = (args, ctx) => SimulatedCommandAdapters.executeScript(args, ctx);
    this.register('bash', scriptHandler);
    this.register('sh', scriptHandler);
    this.register('./backup.sh', (args, ctx) => SimulatedCommandAdapters.executeScript(['backup.sh', ...args], ctx));
    this.register('/opt/ironbank/scripts/backup.sh', (args, ctx) => SimulatedCommandAdapters.executeScript(['backup.sh', ...args], ctx));

    // 25c. ACTIVE DIRECTORY & OFFENSIVE TOOLS
    this.register('smbclient', (args) => SimulatedCommandAdapters.smbclient(args));
    const spnHandler: CommandHandler = (args, ctx) => SimulatedCommandAdapters.getUserSPNs(args, ctx);
    this.register('getuserspns.py', spnHandler);
    this.register('getuserspns', spnHandler);

    const johnHandler: CommandHandler = (args) => SimulatedCommandAdapters.john(args);
    this.register('john', johnHandler);
    this.register('hashcat', johnHandler);

    const secretsHandler: CommandHandler = (args) => SimulatedCommandAdapters.secretsdump(args);
    this.register('secretsdump.py', secretsHandler);
    this.register('secretsdump', secretsHandler);

    const psexecHandler: CommandHandler = (args) => SimulatedCommandAdapters.psexec(args);
    this.register('psexec.py', psexecHandler);
    this.register('psexec', psexecHandler);

    const cmeHandler: CommandHandler = (args) => SimulatedCommandAdapters.crackmapexec(args);
    this.register('crackmapexec', cmeHandler);
    this.register('cme', cmeHandler);

    // 26. PS (VIRTUAL PROCESS TABLE)
    this.register('ps', (_args, ctx) => {
      const machine = SimulationEngine.getInstance().getMachine(ctx.hostname) ||
        (ctx.activeTarget ? SimulationEngine.getInstance().getMachine(ctx.activeTarget.id) : undefined);

      const processes = machine ? machine.processes : [
        { pid: 1, ppid: 0, user: 'root', cpu: 0.0, mem: 0.1, stat: 'Ss', command: '/sbin/init' },
        { pid: 320, ppid: 1, user: 'root', cpu: 0.0, mem: 0.2, stat: 'Ss', command: '/usr/sbin/sshd' },
        { pid: 450, ppid: 1, user: 'kali', cpu: 0.1, mem: 0.8, stat: 'Ss', command: '-bash' },
        { pid: 1024, ppid: 450, user: 'kali', cpu: 0.0, mem: 0.1, stat: 'R+', command: 'ps aux' },
      ];

      const header = 'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND';
      const rows = processes.map((p) => {
        return `${p.user.padEnd(8)} ${p.pid.toString().padStart(5)}  ${p.cpu.toFixed(1)}  ${p.mem.toFixed(1)}  104856  12480 ?        ${p.stat.padEnd(4)} 07:00   0:00 ${p.command}`;
      });

      return {
        stdout: `${header}\n${rows.join('\n')}`,
        stderr: '',
        exitCode: 0,
      };
    });

    // 27. RESET
    this.register('reset', (_args, ctx) => {
      if (ctx.activeTarget) {
        SimulationEngine.getInstance().resetMachine(ctx.activeTarget.id);
        return {
          stdout: `[+] Machine '${ctx.activeTarget.name}' has been reset to pristine initial state.`,
          stderr: '',
          exitCode: 0,
        };
      }
      return { stdout: '', stderr: 'No active target to reset.', exitCode: 1 };
    });

    // 28. EXIT
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
