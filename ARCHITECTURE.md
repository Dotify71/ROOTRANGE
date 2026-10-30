# ROOTRANGE System Architecture

## 1. System Overview

ROOTRANGE is a high-performance, client-side cyber range and penetration testing training platform. It operates 100% within the user's browser, eliminating the need for expensive cloud compute, virtualization infrastructure, or VPN tunnels, while delivering a realistic and educationally grounded offensive security experience.

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           ROOTRANGE APPLICATION SHELL                          │
├────────────────────────────────────────────────────────────────────────────────┤
│ Presentation Layer (React 18 + Tailwind CSS + Lucide + Web Audio API)          │
│ • AppShell: Workstation Sidebar, Top Status Header, Telemetry, and CRT Shader   │
│ • 10 Functional Route Modules (Terminal, Attack Graph, Web Repeater, AI, etc.) │
│ • Accessible Dialogs: ConfirmDialog (alertdialog), ShortcutsModal (Ctrl+K)    │
├────────────────────────────────────────────────────────────────────────────────┤
│ State Management & Data Layer (Zustand 5 + IndexedDB)                          │
│ • useGameStore: Active target, compromise levels, scores, flags, achievements  │
│ • usePreferencesStore: Volume, mute state, CRT shaders, motion, terminal font  │
│ • PersistenceService: Schema v1 IndexedDB + localStorage fallback              │
├────────────────────────────────────────────────────────────────────────────────┤
│ Core Simulation & Execution Engine (Deterministic Virtual State Machine)       │
│ • SimulationEngine: Subnet router, service discovery, objectives, event bus   │
│ • VirtualFileSystem: In-memory POSIX filesystem, octal modes, UID/GID checks   │
│ • CommandRegistry & Interpreter: Tokenizer, pipelines, redirection, adapters  │
│ • AttackGraphTopology: Pure deterministic React Flow node & edge derivation    │
│ • GhostOps AI: Socratic mentor, Payload forge, Autopilot, and LLM adapters     │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
ROOTRANGE/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI workflow
├── docs/                        # Comprehensive documentation suite
│   ├── AI_PROVIDERS.md          # GhostOps AI provider setup
│   ├── CHALLENGE_AUTHORING.md   # Guide for adding new vulnerable targets
│   ├── DEVELOPMENT.md           # Developer workflow and coding standards
│   ├── ENV_VARS.md              # Environment variable reference
│   ├── INSTALLATION.md          # Setup and deployment guide
│   ├── SECURITY_MODEL.md        # Sandboxing and threat model
│   ├── SIMULATION_ENGINE.md     # Simulation engine and event bus
│   ├── TESTING.md               # Testing guide and suite overview
│   └── TROUBLESHOOTING.md       # Diagnostic guide for common issues
├── src/
│   ├── audio/                   # Procedural Web Audio API sound synthesizer
│   │   └── soundManager.ts
│   ├── components/              # UI components
│   │   ├── attack-graph/        # React Flow custom nodes, controls, and drawer
│   │   ├── layout/              # AppShell, Sidebar, TopStatusBar
│   │   ├── ConfirmDialog.tsx    # Accessible alertdialog modal
│   │   ├── FlagSubmissionModal.tsx # Flag validator with confetti
│   │   ├── GhostOpsAi.tsx       # AI mentor, forge, and autopilot
│   │   ├── HttpRepeater.tsx     # Web security proxy and repeater
│   │   ├── KeyboardShortcutsModal.tsx # Shortcuts documentation dialog
│   │   └── PwnboxTerminal.tsx   # Interactive terminal shell
│   ├── pages/                   # 10 Route pages
│   ├── services/                # Core engines and services
│   │   ├── ai/                  # AI providers and mentor logic
│   │   ├── commandInterpreter.ts
│   │   ├── commandRegistry.ts
│   │   ├── flagRegistry.ts
│   │   ├── persistenceService.ts
│   │   ├── progressionCalculator.ts
│   │   ├── shellParser.ts
│   │   └── virtualFs.ts
│   ├── simulation/              # Simulation engine, adapters, definitions
│   │   ├── adapters/            # nmap, gobuster, curl, nc, ssh, sudo, etc.
│   │   ├── attackGraphTopology.ts
│   │   ├── machineDefinitions.ts
│   │   ├── simulationEngine.ts
│   │   └── types.ts
│   ├── store/                   # Zustand stores (gameStore, preferencesStore)
│   ├── tests/                   # 19 Vitest test suites (219 passing tests)
│   ├── types/                   # TypeScript interfaces
│   ├── App.tsx                  # Root application router
│   └── main.tsx                 # Entrypoint
├── CONTRIBUTING.md              # Open source contribution guide
├── LICENSE                      # MIT License
├── PROJECT_PLAN.md              # Complete 12-phase project plan
├── README.md                    # Primary repository overview
├── RELEASE_NOTES.md             # v1.0.0 official release notes
├── REQUIREMENTS_CHECKLIST.md    # Formal requirements traceability matrix
└── TASKS.md                     # Completed task tracker
```

---

## 3. Component Interaction & Data Flow

### A. Terminal Execution Flow
1. User enters command in `PwnboxTerminal.tsx`.
2. Audio manager plays procedural mechanical keystroke sound.
3. `ShellParser.parse` tokenizes input, checks for pipes (`|`) and redirects (`>`, `>>`) without `eval()`.
4. `CommandInterpreter.execute` resolves handlers from `CommandRegistry`.
5. Handlers call `SimulatedCommandAdapters` (e.g. `nmap`, `gobuster`, `curl`, `nc`).
6. Adapters check network reachability via `SimulationEngine.canReachIp`.
7. Adapters update discovered ports and evaluate challenge objective prerequisites.
8. If a shell spawns (e.g. `nc -lvnp 4444` catching Log4j reverse shell), `enterShell` context updates the terminal prompt and working directory.

### B. Attack Graph Derivation Flow
1. `SimulationEngine` maintains discovered ports, compromise levels, and claimed flags.
2. `buildAttackGraphTopology` runs as a pure deterministic mapping function taking `SimulationEngine` state.
3. Node states (`unknown` $\to$ `discovered` $\to$ `reachable` $\to$ `vulnerable` $\to$ `initial-access` $\to$ `privileged` $\to$ `compromised` $\to$ `completed`) are computed.
4. Downstream nodes (`iron-vault`, `corp-dc01`) remain in Fog-of-War until upstream pivot footholds (`ecorp-hr`) are compromised.
5. React Flow renders custom SVG nodes and animated directed edges.

### C. Flag Submission & Progression Flow
1. User submits a flag token in `FlagSubmissionModal.tsx` or Terminal.
2. `gameStore.submitFlag` checks duplicate claims: duplicate submissions are rejected with 0 XP.
3. Valid flags award XP, recalculate rank (`Script Kiddie` $\to$ `Hacker` $\to$ `Pro Hacker` $\to$ `Elite` $\to$ `Omni God`), and evaluate 8 event-driven achievements.
4. Updated engagement state is persisted immediately to IndexedDB via `PersistenceService`.
