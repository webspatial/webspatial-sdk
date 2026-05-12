// =============================================================================
// `@webspatial/core-sdk/install-polyfills` — opt-in polyfill installer.
//
// Side-effect-only module: installs the spatial scene hook + the
// `window.spatial` polyfill iff the page is running inside a
// WebSpatial-capable browser (UA contains `WebSpatial/`) AND we are not
// in an SSR / non-browser environment.
//
// Previously this side effect lived as a top-level `if (...)` block in
// `src/index.ts`, which forced every consumer of the package — even
// consumers that only imported pure runtime helpers like `supports()` —
// to bundle `scene-polyfill.ts` (~636 LoC) and `spatial-window-polyfill.ts`
// (~182 LoC) statically. ESM bundlers cannot tree-shake observable
// side effects, so the if-statement guard was useless for bundle size.
//
// After this extraction, `src/index.ts` is side-effect-free and consumers
// who need the polyfills opt in explicitly:
//
//   import '@webspatial/core-sdk/install-polyfills'
//
// `@webspatial/react-sdk` does this from inside its spatial chunk
// (`packages/react/src/spatial/index.ts`) so the polyfill installs only
// when the spatial chunk dynamically loads — never in the SDK's lean
// default entry. Direct-browser (IIFE) consumers retain the historical
// auto-install behavior via a separate `src/iife-entry.ts` bundle entry.
//
// Per the lazy-load proposal `tasks.md §12.9` ("Pre-v1 budget calibration"),
// extracting these polyfills is one of the named optimization candidates
// for closing the marginal-delta gap on the 8 KB strict budget.
// =============================================================================

import { injectSceneHook } from './scene-polyfill'
import { spatialWindowPolyfill } from './spatial-window-polyfill'
import { isSSREnv } from './ssr-polyfill'

if (!isSSREnv() && navigator.userAgent.indexOf('WebSpatial/') > 0) {
  injectSceneHook()
  spatialWindowPolyfill()
}
