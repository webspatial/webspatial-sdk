# Preventing Unintended Major Bumps from `peerDependencies` (Changesets)

## Problem
In a pnpm workspace + Changesets monorepo, packages may receive **unexpected major version bumps** when a dependency is declared via `peerDependencies` using the `workspace:` protocol (especially `workspace:*`).

This is most noticeable when:

- Package **A** (e.g. `@webspatial/core-sdk`) is depended on by package **B** (e.g. `@webspatial/react-sdk`) via `peerDependencies`
- **B** uses `workspace:*` for the peer range
- Changesets performs a release and attempts to update internal dependency ranges

In this situation, Changesets can treat the peer range update as potentially breaking and bump **B** to **major**, even if **A** only changed by `patch` or `minor`.

If **A** and **B** are in a `fixed` group, a single major bump can cascade and upgrade the whole fixed group.

## Repository Settings (Current)
This repo uses:

- Changesets config: [.changeset/config.json](../.changeset/config.json)
- A `fixed` group containing:
  - `@webspatial/core-sdk`
  - `@webspatial/react-sdk`
  - `@webspatial/builder`
  - `@webspatial/platform-visionos`
  - `@webspatial/platform-androidxrapp`

## Fix Applied

### 1) Avoid `workspace:*` in `peerDependencies`
For published packages, prefer a normal semver range in `peerDependencies` rather than `workspace:*`.

In this repo:

- Updated `@webspatial/react-sdk`:
  - `peerDependencies["@webspatial/core-sdk"]` from `workspace:*` → `^1.5.0`
  - Added `devDependencies["@webspatial/core-sdk"] = "workspace:*"` to ensure local development and tests always use the workspace package, without relying on repo-wide pnpm configuration.

File:
- [packages/react/package.json](../packages/react/package.json)

Rationale:
- When `@webspatial/core-sdk` releases `1.5.x`, it remains within `^1.5.0`
- A patch/minor bump in `core-sdk` does not force a peer range rewrite, so `react-sdk` does not get bumped just to keep peer constraints aligned
- Keeping a workspace devDependency avoids `pnpm-lock.yaml` resolving `@webspatial/core-sdk@1.5.0` from the registry for this package during local installs.

### 2) Only bump peer dependents when out of range
Enable the Changesets experimental option that prevents peer dependents from being bumped unless the peer range becomes incompatible:

```json
{
  "___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH": {
    "onlyUpdatePeerDependentsWhenOutOfRange": true
  }
}
```

File:
- [.changeset/config.json](../.changeset/config.json)

Rationale:
- Keeps peer-dependent packages stable unless compatibility actually breaks
- Reduces noisy release bumps caused by dependency range formatting/rewrites

## How to Validate

### 1) Inspect pending bumps
```bash
pnpm -w changeset status
```

Expected:
- No unexpected `major` bumps triggered purely by peer dependency handling.

### 2) Run package tests (example)
```bash
pnpm -F @webspatial/react-sdk run test
```

## Notes / Tradeoffs
- The Changesets option is marked experimental and may change across Changesets versions.
- Using a semver range (e.g. `^1.5.0`) for internal peers aligns better with how consumers install published packages and avoids leaking `workspace:` into published metadata.
- Adding a workspace devDependency is a local-development convenience; it does not affect consumers, but it does influence workspace installs and lockfile resolution.
- If the goal is “core patch/minor releases should *not* force react to release”, consider revisiting the `fixed` group strategy. That is a separate release-policy decision.