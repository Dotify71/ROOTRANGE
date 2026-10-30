# ROOTRANGE Development Guide

This document describes the codebase conventions, project organization, workflows, and extension mechanisms for contributing to and extending ROOTRANGE.

---

## 1. Project Architecture & Technology Stack

ROOTRANGE is built with:
- **Core Framework**: React 18 with TypeScript 5.7 (strict typing enabled).
- **Build Tool**: Vite 5 with Rollup chunking optimizations.
- **Styling**: Tailwind CSS 3.4 with custom monospace hacker themes and dark cyber color palettes.
- **State Management**: Zustand 5 with immutable state snapshots and IndexedDB persistence.
- **Routing**: React Router DOM v7 (SPA with path-based routing).
- **Network Graph**: React Flow (`@xyflow/react`) with custom SVG machine nodes and directed pivot edges.
- **Terminal Audio**: Web Audio API procedural synthesis with zero pre-interaction autoplay.
- **Testing**: Vitest 2 with jsdom and React Testing Library.

---

## 2. Source Tree Layout

```
ROOTRANGE/
├── src/
│   ├── audio/              # SoundManager procedural Web Audio API synthesizer
│   ├── components/         # Reusable UI components
│   │   ├── attack-graph/   # Custom React Flow nodes, controls, and forensics drawer
│   │   ├── layout/         # AppShell, Sidebar, TopStatusBar
│   │   ├── ConfirmDialog.tsx # Accessible alertdialog component
│   │   ├── GhostOpsAi.tsx  # Socratic mentor, Payload forge, and Autopilot interface
│   │   ├── HttpRepeater.tsx# Burp-inspired HTTP repeater proxy interface
│   │   ├── KeyboardShortcutsModal.tsx # Shortcuts manual dialog (Ctrl+K)
│   │   └── PwnboxTerminal.tsx # Interactive virtual terminal shell
│   ├── pages/              # 10 application views (Dashboard, Machines, Settings, etc.)
│   ├── services/           # Shell parser, Virtual FS, Command Registry & Interpreter
│   │   ├── ai/             # OfflineDeterministicProvider & ExternalAiAdapterProvider
│   │   ├── commandInterpreter.ts
│   │   ├── commandRegistry.ts
│   │   ├── flagRegistry.ts
│   │   ├── persistenceService.ts
│   │   └── virtualFs.ts
│   ├── simulation/         # SimulationEngine, machine configs, adapters, and events
│   │   ├── adapters/       # Command adapters (nmap, gobuster, curl, nc, ssh, etc.)
│   │   ├── attackGraphTopology.ts # Pure topology builder & Fog-of-War rules
│   │   ├── machineDefinitions.ts  # Machine specs, ports, objectives, and flags
│   │   ├── simulationEngine.ts    # Central deterministic state machine
│   │   └── types.ts        # Typed domain models and simulation event interfaces
│   ├── store/              # Zustand stores (gameStore, preferencesStore)
│   ├── tests/              # 19 Vitest test suites (219 passing tests)
│   ├── types/              # Global TypeScript interfaces
│   ├── App.tsx             # Route definitions
│   └── main.tsx            # Application entrypoint
```

---

## 3. Development Workflow & Commands

```bash
# Start development server with live reload
npm run dev

# Run TypeScript compilation check
npm run typecheck

# Run test suites in watch mode
npm run test

# Run all test suites once
npm test -- --run

# Run a specific test suite
npx vitest run src/tests/phase12EndToEndJourney.test.tsx

# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

---

## 4. Coding Standards & Conventions

1. **Strict TypeScript**: Do not use `any`. Define strong interfaces in `src/types/` or co-locate with service domain files.
2. **Deterministic Simulation**: Never call external networks in default mode. Operations against virtual IPs (`10.10.x.x`) must route through `SimulationEngine`.
3. **Immutability in Zustand**: Always derive new state objects in `set(...)` callbacks. Never mutate store state directly.
4. **POSIX Permission Boundaries**: When adding shell commands or file operations, strictly enforce UID/GID checks against `VirtualFileSystem`.
5. **No Host Execution**: Shell parser and command adapters must NEVER invoke `eval()`, `new Function()`, or host OS binaries.
