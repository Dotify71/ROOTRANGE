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

    let targetArg = '';
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if ((a === '-p' || a === '-oN' || a === '--script') && i + 1 < args.length) {
        i++;
        continue;
      }
      if (!a.startsWith('-')) {
        targetArg = a;
      }
    }

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
    } else if (machine.id === 'iron-vault') {
      if (this.engine.isObjectiveUnlocked('iron-obj-1')) {
        this.engine.completeObjective('iron-vault', 'iron-obj-1');
      }
    } else if (machine.id === 'corp-dc01') {
      if (this.engine.isObjectiveUnlocked('dc-obj-1')) {
        this.engine.completeObjective('corp-dc01', 'dc-obj-1');
      }
    }

    const rawArgs = args.join(' ');
    // MS17-010 or SMB Enumeration script on corp-dc01
    let scriptOutput = '';
    if (machine.id === 'corp-dc01' && (rawArgs.includes('smb-vuln-ms17-010') || rawArgs.includes('smb-vuln') || rawArgs.includes('vuln'))) {
      if (this.engine.isObjectiveUnlocked('dc-obj-2')) {
        this.engine.completeObjective('corp-dc01', 'dc-obj-2');
      }
      this.engine.addEvidence({
        machineId: 'corp-dc01',
        type: 'VULNERABILITY',
        name: 'MS17-010 (EternalBlue) SMBv1 RCE Vulnerability',
        source: 'Nmap Script Scan (smb-vuln-ms17-010.nse)',
        value: 'CVE-2017-0143: Critical buffer overflow in Microsoft SMBv1 srv.sys driver',
        description: 'Vulnerable SMBv1 protocol detected on corp-dc01:445.',
      });
      scriptOutput = `
Host script results:
| smb-vuln-ms17-010: 
|   VULNERABLE:
|   Remote Code Execution vulnerability in Microsoft SMBv1 servers (ms17-010)
|     State: VULNERABLE
|     IDs:  CVE:CVE-2017-0143
|     Risk factor: HIGH
|       A critical remote code execution vulnerability exists in Microsoft SMBv1
|       srv.sys driver when handling SrvOs2FeaToNt SrvOs2FeaListSize buffer sizes.
|     Disclosure date: 2017-03-14
|     References:
|       https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2017-0143
|       https://technet.microsoft.com/en-us/library/security/ms17-010.aspx`;
    } else if (machine.id === 'corp-dc01' && (rawArgs.includes('smb-enum-shares') || rawArgs.includes('smb-enum'))) {
      if (this.engine.isObjectiveUnlocked('dc-obj-2')) {
        this.engine.completeObjective('corp-dc01', 'dc-obj-2');
      }
      scriptOutput = `
Host script results:
| smb-enum-shares: 
|   ADMIN$ (Disk, Remote Admin) - Access: DENIED
|   C$ (Disk, Default share) - Access: DENIED
|   IPC$ (IPC, Remote IPC) - Access: READ
|   SYSVOL (Disk, Logon server share) - Access: READ
|   Shared (Disk, Corporate IT Share) - Access: READ`;
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
${portRows}${scriptOutput}

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
      if ((a === '-X' || a === '--request') && args[i + 1] !== undefined) {
        method = args[i + 1].toUpperCase();
        i++;
      } else if ((a === '-d' || a === '--data') && args[i + 1] !== undefined) {
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

    if (machine.id === 'iron-vault') {
      if (parsedPath.includes('/api/login') && res.statusCode === 200 && res.body.includes('token')) {
        if (this.engine.isObjectiveUnlocked('iron-obj-2')) {
          this.engine.completeObjective('iron-vault', 'iron-obj-2');
        }
      } else if (parsedPath.includes('/api/vault') && res.statusCode === 200 && res.body.includes('ROOTRANGE{')) {
        if (this.engine.isObjectiveUnlocked('iron-obj-3')) {
          this.engine.completeObjective('iron-vault', 'iron-obj-3');
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

    // Check if user has an authorized key or is alex / finance_admin
    if (user === 'alex' && machine.id === 'ecorp-hr') {
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

    if (user === 'finance_admin' && (machine.id === 'iron-vault' || targetHost.includes('10.10.11.82') || targetHost.includes('ironbank'))) {
      this.engine.createSession(machine.id, 'SSH', 'finance_admin', '/home/finance_admin');
      return {
        stdout: `Welcome to ${machine.name} (${machine.osVersion})
 * Financial Core Ledger Node (Debian bullseye)
 * Internal Audit: Scheduled cron maintenance active
Last login: Thu Oct 29 07:11:02 2026 from 10.10.14.22
finance_admin@${machine.hostname}:~$ `,
        stderr: '',
        exitCode: 0,
        enterShell: {
          user: 'finance_admin',
          uid: targetUser.uid,
          group: targetUser.groups[0] || 'finance_admin',
          gid: targetUser.gid,
          host: machine.hostname,
          cwd: '/home/finance_admin',
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

    const isIronBank = ctx.hostname === 'iron-vault' || ctx.user === 'finance_admin';
    if (isIronBank) {
      return {
        stdout: `                            Linux Privilege Escalation Awesome Script
                                         by @carlospolop

  [+] OS: Linux version 5.10.0-28-amd64 (Debian 11 bullseye)
  [+] User: ${ctx.user} (uid=${ctx.uid})
  [+] Hostname: ${ctx.hostname}

  [+] CRON JOBS:
  * * * * * root /opt/ironbank/scripts/backup.sh >/dev/null 2>&1

  [+] VULNERABLE WRITABLE CRON TASK:
  ╔═════════════════════════════════════════════════════════════════════════╗
  ║ [!] /opt/ironbank/scripts/backup.sh is writable by group finance_admin! ║
  ║     -rwxrwxr-x 1 root finance_admin 260 Oct 29 07:00                    ║
  ╚═════════════════════════════════════════════════════════════════════════╝
  [VULNERABLE CRON HIJACKING]: Script executed by root every 60 seconds.
  Execute or overwrite: bash /opt/ironbank/scripts/backup.sh`,
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

  /**
   * 10. SCRIPT EXECUTION / CRON HIJACK ADAPTER
   */
  public static executeScript(args: string[], ctx: ExecutionContext): ExecutionOutput {
    const raw = args.join(' ');
    if (raw.includes('backup.sh')) {
      if (ctx.hostname === 'iron-vault' || ctx.user === 'finance_admin') {
        if (this.engine.isObjectiveUnlocked('iron-obj-4')) {
          this.engine.completeObjective('iron-vault', 'iron-obj-4');
        }
        this.engine.setMachineCompromiseLevel('iron-vault', 'ROOT');
        this.engine.addEvidence({
          machineId: 'iron-vault',
          type: 'CREDENTIAL',
          name: 'Root Compromise via Cron Hijacking',
          source: '/opt/ironbank/scripts/backup.sh execution',
          value: 'ROOTRANGE{r00t_cr0n_ov3rwr1t3_pwn4g3}',
          description: 'Privilege escalation to root achieved by modifying/running root-executed cronjob script.',
        });

        return {
          stdout: `[+] Executing /opt/ironbank/scripts/backup.sh under root cron context...
[+] Cron task spawned with effective UID 0 (root)!
[+] ROOT COMPROMISE ACHIEVED: Welcome to root shell!
root@iron-vault:/root# `,
          stderr: '',
          exitCode: 0,
          enterShell: {
            user: 'root',
            uid: 0,
            group: 'root',
            gid: 0,
            host: 'iron-vault',
            cwd: '/root',
          },
          soundTrigger: 'connect',
          targetCompromised: 'ROOT',
        };
      }
    }

    const targetFile = args[0];
    if (targetFile) {
      const readRes = ctx.fs.readFile(ctx.cwd, targetFile, ctx.uid, ctx.gid);
      if (!readRes.success) {
        return { stdout: '', stderr: `bash: ${targetFile}: No such file or directory`, exitCode: 127 };
      }
      return { stdout: `[bash] executed ${targetFile}`, stderr: '', exitCode: 0 };
    }

    return { stdout: '', stderr: 'bash: missing script argument', exitCode: 1 };
  }

  /**
   * 11. SMBCLIENT ADAPTER
   */
  public static smbclient(args: string[]): ExecutionOutput {
    if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
      return {
        stdout: `Version 4.17.12-Debian
Usage: smbclient [-?|--help] [-L|--list=HOST] [//HOST/SHARE] [password]
Options:
  -L, --list=HOST              Get a list of shares available on a host
  -N, --no-pass                Don't ask for a password
  -U, --user=USERNAME          Set the network username`,
        stderr: '',
        exitCode: 0,
      };
    }

    const raw = args.join(' ');
    const reachCheck = this.engine.canReachIp('10.10.11.99');
    if (!reachCheck.reachable) {
      return { stdout: '', stderr: `Connection to 10.10.11.99 failed: ${reachCheck.reason || 'Host unreachable'}`, exitCode: 1 };
    }

    if (raw.includes('-L') || raw.includes('--list')) {
      if (this.engine.isObjectiveUnlocked('dc-obj-2')) {
        this.engine.completeObjective('corp-dc01', 'dc-obj-2');
      }

      this.engine.addEvidence({
        machineId: 'corp-dc01',
        type: 'NETWORK',
        name: 'Discovered SMB Shares',
        source: 'smbclient -L //10.10.11.99',
        value: 'ADMIN$, C$, IPC$, SYSVOL, Shared',
        description: 'Anonymous SMB enumeration revealed accessible shares on corp-dc01:445.',
      });

      return {
        stdout: `Sharename       Type      Comment
---------       ----      -------
ADMIN$          Disk      Remote Admin
C$              Disk      Default share
IPC$            IPC       Remote IPC
SYSVOL          Disk      Logon server share
Shared          Disk      Corporate IT Documentation & Service Accounts

SMB1 disabled -- no; SMB2/3 enabled -- yes
10.10.11.99: Domain=[OMNICORP] OS=[Windows Server 2019 Standard 17763] Server=[Windows Server 2019 Standard 6.3]`,
        stderr: '',
        exitCode: 0,
        soundTrigger: 'scan',
      };
    }

    if (raw.includes('Shared') || raw.includes('SYSVOL')) {
      if (this.engine.isObjectiveUnlocked('dc-obj-2')) {
        this.engine.completeObjective('corp-dc01', 'dc-obj-2');
      }

      this.engine.addEvidence({
        machineId: 'corp-dc01',
        type: 'CREDENTIAL',
        name: 'Service Account SPN Record (svc_backup)',
        source: 'smbclient //10.10.11.99/Shared/ServiceAccounts.txt',
        value: 'SPN: MSSQLSvc/corp-dc01.omnicorp.local:1433, Account: svc_backup, Group: Backup Operators',
        description: 'Discovered Kerberoastable SPN with legacy RC4 encryption enabled.',
      });

      return {
        stdout: `Connected to \\\\10.10.11.99\\Shared (anonymous session)
smb: \\> ls
  .                                   D        0  Thu Oct 29 07:00:00 2026
  ..                                  D        0  Thu Oct 29 07:00:00 2026
  ServiceAccounts.txt                 A      380  Thu Oct 29 07:00:00 2026
  Groups.xml                          A      620  Thu Oct 29 07:00:00 2026

smb: \\> get ServiceAccounts.txt
getting file \\ServiceAccounts.txt of size 380 as ServiceAccounts.txt (18.5 KBs/s)

[+] CONTENT OF ServiceAccounts.txt:
OMNICORP IT SERVICE ACCOUNTS DIRECTORY
--------------------------------------
Account Name: svc_backup
Domain: OMNICORP.LOCAL
ServicePrincipalName: MSSQLSvc/corp-dc01.omnicorp.local:1433
Member Of: Backup Operators, Domain Users
Kerberos Pre-Auth: Disabled
Supported Encryption: RC4-HMAC (etype 23)
Notice: Service ticket requests do not require admin credentials.`,
        stderr: '',
        exitCode: 0,
        soundTrigger: 'connect',
      };
    }

    return { stdout: '', stderr: 'tree connect failed: NT_STATUS_ACCESS_DENIED', exitCode: 1 };
  }

  /**
   * 12. GETUSERSPNS (KERBEROASTING) ADAPTER
   */
  public static getUserSPNs(args: string[], ctx: ExecutionContext): ExecutionOutput {
    const raw = args.join(' ');
    if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
      return {
        stdout: `Impacket v0.11.0 - Copyright 2023 Fortra
usage: GetUserSPNs.py [-h] [-request] [-dc-ip ip address] target
Queries target domain for SPNs that are running under user accounts and outputs hashes for offline cracking.`,
        stderr: '',
        exitCode: 0,
      };
    }

    const reachCheck = this.engine.canReachIp('10.10.11.99');
    if (!reachCheck.reachable) {
      return { stdout: '', stderr: `[-] Connection failed: ${reachCheck.reason || 'Target domain unreachable'}`, exitCode: 1 };
    }

    if (raw.includes('-request') || raw.includes('omnicorp') || raw.includes('10.10.11.99')) {
      const ticketHash = '$krb5tgs$23$*svc_backup*OMNICORP.LOCAL*MSSQLSvc/corp-dc01.omnicorp.local:1433*$52f9b8c19a4e3d02$8a3b5c7d6e4f1a2b0c9e8d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d';
      
      // Save hash into /tmp/svc_backup.hash
      ctx.fs.writeFile('/tmp', 'svc_backup.hash', ticketHash + '\n', 1000, 1000, true);

      this.engine.addEvidence({
        machineId: 'corp-dc01',
        type: 'CREDENTIAL',
        name: 'Kerberos TGS-REP Hash (svc_backup)',
        source: 'GetUserSPNs.py -request omnicorp.local/',
        value: ticketHash,
        description: 'Kerberoastable service ticket hash extracted for MSSQLSvc SPN.',
      });

      return {
        stdout: `Impacket v0.11.0 - Copyright 2023 Fortra

ServicePrincipalName                     Name        MemberOf                           PasswordLastSet             LastLogon
---------------------------------------  ----------  ---------------------------------  --------------------------  -------------------
MSSQLSvc/corp-dc01.omnicorp.local:1433   svc_backup  CN=Backup Operators,CN=Users,...   2026-01-15 11:22:04.148123  2026-10-28 14:02:11

[*] Requesting TGS ticket for SPN 'MSSQLSvc/corp-dc01.omnicorp.local:1433' ...
[*] Extracted Kerberos TGS-REP hash (etype 23 - RC4-HMAC):

${ticketHash}

[+] Ticket hash saved to /tmp/svc_backup.hash`,
        stderr: '',
        exitCode: 0,
        soundTrigger: 'scan',
      };
    }

    return { stdout: '', stderr: '[-] No entries found.', exitCode: 1 };
  }

  /**
   * 13. JOHN THE RIPPER / HASHCAT ADAPTER
   */
  public static john(args: string[]): ExecutionOutput {
    if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
      return {
        stdout: `John the Ripper 1.9.0-jumbo-1 (x86_64)
Usage: john [OPTIONS] [PASSWORD-FILES]
--wordlist=FILE    Wordlist mode, read words from FILE
--format=NAME      Force hash type (e.g. krb5tgs, sha512crypt)`,
        stderr: '',
        exitCode: 0,
      };
    }

    const raw = args.join(' ');
    if (raw.includes('svc_backup') || raw.includes('krb5tgs') || raw.includes('hash')) {
      if (this.engine.isObjectiveUnlocked('dc-obj-3')) {
        this.engine.completeObjective('corp-dc01', 'dc-obj-3');
      }
      this.engine.setMachineCompromiseLevel('corp-dc01', 'USER');

      this.engine.addEvidence({
        machineId: 'corp-dc01',
        type: 'CREDENTIAL',
        name: 'Cracked svc_backup Password',
        source: 'John the Ripper (rockyou.txt dictionary attack)',
        value: 'svc_backup:BackupService2026!',
        description: 'Offline password recovery of Kerberoasted TGS service ticket hash.',
      });

      return {
        stdout: `Loaded 1 password hash (krb5tgs, Kerberos 5 TGS-REP etype 23 [MD4 HMAC-MD5 RC4])
Will run 8 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
BackupService2026! ($krb5tgs$23$*svc_backup*OMNICORP.LOCAL)
1g 0:00:00:01 DONE (2026-10-29 07:44) 0.8196g/s 409600p/s 409600c/s 409600C/s
Use the "--show" option to display all of the cracked passwords reliably
Session completed

[+] Kerberoasting Success! Cracked password for svc_backup: BackupService2026!
[+] USER FLAG: ROOTRANGE{u53r_k3rb3r04st_t1ck3t_h4sh}`,
        stderr: '',
        exitCode: 0,
        soundTrigger: 'scan',
        targetCompromised: 'USER',
      };
    }

    return { stdout: 'Loaded 0 password hashes.', stderr: '', exitCode: 0 };
  }

  /**
   * 14. SECRETSDUMP ADAPTER (DCSYNC)
   */
  public static secretsdump(args: string[]): ExecutionOutput {
    if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
      return {
        stdout: `Impacket v0.11.0 - Copyright 2023 Fortra
usage: secretsdump.py [-h] [-hashes LMHASH:NTHASH] target
Performs various techniques to dump secrets from the remote machine without executing any agent there.`,
        stderr: '',
        exitCode: 0,
      };
    }

    const raw = args.join(' ');
    const reachCheck = this.engine.canReachIp('10.10.11.99');
    if (!reachCheck.reachable) {
      return { stdout: '', stderr: `[-] Connection failed: ${reachCheck.reason || 'Target domain unreachable'}`, exitCode: 1 };
    }

    if (raw.includes('svc_backup') && (raw.includes('BackupService2026!') || raw.includes(':'))) {
      this.engine.addEvidence({
        machineId: 'corp-dc01',
        type: 'CREDENTIAL',
        name: 'Domain Administrator NTLM Hash',
        source: 'secretsdump.py (DRSUAPI DCSync method)',
        value: 'Administrator:500:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::',
        description: 'DCSync replication using Backup Operators privileges to dump Active Directory NTDS.dit hashes.',
      });

      return {
        stdout: `Impacket v0.11.0 - Copyright 2023 Fortra

[*] Target system bootKey: 0x4a9b2c1d8e7f0123456789abcdef0123
[*] Dumping Domain Credentials (DRSUAPI method - DCSync)...
[*] Using SeBackupPrivilege domain replication context...
Administrator:500:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:49b1a82f6e5c3d2b1a0f9e8d7c6b5a4e:::
svc_backup:1100:aad3b435b51404eeaad3b435b51404ee:8c2e4f1a6b9d3c5e7a1f0b2d4e6c8a0b:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
[*] Cleaning up...
[+] DCSync complete: Domain Admin NTLM Hash extracted!`,
        stderr: '',
        exitCode: 0,
        soundTrigger: 'scan',
      };
    }

    return { stdout: '', stderr: '[-] DRSUAPI DsBindWithCred to 10.10.11.99 failed: STATUS_LOGON_FAILURE', exitCode: 1 };
  }

  /**
   * 15. PSEXEC ADAPTER (PASS-THE-HASH)
   */
  public static psexec(args: string[]): ExecutionOutput {
    if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
      return {
        stdout: `Impacket v0.11.0 - Copyright 2023 Fortra
usage: psexec.py [-h] [-hashes LMHASH:NTHASH] target [command]
PSEXEC-like functionality example using RemComSvc.`,
        stderr: '',
        exitCode: 0,
      };
    }

    const raw = args.join(' ');
    const reachCheck = this.engine.canReachIp('10.10.11.99');
    if (!reachCheck.reachable) {
      return { stdout: '', stderr: `[-] Connection failed: ${reachCheck.reason || 'Target domain unreachable'}`, exitCode: 1 };
    }

    if (raw.includes('31d6cfe0d16ae931b73c59d7e0c089c0') || (raw.includes('Administrator') && raw.includes('corp-dc01'))) {
      if (this.engine.isObjectiveUnlocked('dc-obj-4')) {
        this.engine.completeObjective('corp-dc01', 'dc-obj-4');
      }
      this.engine.setMachineCompromiseLevel('corp-dc01', 'ROOT');

      return {
        stdout: `Impacket v0.11.0 - Copyright 2023 Fortra

[*] Requesting shares on 10.10.11.99.....
[*] Found writable share ADMIN$
[*] Uploading file PSEXESVC.exe
[*] Initializing service PSEXESVC on 10.10.11.99.....
[*] Starting service PSEXESVC.....
[+] Opening interactive cmd.exe on 10.10.11.99

Microsoft Windows [Version 10.0.17763.4974]
(c) 2019 Microsoft Corporation. All rights reserved.

C:\\Windows\\system32> whoami
nt authority\\system

C:\\Windows\\system32> type C:\\Users\\Administrator\\Desktop\\root.txt
ROOTRANGE{r00t_d0m41n_4dm1n_g0d_m0d3}`,
        stderr: '',
        exitCode: 0,
        enterShell: {
          user: 'Administrator',
          uid: 500,
          group: 'Domain Admins',
          gid: 512,
          host: 'corp-dc01',
          cwd: 'C:\\Windows\\system32',
        },
        soundTrigger: 'connect',
        targetCompromised: 'ROOT',
      };
    }

    return { stdout: '', stderr: '[-] Could not connect to ADMIN$ on 10.10.11.99: STATUS_ACCESS_DENIED', exitCode: 1 };
  }

  /**
   * 16. CRACKMAPEXEC ADAPTER
   */
  public static crackmapexec(args: string[]): ExecutionOutput {
    if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
      return {
        stdout: `CrackMapExec v5.4.0 (The Swiss Army Knife of pentesting networks)
usage: crackmapexec <protocol> <target(s)> [options]
Protocols: smb, winrm, ldap, ssh, mssql`,
        stderr: '',
        exitCode: 0,
      };
    }

    const raw = args.join(' ');
    if (raw.includes('10.10.11.99') || raw.includes('corp-dc01')) {
      if (raw.includes('svc_backup') && raw.includes('BackupService2026!')) {
        return {
          stdout: `SMB         10.10.11.99     445    CORP-DC01        [*] Windows Server 2019 Standard 17763 x64 (name:CORP-DC01) (domain:omnicorp.local) (signing:True) (SMBv1:True)
SMB         10.10.11.99     445    CORP-DC01        [+] omnicorp.local\\svc_backup:BackupService2026! (Pwn3d!)`,
          stderr: '',
          exitCode: 0,
          soundTrigger: 'scan',
        };
      }

      if (raw.includes('--shares')) {
        return {
          stdout: `SMB         10.10.11.99     445    CORP-DC01        [*] Windows Server 2019 Standard 17763 x64 (domain:omnicorp.local)
SMB         10.10.11.99     445    CORP-DC01        [+] Enumerated shares:
SMB         10.10.11.99     445    CORP-DC01        Share           Permissions     Remark
SMB         10.10.11.99     445    CORP-DC01        -----           -----------     ------
SMB         10.10.11.99     445    CORP-DC01        ADMIN$                          Remote Admin
SMB         10.10.11.99     445    CORP-DC01        C$                              Default share
SMB         10.10.11.99     445    CORP-DC01        IPC$            READ            Remote IPC
SMB         10.10.11.99     445    CORP-DC01        SYSVOL          READ            Logon server share
SMB         10.10.11.99     445    CORP-DC01        Shared          READ            Corporate IT Documentation`,
          stderr: '',
          exitCode: 0,
          soundTrigger: 'scan',
        };
      }
    }

    return { stdout: '[-] No target response.', stderr: '', exitCode: 1 };
  }
}
