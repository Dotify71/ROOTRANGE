# ROOTRANGE Release Notes

---

## v1.0.0 — Production General Availability Release (2026-10-30)

We are thrilled to announce the official **v1.0.0** release of **ROOTRANGE**, the open-source in-browser cyber range and penetration testing battleground.

### 🌟 Key Highlights & Capabilities

#### 1. In-Browser "Pwnbox" Kali Virtual Terminal
- Interactive virtual terminal shell emulator with prompt state (`kali@pwnbox`, `www-data@ecorp-hr`, `root@ecorp-hr`).
- Command history navigation (`ArrowUp` / `ArrowDown`), Tab path/command autocompletion, and Ctrl+C interrupt handling.
- Full POSIX virtual filesystem (`VirtualFileSystem`) with octal modes (`0644`, `0600`, `0755`), UID/GID boundaries, and root protections.
- Safe tokenizer (`ShellParser`) supporting multi-stage pipelines (`cat | grep | head`) and file redirections (`>`, `>>`) without `eval()`.
- Built-in offensive security tool adapters: `nmap`, `gobuster`, `curl`, `nc`, `ssh`, `sudo`, `linpeas.sh`, `GetUserSPNs.py`, `secretsdump.py`, `psexec.py`, `smbclient`, `john`, `sqlmap`, `hydra`.

#### 2. Three Full Realistic Training Machines
- **E-Corp HR (10.10.11.45, Easy)**: Linux payroll application with Log4Shell (CVE-2021-44228) remote code execution and GTFOBins `find` privilege escalation.
- **IronBank Vault (10.10.11.82, Medium)**: Financial database server with parameter-sensitive SQL injection auth bypass, JWT `alg: none` forgery, and scheduled cron task hijacking.
- **Corp-DC01 (10.10.11.99, Hard)**: Windows Server 2019 Domain Controller with SMB enumeration, MS17-010 EternalBlue vulnerability analysis, Kerberoasting hash cracking (`john`/`hashcat`), and DCSync / Pass-the-Hash domain takeovers.

#### 3. BloodHound-Inspired Interactive Network Attack Graph
- Built with React Flow featuring custom SVG machine nodes and directed pivot edges.
- 8 distinct node compromise states (`unknown`, `discovered`, `reachable`, `vulnerable`, `initial-access`, `privileged`, `compromised`, `completed`).
- Strict Fog-of-War preventing premature exposure of isolated target addresses and CVEs until upstream pivot hosts are compromised.
- Live search, 7 state filter tabs, minimap, zoom/pan controls, and forensics details drawer.

#### 4. Integrated Web Security Proxy & HTTP Repeater
- Built-in Burp Suite-inspired testing interface for crafting requests (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
- Query parameters table, structured and raw headers editor, and interactive Cookie Jar.
- 7 pre-configured offensive attack presets (Log4Shell JNDI injection, SQLi auth bypass, JWT forgery, ADCS enrollment).
- Strict simulation firewall blocking SSRF to `localhost`, `127.0.0.1`, cloud metadata (`169.254.169.254`), and arbitrary internet domains.

#### 5. CTF Progression, Scoreboard, & Persistence
- User flags, root flags, and special challenge flags with single-award deduplication guarantees.
- 5-Tier progression rank formula: Script Kiddie (0 XP), Hacker (20 XP), Pro Hacker (55 XP), Elite (105 XP), Omni God (155+ XP).
- 8 event-driven achievements with celebration badges and canvas-confetti effects.
- Unified Loot Vault combining flags, credentials, JWTs, and evidence items with category filtering.
- Local persistence using IndexedDB (schema version 1) with localStorage fallback, and portable JSON export/import with deep schema validation.

#### 6. GhostOps AI Offensive Co-Pilot
- Socratic Mentor Mode with 5 graduated hint depths (Direction -> Category -> Evidence -> Next Step -> Full Walkthrough).
- Offline Deterministic Engine functioning as the zero-dependency, zero-cost default.
- Training Payload Forge generating parameterized reverse shells, web injections, and privesc commands with safety notes.
- Adversary Autopilot Red Team simulator demonstrating automated kill-chain progression with Pause, Step-Forward, and Reset controls.
- Pluggable provider abstraction supporting local Ollama (`http://localhost:11434`), OpenAI, Anthropic Claude, and Google Gemini APIs.

#### 7. Immersion, Procedural Audio, and Accessibility
- Web Audio API procedural sound synthesizer (keystroke chatter, scan pings, shell pops, and fanfare chords) with master gain slider and mute toggle.
- Optional CRT phosphor scanline shader overlays.
- Reduced-motion accessibility honoring both system `(prefers-reduced-motion: reduce)` and manual in-app toggle.
- Terminal typography scaling controls (`sm`, `base`, `lg`) with Zoom In / Zoom Out shortcuts.
- Accessible Keyboard Shortcuts Manual modal (`Ctrl+K` / `Cmd+K` / `Esc`).
- Semantic confirmation dialogs (`ConfirmDialog.tsx`) with full ARIA `role="alertdialog"` support.
- Non-color status cues across all machines, flags, and graph nodes.

#### 8. Production Quality & Verification
- **19 Automated Test Suites** with **219 passing tests** (0 failed).
- **TypeScript strict typing**: 0 errors.
- **Optimized bundle splitting**: main chunk reduced to 373 kB.
- **GitHub Actions CI**: Automated verification pipeline on push and PR.
