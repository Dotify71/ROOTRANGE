# Contributing to ROOTRANGE

Thank you for your interest in contributing to ROOTRANGE! We welcome contributions from offensive security practitioners, educators, software engineers, and designers.

---

## 1. Code of Conduct

All contributors and participants are expected to adhere to standard open-source community guidelines: treat everyone with respect, prioritize constructive collaboration, and promote safe cyber security education.

---

## 2. Ways to Contribute

- **Report Bugs**: Submit bug reports with clear reproduction steps, browser version, and terminal input.
- **Author New Training Targets**: Create new vulnerable machines and CTF challenges following [docs/CHALLENGE_AUTHORING.md](docs/CHALLENGE_AUTHORING.md).
- **Enhance Terminal Tools**: Add realistic handlers for security tools (e.g. `nikto`, `wpscan`, `chisel`) in `src/simulation/adapters/commandAdapters.ts`.
- **Improve Accessibility**: Enhance ARIA roles, keyboard workflows, and high-contrast color themes.
- **Documentation**: Expand remediation write-ups, vulnerability explanations, and user guides.

---

## 3. Development & PR Workflow

ROOTRANGE follows standard feature-branch workflows:

1. **Fork and Clone**:
   ```bash
   git clone https://github.com/<your-username>/ROOTRANGE.git
   cd ROOTRANGE
   ```
2. **Branch from main**:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Install Dependencies**:
   ```bash
   npm ci
   ```
4. **Implement and Test**:
   - Write automated unit and integration tests in `src/tests/`.
   - Verify all tests pass: `npm test -- --run`.
   - Verify TypeScript compilation: `npm run typecheck`.
   - Verify production build: `npm run build`.
5. **Commit with Conventional Commits**:
   - `feat(scope): ...`
   - `fix(scope): ...`
   - `docs(scope): ...`
   - `test(scope): ...`
6. **Push and Open a Pull Request**:
   - Push your branch to GitHub and submit a PR to `main`.
   - Provide a concise summary of changes, motivation, and verification commands.
