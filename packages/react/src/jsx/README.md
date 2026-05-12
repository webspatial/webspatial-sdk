## notice

files inside this folder should not use relative path to import files from `src`, use package name instead.

### Lazy-load roll-out exception (transitional)

`jsx-shared.ts` intentionally imports `Model`, `withSpatialized2DElementContainer`, and `withSpatialMonitor` from `../facades` (relative path) per spatial-lazy-load spec `tasks.md` §6.2 — the JSX runtime MUST resolve those symbols to the **facade** versions, which are not yet re-exported by the default entry while PR 3 of the roll-out is in flight. PR 4 rewires `src/index.ts` to surface facades and PR 5 stops marking `@webspatial/react-sdk` as external in the JSX bundle's `tsup` config (per `tasks.md` §7.4 / §8.1), restoring this folder's "import via package name" convention.

`jsx-runtime.web.ts` and `jsx-dev-runtime.web.ts` re-export the unified runtime as a transitional no-op; the files themselves are deleted in PR 5 alongside the corresponding `tsup` entry and `react-server` `exports` conditional drops.