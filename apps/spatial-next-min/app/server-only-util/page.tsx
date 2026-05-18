// Pure Server Component — NO `'use client'` directive, NO React hooks.
//
// What this page proves:
//
// 1. Group B / Group C utilities (`getAbsoluteUrl`,
//    `WebSpatialRuntime.supports`) are SSR-safe by design: `getAbsoluteUrl`
//    early-returns when `typeof window === 'undefined'`, and `supports`
//    returns `false` for spatial-dependent keys when no runtime is detected.
//
// 2. Next.js 15 caveat: `dist/index.js` carries `'use client'`, so Next
//    marks every `@webspatial/react-sdk` export as a Client Reference.
//    You cannot *import* those helpers from an RSC file until the SDK
//    publishes a server-safe subpath. This page calls the same
//    implementations via `@webspatial/core-sdk` (`supports`) and a local
//    mirror of `getAbsoluteUrl` (see `lib/getAbsoluteUrl.ts`).
//
// 3. Importing only these utilities does NOT pull the spatial chunk into
//    the server bundle (no `chunk-SHX6AI5C-*.js` in this page's graph).

import { supports } from '@webspatial/core-sdk'
import { getAbsoluteUrl } from '@/lib/getAbsoluteUrl'

const WebSpatialRuntime = { supports } as const

export const metadata = { title: '/server-only-util — spatial-next-min' }

export default function ServerOnlyUtilPage() {
  const resolvedRelative = getAbsoluteUrl('/scene.usdz')
  const supportsModel = WebSpatialRuntime.supports('Model')
  return (
    <section>
      <h1>Pure RSC + Group B/C utilities</h1>
      <p>
        This page is a Server Component. It runs the same Group B/C helpers the
        SDK documents, wired through <code>@webspatial/core-sdk</code> and{' '}
        <code>lib/getAbsoluteUrl.ts</code> because Next.js cannot call exports
        from the <code>&apos;use client&apos;</code> default entry on the server
        (see file comment).
      </p>
      <h2 style={{ marginTop: 24 }}>Server-side values</h2>
      <pre
        style={{
          background: '#f5f5f5',
          padding: 12,
          borderRadius: 8,
          overflow: 'auto',
        }}
      >
        {`getAbsoluteUrl('/scene.usdz')             // → ${JSON.stringify(resolvedRelative)}
WebSpatialRuntime.supports('Model')        // → ${JSON.stringify(supportsModel)}`}
      </pre>
      <p>Notes on the values:</p>
      <ul>
        <li>
          <code>getAbsoluteUrl</code> returns the input unchanged when there is
          no <code>window</code> (which is always the case in the RSC render).
        </li>
        <li>
          <code>WebSpatialRuntime.supports(key)</code> returns{' '}
          <code>false</code> for spatial-dependent keys when no WebSpatial
          runtime is detected (server, plain browser). In a WebSpatial runtime
          (AVP / PICO / Puppeteer), the same key resolves against the
          runtime&apos;s capability table.
        </li>
      </ul>
      <h2 style={{ marginTop: 24 }}>
        What you should NOT see in the network panel
      </h2>
      <p>
        No request for any <code>spatial-*.js</code> or{' '}
        <code>chunk-*-SHX6AI5C-*.js</code> file. This page does not import any
        facade or hook, so the spatial chunk is not statically reachable.
      </p>
    </section>
  )
}
