// Internal engineering route — NOT a customer recipe.
//
// Demonstrates request-time branching using only the User-Agent string and
// patterns documented on webspatial.dev. The SDK does not ship a supported
// server-side runtime-detection API for third-party apps.
//
// Contrast with lazy routes: those import `@webspatial/react-sdk` inside
// `'use client'` modules. This page is a pure Server Component with zero
// SDK runtime imports, so the server bundle must not pull facades or the
// spatial chunk (verify via README "view-source" checklist).

import { headers } from 'next/headers'

export const metadata = {
  title: '/server-only-util — UA-only SSR (spatial-next-min)',
}

/** Fixture-only heuristic — match official WebSpatial UA docs in production apps. */
function hasWebSpatialShellToken(userAgent: string): boolean {
  return (
    /\b(WSAppShell|PicoWebApp)\b/i.test(userAgent) ||
    /\bPuppeteer\b/i.test(userAgent)
  )
}

export default async function ServerOnlyUtilPage() {
  const requestHeaders = await headers()
  const requestUserAgent = requestHeaders.get('user-agent') ?? '(unset)'
  const hasWebSpatialToken = hasWebSpatialShellToken(requestUserAgent)

  return (
    <section>
      <h1>RSC + User-Agent branching (engineering demo)</h1>
      <p>
        This Server Component reads <code>User-Agent</code> only — no{' '}
        <code>@webspatial/react-sdk</code> import.{' '}
        <strong>
          Integrators classify WebSpatial vs plain web using the request UA and{' '}
          <a href="https://webspatial.dev/docs/introduction">
            official WebSpatial documentation
          </a>
          , not SDK detection helpers.
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
        {JSON.stringify(
          { userAgent: requestUserAgent, hasWebSpatialToken },
          null,
          2,
        )}
      </pre>
      <p>Notes:</p>
      <ul>
        <li>
          <code>hasWebSpatialToken</code> is a coarse fixture flag (shell tokens
          like <code>WSAppShell</code> / <code>PicoWebApp</code>). Production
          apps should follow the UA rules in official docs, not copy this regex
          blindly.
        </li>
        <li>
          Spatial UI still boots on the client via{' '}
          <code>&lt;SpatialBoot&gt;</code> in{' '}
          <code>&apos;use client&apos;</code> routes — SSR here only decides
          non-spatial shell markup (hero, meta, redirects).
        </li>
      </ul>
      <h2 style={{ marginTop: 24 }}>
        What you should NOT see in the network panel
      </h2>
      <p>
        No request for any <code>spatial-*.js</code> chunk on this route. With
        no SDK import, the spatial implementation graph is not statically
        reachable from the server bundle for this page.
      </p>
    </section>
  )
}
