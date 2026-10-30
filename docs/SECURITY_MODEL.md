# ROOTRANGE Security Model & Sandboxing Architecture

ROOTRANGE is built specifically for offensive cyber security education and penetration testing simulations. To provide a completely safe environment, ROOTRANGE enforces strict sandboxing and security isolation boundaries.

---

## 1. Threat Model & Invariant Rules

ROOTRANGE operates under four non-negotiable security invariants:

1. **Zero Host System Execution**:
   - The virtual terminal, parser, and command adapters NEVER execute code on the host operating system.
   - `eval()`, `new Function()`, `child_process`, and browser plugins are strictly prohibited in the terminal engine.
2. **Strict Simulation Network Boundary (SSRF Defense)**:
   - The HTTP repeater and command adapters operate exclusively on internal simulated subnets (`10.10.0.0/16`) and virtual machine hostnames.
   - Requests to `localhost`, `127.0.0.1`, `0.0.0.0`, private cloud metadata endpoints (`169.254.169.254`), and arbitrary internet addresses are blocked with `403 Security Boundary Violation`.
3. **No Weaponized Arbitrary Exploits**:
   - The Payload Forge generates educational templates targeted strictly to the simulated environment.
   - It does not establish real outbound reverse shells or target external machines on the local network or internet.
4. **Client-Side Secret & Privacy Protection**:
   - All progress, flags, and saves persist locally in the user's browser (IndexedDB and localStorage).
   - No telemetry, keystrokes, or player activity are exfiltrated to external analytics or third-party servers.

---

## 2. Architecture Boundary Matrix

| Component | Target Domain | Execution Boundary | Defense / Enforcement |
|---|---|---|---|
| **Pwnbox Terminal** | Shell commands | Pure Virtual Memory (`VirtualFileSystem`) | Custom tokenizer (`ShellParser`), no OS exec |
| **HTTP Repeater** | Virtual Web Endpoints | `SimulationEngine.handleHttpRequest` | IP prefix validation (`10.10.x.x`), 403 on SSRF |
| **Pivoting Engine** | Target Subnets | Virtual Subnet Router | Foothold verification (`canReachIp`), Fog-of-War |
| **AI Copilot** | Mentor guidance | Offline Heuristics (or local LLM via user key) | Ephemeral session memory, zero telemetry |
| **CTF Flags** | Points & Ranks | Client-side Validation | Single-award deduplication, schema validation |

---

## 3. Auditing & Vulnerability Disclosure

To report a vulnerability or sandbox bypass in ROOTRANGE:
- Please review `SECURITY.md` or open a confidential security advisory on GitHub.
- Submissions will be acknowledged within 48 hours and patched promptly.
