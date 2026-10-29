import { SimulationEngine } from '../simulationEngine';
import { ExecutionContext, ExecutionOutput } from '../../services/commandRegistry';

export class SimulatedCommandAdapters {
  private static engine = SimulationEngine.getInstance();

  /**
   * 1. NMAP ADAPTER
   */
  public static nmap(args: string[], _ctx: ExecutionContext): ExecutionOutput {
    if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
      return {
        stdout: `Nmap 7.94 ( https://nmap.org )
Usage: nmap [Scan Type(s)] [Options] {target specification}
TARGET SPECIFICATION:
  Can pass hostnames, IP addresses, networks, etc.
SCAN TECHNIQUES:
  -sS/sT/sA/sW/sM: TCP SYN/Connect()/ACK/Window/Maimon scans
  -sV: Probe open ports to determine service/version info
  -sC: equivalent to --script=default
  -p <port ranges>: Only scan specified ports
  -Pn: Treat all hosts as online -- skip host discovery`,
        stderr: '',
        exitCode: 0,
      };
    }

    const targetArg = args.find((a) => !a.startsWith('-')) || '';
    if (!targetArg) {
      return { stdout: '', stderr: 'Failed to resolve IP or target. Usage: nmap -sV -sC <ip>', exitCode: 1 };
    }

    const machine = this.engine.getMachine(targetArg);
    if (!machine) {
      return {
        stdout: `Starting Nmap 7.94 ( https://nmap.org ) at 2026-10-29 07:15 UTC
Note: Host seems down. If it is really up, but blocking our ping probes, try -Pn
Nmap done: 1 IP address (0 hosts up) scanned in 2.05 seconds`,
        stderr: '',
        exitCode: 0,
      };
    }

    // Network reachability check
    const reachableCheck = this.engine.canReachIp(machine.ip);
    if (!reachableCheck.reachable) {
      return {
        stdout: `Starting Nmap 7.94 ( https://nmap.org ) at 2026-10-29 07:15 UTC
Note: Host seems down. ${reachableCheck.reason || 'No route to host.'}
Nmap done: 1 IP address (0 hosts up) scanned in 3.00 seconds`,
        stderr: '',
        exitCode: 0,
      };
    }

    // Discover ports in simulation engine
    for (const p of machine.ports) {
      this.engine.discoverPort(machine.id, p.port);
    }

    // Auto-complete reconnaissance objective if prerequisites met
    if (machine.id === 'ecorp-hr') {
      this.engine.completeObjective(machine.id, 'ecorp-obj-1');
    } else if (machine.id === 'corp-dc01' && this.engine.isObjectiveUnlocked('dc-obj-1')) {
      this.engine.completeObjective(machine.id, 'dc-obj-1');
    }

    const portRows = machine.ports
      .map((p) => `${(p.port.toString() + '/tcp').padEnd(10)} ${p.state.padEnd(8)} ${p.service.padEnd(16)} ${p.version}`)
      .join('\n');

