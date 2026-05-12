// =============================================================================
// `@webspatial/core-sdk` IIFE bundle entry.
//
// Direct-browser (`<script src=".../webspatial-core.iife.js">`) consumers
// historically got the spatial scene hook + window-spatial polyfill
// auto-installed when the bundle evaluated, because the polyfill side
// effect lived at the top level of `src/index.ts`. After the §12.9
// extraction (see `./install-polyfills.ts` for the rationale), the ESM
// `src/index.ts` is side-effect-free; this file is the dedicated IIFE
// entry that re-exports the public API AND runs the install side effect
// so direct-browser consumers see no behavior change.
//
// ESM consumers (e.g. `@webspatial/react-sdk` from a bundler) opt in via
// `import '@webspatial/core-sdk/install-polyfills'` instead, scoped to
// the moment they actually need the polyfill installed.
// =============================================================================

export * from './index'
import './install-polyfills'
