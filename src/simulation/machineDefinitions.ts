import { SimulatedMachineConfig, VirtualSubnet } from './types';

export const SIMULATED_SUBNETS: VirtualSubnet[] = [
  {
    id: 'perimeter-gw',
    name: 'Perimeter Gateway Network',
    cidr: '10.10.10.0/24',
    gatewayIp: '10.10.10.1',
    isDirectlyAccessible: true,
  },
  {
    id: 'dmz-net',
    name: 'Corporate DMZ Subnet',
    cidr: '10.10.11.0/24',
    gatewayIp: '10.10.11.1',
    isDirectlyAccessible: true,
  },
  {
    id: 'internal-services',
    name: 'Internal Banking Subnet',
    cidr: '10.10.12.0/24',
    gatewayIp: '10.10.12.1',
    isDirectlyAccessible: false,
    requiredPivotMachineId: 'ecorp-hr',
  },
  {
    id: 'ad-forest',
    name: 'Enterprise Active Directory Forest',
    cidr: '10.10.13.0/24',
    gatewayIp: '10.10.13.1',
    isDirectlyAccessible: false,
    requiredPivotMachineId: 'iron-vault',
  },
];

export const SIMULATED_MACHINES: SimulatedMachineConfig[] = [
  {
    id: 'ecorp-hr',
    name: 'E-Corp HR Portal',
    hostname: 'ecorp-hr',
    ip: '10.10.11.45',
    subnetId: 'dmz-net',
    os: 'Linux',
    osVersion: 'Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-89-generic x86_64)',
    difficulty: 'Easy',
    points: { user: 20, root: 30 },
    description: 'Internal human resources payroll application running on an unpatched Linux container with Log4j remote code execution and sudo privilege escalation.',
    cves: ['CVE-2021-44228 (Log4j / Log4Shell)', 'GTFOBins Sudo Find Privesc'],
    initialCompromiseLevel: 'NONE',
    userFlag: 'ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}',
    rootFlag: 'ROOTRANGE{r00t_pr1v3sc_m4st3r_c0mpr0m1s3}',
    interfaces: [
      {
        name: 'eth0',
        ip: '10.10.11.45',
        netmask: '255.255.255.0',
        mac: '02:42:0a:0a:0b:2d',
        isUp: true,
        rxBytes: 5242880,
        txBytes: 12582912,
      },
      {
        name: 'lo',
        ip: '127.0.0.1',
        netmask: '255.0.0.0',
        mac: '00:00:00:00:00:00',
        isUp: true,
      },
    ],
    ports: [
      {
        port: 22,
        service: 'ssh',
        version: 'OpenSSH 8.9p1 Ubuntu 3ubuntu0.4',
        state: 'open',
        banner: 'SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.4',
      },
      {
        port: 80,
        service: 'http',
        version: 'Apache/2.4.49 (Log4j / Spring)',
        state: 'open',
        banner: 'Apache/2.4.49 (Unix) OpenSSL/1.1.1f',
      },
      {
        port: 8080,
        service: 'http-proxy',
        version: 'Spring Boot Log4j Core 2.14.1',
        state: 'open',
        banner: 'HTTP/1.1 200 OK Server: Apache-Coyote/1.1',
      },
    ],
    users: [
      {
        username: 'root',
        uid: 0,
        gid: 0,
        home: '/root',
        shell: '/bin/bash',
        groups: ['root'],
      },
      {
        username: 'alex',
        uid: 1001,
        gid: 1001,
        home: '/home/alex',
        shell: '/bin/bash',
        password: 'alexmorgan_dev',
        groups: ['alex', 'sudo'],
        sudoPermissions: ['(ALL : ALL) NOPASSWD: /usr/bin/find'],
        sshKeyAuthorized: true,
      },
      {
        username: 'www-data',
        uid: 33,
        gid: 33,
        home: '/var/www',
        shell: '/usr/sbin/nologin',
        groups: ['www-data'],
        sudoPermissions: ['(ALL : ALL) NOPASSWD: /usr/bin/find'],
      },
    ],
    processes: [
      { pid: 1, ppid: 0, user: 'root', cpu: 0.0, mem: 0.1, stat: 'Ss', command: '/sbin/init' },
      { pid: 480, ppid: 1, user: 'root', cpu: 0.0, mem: 0.2, stat: 'Ss', command: '/usr/lib/systemd/systemd-journald' },
      { pid: 620, ppid: 1, user: 'root', cpu: 0.0, mem: 0.3, stat: 'Ss', command: '/usr/sbin/sshd -D', port: 22 },
      { pid: 710, ppid: 1, user: 'root', cpu: 0.1, mem: 1.2, stat: 'Ss', command: '/usr/sbin/apache2 -k start', port: 80 },
      { pid: 712, ppid: 710, user: 'www-data', cpu: 0.2, mem: 1.4, stat: 'S', command: '/usr/sbin/apache2 -k start' },
      { pid: 820, ppid: 1, user: 'www-data', cpu: 0.8, mem: 6.8, stat: 'Ssl', command: '/usr/bin/java -Dlog4j2.formatMsgNoLookups=false -jar /opt/ecorp/hr-portal.jar', port: 8080 },
      { pid: 905, ppid: 1, user: 'root', cpu: 0.0, mem: 0.1, stat: 'Ss', command: '/usr/sbin/cron -f' },
    ],
    webRoutes: [
      {
        path: '/',
        methods: ['GET', 'HEAD'],
        statusCode: 200,
        contentType: 'text/html; charset=UTF-8',
        responseBody: `<!DOCTYPE html>
<html>
<head><title>E-Corp Employee Portal</title></head>
<body>
  <h1>E-Corp Internal HR Subsystem v2.4.1</h1>
  <p>Status: All payroll services operational.</p>
  <p>Auditing: Powered by Apache Log4j Enterprise Logging Subsystem.</p>
  <a href="/portal">Employee Directory</a> | <a href="/login">Single Sign-On</a>
</body>
</html>`,
      },
      {
        path: '/portal',
        methods: ['GET'],
        statusCode: 200,
        contentType: 'text/html; charset=UTF-8',
        responseBody: `<!DOCTYPE html>
<html>
<head><title>E-Corp Staff Directory</title></head>
<body>
  <h2>Staff Directory (Read-Only)</h2>
  <ul>
    <li>Alex Morgan - Senior Backend Developer (alex@ecorp.htb)</li>
    <li>Elliot Alderson - Cyber Security Analyst (elliot@ecorp.htb)</li>
    <li>Tyrell Wellick - SVP Technology (tyrell@ecorp.htb)</li>
  </ul>
</body>
</html>`,
      },
      {
        path: '/login',
        methods: ['GET', 'POST'],
        statusCode: 200,
        contentType: 'text/html; charset=UTF-8',
        responseBody: `<!DOCTYPE html><html><head><title>E-Corp SSO Portal</title></head><body><h2>E-Corp Corporate Authentication</h2><form method="POST" action="/login"><input type="text" name="username" placeholder="Username" /><input type="password" name="password" placeholder="Password" /><button type="submit">Sign In</button></form></body></html>`,
        handler: (req) => {
          if (req.method === 'GET') {
            return {
              statusCode: 200,
              contentType: 'text/html; charset=UTF-8',
              body: `<!DOCTYPE html><html><head><title>E-Corp SSO Portal</title></head><body style="font-family:sans-serif;background:#0d1117;color:#c9d1d9;padding:30px;"><h2>E-Corp Corporate Authentication</h2><p>Sign in to access internal employee payroll and portal services.</p><form method="POST" action="/login"><div style="margin-bottom:10px;"><label>Username: </label><input type="text" name="username" style="padding:6px;background:#161b22;border:1px solid #30363d;color:#fff;" /></div><div style="margin-bottom:10px;"><label>Password: </label><input type="password" name="password" style="padding:6px;background:#161b22;border:1px solid #30363d;color:#fff;" /></div><button type="submit" style="padding:8px 16px;background:#238636;color:#fff;border:none;cursor:pointer;">Sign In</button></form></body></html>`,
            };
          }

          // POST handling
          const raw = `${req.body || ''} ${JSON.stringify(req.headers)}`;
          if (raw.includes('${jndi:') || raw.includes('jndi:ldap') || raw.includes('jndi:rmi')) {
            return {
              statusCode: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                status: 'exploit_triggered',
                message: 'JNDI lookup executed against referral server ldap://10.10.14.22:1389/Exploit',
                session: 'Spawning reverse shell to attacker listener 10.10.14.22:4444',
                pwn_notice: '[+] Reverse TCP shell payload triggered on target container! Check your Pwnbox netcat listener on port 4444!',
              }, null, 2),
              triggerEvent: {
                type: 'INITIAL_ACCESS_GRANTED',
                payload: { method: 'Log4j JNDI Remote Code Execution', uid: 33, user: 'www-data' },
                xp: 25,
              },
            };
          }

          const bodyStr = req.body || '';
          if (
            (bodyStr.includes('username=alex') || bodyStr.includes('"username":"alex"')) &&
            (bodyStr.includes('alex123') || bodyStr.includes('alexpassword') || bodyStr.includes('password=alex'))
          ) {
            return {
              statusCode: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                message: 'Authentication successful. Session cookie issued for Alexander Morgan.',
                session_id: 'ecorp_alex_sess_8921',
                redirect: '/admin',
              }, null, 2),
              headers: {
                'Set-Cookie': 'session_id=ecorp_alex_sess_8921; Path=/; HttpOnly; SameSite=Lax',
              },
            };
          }

          return {
            statusCode: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Invalid employee credentials' }),
          };
        },
      },
      {
        path: '/api/audit',
        methods: ['POST', 'GET'],
        statusCode: 200,
        contentType: 'application/json',
        responseBody: '{"status":"ok","message":"Audit log recorded via Log4j engine"}',
        handler: (req) => {
          const raw = `${req.body || ''} ${JSON.stringify(req.headers)}`;
          if (raw.includes('jndi:ldap') || raw.includes('jndi:rmi') || raw.includes('${jndi:')) {
            return {
              statusCode: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                status: 'exploit_triggered',
                message: 'JNDI lookup executed against referral server ldap://10.10.14.22:1389/Exploit',
                session: 'Spawning reverse shell to attacker listener 10.10.14.22:4444',
                pwn_notice: '[+] Reverse TCP shell payload triggered on target container! Check your Pwnbox netcat listener on port 4444!',
              }, null, 2),
              triggerEvent: {
                type: 'INITIAL_ACCESS_GRANTED',
                payload: { method: 'Log4j JNDI Remote Code Execution', uid: 33, user: 'www-data' },
                xp: 25,
              },
            };
          }
          return {
            statusCode: 200,
            contentType: 'application/json',
            body: JSON.stringify({ status: 'logged', timestamp: Date.now() }),
          };
        },
      },
      {
        path: '/admin',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        statusCode: 403,
        contentType: 'text/html',
        responseBody: '<html><body><h1>403 Forbidden</h1><p>Access restricted to internal subnet 10.10.12.0/24.</p></body></html>',
        handler: (req) => {
          const cookieHeader = req.headers['cookie'] || req.headers['Cookie'] || '';
          const hasAdminCookie =
            cookieHeader.includes('session_id=admin_session_root_99') ||
            cookieHeader.includes('session_id=ecorp_alex_sess_8921') ||
            cookieHeader.includes('role=admin') ||
            (req.headers['authorization'] || '').toLowerCase().includes('admin');

          if (hasAdminCookie) {
            const respHeaders: Record<string, string> = {
              Server: 'Apache/2.4.49 (Unix)',
              'X-Authenticated-As': 'admin',
            };
            return {
              statusCode: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                status: 'authorized',
                admin_user: 'Alexander Morgan',
                role: 'Senior DevOps / Sudo Administrator',
                notice: 'Sudo permission maintenance grant: Alexander has NOPASSWD access to /usr/bin/find on ecorp-hr container.',
                payroll_audit_key: 'E-CORP-PAYROLL-SEC-4412',
                system_uptime: '42 days, 14 hours',
              }, null, 2),
              headers: respHeaders,
              triggerEvent: {
                type: 'CREDENTIAL_DISCOVERED',
                payload: { name: 'Admin Session Access', user: 'alex', note: 'Sudo maintenance access to find' },
                xp: 15,
              },
            };
          }

          const defaultHeaders: Record<string, string> = { Server: 'Apache/2.4.49 (Unix)' };
          return {
            statusCode: 403,
            contentType: 'text/html; charset=UTF-8',
            body: '<!DOCTYPE html><html><head><title>403 Forbidden</title></head><body><h1>403 Forbidden</h1><p>Access denied. Valid administrator session cookie (session_id or role=admin) required.</p></body></html>',
            headers: defaultHeaders,
          };
        },
      },
      {
        path: '/uploads',
        methods: ['GET'],
        statusCode: 301,
        contentType: 'text/html',
        responseBody: '<html><body><h1>301 Moved Permanently</h1></body></html>',
      },
    ],
    objectives: [
      {
        id: 'ecorp-obj-1',
        title: 'Network Reconnaissance',
        description: 'Scan 10.10.11.45 with nmap to discover active TCP services and banners.',
        prerequisites: [],
        completed: false,
        xp: 10,
        category: 'RECON',
      },
      {
        id: 'ecorp-obj-2',
        title: 'Web Directory Enumeration',
        description: 'Enumerate web routes with gobuster to locate the staff directory and API audit endpoint.',
        prerequisites: ['ecorp-obj-1'],
        completed: false,
        xp: 15,
        category: 'ENUMERATION',
      },
      {
        id: 'ecorp-obj-3',
        title: 'Vulnerability Identification (Log4Shell)',
        description: 'Inspect HTTP banners and application dependencies to identify vulnerable Log4j v2.14.1.',
        prerequisites: ['ecorp-obj-2'],
        completed: false,
        xp: 20,
        category: 'ENUMERATION',
      },
      {
        id: 'ecorp-obj-4',
        title: 'Initial Foothold (Log4j Exploitation)',
        description: 'Deliver JNDI exploit string via curl and catch incoming reverse shell on netcat port 4444.',
        prerequisites: ['ecorp-obj-3'],
        completed: false,
        xp: 25,
        category: 'EXPLOITATION',
      },
      {
        id: 'ecorp-obj-5',
        title: 'Capture User Flag',
        description: 'Locate and submit the user flag in /home/alex/user.txt.',
        prerequisites: ['ecorp-obj-4'],
        completed: false,
        xp: 20,
        category: 'EXPLOITATION',
      },
      {
        id: 'ecorp-obj-6',
        title: 'Privilege Escalation Enumeration',
        description: 'Run sudo -l or LinPEAS to discover GTFOBins NOPASSWD find privilege.',
        prerequisites: ['ecorp-obj-5'],
        completed: false,
        xp: 20,
        category: 'PRIVESC',
      },
      {
        id: 'ecorp-obj-7',
        title: 'Root Compromise & Flag Submission',
        description: 'Exploit sudo find binary to escalate to root (UID 0) and capture the root flag in /root/root.txt.',
        prerequisites: ['ecorp-obj-6'],
        completed: false,
        xp: 30,
        category: 'POST_EXPLOIT',
      },
    ],
  },
  {
    id: 'iron-vault',
    name: 'IronBank Vault',
    hostname: 'iron-vault',
    ip: '10.10.11.82',
    subnetId: 'internal-services',
    os: 'Linux',
    osVersion: 'Debian GNU/Linux 11 (bullseye) x86_64',
    difficulty: 'Medium',
    points: { user: 25, root: 35 },
    description: 'Financial ledger API vulnerable to SQL injection authentication bypass, forged JWT token privilege escalation, and root cronjob hijacking.',
    cves: ['CWE-89 (SQL Injection Auth Bypass)', 'CWE-347 (JWT Algorithm "none" Forgery)', 'Insecure Cronjob Privesc'],
    initialCompromiseLevel: 'NONE',
    userFlag: 'ROOTRANGE{u53r_jwt_f0rg3ry_b4nk_l00t}',
    rootFlag: 'ROOTRANGE{r00t_cr0n_ov3rwr1t3_pwn4g3}',
    interfaces: [
      {
        name: 'eth0',
        ip: '10.10.11.82',
        netmask: '255.255.255.0',
        mac: '02:42:0a:0a:0c:52',
        isUp: true,
      },
    ],
    ports: [
      {
        port: 22,
        service: 'ssh',
        version: 'OpenSSH 8.4p1 Debian 5+deb11u2',
        state: 'open',
        banner: 'SSH-2.0-OpenSSH_8.4p1 Debian-5+deb11u2',
      },
      {
        port: 8080,
        service: 'http',
        version: 'Node.js Express / JWT Auth API',
        state: 'open',
        banner: 'Express / IronBank Core v1.4',
      },
      {
        port: 3306,
        service: 'mysql',
        version: 'MySQL 8.0.28-0ubuntu0.20.04.3',
        state: 'open',
        banner: '8.0.28 MySQL Community Server - GPL',
      },
    ],
    users: [
      {
        username: 'root',
        uid: 0,
        gid: 0,
        home: '/root',
        shell: '/bin/bash',
        groups: ['root'],
      },
      {
        username: 'finance_admin',
        uid: 1002,
        gid: 1002,
        home: '/home/finance_admin',
        shell: '/bin/bash',
        password: 'password123',
        groups: ['finance_admin', 'dev'],
      },
      {
        username: 'node_app',
        uid: 1004,
        gid: 1004,
        home: '/opt/ironbank',
        shell: '/bin/bash',
        groups: ['node_app'],
      },
    ],
    processes: [
      { pid: 1, ppid: 0, user: 'root', cpu: 0.0, mem: 0.1, stat: 'Ss', command: '/sbin/init' },
      { pid: 540, ppid: 1, user: 'root', cpu: 0.0, mem: 0.3, stat: 'Ss', command: '/usr/sbin/sshd -D', port: 22 },
      { pid: 880, ppid: 1, user: 'mysql', cpu: 0.4, mem: 4.8, stat: 'Ssl', command: '/usr/sbin/mysqld', port: 3306 },
      { pid: 1010, ppid: 1, user: 'node_app', cpu: 0.3, mem: 2.5, stat: 'Sl', command: '/usr/bin/node /opt/ironbank/server.js', port: 8080 },
      { pid: 1150, ppid: 1, user: 'root', cpu: 0.0, mem: 0.1, stat: 'Ss', command: '/usr/sbin/cron -f' },
    ],
    webRoutes: [
      {
        path: '/',
        methods: ['GET'],
        statusCode: 200,
        contentType: 'application/json',
        responseBody: '{"api":"IronBank Core Financial Ledger API","version":"1.4.0","endpoints":["/api/login","/api/vault","/api/users","/api/transfer","/api/db-status"]}',
      },
      {
        path: '/api/login',
        methods: ['POST', 'GET'],
        statusCode: 200,
        contentType: 'application/json',
        responseBody: '{"error":"Missing credentials. Usage: POST { username, password }"}',
        handler: (req) => {
          const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || req);
          if (!bodyStr || bodyStr === '{}' || bodyStr === '""') {
            return {
              statusCode: 400,
              contentType: 'application/json',
              body: JSON.stringify({ error: 'Missing credentials. Usage: POST /api/login with JSON { username, password }' }),
            };
          }

          // SQL Injection detection on username parameter:
          // admin' OR 1=1-- or ' OR '1'='1 or admin'-- or ' UNION SELECT
          const isSqli =
            bodyStr.includes("' OR '1'='1") ||
            bodyStr.includes("' OR 1=1") ||
            bodyStr.includes("admin'--") ||
            bodyStr.includes("admin' OR") ||
            bodyStr.includes("' OR ''='") ||
            bodyStr.includes("admin'#") ||
            bodyStr.includes("' OR 1=1#") ||
            bodyStr.includes("UNION SELECT") ||
            bodyStr.includes("union select");

          const isCredMatch = bodyStr.includes('finance_admin') && (bodyStr.includes('banker123') || bodyStr.includes('password'));

          if (isSqli || isCredMatch) {
            return {
              statusCode: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                message: isSqli ? 'Authentication bypass successful via SQL injection!' : 'Authentication successful',
                user: 'admin',
                role: 'finance_admin',
                token: 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiZmluYW5jZV9hZG1pbiJ9.',
                database_debug: isSqli ? {
                  query: "SELECT id, username, role, password_hash FROM users WHERE username = 'admin' OR 1=1 --' AND password = '***'",
                  matched_rows: 1,
                  vulnerability: 'CWE-89: Direct string concatenation into SQL query',
                  remediation: 'Use parameterized queries: db.execute("SELECT ... WHERE username = ? AND password = ?", [username, password])',
                } : undefined,
              }),
              triggerEvent: isSqli ? {
                type: 'VULNERABILITY_IDENTIFIED',
                payload: { cve: 'CWE-89 (SQLi Auth Bypass)', endpoint: '/api/login' },
                xp: 25,
              } : undefined,
            };
          }

          return {
            statusCode: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Invalid username or password' }),
          };
        },
      },
      {
        path: '/api/vault',
        methods: ['GET'],
        statusCode: 200,
        contentType: 'application/json',
        responseBody: '{"error":"Unauthorized: Missing Bearer Token"}',
        handler: (req) => {
          const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
          const cookieHeader = req.headers['cookie'] || req.headers['Cookie'] || '';
          const auth = `${authHeader} ${cookieHeader}`;

          if (!auth.trim()) {
            return {
              statusCode: 401,
              contentType: 'application/json',
              body: JSON.stringify({ error: 'Unauthorized: Missing Bearer Token' }),
            };
          }

          if (
            auth.includes('eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0') ||
            auth.includes('Bearer admin_jwt') ||
            auth.includes('finance_admin')
          ) {
            return {
              statusCode: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                vault_id: 'VAULT-SEC-9941',
                organization: 'IronBank Global Custody & Clearing',
                reserve_balance: '$42,500,000.00 USD',
                user_flag: 'ROOTRANGE{u53r_jwt_f0rg3ry_b4nk_l00t}',
                confidential_cron_memo:
                  'Automated ledger backup job: /opt/ironbank/scripts/backup.sh runs every 60 seconds as root via /etc/cron.d/vault-backup. Backup script is maintained by dev team with write permissions.',
              }),
              triggerEvent: {
                type: 'INITIAL_ACCESS_GRANTED',
                payload: { method: 'JWT Algorithm None Forgery', user: 'finance_admin' },
                xp: 25,
              },
            };
          }

          return {
            statusCode: 403,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Forbidden: Invalid JWT Token signature or insufficient permissions' }),
          };
        },
      },
      {
        path: '/api/users',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        statusCode: 200,
        contentType: 'application/json',
        responseBody: '{"error":"Unauthorized"}',
        handler: (req) => {
          const auth = req.headers['authorization'] || req.headers['Authorization'] || '';
          const cookies = req.headers['cookie'] || req.headers['Cookie'] || '';
          if (!auth && !cookies.includes('auth_token=')) {
            return {
              statusCode: 401,
              contentType: 'application/json',
              body: JSON.stringify({ error: 'Unauthorized: Authentication required (Bearer token or auth_token cookie)' }),
            };
          }

          if (req.method === 'POST') {
            return {
              statusCode: 201,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                message: 'User provisioned in financial database',
                user: { id: 4, username: 'auditor', role: 'auditor' },
              }, null, 2),
            };
          }

          if (req.method === 'PUT' || req.method === 'PATCH') {
            return {
              statusCode: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                message: 'User record patched successfully',
                method: req.method,
              }, null, 2),
            };
          }

          if (req.method === 'DELETE') {
            return {
              statusCode: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                message: 'User record purged from MySQL',
              }),
            };
          }

          const roleFilter = req.queryParams?.role || (req.path.includes('role=') ? req.path.split('role=')[1].split('&')[0] : undefined);
          const allUsers = [
            { id: 1, username: 'admin', role: 'finance_admin', email: 'admin@ironbank.htb' },
            { id: 2, username: 'finance_admin', role: 'finance_admin', email: 'finance@ironbank.htb', ssh_enabled: true },
            { id: 3, username: 'node_app', role: 'service', email: 'service@ironbank.htb' },
          ];

          const filtered = roleFilter ? allUsers.filter(u => u.role.toLowerCase() === roleFilter.toLowerCase()) : allUsers;

          return {
            statusCode: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              count: filtered.length,
              users: filtered,
            }, null, 2),
          };
        },
      },
      {
        path: '/api/transfer',
        methods: ['POST'],
        statusCode: 200,
        contentType: 'application/json',
        responseBody: '{"error":"Unauthorized"}',
        handler: (req) => {
          const auth = req.headers['authorization'] || req.headers['Authorization'] || '';
          if (!auth) {
            return {
              statusCode: 401,
              contentType: 'application/json',
              body: JSON.stringify({ error: 'Unauthorized: Bearer token required for wire transfers' }),
            };
          }
          return {
            statusCode: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              tx_id: 'TX-' + Math.floor(Math.random() * 900000 + 100000),
              status: 'APPROVED',
              timestamp: new Date().toISOString(),
              message: 'Transfer processed by IronBank Clearing Engine',
            }),
          };
        },
      },
      {
        path: '/api/db-status',
        methods: ['GET'],
        statusCode: 200,
        contentType: 'application/json',
        responseBody: '{"status":"online","db":"MySQL 8.0.28","database":"ironbank_db","pool_connections":5}',
      },
    ],
    objectives: [
      {
        id: 'iron-obj-1',
        title: 'Discover Internal Banking Subnet',
        description: 'Scan 10.10.11.82 to locate OpenSSH (22), Express API (8080), and MySQL (3306).',
        prerequisites: [],
        completed: false,
        xp: 15,
        category: 'RECON',
      },
      {
        id: 'iron-obj-2',
        title: 'SQL Injection Authentication Bypass',
        description: 'Exploit SQL injection on /api/login endpoint to bypass authentication and obtain JWT token.',
        prerequisites: ['iron-obj-1'],
        completed: false,
        xp: 25,
        category: 'EXPLOITATION',
      },
      {
        id: 'iron-obj-3',
        title: 'JWT Forgery & User Flag',
        description: 'Access /api/vault with forged admin token to extract vault ledger and capture the user flag.',
        prerequisites: ['iron-obj-2'],
        completed: false,
        xp: 25,
        category: 'EXPLOITATION',
      },
      {
        id: 'iron-obj-4',
        title: 'Cronjob Hijacking & Root Flag',
        description: 'Hijack the root-owned scheduled backup script to compromise the system and capture the root flag.',
        prerequisites: ['iron-obj-3'],
        completed: false,
        xp: 35,
        category: 'PRIVESC',
      },
    ],
  },
  {
    id: 'corp-dc01',
    name: 'Corp-DC01',
    hostname: 'corp-dc01',
    ip: '10.10.11.99',
    subnetId: 'ad-forest',
    os: 'ActiveDirectory',
    osVersion: 'Windows Server 2019 Standard (OS Build 17763.4974)',
    difficulty: 'Hard',
    points: { user: 30, root: 40 },
    description: 'Enterprise Windows Domain Controller vulnerable to SMB share exposure, MS17-010 legacy flaw, Kerberoasting service account hashes, and DCSync domain admin escalation.',
    cves: ['CVE-2017-0143 (MS17-010 EternalBlue)', 'Kerberoasting (TGS-REP RC4-HMAC)', 'DCSync / DRSUAPI Domain Admin Compromise'],
    initialCompromiseLevel: 'NONE',
    userFlag: 'ROOTRANGE{u53r_k3rb3r04st_t1ck3t_h4sh}',
    rootFlag: 'ROOTRANGE{r00t_d0m41n_4dm1n_g0d_m0d3}',
    interfaces: [
      {
        name: 'Ethernet0',
        ip: '10.10.11.99',
        netmask: '255.255.255.0',
        mac: '00:50:56:b9:2a:18',
        isUp: true,
      },
    ],
    ports: [
      {
        port: 53,
        service: 'domain',
        version: 'Simple DNS Plus',
        state: 'open',
      },
      {
        port: 88,
        service: 'kerberos-sec',
        version: 'Microsoft Windows Kerberos (server time: 2026-10-29 07:00:00Z)',
        state: 'open',
      },
      {
        port: 389,
        service: 'ldap',
        version: 'Microsoft Windows Active Directory LDAP (Domain: omnicorp.local)',
        state: 'open',
      },
      {
        port: 445,
        service: 'microsoft-ds',
        version: 'Windows Server 2019 Standard 17763 microsoft-ds',
        state: 'open',
      },
    ],
    webRoutes: [
      {
        path: '/',
        methods: ['GET', 'HEAD'],
        statusCode: 200,
        contentType: 'text/html; charset=UTF-8',
        responseBody: `<!DOCTYPE html><html><head><title>OmniCorp DC01 - Microsoft IIS 10.0</title></head><body style="font-family:Segoe UI,sans-serif;background:#1e1e1e;color:#fff;padding:40px;"><h1>Internet Information Services (IIS) 10.0</h1><p>OmniCorp Active Directory Domain Controller (corp.local)</p><hr/><p>Services: <a href="/certsrv">Active Directory Certificate Services</a> | <a href="/adfs/ls">ADFS SSO</a> | <a href="/health">Health API</a></p></body></html>`,
      },
      {
        path: '/certsrv',
        methods: ['GET', 'POST'],
        statusCode: 200,
        contentType: 'text/html; charset=UTF-8',
        responseBody: `<!DOCTYPE html><html><head><title>Microsoft Active Directory Certificate Services</title></head><body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:30px;"><h2>Microsoft Active Directory Certificate Services</h2><p>Certification Authority: <strong>corp-dc01-CA</strong></p><p>Enrollment web service online. Domain: <code>CORP.LOCAL</code></p><p>Service Principal Name: <code>MSSQLSvc/corp-dc01.omnicorp.local:1433</code></p></body></html>`,
      },
      {
        path: '/adfs/ls',
        methods: ['GET'],
        statusCode: 200,
        contentType: 'text/html; charset=UTF-8',
        responseBody: `<!DOCTYPE html><html><head><title>Active Directory Federation Services</title></head><body><h2>OmniCorp Federation Service</h2><p>Sign in with your organizational account (CORP\\username)</p></body></html>`,
      },
      {
        path: '/wsman',
        methods: ['GET', 'POST'],
        statusCode: 200,
        contentType: 'application/soap+xml;charset=UTF-8',
        responseBody: `<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope"><s:Header/><s:Body><wsmid:IdentifyResponse xmlns:wsmid="http://schemas.dmtf.org/wbem/wsman/identity/1/wsmanidentity.xsd"><wsmid:ProtocolVersion>http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd</wsmid:ProtocolVersion><wsmid:ProductVendor>Microsoft Corporation</wsmid:ProductVendor><wsmid:ProductVersion>OS: 10.0.17763 SP: 0.0 Stack: 3.0</wsmid:ProductVersion></wsmid:IdentifyResponse></s:Body></s:Envelope>`,
      },
      {
        path: '/health',
        methods: ['GET'],
        statusCode: 200,
        contentType: 'application/json',
        responseBody: JSON.stringify({
          domain: 'corp.local',
          forest: 'omnicorp.local',
          domain_controller: 'CORP-DC01',
          kerberos_kdc: 'ONLINE',
          ldap_service: 'ONLINE',
          smb_shares: ['SYSVOL', 'NETLOGON', 'Replication'],
          active_sessions: 14,
        }, null, 2),
      },
    ],
    users: [
      {
        username: 'Administrator',
        uid: 500,
        gid: 512,
        home: 'C:\\Users\\Administrator',
        shell: 'powershell.exe',
        groups: ['Domain Admins', 'Enterprise Admins'],
      },
      {
        username: 'krbtgt',
        uid: 502,
        gid: 512,
        home: 'C:\\Windows\\system32',
        shell: 'cmd.exe',
        groups: ['Domain Admins'],
      },
      {
        username: 'svc_backup',
        uid: 1100,
        gid: 513,
        home: 'C:\\Users\\svc_backup',
        shell: 'cmd.exe',
        password: 'BackupService2026!',
        groups: ['Domain Users', 'Backup Operators'],
      },
    ],
    processes: [
      { pid: 4, ppid: 0, user: 'SYSTEM', cpu: 0.1, mem: 0.5, stat: 'R', command: 'System' },
      { pid: 612, ppid: 4, user: 'SYSTEM', cpu: 0.0, mem: 1.2, stat: 'S', command: 'lsass.exe', port: 88 },
      { pid: 740, ppid: 4, user: 'SYSTEM', cpu: 0.0, mem: 2.1, stat: 'S', command: 'ntds.dit (Active Directory Database)', port: 389 },
      { pid: 980, ppid: 4, user: 'SYSTEM', cpu: 0.0, mem: 0.8, stat: 'S', command: 'spoolsv.exe', port: 445 },
    ],
    objectives: [
      {
        id: 'dc-obj-1',
        title: 'Active Directory Forest Discovery',
        description: 'Scan 10.10.11.99 to discover Kerberos (88), LDAP (389), and SMB (445).',
        prerequisites: [],
        completed: false,
        xp: 20,
        category: 'RECON',
      },
      {
        id: 'dc-obj-2',
        title: 'SMB Share Enumeration & MS17-010 Audit',
        description: 'Enumerate SMB shares and audit MS17-010 legacy vulnerability to discover IT service account artifacts.',
        prerequisites: ['dc-obj-1'],
        completed: false,
        xp: 25,
        category: 'ENUMERATION',
      },
      {
        id: 'dc-obj-3',
        title: 'Kerberoasting Attack & User Flag',
        description: 'Request service ticket for svc_backup SPN and crack ticket hash with rockyou.txt to capture the user flag.',
        prerequisites: ['dc-obj-2'],
        completed: false,
        xp: 30,
        category: 'EXPLOITATION',
      },
      {
        id: 'dc-obj-4',
        title: 'Domain Admin DCSync Escalation & Root Flag',
        description: 'Leverage Backup Operators DCSync privileges to dump Domain Admin credentials and capture the root flag.',
        prerequisites: ['dc-obj-3'],
        completed: false,
        xp: 40,
        category: 'POST_EXPLOIT',
      },
    ],
  },
];
