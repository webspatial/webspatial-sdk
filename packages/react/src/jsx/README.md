## notice

`jsx-shared.ts` imports `Model`, `withSpatialized2DElementContainer`, and
`withSpatialMonitor` from `../facades` (relative path) so the JSX runtime
resolves them to the **facade** versions, per spatial-lazy-load spec
`tasks.md` §6.2 / §7.4. The JSX runtime, the default entry barrel, and the
spatial chunk all build in a single `tsup` pass with `splitting: true`
(`packages/react/tsup.config.ts`), so the facade module is hoisted into a
shared chunk that both consumers reuse — there is no duplicate facade copy
per JSX bundle.

The previously-shipped strip-only siblings `jsx-runtime.web.ts` and
`jsx-dev-runtime.web.ts`, plus the `react-server` `exports` conditional in
`packages/react/package.json`, were removed in PR 5 of the lazy-load
roll-out. The single unified runtime now serves plain web, AVP, SSR, and
RSC consumers.
