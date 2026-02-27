# WebSpatial SDK — Agent Guide

This repository is a `pnpm` workspace monorepo that ships WebSpatial SDK packages, a local dev/test server, and an end-to-end (AVP simulator) CI harness.

## Repository Layout

- `packages/*`: published packages (Core SDK, React SDK, Builder CLI, platform shells).
- `apps/test-server`: local dev site and demo pages used during development.
- `tests/ci-test`: CI/e2e harness (Mocha/Chai) that runs against the Apple Vision Pro simulator.
- `tools/scripts`: repo scripts used by CI and pre-commit checks.

## Quick Start (Local)

From repo root:

- Install + build packages: `npm run setup`
- Start dev server: `npm run dev` (serves `apps/test-server`)
- Run unit tests + typecheck: `pnpm test`

## Common Tasks

### Add a New Demo Page (Test Server)

1. Create `apps/test-server/src/<test-name>/index.tsx` exporting a React component.
2. Register the route in `apps/test-server/index.tsx`.
3. Add a sidebar entry in `apps/test-server/src/components/Sidebar.tsx`.

### Build SDK Packages

- Build all `@webspatial/*` packages: `npm run buildPackages`

### Run CI/E2E Harness

- From repo root: `npm run ciTest`
- Notes: requires Xcode + Apple Vision Pro simulator environment.

## Conventions / Gotchas

- Package manager is `pnpm` (enforced by `preinstall`).
- Pre-commit runs `lint-staged`; it rejects files >= 1MB and non-English (CJK) characters.
- Keep PRs focused: avoid committing local artifacts (`.trae/`, `node_modules/`, build outputs).

## Useful Entry Points

- Root scripts: `package.json`.
- Dev server docs: `apps/test-server/README.md`.
- E2E harness docs: `tests/ci-test/README.md`.
- Contributor setup: `CONTRIBUTING.md`.