    return {
      stdout: `Starting Nmap 7.94 ( https://nmap.org ) at 2026-10-29 07:15 UTC
Nmap scan report for ${machine.name} (${machine.ip})
Host is up (0.024s latency).
Not shown: 997 closed tcp ports (reset)

PORT       STATE    SERVICE          VERSION
${portRows}

Service Info: OS: ${machine.os}; OS CPE: cpe:/o:linux:linux_kernel

Nmap done: 1 IP address (1 host up) scanned in 2.84 seconds`,
      stderr: '',
      exitCode: 0,
      soundTrigger: 'scan',
      targetCompromised: 'RECON',
    };
  }

  /**
   * 2. GOBUSTER ADAPTER
   */
  public static gobuster(args: string[]): ExecutionOutput {
    if (args.length === 0 || args[0] !== 'dir') {
      return {
        stdout: '',
        stderr: 'Error: invalid mode. Usage: gobuster dir -u <url> -w <wordlist>',
        exitCode: 1,
      };
    }

    const uIdx = args.indexOf('-u');
    const url = uIdx !== -1 && args[uIdx + 1] ? args[uIdx + 1] : '';

    if (!url) {
      return {
        stdout: '',
        stderr: 'Error: required flag `-u` missing. Usage: gobuster dir -u http://10.10.11.45 -w common.txt',
        exitCode: 1,
      };
    }

    let targetIp = '';
    try {
      const parsed = new URL(url.startsWith('http') ? url : `http://${url}`);
      targetIp = parsed.hostname;
    } catch {
      targetIp = url.replace('http://', '').replace('https://', '').split('/')[0].split(':')[0];
    }

    const machine = this.engine.getMachine(targetIp);
    if (!machine || !machine.webRoutes) {
      return {
        stdout: '',
        stderr: `Error: unable to connect to host: ${url}`,
        exitCode: 1,
      };
    }

    const reachCheck = this.engine.canReachIp(machine.ip);
    if (!reachCheck.reachable) {
      return {
        stdout: '',
        stderr: `Error: ${reachCheck.reason || 'Network unreachable'}`,
        exitCode: 1,
      };
    }

    // Discover routes in engine
    for (const r of machine.webRoutes) {
      if (r.path !== '/') {
        this.engine.discoverRoute(machine.id, r.path);
      }
    }

    // Check challenge objective completion
    if (machine.id === 'ecorp-hr' && this.engine.isObjectiveUnlocked('ecorp-obj-2')) {
      this.engine.completeObjective(machine.id, 'ecorp-obj-2');
    }

    const routeRows = machine.webRoutes
      .filter((r) => r.path !== '/')
      .map((r) => `${r.path.padEnd(20)} (Status: ${r.statusCode}) [Size: ${r.responseBody.length}]`)
      .join('\n');

    return {
      stdout: `===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     ${url}
[+] Method:                  GET
[+] Wordlist:                common.txt
[+] Negative Status codes:   404
===============================================================
Starting gobuster directory enumeration mode
===============================================================
${routeRows}
===============================================================
Finished
===============================================================`,
      stderr: '',
      exitCode: 0,
      soundTrigger: 'scan',
    };
  }

  /**
   * 3. CURL ADAPTER
   */
  public static curl(args: string[]): ExecutionOutput {
    if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
      return {
        stdout: 'Usage: curl [options...] <url>\n -X, --request <command>   Specify request command to use\n -d, --data <data>         HTTP POST data\n -H, --header <header>     Pass custom header(s) to server\n -i, --include             Include protocol response headers in the output',
        stderr: '',
        exitCode: 0,
      };
    }

    let method = 'GET';
    let data = '';
    const headers: Record<string, string> = {
      'User-Agent': 'curl/7.88.1',
      Accept: '*/*',
    };
    let targetUrl = '';

    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if ((a === '-X' || a === '--request') && args[i + 1]) {
        method = args[i + 1].toUpperCase();
        i++;
      } else if ((a === '-d' || a === '--data') && args[i + 1]) {
        data = args[i + 1];
        if (method === 'GET') method = 'POST';
        i++;
      } else if ((a === '-H' || a === '--header') && args[i + 1]) {
        const headerStr = args[i + 1];
        const splitIdx = headerStr.indexOf(':');
        if (splitIdx !== -1) {
          headers[headerStr.slice(0, splitIdx).trim()] = headerStr.slice(splitIdx + 1).trim();
        }
        i++;
      } else if (!a.startsWith('-')) {
        targetUrl = a;
      }
    }

    if (!targetUrl) {
      return { stdout: '', stderr: 'curl: no URL specified!\ncurl: try \'curl --help\' for more information', exitCode: 2 };
    }

    let parsedPath = '/';
    let targetHost = targetUrl;
    try {
      const u = new URL(targetUrl.startsWith('http') ? targetUrl : `http://${targetUrl}`);
      targetHost = u.hostname;
      parsedPath = u.pathname || '/';
    } catch {
      targetHost = targetUrl.replace('http://', '').replace('https://', '').split('/')[0].split(':')[0];
      const slashIdx = targetUrl.indexOf('/', targetUrl.indexOf('//') + 2);
      if (slashIdx !== -1) {
        parsedPath = targetUrl.slice(slashIdx);
      }
    }

    const machine = this.engine.getMachine(targetHost);
    if (!machine) {
      return { stdout: '', stderr: `curl: (6) Could not resolve host: ${targetHost}`, exitCode: 6 };
    }

    const res = this.engine.handleHttpRequest(machine.ip, {
      method,
      path: parsedPath,
      headers,
      body: data,
    });

    // Check if JNDI payload triggered
    const rawArgs = args.join(' ');
    if (rawArgs.includes('jndi:ldap') || rawArgs.includes('${jndi:')) {
      if (machine.id === 'ecorp-hr') {
        if (this.engine.isObjectiveUnlocked('ecorp-obj-3')) {
          this.engine.completeObjective(machine.id, 'ecorp-obj-3');
        }
      }
    }

    return {
      stdout: res.body,
      stderr: '',
      exitCode: res.statusCode >= 400 && res.statusCode !== 404 && res.statusCode !== 403 ? 1 : 0,
      soundTrigger: rawArgs.includes('jndi:') ? 'connect' : undefined,
    };
  }

  /**
   * 4. SSH ADAPTER
   */
  public static ssh(args: string[], _ctx: ExecutionContext): ExecutionOutput {
    if (args.length === 0) {
      return { stdout: '', stderr: 'usage: ssh [-i identity_file] [user@]hostname [command]', exitCode: 1 };
    }

    let user = 'kali';
    let targetHost = '';

    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '-i' && args[i + 1]) {
        i++;
      } else if (!a.startsWith('-')) {
        if (a.includes('@')) {
          const parts = a.split('@');
          user = parts[0];
          targetHost = parts[1];
        } else {
          targetHost = a;
        }
      }
    }

    const machine = this.engine.getMachine(targetHost);
    if (!machine) {
      return { stdout: '', stderr: `ssh: Could not resolve hostname ${targetHost}: Name or service not known`, exitCode: 255 };
    }

    const reachCheck = this.engine.canReachIp(machine.ip);
    if (!reachCheck.reachable) {
      return { stdout: '', stderr: `ssh: connect to host ${targetHost} port 22: ${reachCheck.reason || 'Connection timed out'}`, exitCode: 255 };
    }

    const targetUser = machine.users.find((u) => u.username === user);
    if (!targetUser) {
      return { stdout: '', stderr: `Permission denied (publickey,password).`, exitCode: 1 };
    }

    // Check if user has an authorized key or is alex
    if (user === 'alex') {
      this.engine.createSession(machine.id, 'SSH', 'alex', '/home/alex');
      return {
        stdout: `Welcome to ${machine.name} (${machine.osVersion})
 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
Last login: Thu Oct 29 06:12:01 2026 from 10.10.14.22
alex@${machine.hostname}:~$ `,
        stderr: '',
        exitCode: 0,
        enterShell: {
          user: 'alex',
          uid: targetUser.uid,
          group: targetUser.groups[0] || 'alex',
          gid: targetUser.gid,
          host: machine.hostname,
          cwd: '/home/alex',
        },
        soundTrigger: 'connect',
        targetCompromised: 'USER',
      };
    }

    return { stdout: '', stderr: `${user}@${targetHost}: Permission denied (publickey,password).`, exitCode: 1 };
  }

  /**
   * 5. SUDO ADAPTER
   */
  public static sudo(args: string[], ctx: ExecutionContext): ExecutionOutput {
    const fullArgs = args.join(' ');
    const machine = ctx.activeTarget ? this.engine.getMachine(ctx.activeTarget.id) : undefined;

    if (fullArgs.includes('-l')) {
      if (ctx.user === 'root') {
        return {
          stdout: `User root may run the following commands on ${ctx.hostname}:\n    (ALL : ALL) ALL`,
          stderr: '',
          exitCode: 0,
        };
      }

      if (ctx.user === 'alex' || ctx.user === 'www-data') {
        if (machine && machine.id === 'ecorp-hr' && this.engine.isObjectiveUnlocked('ecorp-obj-6')) {
          this.engine.completeObjective('ecorp-hr', 'ecorp-obj-6');
        }

        return {
          stdout: `Matching Defaults entries for ${ctx.user} on ${ctx.hostname}:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\\:/usr/local/bin\\:/usr/sbin\\:/usr/bin

User ${ctx.user} may run the following commands on ${ctx.hostname}:
    (ALL : ALL) NOPASSWD: /usr/bin/find`,
          stderr: '',
          exitCode: 0,
        };
      }

      return {
        stdout: '',
        stderr: `[sudo] password for ${ctx.user}: \nsudo: a password is required`,
        exitCode: 1,
      };
    }

    // GTFOBins Privilege Escalation via find
    if (fullArgs.includes('/usr/bin/find') && (fullArgs.includes('/bin/sh') || fullArgs.includes('/bin/bash') || fullArgs.includes('sh'))) {
      if (machine && machine.id === 'ecorp-hr') {
        this.engine.completeObjective('ecorp-hr', 'ecorp-obj-7');
        this.engine.setMachineCompromiseLevel('ecorp-hr', 'ROOT');
      }

      return {
        stdout: `[+] Sudo GTFOBins privilege escalation verified!
[+] Spawning interactive root shell session (euid=0)...
root@${ctx.hostname}:/root# `,
        stderr: '',
        exitCode: 0,
        enterShell: {
          user: 'root',
          uid: 0,
          group: 'root',
          gid: 0,
          host: ctx.hostname,
          cwd: '/root',
        },
        soundTrigger: 'connect',
        targetCompromised: 'ROOT',
      };
    }

    return {
      stdout: '',
      stderr: `[sudo] password for ${ctx.user}: \nsudo: a password is required`,
      exitCode: 1,
    };
  }

  /**
   * 6. HYDRA ADAPTER
   */
  public static hydra(args: string[]): ExecutionOutput {
    const raw = args.join(' ');
    if (args.length === 0 || args.includes('-h')) {
      return {
        stdout: `Hydra v9.5 (c) 2023 by van Hauser / THC & David Maciejak
Syntax: hydra [[[-l LOGIN|-L FILE] [-p PASS|-P FILE]] | [-C FILE]] [-e nsr] [-o FILE] [-t TASKS] [-M FILE [-T TASKS]] [-w TIME] [-W TIME] [-f] [-s PORT] [-x MIN:MAX:CHARSET] [[service://]server[:PORT][/OPT]]`,
        stderr: '',
        exitCode: 0,
      };
    }

    const machine = this.engine.getMachines().find((m) => raw.includes(m.ip) || raw.includes(m.hostname));
    if (!machine) {
      return { stdout: '', stderr: 'Hydra: Target host unreachable or unspecified.', exitCode: 1 };
    }

    if (machine.id === 'iron-vault' && raw.includes('finance_admin') && (raw.includes('common.txt') || raw.includes('rockyou.txt') || raw.includes('passwords'))) {
      this.engine.addEvidence({
        machineId: 'iron-vault',
        type: 'CREDENTIAL',
        name: 'Finance Admin SSH Password',
        source: 'Hydra SSH Brute-Force (10.10.11.82:22)',
        value: 'finance_admin:password123',
        description: 'Compromised via credential dictionary attack against SSH service.',
      });

      return {
        stdout: `Hydra v9.5 (c) 2023 by van Hauser / THC & David Maciejak
[DATA] attacking ssh://${machine.ip}:22/
[STATUS] 14.00 tries/min, 14 tries in 00:01h, 8 to_do...
[22][ssh] host: ${machine.ip}   login: finance_admin   password: password123
1 of 1 target completed, 1 valid password found`,
        stderr: '',
        exitCode: 0,
        soundTrigger: 'scan',
      };
    }

    if (raw.includes('alex') && raw.includes('10.10.11.45')) {
      return {
        stdout: `Hydra v9.5 (c) 2023 by van Hauser / THC & David Maciejak
[DATA] attacking ssh://10.10.11.45:22/
[STATUS] 10.00 tries/min, 10 tries in 00:01h, 8 to_do...
[22][ssh] host: 10.10.11.45   login: alex   password: alexmorgan_dev
1 of 1 target completed, 1 valid password found`,
        stderr: '',
        exitCode: 0,
        soundTrigger: 'scan',
      };
    }

    return {
      stdout: `Hydra v9.5 (c) 2023 by van Hauser / THC & David Maciejak
[DATA] attacking target service
[STATUS] 100 tries tested... 0 valid passwords found.`,
      stderr: '',
      exitCode: 0,
    };
  }

  /**
   * 7. SQLMAP ADAPTER
   */
  public static sqlmap(args: string[]): ExecutionOutput {
    if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
      return {
        stdout: `sqlmap/1.7.11#stable - automatic SQL injection and database takeover tool
http://sqlmap.org
Usage: python3 sqlmap.py [options]
Options:
  -u URL, --url=URL   Target URL (e.g. "http://www.site.com/vuln.php?id=1")
  --data=DATA         Data string to be sent through POST (e.g. "id=1")
  --dbs               Enumerate DBMS databases
  --batch             Never ask for user input, use the default behavior`,
        stderr: '',
        exitCode: 0,
      };
    }

    const raw = args.join(' ');
    if (raw.includes('10.10.11.82') || raw.includes('/api/login')) {
      const machine = this.engine.getMachine('iron-vault');
      if (machine) {
        if (this.engine.isObjectiveUnlocked('iron-obj-2')) {
          this.engine.completeObjective('iron-vault', 'iron-obj-2');
        }

        this.engine.addEvidence({
          machineId: 'iron-vault',
          type: 'JWT',
          name: 'Extracted Admin JWT Signature',
          source: 'sqlmap SQLi Extraction (/api/login)',
          value: 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiZmluYW5jZV9hZG1pbiJ9.',
          description: 'Vulnerable JWT token generated via SQL injection authentication bypass.',
        });
      }

      return {
        stdout: `        ___
       __H__
 ___ ___["]_____ ___ ___  {1.7.11#stable}
|_ -| . [']     | .'| . |
|___|_  ["]_|_|_|__,|  _|
      |_|V...       |_|   http://sqlmap.org

[*] starting @ 07:22:15 /2026-10-29/

[07:22:15] [INFO] testing connection to the target URL
[07:22:16] [INFO] checking if the target is protected by some kind of WAF/IPS
[07:22:16] [INFO] testing if the target URL content is stable
[07:22:17] [INFO] testing if parameter 'username' is dynamic
[07:22:17] [INFO] heuristics detected that parameter 'username' might be injectable (type: boolean-based blind)
[07:22:18] [INFO] confirming boolean-based blind injection on 'username'
POST parameter 'username' is vulnerable!
Type: boolean-based blind
Title: AND boolean-based blind - WHERE or HAVING clause
Payload: username=admin' AND 7421=7421-- x&password=test

[07:22:19] [INFO] the back-end DBMS is MySQL
back-end DBMS: MySQL >= 8.0.0
available databases [2]:
[*] information_schema
[*] ironbank_db

[+] SQL Injection confirmed on endpoint /api/login`,
        stderr: '',
        exitCode: 0,
        soundTrigger: 'scan',
      };
    }

    return {
      stdout: '[*] starting sqlmap...\n[!] all tested parameters do not appear to be injectable.',
      stderr: '',
      exitCode: 0,
    };
  }

  /**
   * 8. NETCAT (NC) ADAPTER
   */
  public static nc(args: string[]): ExecutionOutput {
    const raw = args.join(' ');

    // Listener Mode: Catch reverse shell
    if (raw.includes('-l') && (raw.includes('4444') || raw.includes('9001'))) {
      const machine = this.engine.getMachine('ecorp-hr');
      if (machine) {
        if (this.engine.isObjectiveUnlocked('ecorp-obj-4')) {
          this.engine.completeObjective('ecorp-hr', 'ecorp-obj-4');
        }
        this.engine.createSession('ecorp-hr', 'REVERSE_SHELL', 'www-data', '/home/alex');
      }

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
        enterShell: {
          user: 'www-data',
          uid: 33,
          group: 'www-data',
          gid: 33,
          host: 'ecorp-hr',
          cwd: '/home/alex',
        },
        soundTrigger: 'connect',
        targetCompromised: 'USER',
      };
    }

    // Connect mode: banner grab
    if (!raw.includes('-l')) {
      const host = args.find((a) => !a.startsWith('-')) || '';
      const portStr = args.find((a, idx) => idx > 0 && !a.startsWith('-') && !isNaN(Number(a))) || '';
      const port = Number(portStr);

      const machine = this.engine.getMachine(host);
      if (machine && port) {
        const portInfo = machine.ports.find((p) => p.port === port);
        if (portInfo) {
          return {
            stdout: portInfo.banner || `${portInfo.service} ${portInfo.version}`,
            stderr: '',
            exitCode: 0,
          };
        }
      }
    }

    return { stdout: '', stderr: 'usage: nc [-lvnp port] or nc [hostname] [port]', exitCode: 1 };
  }

  /**
   * 9. LINPEAS ADAPTER
   */
  public static linpeas(ctx: ExecutionContext): ExecutionOutput {
    const isEcorp = ctx.hostname === 'ecorp-hr' || ctx.cwd.includes('alex') || ctx.user === 'www-data' || ctx.user === 'alex';

    if (isEcorp) {
      if (this.engine.isObjectiveUnlocked('ecorp-obj-6')) {
        this.engine.completeObjective('ecorp-hr', 'ecorp-obj-6');
      }

      return {
        stdout: `                            Linux Privilege Escalation Awesome Script
                                         by @carlospolop

  [+] OS: Linux version 5.15.0-89-generic (Ubuntu 22.04.3 LTS)
  [+] User: ${ctx.user} (uid=${ctx.uid})
  [+] Hostname: ${ctx.hostname}

  [+] SUDO PERMISSIONS:
  ╔═════════════════════════════════════════════════════════════════════════╗
  ║ [!] User ${ctx.user} may run the following commands on ${ctx.hostname}:     ║
  ║     (ALL : ALL) NOPASSWD: /usr/bin/find                                 ║
  ╚═════════════════════════════════════════════════════════════════════════╝
  [VULNERABLE GTFOBINS]: https://gtfobins.github.io/gtfobins/find/#sudo
  Execute: sudo /usr/bin/find . -exec /bin/sh \\; -quit

  [+] INTERESTING SUID BINARIES:
  -rwsr-xr-x 1 root root 55560 Feb 21  2024 /usr/bin/passwd
  -rwsr-xr-x 1 root root 88304 Feb 21  2024 /usr/bin/gpasswd

  [+] CRON JOBS:
  * * * * * root /root/scripts/backup.sh >/dev/null 2>&1`,
        stderr: '',
        exitCode: 0,
      };
    }

    return {
      stdout: `[+] LinPEAS Quick Scan for ${ctx.hostname}\n[+] Current user: ${ctx.user}\n[+] No obvious automated privesc vectors detected.`,
      stderr: '',
      exitCode: 0,
    };
  }
}
