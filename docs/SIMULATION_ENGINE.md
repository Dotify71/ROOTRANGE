# ROOTRANGE Simulation Engine Specification

The ROOTRANGE Simulation Engine (`SimulationEngine.ts`) is a high-performance, deterministic state machine executing entirely within the client's browser. It models networks, machines, virtual services, HTTP routes, active sessions, and multi-stage cyber security challenges without requiring containers or external infrastructure.

---

## 1. Core Responsibilities

```
                               ┌────────────────────────────────┐
                               │        SimulationEngine        │
                               └────────────────────────────────┘
                                  │            │            │
          ┌───────────────────────┴─┐          │            └──────────────────────┐
          ▼                         ▼          ▼                                   ▼
┌──────────────────┐   ┌─────────────────┐   ┌─────────────────┐         ┌────────────────────┐
│ Subnet & Routing │   │ Virtual Services│   │ Objective Graph │         │  Event Bus & State │
│ • DMZ Subnet     │   │ • SSH (22)      │   │ • Prerequisites │         │ • 11 Typed Events  │
│ • Vault Subnet   │   │ • HTTP (80)     │   │ • Foothold check│         │ • Reactive Sub     │
│ • AD Subnet      │   │ • Kerberos (88) │   │ • XP & Scoring  │         │ • Save / Hydrate   │
│ • Pivot checks   │   │ • SMB (445)     │   │ • Loot Vault    │         │ • Machine Resets   │
└──────────────────┘   └─────────────────┘   └─────────────────┘         └────────────────────┘
```

1. **Virtual Network Interfaces & Subnets**:
   - Models distinct virtual subnets (`10.10.11.0/24` DMZ, `10.10.11.80/28` Internal Financial Vault, `10.10.11.96/28` Active Directory Domain Forest).
   - Validates IP reachability (`canReachIp(targetIp)`): isolated subnets strictly require an initial foothold on an upstream pivot machine (`ecorp-hr` for IronBank; `iron-vault` for Corp-DC01).
2. **Service Discovery & Port Enumeration**:
   - Manages state of discovered ports per target machine.
   - Emits `SERVICE_DISCOVERED` events upon discovery via `nmap` or banner interaction.
3. **Virtual Web Server & Route Registry**:
   - Handles HTTP requests (`handleHttpRequest(host, request)`) locally in memory.
   - Dispatches responses for static endpoints (`/`, `/portal`, `/admin`), API endpoints (`/api/audit`, `/api/login`, `/api/vault`), and dynamic vulnerability payloads (Log4j JNDI strings, SQL injection tokens, JWT signatures).
4. **Interactive Session Registry**:
   - Tracks live sessions (`SSH`, `REVERSE_SHELL`, `CMD_SHELL`).
   - Supports switching interactive terminal contexts (`enterShell`), working directories, and user permissions (`www-data`, `alex`, `finance_admin`, `Administrator`, `root`).
5. **Challenge Graph & Objective Tracking**:
   - Manages sequential and non-linear challenge objectives with strict prerequisite evaluation (`isObjectiveUnlocked(id)`, `completeObjective(machineId, id)`).
   - Prevents out-of-order exploits or skipping reconnaissance stages.
6. **Typed Event Bus**:
   - Emits typed events (`SimulationEvent`) to all subscribed UI components (Attack Graph, Dashboard, Terminal, Loot Vault).

---

## 2. Typed Simulation Events

The engine dispatches 11 distinct event types:

| Event Type | Trigger Description | Key Payload Data |
|---|---|---|
| `SERVICE_DISCOVERED` | Port scanner probes open port | `machineId`, `port`, `service`, `version` |
| `DIRECTORY_DISCOVERED` | Web route discovered via fuzzing | `machineId`, `path`, `statusCode` |
| `VULNERABILITY_IDENTIFIED` | Exploit inspection or banner check | `machineId`, `name`, `cve`, `severity` |
| `CREDENTIAL_DISCOVERED` | Credential found in logs/code | `machineId`, `username`, `secret` |
| `INITIAL_ACCESS_GRANTED` | Reverse shell or SSH access established | `machineId`, `user`, `sessionType` |
| `SESSION_ESTABLISHED` | Interactive shell session launched | `machineId`, `sessionId`, `user` |
| `PRIVILEGE_ESCALATED` | User escalates to root/admin | `machineId`, `oldUser`, `newUser` |
| `MACHINE_COMPROMISED` | Target machine status transitions | `machineId`, `compromiseLevel` |
| `NETWORK_ROUTE_DISCOVERED` | New pivot route unlocked | `sourceSubnet`, `targetSubnet` |
| `FLAG_CAPTURED` | Valid CTF flag submitted | `flagId`, `machineId`, `points` |
| `CHALLENGE_COMPLETED` | Target challenge fully solved | `machineId`, `totalScoreAwarded` |

---

## 3. Command Adapters Integration

Standard offensive commands execute via `SimulatedCommandAdapters`:
- `nmap(args, ctx)`: Validates reachability, updates discovered ports, and auto-completes reconnaissance objectives.
- `gobuster(args)`: Fuzzes endpoints against the machine's route registry.
- `curl(args)`: Fires virtual HTTP requests to the target web server and evaluates vulnerability vectors.
- `nc(args)`: Listens on port 4444 to catch inbound reverse shells triggered by exploits.
- `ssh(args, ctx)`: Verifies credentials/keys and launches remote user sessions.
- `sudo(args, ctx)`: Checks `/etc/sudoers` permissions and executes commands with UID 0.
- `GetUserSPNs.py(args, ctx)`: Harvests Kerberoasting ticket hashes on Corp-DC01.
- `secretsdump.py(args, ctx)`: Performs DCSync replication attacks against Active Directory.
- `psexec.py(args, ctx)`: Passes NTLM hashes to launch administrative SYSTEM shells.
