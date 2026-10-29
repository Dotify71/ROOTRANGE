# ROOTRANGE Tasks Tracker

## Phase 1: Repository Audit and Project Foundation
- [x] Establish React 18, TypeScript, and Vite with strict configuration.
- [x] Verify Tailwind CSS and Lucide React.
- [x] Configure Zustand store.
- [x] Install and configure React Router DOM.
- [x] Configure Vitest and React Testing Library testing setup.
- [x] Establish shared design tokens and responsive layout components (`AppShell`, `Sidebar`, `TopStatusBar`).
- [x] Implement 10 functional routes (Dashboard, Range, Machines, Attack Graph, Repeater, GhostOps AI, Inventory, Achievements, Docs, Settings).
- [x] Provide helpful initial empty states for all views.
- [x] Establish linting, formatting, and build scripts.
- [x] Create `.env.example` and verify `.gitignore`.
- [x] Create `PROJECT_PLAN.md`, `ARCHITECTURE.md`, `TASKS.md`, and `REQUIREMENTS_CHECKLIST.md`.
- [x] Verify automated test coverage across all components and router.

## Phase 2: Virtual Pwnbox Terminal & Shell Engine
- [x] Responsive terminal interface with mechanical keystroke audio feedback.
- [x] Realistic prompt reflecting current user (`kali`, `www-data`, `root`), host (`pwnbox`, `ecorp-hr`), and working directory.
- [x] Command history tracking with ArrowUp and ArrowDown keyboard navigation.
- [x] Tab completion for registered shell commands and virtual filesystem paths.
- [x] Safe command tokenizer (`ShellParser`) supporting arguments, quotes, and backslash escapes without `eval()`.
- [x] Multi-command pipeline execution (`cmd1 | cmd2 | cmd3`) forwarding stdout to stdin.
- [x] Output redirection (`>` overwrite, `>>` append) obeying filesystem write permissions.
- [x] Standard output, standard error, and exit status codes (e.g. 127 command not found).
- [x] Structured virtual Linux filesystem (`VirtualFileSystem`) with POSIX octal modes and permissions.
- [x] Simulated users (`root`, `kali`, `alex`, `www-data`), UIDs, GIDs, groups, and working directories.
- [x] Typed command registry (`CommandRegistry`) with modular handlers.
- [x] Implemented core commands: `help`, `clear`, `pwd`, `whoami`, `id`, `uname`, `ls`, `cd`, `cat`, `head`, `tail`, `grep`, `find`, `stat`, `env`, `history`, `echo`, `touch`, `mkdir`, `sudo`, `nmap`, `gobuster`, `nc`, `curl`, `hydra`, `exit`.
- [x] Training machine fixtures (`/etc/passwd`, `/etc/shadow`, `/var/log/auth.log`, `/var/www/html/index.html`, `/var/www/html/config.php`, `/home/alex/user.txt`, `/root/root.txt`, `/root/scripts/backup.sh`).
- [x] Permission boundaries: unprivileged users are strictly prevented from accessing root-owned files.
- [x] Comprehensive test suite (`src/tests/phase2Terminal.test.ts`) covering parser, filesystem, permissions, pipelines, and commands (27 tests).

