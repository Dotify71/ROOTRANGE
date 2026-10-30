# ROOTRANGE Testing Guide

ROOTRANGE enforces strict test coverage and quality assurance across unit, integration, simulation, and regression test suites.

---

## 1. Test Architecture & Framework

ROOTRANGE uses:
- **Test Runner**: [Vitest](https://vitest.dev/) v2.1 (Vite-native unit and integration test framework).
- **DOM Environment**: `jsdom` with `@testing-library/react` and `@testing-library/jest-dom`.
- **In-Memory Storage**: `fake-indexeddb` for IndexedDB persistence tests.
- **Mock Audio**: Web Audio API mocks and headless safety guards.

---

## 2. Test Suites Overview

The repository includes **19 automated test suites** covering **219 tests**:

| Test Suite File | Coverage Scope | Test Count |
|---|---|---|
| `phase2Terminal.test.ts` | Shell parser, virtual FS, POSIX modes, command pipelines, output redirects | 27 tests |
| `phase3Simulation.test.ts` | Subnets, routing, ports, events, objectives, loot vault, sessions | 22 tests |
| `phase4EcorpMachine.test.ts` | E-Corp HR target journey, Log4j JNDI, find GTFOBins, user/root flags | 11 tests |
| `phase5IronBankAndCorpDc01.test.ts` | SQLi auth bypass, JWT forgery, cron hijacking, Kerberoasting, DCSync | 15 tests |
| `phase6AttackGraph.test.ts` | React Flow topology derivation, Fog-of-War, search, filter tabs, minimap | 17 tests |
| `phase7WebRepeater.test.ts` | HTTP methods, query params, cookies, response viewers, SSRF firewall | 22 tests |
| `phase8Progression.test.ts` | Flag validation, duplicate prevention, 5-tier rank formula, IndexedDB | 20 tests |
| `phase9GhostOpsAi.test.ts` | Socratic mentor hint tiers 1-5, Payload forge templates, Autopilot | 16 tests |
| `phase10ImmersionAndA11y.test.tsx`| Web Audio GainNode, volume slider, CRT scanlines, a11y dialogs, a11y manual | 13 tests |
| `phase11SecurityHardeningAndRegressions.test.tsx` | All 12 regression scenarios (scope isolation, permissions, sandboxing) | 24 tests |
| `phase12EndToEndJourney.test.tsx`| Full 17-step user journey from dashboard to root flag and reset | 1 test |
| `virtualShell.test.ts` | Command execution context, pipes, exit codes | 9 tests |
| `ctfProgression.test.ts` | Scoring engine and achievements | 2 tests |
| `attackGraph.test.ts` | Edge creation and node selection | 3 tests |
| `httpRepeater.test.ts` | Virtual route simulation | 2 tests |
| `ghostopsAi.test.ts` | Offline hint generation | 2 tests |
| `foundation.test.ts` | Initial store and machine inventory | 6 tests |
| `routing.test.tsx` | Route rendering and layout integration | 6 tests |
| `endToEnd.test.ts` | Core kill chain execution | 1 test |

---

## 3. Running Tests

```bash
# Run all test suites once
npm test -- --run

# Run a specific test suite
npx vitest run src/tests/phase12EndToEndJourney.test.tsx

# Run with test coverage report
npx vitest run --coverage

# Run tests in watch mode during development
npm test
```

---

## 4. Continuous Integration Checks

Every pull request and push to `main` runs the automated CI workflow (`.github/workflows/ci.yml`), which executes:
1. `npm ci`
2. `npm run typecheck` (`tsc --noEmit`)
3. `npm test -- --run` (all 19 test suites)
4. `npm run build`
