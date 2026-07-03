## Why

**Problem**

The repository had multiple ESLint entry points and no unified pre-commit ESLint fix path. `apps/test-server` used an ESLint 8 `.eslintrc.cjs`, `tests/ci-test` used an ESLint 9 flat config, and `packages/cli` exposed a lint script without a complete local ESLint setup. The root `lint-staged` configuration only formatted files and ran repository guard scripts, so unused imports and lint-fixable issues could still enter commits.

**Approach**

Consolidate ESLint governance at the workspace root with an ESLint 9 flat config, keep package-level lint scripts as thin entry points, and add `eslint-plugin-unused-imports` to the root lint and pre-commit flow. This change covers the repository areas that should be governed by the unified setup:

- `apps/test-server`
- `tests/ci-test`
- `packages/cli/src`
- `packages/core`
- `packages/react`

**Why now**

This is infrastructure work that should not be mixed into feature pull requests. Capturing the plan as an OpenSpec change documents the intended scope, risk controls, validation results, and follow-up work for reviewers.

## What Changes

- Add a root-level ESLint flat config as the only ESLint configuration entry point.
- Remove split ESLint configs from `apps/test-server` and `tests/ci-test`.
- Move ESLint-related dependencies to the root package where the unified config lives.
- Add `eslint-plugin-unused-imports` and enable automatic unused import removal.
- Keep package lint scripts, but route them through the workspace root ESLint installation.
- Extend root `lint-staged` so staged JavaScript and TypeScript files in the governed directories run `eslint --fix` before `prettier --write`.
- Keep existing file-size, character validation, Swift formatting, and Prettier checks in the pre-commit path.

## Scope

**Included:**

- `apps/test-server`
- `tests/ci-test`
- `packages/cli/src`
- `packages/core`
- `packages/react`
- Root `package.json`
- Root `pnpm-lock.yaml`
- Root `lint-staged` and `simple-git-hooks` integration

**Excluded for this change:**

- `packages/visionOS`
- `tests/autoTest`
- Compatibility fixtures under `tests/*-compat`
- Minimal app fixtures such as Next, Vite, Remix, and Rspack examples

The excluded directories either do not currently have ESLint wired in, rely on framework-specific lint behavior, or would require separate cleanup before safe pre-commit enforcement. `packages/core` and `packages/react` are included in the requirement; their current implementation status is tracked in `tasks.md`.

## Impact

- **Repository workflow:** pre-commit now fixes unused imports in the verified governed directories.
- **Developer commands:** `pnpm lint` should check the governed directories from the root once all tasks in this change are complete.
- **Package scripts:** existing lint scripts remain available for `web-content`, `ci-test`, and `@webspatial/builder`.
- **Compatibility:** this change does not alter SDK runtime behavior or public APIs.
- **Known residual warnings:** historical React Hooks / React Refresh warnings in `apps/test-server` and stale `@typescript-eslint/camelcase` disable comments in `packages/cli` remain as warnings rather than blocking the migration.

## Validation

Validation performed after implementation:

- `pnpm install --ignore-scripts`
- ESLint config load via Node
- ESLint `--print-config` checks for `apps/test-server`, `tests/ci-test`, and `packages/cli`
- `pnpm --filter web-content lint`
- `pnpm --filter ci-test lint`
- `pnpm --filter @webspatial/builder lint`
- `pnpm lint`
- `pnpm exec lint-staged --debug`
- `pnpm exec prettier --check` for edited config files
- Final newline check for edited text files
