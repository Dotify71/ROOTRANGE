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

## Phase 6: Interactive Network Attack Graph
- [x] Custom machine nodes using React Flow with state-specific visual styling and indicators.
- [x] Directed network edges connecting Gateway -> DMZ Server -> Pivot Router -> Internal Vault -> Domain Controller.
- [x] 8 Distinct Compromise States implemented: `unknown`, `discovered`, `reachable`, `vulnerable`, `initial-access`, `privileged`, `compromised`, `completed`.
- [x] Conditional node and edge visibility with strict Fog-of-War preventing premature leakage of hidden IPs, ports, and CVEs.
- [x] Directed pivot edges unlock and animate when upstream pivot hosts are compromised.
- [x] Zoom in, Zoom out, Pan, and Fit-to-View controls.
- [x] Reset Layout restoring optimal positions and viewport centering.
- [x] Interactive Node Search by hostname, IP address, OS, or subnet with instant match highlighting.
- [x] State Filter toolbar tabs (`ALL`, `REACHABLE`, `VULNERABLE`, `FOOTHOLD`, `ROOTED`, `COMPLETE`, `LOCKED`) with live badge counts.
- [x] Comprehensive Attack Graph Legend explaining all 8 states, edge styles, and node roles.
- [x] Selected-Node Forensics Details Drawer displaying machine specs, open ports table, vulnerability vectors, objectives, flags, and quick action buttons.
- [x] Accessible Alternative Table/List View with full semantic HTML, ARIA labels, and keyboard navigation.
- [x] Connected to simulation events (`SERVICE_DISCOVERED`, `INITIAL_ACCESS_GRANTED`, `PRIVILEGE_ESCALATED`, `NETWORK_ROUTE_DISCOVERED`, `FLAG_CAPTURED`, `CHALLENGE_COMPLETED`).
- [x] Graph state stays strictly synchronized after challenge resets and page refreshes.
- [x] Automated test suite (`src/tests/phase6AttackGraph.test.ts`) covering all 17 test cases across topology derivation, fog-of-war, event reactions, search/filters, and resets (123 total tests).

## Phase 7: Built-in Web Security Proxy Interface and HTTP Repeater
- [x] HTTP method selection supporting `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, and `HEAD`.
- [x] Dynamic URL path and query string synchronization (bi-directional sync between path bar and parameters table).
- [x] Query parameter editing table with Key, Value, Description, and enable/disable checkboxes.
- [x] Request headers editor supporting structured key-value table and raw text mode toggle.
- [x] Cookie Jar editor with structured key-value entries synced automatically with the `Cookie:` header.
- [x] Request body editor supporting JSON, x-www-form-urlencoded, and raw text formats.
- [x] Prettify JSON formatting helper and quick payload inject buttons.
- [x] Send Request action with keyboard shortcut (`Ctrl+Enter` / `Cmd+Enter`) and realistic duration simulation (15–75ms).
- [x] Response status badge, content-type, content-length, round-trip timing, and headers inspector.
- [x] Multi-mode response body viewer: Pretty JSON, Raw HTTP text, and sandboxed rendered HTML preview.
- [x] Request history tracking with chronological execution log, method badges, status codes, and instant replay into editor.
- [x] Quick export controls: "Copy as cURL", "Copy Raw Request", "Copy Raw Response", and "Copy Body".
- [x] Attack vector preset library: Log4Shell JNDI injection (`User-Agent` / `X-Forwarded-For`), SQLi auth bypass, JWT `alg: none` forgery, Admin session cookie, and ADCS web enrollment.
- [x] Strict security boundary: prevents loopback (`127.0.0.1`, `localhost`), cloud metadata (`169.254.x.x`), and arbitrary external hosts (`google.com`) with 403 Security Boundary Violation.
- [x] Integration with simulation engine: triggers service/port discovery, route enumeration, vulnerability discovery, and evidence creation (`addEvidence`).
- [x] Complete automated test suite (`src/tests/phase7WebRepeater.test.ts`) covering methods, query params, headers, cookies, route discovery, security boundaries, and AD endpoints (22 tests, 145 total passing tests).


