## 1. Inventory and decision record

- [x] 1.1 Read repository agent instructions before analysis.
- [x] 1.2 Inventory `.eslintrc*` and `eslint.config.*` files.
- [x] 1.3 Inventory package `lint` scripts.
- [x] 1.4 Inventory `lint-staged`, `simple-git-hooks`, and `husky` usage.
- [x] 1.5 Classify packages into existing ESLint config, lint script without config, and no ESLint integration.
- [x] 1.6 Decide on root ESLint 9 flat config instead of keeping split configuration systems.

## 2. Root ESLint governance

- [x] 2.1 Add root ESLint dependencies.
- [x] 2.2 Add root `eslint.config.js`.
- [x] 2.3 Consolidate React Hooks and React Refresh behavior into root overrides.
- [x] 2.4 Add `eslint-plugin-unused-imports`.
- [x] 2.5 Keep broad historical cleanup rules disabled while the governed directories are brought under the unified config.

## 3. Package migration

- [x] 3.1 Remove `apps/test-server/.eslintrc.cjs`.
- [x] 3.2 Remove `tests/ci-test/eslint.config.js`.
- [x] 3.3 Update `apps/test-server` lint script to use root ESLint via `pnpm --workspace-root exec`.
- [x] 3.4 Update `tests/ci-test` lint script to use root ESLint via `pnpm --workspace-root exec`.
- [x] 3.5 Update `packages/cli` lint script to use root ESLint via `pnpm --workspace-root exec`.
- [x] 3.6 Remove duplicated package-local ESLint dependencies from migrated packages.

## 4. Pre-commit integration

- [x] 4.1 Keep root `simple-git-hooks` as the pre-commit hook owner.
- [x] 4.2 Add `eslint --fix` before Prettier for staged files in `apps/test-server`.
- [x] 4.3 Add `eslint --fix` before Prettier for staged files in `tests/ci-test`.
- [x] 4.4 Add `eslint --fix` before Prettier for staged files in `packages/cli/src`.
- [x] 4.5 Keep existing Prettier, Swift format, file-size, and character validation tasks.

## 5. Validation

- [x] 5.1 Run dependency installation and update lockfile.
- [x] 5.2 Verify the root ESLint config loads.
- [x] 5.3 Verify ESLint config resolution for the governed directories.
- [x] 5.4 Run `pnpm --filter web-content lint`.
- [x] 5.5 Run `pnpm --filter ci-test lint`.
- [x] 5.6 Run `pnpm --filter @webspatial/builder lint`.
- [x] 5.7 Run `pnpm lint`.
- [x] 5.8 Run `pnpm exec lint-staged --debug`.
- [x] 5.9 Run Prettier check for edited config files.
- [x] 5.10 Check edited text files end with newline.

## 6. `packages/core` adoption

- [ ] 6.1 Add a focused root ESLint override for `packages/core`.
- [ ] 6.2 Add a `packages/core` lint script that delegates to `pnpm --workspace-root exec eslint`.
- [ ] 6.3 Run ESLint in report-only mode for `packages/core` and classify historical findings.
- [ ] 6.4 Decide the initial enforcement subset for `packages/core`, starting with unused imports and low-risk rules.
- [ ] 6.5 Add `packages/core` to root `pnpm lint` after the selected enforcement subset passes.
- [ ] 6.6 Add a `lint-staged` entry for `packages/core` only after staged-file auto-fix behavior is verified.

## 7. `packages/react` adoption

- [ ] 7.1 Add root ESLint overrides for `packages/react` source, tests, and build/config files.
- [ ] 7.2 Add a `packages/react` lint script that delegates to `pnpm --workspace-root exec eslint`.
- [ ] 7.3 Run ESLint in report-only mode for `packages/react` and classify React Hooks, test, TypeScript, and unused import findings.
- [ ] 7.4 Decide whether initial enforcement covers all of `packages/react` or a safe subset such as `src/**/*.{ts,tsx}`.
- [ ] 7.5 Add `packages/react` to root `pnpm lint` after the selected enforcement subset passes.
- [ ] 7.6 Add a `lint-staged` entry for `packages/react` only after staged-file auto-fix behavior is verified.

## 8. Follow-up items

- [ ] 8.1 Clean stale `@typescript-eslint/camelcase` disable comments in `packages/cli`.
- [ ] 8.2 Decide whether historical React Hooks / React Refresh warnings in `apps/test-server` should become blocking.
- [ ] 8.3 Evaluate fixture applications separately before adding them to pre-commit ESLint fix.
