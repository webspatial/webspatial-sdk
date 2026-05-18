---
'@webspatial/react-sdk': minor
---

Add `@webspatial/react-sdk/server` — a server-safe public subpath for React Server Component consumers (Next.js App Router et al.).

The default entry of the SDK carries `'use client'` at the top of its emitted `dist/index.js`, so Next's RSC compiler turns every imported symbol into a Client Reference; calling those from a Server Component throws `"Attempted to call X() from the server but X is on the client."`. Helpers that are genuinely server-callable now live on this separate subpath instead.

This release ships **one** runtime export plus the full type surface:

- `detectSpatialRuntime(input)` — server-side WebSpatial runtime detection. Accepts a raw User-Agent string, a Web Fetch `Headers` instance, the `ReadonlyHeaders` returned by Next.js `await headers()`, or any object with a `.get(name)` method. Returns the same `{ type: 'visionos' | 'picoos' | 'puppeteer' | null, shellVersion }` snapshot the client-side runtime cache produces from `navigator.userAgent`. Lets RSC pages branch the initial HTML on the requesting device's runtime **before any client JS executes**.

  ```tsx
  // app/page.tsx (RSC)
  import { headers } from 'next/headers'
  import { detectSpatialRuntime } from '@webspatial/react-sdk/server'

  export default async function Page() {
    const runtime = detectSpatialRuntime(await headers())
    if (runtime.type === 'visionos') return <SpatialHero />
    return <FallbackHero />
  }
  ```

- `export type *` — type-only mirror of the default entry, so RSC files can write annotations (`ModelProps`, `CapabilityKey`, `Vec3`, …) without crossing back to `@webspatial/react-sdk`. Zero runtime cost.

Hooks, facade components, and APIs that mutate module-level singleton state (`bootSpatial`, `onSpatialLoadError`, `isSpatialReady`, `useSpatialReady`, `useMetrics`, every facade) are intentionally **not** re-exposed here — keep importing those from the default entry, which Next will continue to treat as a Client Component boundary.

No breaking changes. The default entry / eager entry / JSX runtime contracts are unchanged; only the new subpath is added.
