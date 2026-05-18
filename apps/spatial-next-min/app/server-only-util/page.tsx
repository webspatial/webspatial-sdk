// Pure Server Component — NO `'use client'` directive, NO React hooks.
//
// What this page proves:
//
// 1. `@webspatial/react-sdk/server` is the server-safe public subpath
//    that an RSC file can call directly. `detectSpatialRuntime` runs in
//    Node, takes the Web Fetch `Headers`-like object Next.js gives us
//    from `await headers()`, and returns the same snapshot shape the
//    client-side runtime cache produces from `navigator.userAgent`. No
//    browser globals are touched and no facade / hook ever enters this
//    page's server graph.
//
// 2. The default entry of the SDK (`@webspatial/react-sdk`) carries
//    `'use client'` at the top of its `dist/index.js`, so Next turns
//    every imported symbol from THAT entry into a Client Reference and
//    fails when called from a Server Component. The `/server` subpath
//    exists precisely to dodge that constraint — see
//    `packages/react/src/server/index.ts` for the design note.
//
// 3. Importing only `detectSpatialRuntime` does NOT pull the spatial
//    chunk into the server bundle: `getSpatialImpl()`, `bootSpatial()`,
//    `useSpatialReady()`, and the facade trees never reach the server.

import { headers } from 'next/headers'
import { detectSpatialRuntime } from '@webspatial/react-sdk/server'

export const metadata = { title: '/server-only-util — spatial-next-min' }

export default async function ServerOnlyUtilPage() {
  const requestHeaders = await headers()
  const requestUserAgent = requestHeaders.get('user-agent') ?? '(unset)'
  const runtime = detectSpatialRuntime(requestHeaders)

  return (
    <section>
      <h1>Pure RSC + server-safe SDK subpath</h1>
      <p>
        This page is a Server Component. It runs{' '}
        <code>detectSpatialRuntime</code> from{' '}
        <code>@webspatial/react-sdk/server</code> against the request&apos;s own{' '}
        <code>user-agent</code> header — so the initial HTML can already branch
        on whether the requesting device is running a WebSpatial runtime, before
        any JavaScript reaches the client.
      </p>
      <h2 style={{ marginTop: 24 }}>Server-side values</h2>
      <pre
        style={{
          background: '#f5f5f5',
          padding: 12,
          borderRadius: 8,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {`request.headers['user-agent']  // → ${JSON.stringify(requestUserAgent)}
detectSpatialRuntime(headers)  // → ${JSON.stringify(runtime, null, 2)}`}
      </pre>
      <p>Notes on the values:</p>
      <ul>
        <li>
          <code>runtime.type</code> is <code>&apos;visionos&apos;</code>,{' '}
          <code>&apos;picoos&apos;</code>, <code>&apos;puppeteer&apos;</code>,
          or <code>null</code>. A plain desktop / mobile browser resolves to{' '}
          <code>null</code> — render your fallback hero here.
        </li>
        <li>
          <code>runtime.shellVersion</code> is the shell version string parsed
          from <code>WSAppShell/&lt;ver&gt;</code> or{' '}
          <code>PicoWebApp/&lt;ver&gt;</code>; <code>null</code> when no spatial
          shell token is present.
        </li>
        <li>
          The same snapshot shape is returned by the client-side runtime cache,
          so server-rendered branching aligns one-to-one with post-hydration
          branching.
        </li>
      </ul>
      <h2 style={{ marginTop: 24 }}>
        What you should NOT see in the network panel
      </h2>
      <p>
        No request for any <code>spatial-*.js</code> chunk and no facade chunk.
        This page does not import any facade or hook, so the spatial
        implementation graph is never statically reachable from the server
        bundle for this route.
      </p>
    </section>
  )
}
