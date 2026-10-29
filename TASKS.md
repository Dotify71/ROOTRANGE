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
