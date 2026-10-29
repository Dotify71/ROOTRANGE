# ROOTRANGE: Comprehensive Project Plan

## 1. Executive Summary
ROOTRANGE is an open-source, in-browser Cyber Range and Gamified Penetration Testing Battleground designed to deliver an advanced, cost-free alternative to commercial platforms like Hack The Box.

## 2. Phase Breakdown

### Phase 1: Repository Audit and Project Foundation (Current)
- Establish React 18, TypeScript, and Vite with strict typing.
- Configure Tailwind CSS, Lucide icons, and Zustand game store.
- Implement React Router DOM with 10 functional routes.
- Implement responsive workstation AppShell with collapsible sidebar and top status bar.
- Create automated testing setup using Vitest and React Testing Library.
- Provide comprehensive architectural and task tracking documentation.

### Phase 2: Virtual Pwnbox Terminal & Shell Engine
- In-memory virtual Linux filesystem (`/bin`, `/etc`, `/home/kali`, `/root`).
- Command interpreter supporting pipelines (`| grep`), command history, and auto-complete.
- Simulated offensive tooling: `nmap`, `gobuster`, `hydra`, `nc`, `curl`, and `sudo`.

### Phase 3: Simulated Machines Range & CVE Scenarios
- Box 1: E-Corp HR (Log4j CVE-2021-44228 $\to$ Sudo Find Root Privesc).
- Box 2: IronBank Vault (SQLi Auth Bypass $\to$ JWT Signature Forgery $\to$ Cron Root).
- Box 3: OmniCorp DC01 (Windows Active Directory $\to$ Kerberoasting $\to$ Domain Admin).

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
