# ⚔️ ROOTRANGE // THE OPEN-SOURCE CYBER RANGE

> **An In-Browser, Zero-Subscription Cyber Range & Penetration Testing Battleground ("Hack The Box on Steroids")**  
> *Built with React 18, TypeScript, Tailwind CSS, Zustand, and a client-side virtual offensive execution engine.*

```
  ____   ____   ____ _______ _____            _   _  _____ ______ 
 |  _ \ / __ \ / __ \__   __|  __ \     /\   | \ | |/ ____|  ____|
 | |_) | |  | | |  | | | |  | |__) |   /  \  |  \| | |  __| |__   
 |  _ <| |  | | |  | | | |  |  _  /   / /\ \ | . ` | | |_ |  __|  
 | |_) | |__| | |__| | | |  | | \ \  / ____ \| |\  | |__| | |____ 
 |____/ \____/ \____/  |_|  |_|  \_\/_/    \_\_| \_|\_____|______|
                     [ G H O S T // O P S ]
```

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-219%20passed-brightgreen.svg)](docs/TESTING.md)
[![CI Status](https://img.shields.io/badge/CI-Passing-brightgreen.svg)](.github/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 🥊 Hack The Box vs ROOTRANGE

| Feature | Hack The Box (VIP) | ROOTRANGE |
| :--- | :--- | :--- |
| **Price** | $14 – $30 / month | **100% Free & Open Source (MIT)** |
| **Setup Required** | OpenVPN files, local VM, cloud wait times | **Zero Setup (Instant In-Browser)** |
| **Offline Execution** | Requires persistent internet to cloud | **100% Client-Side In-Memory Engine** |
| **Offensive AI Co-Pilot** | None (Forum hints only) | **Built-in Socratic AI & Payload Forge** |
| **Attack Graph Visualizer** | None (Isolated IP boxes) | **BloodHound-style Multi-Subnet Pivoting** |
| **Web Proxy / Repeater** | Requires external Burp Suite setup | **Integrated In-Browser HTTP Repeater** |
| **Audio Immersion** | Silent | **Web Audio API Procedural Feedback** |
| **State Persistence** | Cloud database account required | **IndexedDB + Exportable JSON Saves** |

---

## 🚀 Key Modules

### 1. In-Browser "Pwnbox" Kali Terminal
Realistic offensive CLI emulator equipped with core reconnaissance and exploit tools:
* `nmap -sV -sC <target_ip>`: Port scanner discovering open services and versions.
* `gobuster dir -u <url> -w common.txt`: Web endpoint fuzzing.
* `curl -X POST -H "..." <url>`: Raw HTTP payload delivery.
* `nc -lvnp 4444`: Arbitrary TCP socket listener for catching reverse shells.
* `ssh [user@]host`: OpenSSH remote login client.
* `sudo [-l] [command]`: Sudoers verification and GTFOBins root exploits.
* Active Directory Tooling: `smbclient`, `GetUserSPNs.py`, `john` / `hashcat`, `secretsdump.py`, `psexec.py`.
* POSIX utilities: `cat`, `ls -la`, `cd`, `pwd`, `whoami`, `id`, `stat`, `mkdir`, `touch`, `ps aux`, and multi-stage pipelines (`cat /etc/passwd | grep root`).
* Interactive Terminal Font Scaling (`sm`, `base`, `lg`) and procedural keystroke audio.

### 2. BloodHound-Style Interactive Network Attack Graph
Live interactive React Flow topology showing:
* `Perimeter Gateway (10.10.10.1)` $\to$ `E-Corp DMZ (10.10.11.45)` $\to$ `Internal Transit Router (10.10.11.81)` $\to$ `IronBank Vault (10.10.11.82)` $\to$ `Corp-DC01 AD Forest (10.10.11.99)`.
* 8 distinct node compromise states (`unknown`, `discovered`, `reachable`, `vulnerable`, `initial-access`, `privileged`, `compromised`, `completed`).
* Strict Fog-of-War preventing discovery of downstream targets until upstream pivot footholds are compromised.
* Real-time search, 7 state filter tabs, minimap, and comprehensive forensics drawer.

### 3. Integrated Web Security Proxy & HTTP Repeater (Burp Suite Clone)
* Inspect and craft raw HTTP requests (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
* Dynamic URL path synchronization, query parameters table, raw and structured headers editor, and interactive Cookie Jar.
* Pre-configured exploit presets for Log4j JNDI injection, SQL injection auth bypass, JWT `alg: none` forgery, and ADCS web enrollment.
* Strict simulation firewall blocking SSRF to `localhost`, `127.0.0.1`, cloud metadata (`169.254.169.254`), and arbitrary external hosts.

### 4. Three Complete Realistic Training Machines
1. **E-Corp HR (10.10.11.45, Easy)**: Linux HR portal vulnerable to Log4Shell (CVE-2021-44228) and `/usr/bin/find` GTFOBins privilege escalation.
2. **IronBank Vault (10.10.11.82, Medium)**: Financial database server vulnerable to SQL injection authentication bypass, JWT secret tampering, and scheduled cron script hijacking.
3. **Corp-DC01 (10.10.11.99, Hard)**: Active Directory Domain Controller with SMB share enumeration, MS17-010 EternalBlue investigation, Kerberoasting hash cracking, and DCSync / Pass-the-Hash domain takeovers.

### 5. GhostOps AI Offensive Co-Pilot
* **Socratic Mentor**: 5 graduated hint depths (Direction $\to$ Category $\to$ Evidence $\to$ Next Step $\to$ Full Walkthrough) without spoiling flags.
* **Payload Forge**: Parameterized reverse shell generator (Bash, Netcat, Python PTY, Log4j JNDI strings, GTFOBins commands) with safety notes.
* **Autopilot Red Team**: Visual step-by-step adversary simulation with Pause, Step-Forward, and Reset controls.
* **Pluggable Provider Abstraction**: Zero-dependency offline engine default, plus optional integration with local Ollama (`http://localhost:11434`), OpenAI, Anthropic Claude, and Google Gemini.

### 6. CTF Progression, Scoreboard, & Persistence
* Real-time flag validation with single-award duplicate submission prevention.
* 5-Tier progression rank ladder: Script Kiddie (0 XP) $\to$ Hacker (20 XP) $\to$ Pro Hacker (55 XP) $\to$ Elite (105 XP) $\to$ Omni God (155+ XP).
* 8 event-driven achievements with celebration badges and canvas-confetti.
* Local persistence using IndexedDB (version 1) with localStorage fallback, and cryptographically validated JSON save export and restoration.

### 7. Immersion, Procedural Audio, and Accessibility
* Procedural Web Audio API synthesizers (mechanical keystroke chatter, scan pings, shell connection pops, fanfare chords) with master volume slider and mute toggle.
* Optional retro CRT phosphor scanline shader overlays.
* Reduced-motion support honoring system `prefers-reduced-motion` and user settings.
* Accessible Keyboard Shortcuts Manual modal (`Ctrl+K` / `Cmd+K` / `Esc`).
* Accessible confirmation dialogs (`ConfirmDialog.tsx`) with ARIA `role="alertdialog"` replacing browser popups.

---

## 🎯 Target Machines & Attack Paths

```
┌────────────────────────────────────────────────────────────────────────┐
│                              TARGET RANGE                              │
├────────────────────────────────────────────────────────────────────────┤
│ 1. E-Corp HR (10.10.11.45) // Easy Linux DMZ                           │
│    Recon -> Web Enum -> Log4j RCE -> Reverse Shell -> Sudo Find -> Root│
│                                                                        │
│ 2. IronBank Vault (10.10.11.82) // Medium Debian Core                  │
│    Pivoting -> SQLi Login Bypass -> JWT Tampering -> Cron Esc -> Root  │
│                                                                        │
│ 3. Corp-DC01 (10.10.11.99) // Hard Windows Active Directory            │
│    SMB Enum -> EternalBlue -> Kerberoasting -> DCSync -> Pass-the-Hash │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Quickstart

```bash
# 1. Clone the repository
git clone https://github.com/Dotify71/ROOTRANGE.git
cd ROOTRANGE

# 2. Install dependencies
npm ci

# 3. Run type check and tests
npm run typecheck
npm test -- --run

# 4. Start local development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📖 Comprehensive Documentation

| Document | Purpose |
|---|---|
| [docs/INSTALLATION.md](docs/INSTALLATION.md) | System requirements, deployment, and static hosting guide |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Development workflow, architecture, and coding conventions |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Complete system architecture and domain models |
| [docs/SIMULATION_ENGINE.md](docs/SIMULATION_ENGINE.md) | Deterministic simulation engine, event bus, and routing |
| [docs/CHALLENGE_AUTHORING.md](docs/CHALLENGE_AUTHORING.md) | Guide for creating and contributing new training targets |
| [docs/SECURITY_MODEL.md](docs/SECURITY_MODEL.md) | Threat model, sandbox boundaries, and SSRF defenses |
| [docs/AI_PROVIDERS.md](docs/AI_PROVIDERS.md) | GhostOps AI provider setup (Offline, Ollama, OpenAI, Gemini) |
| [docs/TESTING.md](docs/TESTING.md) | Test architecture, suites overview, and verification procedures |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Solutions for common audio, command, and persistence issues |
| [docs/ENV_VARS.md](docs/ENV_VARS.md) | Complete environment variable reference |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guide and code of conduct |
| [RELEASE_NOTES.md](RELEASE_NOTES.md) | Official v1.0.0 release notes and feature breakdown |
| [REQUIREMENTS_CHECKLIST.md](REQUIREMENTS_CHECKLIST.md) | Complete requirements traceability matrix |

---

## 🧪 Testing & Quality Assurance

ROOTRANGE includes **19 automated test suites** covering **219 tests**:

```bash
npm test -- --run
```

All 219 test cases validate:
* Shell parser, virtual filesystem, and POSIX permissions.
* Simulation engine, event transitions, prerequisites, and machine resets.
* Multi-target attack chains across E-Corp HR, IronBank Vault, and Corp-DC01.
* React Flow topology derivation, Fog-of-War, search, and filters.
* HTTP repeater methods, parameters, cookies, and SSRF security firewall.
* CTF flag validation, 5-tier rank formula, achievements, and IndexedDB persistence.
* GhostOps AI offline mentor hints, templates, autopilot, and error fallbacks.
* Procedural Web Audio API safety, CRT scanlines, and accessibility dialogs.
* All 12 essential regression scenarios and end-to-end user journeys.

---

## 📜 License

ROOTRANGE is distributed under the **MIT License**. See [LICENSE](LICENSE) for details.
