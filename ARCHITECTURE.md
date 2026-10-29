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
│   ├── services/        # VirtualFileSystem and CommandInterpreter
│   ├── store/           # Zustand state store
│   ├── tests/           # Vitest unit and integration test suites
│   ├── types/           # TypeScript domain definitions
│   ├── App.tsx          # Root router configuration
│   ├── main.tsx         # Application entrypoint
│   └── index.css        # Tailwind styling & cyber scrollbars
├── .env.example         # Environment template
├── ARCHITECTURE.md      # System architecture specification
├── PROJECT_PLAN.md      # Development roadmap
├── REQUIREMENTS_CHECKLIST.md # Traceability checklist
├── TASKS.md             # Work tracking breakdown
└── package.json         # Package configuration
```
