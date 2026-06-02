# spatial-next-min

Minimal **Next.js 15 App Router + React 18 + `@webspatial/react-sdk` lazy entry**
fixture.

This app is intentionally **lazy-only** (`@webspatial/react-sdk`). It validates:

- Server Components + `'use client'` boundary usage
- SSR shell + hydration round-trip for lazy facades
- `SpatialBoot` and `useSpatialReady()` patterns in a real Next.js app

Eager entry examples live in `apps/spatial-next-eager-min`.

## Quick start

```sh
pnpm install
pnpm -r --filter '@webspatial/*' build

pnpm --filter spatial-next-min dev
pnpm --filter spatial-next-min build
pnpm --filter spatial-next-min start
pnpm --filter spatial-next-min test
```

## Routes

- `/lazy`: default lazy entry + `SpatialBoot` (children mount after boot)
- `/capability-wrapper`: app-side branching with `useSpatialReady()`
- `/server-only-util`: pure RSC UA-branching demo (no SDK runtime import)

## Server-side request detection

Use `lib/webspatial-request.ts` for SSR branching:

```ts
const userAgent = headers().get('user-agent') ?? ''
const runtime = detectWebSpatialRequest(userAgent)

if (runtime.isWebSpatial) {
  // WebSpatial-specific server logic
} else {
  // Plain-web server logic
}
```

The helper also exposes `runtime.platform` (`visionos`, `picoos`, `unknown`) and
`runtime.signal` for analytics labels.

## Why split from eager?

The SDK forbids mixing `@webspatial/react-sdk` and
`@webspatial/react-sdk/eager` in one JS realm. In SPA navigations, putting both
roots in one app can trigger `WebSpatialMixedEntryError`. Keeping separate lazy
and eager fixtures makes each app spec-compliant and CI-stable.
