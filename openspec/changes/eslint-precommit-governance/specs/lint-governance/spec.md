# Lint governance (WebSpatial SDK monorepo)

## ADDED Requirements

### Requirement: Unified root ESLint configuration owns governed directories

The repository SHALL use a single root-level ESLint 9 flat config (`eslint.config.js`)
as the only ESLint configuration entry point for the governed directories, and SHALL NOT
keep package-local ESLint config files in those directories.

Governed directories for this change:

- `apps/test-server`
- `tests/ci-test`
- `packages/cli/src`

#### Scenario: Root flat config resolves for a governed file

- **WHEN** ESLint resolves configuration for a file under `apps/test-server`, `tests/ci-test`, or `packages/cli/src`
- **THEN** it uses the root `eslint.config.js`
- **AND** no package-local `.eslintrc*` or `eslint.config.*` file participates in resolution

#### Scenario: Legacy split configs are removed

- **WHEN** the repository is inspected after the change
- **THEN** `apps/test-server/.eslintrc.cjs` does not exist
- **AND** `tests/ci-test/eslint.config.js` does not exist

### Requirement: Package lint scripts delegate to the workspace-root ESLint

Each governed package SHALL keep a `lint` script, and that script SHALL execute ESLint
through the workspace-root installation via `pnpm --workspace-root exec eslint`, avoiding
package-local ESLint dependency duplication.

#### Scenario: Package lint script runs root ESLint

- **WHEN** a developer runs `pnpm --filter <governed-package> lint`
- **THEN** ESLint runs from the workspace root against that package's governed paths
- **AND** the package does not declare its own ESLint dependencies

### Requirement: Pre-commit removes unused imports in governed staged files

The root `lint-staged` configuration SHALL run `eslint --fix` before `prettier --write`
for staged JavaScript/TypeScript files in the governed directories, and the enforced
ESLint rule `unused-imports/no-unused-imports` SHALL remove unused imports automatically.
Existing file-size, character-validation, Swift-format, and Prettier tasks SHALL be
preserved.

#### Scenario: Staged file with an unused import is fixed on commit

- **WHEN** a staged file under a governed directory contains an unused import
- **AND** the pre-commit hook (`simple-git-hooks` -> `pnpm lint-staged`) runs
- **THEN** `eslint --fix` removes the unused import before `prettier --write` formats the file

#### Scenario: Historical warnings do not block the commit

- **WHEN** governed files contain historical React Hooks, React Refresh, or CLI inline-disable warnings
- **THEN** those findings surface as warnings only
- **AND** the lint step exits successfully (0 errors)
