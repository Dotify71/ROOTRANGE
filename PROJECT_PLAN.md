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

### Phase 4: BloodHound Attack Graph & Subnet Pivoting
- 2D interactive network topology visualizer.
- Dynamic compromise status updates (Locked $\to$ Discovered $\to$ User Foothold $\to$ Rooted).
- Multi-subnet traversal (DMZ $\to$ Internal Services $\to$ AD Domain Forest).

### Phase 5: In-Browser Web Proxy & Repeater
- Intercept and replay raw HTTP requests.
- Exploit presets for JNDI LDAP lookup strings and SQL injection bypasses.
- Raw text and rendered HTML response inspectors.

### Phase 6: GhostOps AI Offensive Copilot
- Socratic Mentor providing progressive hints without spoiling flags.
- Payload Forge generating pre-configured reverse shells and privesc commands.
- Autopilot Red Team kill chain walkthrough.

### Phase 7: Final Hardening & Verification
- End-to-end integration test suites.
- Production build optimization and deployment readiness.
