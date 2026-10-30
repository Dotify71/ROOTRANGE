# ROOTRANGE Challenge Authoring Guide

This guide details how instructors, red teamers, and community contributors can create and contribute new training targets to ROOTRANGE.

---

## 1. Challenge Architecture Overview

Each machine in ROOTRANGE is defined declaratively using TypeScript models in `src/simulation/machineDefinitions.ts`. A complete machine requires:
1. **Machine Metadata**: Hostname, IP address, OS, architecture, difficulty tier, and description.
2. **Network Subnet**: Subnet CIDR, gateway, and optional upstream pivot prerequisite.
3. **Open Services Inventory**: Port numbers, protocol, service names, software versions, and banner strings.
4. **Web Route Registry** (if HTTP/HTTPS active): Route paths, methods, response codes, headers, and bodies.
5. **Virtual Filesystem Hierarchy**: Directories, files, ownership (UID/GID), octal permissions (`0644`, `0600`, `0755`), and content.
6. **Users & Credentials**: Usernames, UIDs, GIDs, home directories, and sudo privileges.
7. **Challenge Objectives Graph**: Sequenced or non-linear milestones with explicit prerequisites and XP awards.
8. **CTF Flags**: User, root, and optional special challenge flags registered in `flagRegistry.ts`.

---

## 2. Step-by-Step Walkthrough

### Step A: Define Machine Configuration
Open `src/simulation/machineDefinitions.ts` and add a new `SimulatedMachineConfig` entry:

```typescript
{
  id: 'crypto-ledger',
  name: 'CryptoLedger Node',
  hostname: 'ledger-node01',
  ip: '10.10.11.77',
  subnetId: 'subnet-internal-vault',
  os: 'Linux',
  osVersion: 'Ubuntu 22.04 LTS (Jammy Jellyfish)',
  difficulty: 'Medium',
  points: { user: 25, root: 35 },
  description: 'Decentralized smart contract backend with an exposed RPC interface and insecure sudo binary.',
  cves: ['CVE-2023-XXXXX (Insecure RPC Bind)'],
  userFlag: 'ROOTRANGE{u53r_crypt0_rpc_3xpl01t_pwn}',
  rootFlag: 'ROOTRANGE{r00t_m4st3r_bl0ckch41n_k3y}',
  userClaimed: false,
  rootClaimed: false,
  compromiseLevel: 'NONE',
  ports: [
    { port: 22, service: 'ssh', version: 'OpenSSH 8.9p1', state: 'open' },
    { port: 8545, service: 'json-rpc', version: 'Ethereum-compatible RPC 1.10.0', state: 'open' }
  ],
  webRoutes: [
    {
      path: '/rpc',
      method: 'POST',
      statusCode: 200,
      contentType: 'application/json',
      responseBody: JSON.stringify({ jsonrpc: '2.0', result: 'ready' }),
      headers: { Server: 'CryptoNode/1.0' }
    }
  ],
  users: [
    {
      username: 'validator',
      uid: 1001,
      gid: 1001,
      groups: ['validator'],
      homeDir: '/home/validator',
      hasSudo: true,
      sudoCommands: ['/usr/bin/python3 /opt/ledger/audit.py']
    }
  ],
  objectives: [
    {
      id: 'ledger-obj-1',
      title: 'Service Discovery',
      description: 'Run nmap to discover the exposed RPC interface on port 8545.',
      prerequisites: [],
      completed: false,
      xp: 15,
      category: 'RECONNAISSANCE'
    },
    {
      id: 'ledger-obj-2',
      title: 'Initial Access via RPC Injection',
      description: 'Deliver custom JSON-RPC request to trigger reverse shell as validator.',
      prerequisites: ['ledger-obj-1'],
      completed: false,
      xp: 25,
      category: 'EXPLOITATION'
    }
  ]
}
```

### Step B: Register Flags in `flagRegistry.ts`
Register all associated flag definitions in `src/services/flagRegistry.ts`:

```typescript
{
  id: 'flag-crypto-user',
  flag: 'ROOTRANGE{u53r_crypt0_rpc_3xpl01t_pwn}',
  machineId: 'crypto-ledger',
  type: 'user',
  title: 'CryptoLedger Validator Shell (User Flag)',
  description: 'Gained initial foothold via exposed JSON-RPC API.',
  points: 25,
}
```

### Step C: Register Filesystem Nodes in `virtualFs.ts`
Add the target's initial directory structure, user flag (`user.txt`), and root flag (`root.txt`) in `src/services/virtualFs.ts`.

### Step D: Add Automated Test Suite
Create `src/tests/machineCryptoLedger.test.ts` validating:
1. Reconnaissance (`nmap`).
2. Vulnerability exploitation (`curl` / `nc`).
3. Local file access permissions.
4. Privilege escalation.
5. Flag submission and XP award.
6. Target reset verification.
