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

### Phase 6: Interactive Network Attack Graph (Complete)
- Production-grade React Flow interactive network canvas (`src/components/AttackGraph.tsx`) deriving topology directly from simulation engine and machine definitions.
- Custom machine nodes with role icons, compromise status glows, open ports counters, objective progress bars, and flag indicators (`AttackGraphNodeComponent.tsx`).
- 8 Distinct compromise states: `unknown`, `discovered`, `reachable`, `vulnerable`, `initial-access`, `privileged`, `compromised`, and `completed`.
- Strict Fog-of-War information isolation: downstream hosts and pivot routers redact IPs (`?.?.?.?`), ports, and CVEs until upstream pivot foothold is gained (`attackGraphTopology.ts`).
- Directed pivot edges dynamically unlock, style, and animate when pivot machines are breached.
- Rich interactive toolbar with Zoom In/Out, Fit-to-View, Reset Layout, live node search by IP/host/OS, and state filter tabs (`AttackGraphControls.tsx`).
- Dedicated offensive-security legend (`AttackGraphLegend.tsx`) and forensics details drawer (`AttackGraphDetailsDrawer.tsx`).
- Semantic HTML and ARIA-compliant Accessible Table/List View (`AttackGraphAccessibleTable.tsx`).
- Fully automated test suite (`src/tests/phase6AttackGraph.test.ts`) validating state derivation, event reactions, fog-of-war isolation, search, filters, and resets (123 total tests).

### Phase 7: In-Browser Web Proxy & Repeater
- Advanced HTTP request composer supporting GET, POST, PUT, PATCH, DELETE, OPTIONS, and HEAD (`RequestEditor.tsx`).
- Bi-directional synchronization between URL query strings and structured query parameter tables.
- Request headers editor with structured key-value rows and toggleable raw text mode.
- Interactive Cookie Jar manager synced directly with the `Cookie:` HTTP request header.
- Multi-format request body editor (JSON, form-urlencoded, raw) with auto-formatting "Prettify JSON".
- Exploit presets library for Log4Shell JNDI injection, SQLi auth bypass, JWT `alg: none` forgery, session cookies, and ADCS web enrollment (`repeaterPresets.ts`).
- Response inspector with status badge, round-trip timing, content-type, content-length, headers table, Pretty JSON, Raw HTTP text, and sandboxed rendered HTML preview (`ResponseViewer.tsx`).
- Request history tracking with execution log and one-click request replay (`RequestHistoryDrawer.tsx`).
- Quick export utilities ("Copy as cURL", "Copy Raw Request", "Copy Raw Response", "Copy Body").
- Strict in-browser security boundary preventing loopback/localhost, cloud metadata (169.254.x.x), and external internet access.
- Fully automated test suite (`src/tests/phase7WebRepeater.test.ts`) validating methods, parameters, cookies, headers, exploit triggers, route discovery, and security boundaries (22 tests, 145 total passing).

### Phase 8: CTF Progression, XP, Ranks, Flags, and Achievements
- Multi-tier flag validation system supporting User, Root, Special Challenge, and Final Range Master flags (`flagRegistry.ts`).
- Interactive flag submission modal with target machine auto-detection, immediate validation feedback, and duplicate prevention (`FlagSubmissionModal.tsx`).
- Documented, configurable 5-tier rank progression formula (Script Kiddie -> Hacker -> Pro Hacker -> Elite -> Omni God) in `progressionCalculator.ts`.
- 8 state- and event-driven achievements with explicit simulation triggers and duplicate award prevention in `achievementRegistry.ts`.
- IndexedDB progress persistence with versioned schema (`version: 1`) and resilient localStorage fallback in `persistenceService.ts`.
- Portable Save State Export and Import with JSON schema validation and corrupted payload rejection.
- Fully dynamic Dashboard deriving all XP metrics, rank progression bars, rooted machine counts, and recent activity timeline from live store state (`DashboardPage.tsx`).
- Unified Loot Vault combining captured flags, credentials, JWTs, and evidence items with full text search and category tabs (`InventoryPage.tsx`).
- Comprehensive automated test suite (`src/tests/phase8Progression.test.ts`) covering all progression rules, achievements, and persistence operations (20 tests, 165 total passing).

### Phase 9: Final Hardening & Verification
- End-to-end integration test suites across full cyber range operations.
- Production build optimization and deployment readiness.
