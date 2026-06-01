// =============================================================================
// Eager-entry side-effect guard.
//
// This module exists so the mixed-entry registration/validation runs DURING
// import evaluation, BEFORE `src/eager.ts` evaluates `import * as SpatialImpl
// from './spatial'`. ES module semantics evaluate all of a module's static
// imports (depth-first, in source order) before the module body runs, so a
// `registerReactSdkEntry('eager')` call placed in the `eager.ts` body would
// execute only AFTER `./spatial` — whose top-level side effects install the
// `@webspatial/core-sdk` polyfill and call `initPolyfill()` — has already
// evaluated. If the default (lazy) entry was loaded first, that means the
// runtime would be polluted before `WebSpatialMixedEntryError` is thrown.
//
// By importing THIS module first in `eager.ts` (before `./spatial`), the
// registration — and its throw on a mixed-entry conflict — happens before the
// spatial chunk's side effects can run.
// =============================================================================

import { registerReactSdkEntry } from './entryRegistry'

registerReactSdkEntry('eager')
