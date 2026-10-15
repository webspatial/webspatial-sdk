# spatial-next-eager-min

Minimal **Next.js 15 App Router + React 18 + `@webspatial/react-sdk/eager`**
fixture.

This app is intentionally **eager-only** (`@webspatial/react-sdk/eager`).

## Quick start

```sh
pnpm install
pnpm -r --filter '@webspatial/*' build

pnpm --filter spatial-next-eager-min dev
pnpm --filter spatial-next-eager-min build
pnpm --filter spatial-next-eager-min start
pnpm --filter spatial-next-eager-min test
```

## Routes

- `/eager`: eager entry route with SSR shell + CSR-gated eager island
- `/server-only-util`: pure RSC UA-branching demo

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

## Static assets

`<Model>` samples load `public/modelasset/cone.usdz` (served at
`/modelasset/cone.usdz`).

Lazy-entry examples live in `apps/spatial-next-min`.
