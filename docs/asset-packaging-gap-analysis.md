# Asset Packaging Gap Analysis (webspatial-sdk vs web-builder-plugins)

## Context

This analysis compares the current `webspatial-sdk` repository with `web-builder-plugins` to identify the changes needed to resolve recurring confusion around:

- where static assets should live (`/public` vs `/src`), and
- when/how `__XR_ENV_BASE__` should be used.

It is aligned with the decision to move to a **single-bundle** model and remove legacy two-bundle assumptions.

## What we observed

### 1) SDK repo still lacks explicit asset-packaging guidance for Builder users

In this repo, `@webspatial/builder` docs currently only point to external docs and do not describe:

- the canonical static-asset location,
- the expected runtime URL shape,
- how `base` and `start_url` should be configured for packaged apps.

Result: developers keep placing 3D assets in `src` and/or hand-building prefixed URLs.

### 2) Test/demo code in this repo uses inconsistent asset URL patterns

Examples in `apps/test-server` use different patterns (for example `/assets/*`, `/modelasset/*`, raw localhost paths, and `/src/pages/*` links in scene pages), which makes it hard to infer one canonical rule.

Result: contributors copy inconsistent practices into production apps.

### 3) builder plugin defaults in the plugin repo still reflect AVP-path assumptions

In `web-builder-plugins`, shared plugin utilities still default to `DEFAULT_BASE = '/webspatial/avp'` and AVP output nesting behavior. That behavior can force developers to reason about prefixed paths and use `__XR_ENV_BASE__` in app code.

Result: this conflicts with the requested single-bundle mental model and contributes directly to path confusion.

## Required changes to fix the bug

### A. Changes required in **web-builder-plugins** (primary behavior fix)

1. **Adopt single-bundle defaults in shared utilities**
   - Update base/outDir resolution so default behavior does **not** nest outputs under `/webspatial/avp`.
   - Keep compatibility only when users explicitly opt into a custom `outputDir`/`base`.

2. **Reduce `__XR_ENV_BASE__` dependency in app-level docs/examples**
   - Treat `__XR_ENV_BASE__` as an internal plugin detail for compatibility, not something most app code should append manually.
   - Update plugin READMEs to show root-relative static asset URLs (for example `/assets/model.usdz`) under single-bundle defaults.

3. **Unify plugin docs (Vite/Next/Rsbuild/Rspack)**
   - Replace AVP-prefixed basename examples with single-bundle guidance.
   - Add one explicit section: “Static assets belong in `public/`, referenced as `/assets/...`”.

### B. Changes required in **webspatial-sdk** (docs/examples alignment)

1. **Add explicit Builder asset packaging guide in this repo**
   - In `packages/cli/README.md`, add a short “Asset packaging (single bundle)” section that states:
     - place static 3D assets in `public/`,
     - reference them via root-relative URLs (`/assets/...`),
     - avoid importing large `.usdz/.glb` from `src` for packaged runtime URLs.

2. **Add troubleshooting guidance for runtime path bugs**
   - Explain symptoms and fixes for:
     - 404s caused by `src` asset placement,
     - double-prefix path bugs caused by manual `__XR_ENV_BASE__` concatenation.

3. **Normalize representative examples in test-server docs/pages**
   - Ensure at least one canonical example page uses `public/assets` + `/assets/...` with a note that this is the recommended production pattern.
   - Remove/annotate misleading localhost or `/src/pages/...` examples where possible.

## Suggested rollout order

1. Land plugin behavior/doc updates in `web-builder-plugins` first (prevents generating new confusing setups).
2. Land SDK-side Builder README + troubleshooting updates in this repo.
3. Follow up with test-server example cleanup.

## Validation checklist (post-change)

- New app scaffold with plugin defaults can load `/public/assets/*.usdz` in web + AVP modes without custom path concatenation.
- No docs instruct users to append `__XR_ENV_BASE__` for normal static assets.
- Builder README includes one clear, copy-pastable asset workflow.

