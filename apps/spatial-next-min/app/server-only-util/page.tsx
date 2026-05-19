// Internal engineering route — NOT a customer recipe.
//
// Uses `@webspatial/react-sdk/server` (`detectSpatialRuntime`) only to
// validate that the in-repo server bundle does not pull hooks/facades. Product
// direction: third-party apps branch on User-Agent using **official WebSpatial
// site documentation**, not SDK detection helpers.
//
// 1. The default entry (`@webspatial/react-sdk`) carries `'use client'` at the
//    top of `dist/index.js`, so Next turns callable imports from that entry
//    into Client References on the server.
//
// 2. Importing `detectSpatialRuntime` from this internal subpath does NOT pull
//    the spatial chunk into the server bundle.

import { headers } from 'next/headers'
import { detectSpatialRuntime } from '@webspatial/react-sdk/server'

export const metadata = { title: '/server-only-util — spatial-next-min' }

export default async function ServerOnlyUtilPage() {
  const requestHeaders = await headers()
  const requestUserAgent = requestHeaders.get('user-agent') ?? '(unset)'
  const runtime = detectSpatialRuntime(requestHeaders)

  return (
    <section>
      <h1>RSC + internal server entry (engineering validation)</h1>
      <p>
        This Server Component calls an <strong>internal</strong>{' '}
        <code>detectSpatialRuntime</code> helper from{' '}
        <code>@webspatial/react-sdk/server</code> to prove the server graph
        stays free of facades.{' '}
        <strong>
          Integrators should use the request <code>User-Agent</code> and
          official WebSpatial documentation — not this API.
        </strong>
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
