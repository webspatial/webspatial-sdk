// =============================================================================
// Eager-entry registration guard.
//
// Two contracts must hold simultaneously:
//
// 1. ORDERING — the mixed-entry registration MUST run before `src/eager.ts`
//    evaluates `import * as SpatialImpl from './spatial'` (whose bootstrap
//    installs the `@webspatial/core-sdk` polyfill). ES modules evaluate static
//    imports in source order before the module body, so `eager.ts` imports
//    THIS module first; emitting it as its own tsup entry (see
//    `tsup.config.ts`) keeps it a standalone chunk that is evaluated during
//    `eager.js`'s import phase rather than inlined into the body after the
//    spatial import.
//
// 2. SURVIVES DOWNSTREAM TREE-SHAKING — a bare top-level
//    `registerReactSdkEntry('eager')` statement was dropped by consumer
//    bundlers: the emitted hashed chunk is not in the package `sideEffects`
//    allowlist, so esbuild/Rollup/Rspack treat it as side-effect-free and
//    elide the bare side-effect import, defeating mixed-entry detection. We
//    therefore carry the registration as the INITIALIZER of an exported
//    binding that `eager.ts` actually consumes. Because `dist/eager.js` is in
//    the `sideEffects` allowlist, the statement in `eager.ts` that references
//    `eagerEntryRegistered` is retained, which keeps this import live, which
//    keeps the registration call.
// =============================================================================

import { registerReactSdkEntry } from './entryRegistry'

function register(): 'eager' {
  registerReactSdkEntry('eager')
  return 'eager'
}

/**
 * Registers the eager entry root as a side effect of computing this value.
 * `src/eager.ts` MUST reference this binding (see its `__internalSetSpatialImpl`
 * guard) so downstream bundlers cannot tree-shake the registration away.
 */
export const eagerEntryRegistered = register()
