# ROOTRANGE System Architecture

## Overview
ROOTRANGE operates as a high-performance, client-side cyber range application executed completely in the browser with zero cloud compute requirements.

## Architecture Diagram

```
┌────────────────────────────────────────────────────────┐
│                   ROOTRANGE APPLICATION                │
├────────────────────────────────────────────────────────┤
│ Presentation Layer (React 18 + Tailwind CSS + Lucide)  │
│ • AppShell: Workstation Sidebar & Status Header        │
│ • 10 Functional Route Modules (Range, Graph, AI, etc.) │
│ • Web Audio API Synthesizer (Keystrokes, Pings, Alarms)│
├────────────────────────────────────────────────────────┤
│ State Management (Zustand Store)                       │
│ • Active Target Machine Selection                      │
│ • Network Node Compromise Graph States                 │
│ • Flag Submission & Score / Rank Calculations          │
├────────────────────────────────────────────────────────┤
│ Execution Engine (Virtual Linux Shell & Network Sim)   │
│ • VirtualFileSystem (In-memory nodes, permissions)     │
│ • CommandInterpreter (Pipes, nmap, gobuster, hydra)   │
│ • Interactive Reverse Shell & Sudo Privilege Daemon    │
└────────────────────────────────────────────────────────┘
```

## Directory Structure
```
ROOTRANGE/
├── src/
│   ├── audio/           # Procedural Web Audio API sound synthesizer
│   ├── components/      # UI components (PwnboxTerminal, AttackGraph, HttpRepeater, etc.)
│   │   └── layout/      # AppShell, Sidebar, TopStatusBar
│   ├── pages/           # 10 Functional Route Pages
│   ├── services/        # VirtualFileSystem, ShellParser, CommandRegistry, and CommandInterpreter
│   ├── simulation/      # Deterministic Cyber Range Simulation Engine
│   │   ├── adapters/    # Deterministic Command Adapters (nmap, gobuster, curl, etc.)
│   │   ├── machineDefinitions.ts # Typed machine configs and network subnets
│   │   ├── simulationEngine.ts   # Core engine, event bus, sessions, and state serialization
│   │   └── types.ts              # Typed domain models, events, and objectives
│   ├── store/           # Zustand state store
│   ├── tests/           # Vitest unit and integration test suites
│   ├── types/           # TypeScript domain definitions
│   ├── App.tsx          # Root router configuration
│   ├── main.tsx         # Application entrypoint
│   └── index.css        # Tailwind styling & cyber scrollbars

## Simulation Engine Architecture (Phase 3)

The simulation engine is designed as a deterministic, event-driven virtual penetration testing sandbox:

```
┌────────────────────────────────────────────────────────┐
│                   SIMULATION ENGINE                    │
├────────────────────────────────────────────────────────┤
│ Subnet & Network Routing (Pivoting & Gateway Enforcer) │
│ • DMZ (10.10.11.0/24) -> Directly accessible           │
│ • Internal Banking (10.10.12.0/24) -> Requires Pivot   │
│ • AD Forest (10.10.13.0/24) -> Requires Domain Pivot   │
├────────────────────────────────────────────────────────┤
│ Typed Event Bus (11 Event Types)                       │
│ • SERVICE_DISCOVERED, DIRECTORY_DISCOVERED             │
│ • VULNERABILITY_IDENTIFIED, CREDENTIAL_DISCOVERED      │
│ • INITIAL_ACCESS_GRANTED, SESSION_ESTABLISHED          │
│ • PRIVILEGE_ESCALATED, MACHINE_COMPROMISED             │
│ • CHALLENGE_COMPLETED, FLAG_CAPTURED                   │
├────────────────────────────────────────────────────────┤
│ Challenge Progression & Evidence Vault                 │
│ • Prerequisite objective graph validation              │
│ • Deduplicated loot & credential discovery             │
│ • Active interactive sessions (SSH, reverse shells)   │
├────────────────────────────────────────────────────────┤
│ Deterministic Command Adapters                         │
│ • nmap, gobuster, curl, ssh, sudo, hydra, sqlmap, nc   │
│ • linpeas.sh, ps aux                                   │
└────────────────────────────────────────────────────────┘
```
├── .env.example         # Environment template
├── ARCHITECTURE.md      # System architecture specification
├── PROJECT_PLAN.md      # Development roadmap
├── REQUIREMENTS_CHECKLIST.md # Traceability checklist
├── TASKS.md             # Work tracking breakdown
└── package.json         # Package configuration
```
