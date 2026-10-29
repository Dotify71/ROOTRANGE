# ROOTRANGE: Comprehensive Project Plan

## 1. Executive Summary
ROOTRANGE is an open-source, in-browser Cyber Range and Gamified Penetration Testing Battleground designed to deliver an advanced, cost-free alternative to commercial platforms like Hack The Box.

## 2. Phase Breakdown

### Phase 1: Repository Audit and Project Foundation (Complete)
- Establish React 18, TypeScript, and Vite with strict typing.
- Configure Tailwind CSS, Lucide icons, and Zustand game store.
- Implement React Router DOM with 10 functional routes.
- Implement responsive workstation AppShell with collapsible sidebar and top status bar.
- Create automated testing setup using Vitest and React Testing Library.
- Provide comprehensive architectural and task tracking documentation.

### Phase 2: Virtual Pwnbox Terminal & Shell Engine (Complete)
- In-memory virtual Linux filesystem (`VirtualFileSystem`) with POSIX permissions and octal modes.
- Modular shell parser (`ShellParser`) supporting arguments, quotes, escapes, pipelines, and redirection safely without `eval()`.
- Typed command registry (`CommandRegistry`) supporting standard utilities (`pwd`, `ls`, `cd`, `cat`, `head`, `tail`, `grep`, `find`, `stat`, `env`, `history`, `echo`, `touch`, `mkdir`) and offensive tools (`nmap`, `gobuster`, `hydra`, `nc`, `curl`, `sudo`).
- Realistic Kali Linux terminal interface (`PwnboxTerminal.tsx`) with dynamic prompt, command history, tab completion, and audio feedback.
- Machine fixtures and simulated permission boundaries (`/etc/shadow`, `/root/root.txt`, `/root/scripts/backup.sh`).

### Phase 3: Deterministic Cyber Range Simulation Engine (Complete)
- Deterministic simulation core (`SimulationEngine`) managing machines, subnets, routing, and challenge progression.
- Machine domain models with full configurations for E-Corp HR, IronBank API, OmniCorp DC01, and Perimeter Gateway.
- Virtual network interfaces, subnets, and pivoting requirements across isolated networks.
- Service discovery and web route registries with dynamic Log4Shell JNDI and SQLi handlers.
- Virtual process tables (`VirtualProcess`) and sessions (`ActiveSession`).
- Typed event system with 11 event types (`SERVICE_DISCOVERED`, `SESSION_ESTABLISHED`, `CHALLENGE_COMPLETED`, etc.).
- Deterministic command adapters for `nmap`, `gobuster`, `curl`, `ssh`, `sudo`, `hydra`, `sqlmap`, `nc`, and `linpeas.sh`.
- Machine and range reset workflows and versioned JSON state serialization.

### Phase 4: E-Corp HR Training Machine (Complete)
- Linux-themed machine detail briefing page with IP (`10.10.11.45`), hostname (`ecorp-hr`), OS, and live service inventory.
- Complete 7-stage discoverable attack path: Reconnaissance -> Web Directory Enumeration -> Log4Shell Vulnerability Investigation -> Simulated Initial Access -> User Flag -> Sudo Privilege Escalation -> Root Flag.
- In-memory synthetic code & file inspector (`Log4jAuditLogger.java`, `pom.xml`, `/var/www/html/config.php`, `/etc/sudoers.d/alex`).
- Educational remediation guidance explaining CVE-2021-44228 and GTFOBins sudo find misconfigurations.
- In-page flag capture validation with instant feedback and machine state reset controls.
- Comprehensive end-to-end automated journey test suite (`phase4EcorpMachine.test.ts`).

### Phase 5: IronBank Vault and Corp-DC01 Training Machines (Complete)
- **IronBank Vault (Medium)**: Simulated financial ledger API on Debian 11 with MySQL 8.0 database, parameterized query evaluation, SQL injection auth bypass (`/api/login`), JWT `alg: none` token forgery (`/api/vault`), Hydra SSH brute force, and root-executed writable cron script hijacking (`/opt/ironbank/scripts/backup.sh`).
- **Corp-DC01 (Hard)**: Enterprise Active Directory domain controller simulation on Windows Server 2019 with Kerberos (88), LDAP (389), SMB (445), SMB share enumeration, MS17-010 EternalBlue vulnerability analysis, synthetic Kerberoasting (`GetUserSPNs.py`), offline dictionary password cracking (`john` / `hashcat`), and DCSync domain admin escalation (`secretsdump.py` / `psexec.py`).
- Tailored machine detail tabs, synthetic source code inspectors, and comprehensive remediation guides.
- Automated end-to-end multi-target test suite (`phase5IronBankAndCorpDc01.test.ts`).

### Phase 6: BloodHound Attack Graph & Subnet Pivoting
- 2D interactive network topology visualizer.
- Dynamic compromise status updates (Locked $\to$ Discovered $\to$ User Foothold $\to$ Rooted).
- Multi-subnet traversal (DMZ $\to$ Internal Services $\to$ AD Domain Forest).

### Phase 7: In-Browser Web Proxy & Repeater
- Intercept and replay raw HTTP requests.
- Exploit presets for JNDI LDAP lookup strings and SQL injection bypasses.
- Raw text and rendered HTML response inspectors.

### Phase 8: GhostOps AI Offensive Copilot
- Socratic Mentor providing progressive hints without spoiling flags.
- Payload Forge generating pre-configured reverse shells and privesc commands.
- Autopilot Red Team kill chain walkthrough.

### Phase 9: Final Hardening & Verification
- End-to-end integration test suites.
- Production build optimization and deployment readiness.