## Phase 3: Deterministic Cyber Range Simulation Engine
- [x] Machine definitions with typed configurations (`SimulatedMachineConfig`, `SIMULATED_MACHINES`).
- [x] Virtual network interfaces (`eth0`, `lo`, MAC, netmasks) and subnets (`SIMULATED_SUBNETS`).
- [x] Network routing and subnet pivoting enforcement (`canReachIp` requiring pivot machine foothold).
- [x] Simulated services and service banners across SSH, HTTP, MySQL, Kerberos, LDAP, SMB.
- [x] Service discovery and port enumeration (`discoverPort` emitting `SERVICE_DISCOVERED`).
- [x] Simulated web servers and route registries with dynamic handlers for Log4j JNDI and SQLi.
- [x] Virtual users, groups, UIDs, GIDs, and sudoers permissions.
- [x] Virtual process tables (`VirtualProcess`, `ps aux` command).
- [x] Challenge objectives and prerequisite validation (`completeObjective`, `isObjectiveUnlocked`).
- [x] Evidence and inventory records vault (`EvidenceItem`, `addEvidence`, duplicate deduplication).
- [x] Simulated authentication and session establishment (`createSession`, `terminateSession`, `ssh`).
- [x] Real-time privilege level tracking (`NONE` -> `RECON` -> `USER` -> `ROOT`).
- [x] Typed simulation event model with 11 distinct event types and reactive subscriptions.
- [x] XP and flag event hooks integrated with Zustand game store.
- [x] Machine reset (`resetMachine`) and range reset (`resetRange`).
- [x] Versioned save-state serialization and restoration (`exportState`, `importState`).
- [x] Deterministic simulated command adapters for `nmap`, `gobuster`, `curl`, `ssh`, `sudo`, `hydra`, `sqlmap`, `nc`, `linpeas.sh`.
- [x] Comprehensive unit tests for event transitions, prerequisites, duplicate events, invalid actions, and reset behavior (22 tests in `phase3Simulation.test.ts`).

## Phase 4: E-Corp HR Training Machine
- [x] Dedicated Machine Detail Page (`/machines/:id`) with target briefing, IP, hostname, OS, and difficulty.
- [x] Service inventory displaying live status, open ports, versions, and protocol banners (SSH, HTTP, Log4j app).
- [x] Interactive 7-stage Attack Journey progress tracker (Recon -> Web Enum -> Vuln Investigation -> Initial Access -> User Flag -> Sudo Privesc -> Root Flag).
- [x] Synthetic source code and configuration inspection tab (`Log4jAuditLogger.java`, `pom.xml`, `/var/www/html/config.php`, `/etc/sudoers.d/alex`).
- [x] Comprehensive Educational Remediation Guide covering Apache Log4Shell (CVE-2021-44228) and Sudo GTFOBins misconfigurations.
- [x] In-page Flag Submission modal and instant validation with sound and confetti triggers.
- [x] Pristine machine reset workflow restoring machine state, services, sessions, and objectives.
- [x] Seamless navigation between Machine Catalog (`/machines`), Machine Detail (`/machines/:id`), and Pwnbox Terminal (`/range`).
- [x] Automated test suite (`src/tests/phase4EcorpMachine.test.ts`) validating end-to-end user attack path, prerequisites, file inspection, privilege escalation, and reset behavior (11 tests).

## Phase 5: IronBank Vault and Corp-DC01 Training Machines
- [x] Fictional financial application machine (IronBank Vault, 10.10.11.82, Medium) with MySQL database services, API endpoints, and SSH.
- [x] Constrained parameter-sensitive SQL injection authentication bypass on `/api/login` and query execution debug feedback.
- [x] Fictional JWT configuration flaws (`alg: none` and weak secret) granting access to `/api/vault` and confidential records.
- [x] Insecure cron task hijacking scenario (`/opt/ironbank/scripts/backup.sh` writable by `finance_admin`) escalating to root.
- [x] Active Directory Domain Controller machine (Corp-DC01, 10.10.11.99, Hard) with Kerberos (88), LDAP (389), SMB (445).
- [x] SMB service enumeration (`ADMIN$`, `C$`, `IPC$`, `SYSVOL`, `Shared`) and legacy MS17-010 EternalBlue vulnerability analysis.
- [x] Synthetic Kerberoasting learning exercise extracting TGS service ticket hashes for SPN `MSSQLSvc/corp-dc01.omnicorp.local:1433`.
- [x] Wordlist password recovery with `john` / `hashcat` capturing the Active Directory user flag.
- [x] Domain privilege escalation via DCSync (`secretsdump.py`) and Pass-the-Hash (`psexec.py`) capturing Domain Admin root flag.
- [x] Dedicated machine detail views for both targets with tailored tabs, synthetic artifacts, and remediation guidance.
- [x] Complete automated test suite (`src/tests/phase5IronBankAndCorpDc01.test.ts`) covering all 15 test cases (106 total passing tests).
