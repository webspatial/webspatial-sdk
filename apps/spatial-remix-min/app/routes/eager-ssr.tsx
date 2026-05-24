import { Link } from 'react-router'

import { ClientOnly } from '../components/ClientOnly'
import { EagerSpatialIsland } from '../components/EagerSpatialIsland'

import type { Route } from './+types/eager-ssr'

/** Fixture-only heuristic — follow official WebSpatial UA docs in production. */
function hasWebSpatialShellToken(userAgent: string): boolean {
  return (
    /\b(WSAppShell|PicoWebApp)\b/i.test(userAgent) ||
    /\bPuppeteer\b/i.test(userAgent)
  )
}

/**
 * SSR shell via `loader` + eager spatial behind `<ClientOnly>` (Remix-style
 * equivalent of Next.js `dynamic(..., { ssr: false })`).
 */
export async function loader({ request }: Route.LoaderArgs) {
  const userAgent = request.headers.get('user-agent') ?? '(unset)'
  return {
    userAgent,
    hasWebSpatialToken: hasWebSpatialShellToken(userAgent),
  }
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: '/eager-ssr — SSR shell + eager client island' },
    {
      name: 'description',
      content:
        'React Router SSR + @webspatial/react-sdk/eager CSR-gated client island',
    },
  ]
}

export default function EagerSsrRoute({ loaderData }: Route.ComponentProps) {
  const { userAgent, hasWebSpatialToken } = loaderData

  return (
    <section style={{ maxWidth: 720 }}>
      <h1>SSR shell + eager client island</h1>
      <p>
        <Link to="/">Home</Link> — this route SSRs a static shell (loader JSON
        below) and mounts <code>@webspatial/react-sdk/eager</code> only after
        client hydration via <code>&lt;ClientOnly&gt;</code>.
      </p>

      <h2 style={{ marginTop: 24 }}>Loader data (SSR)</h2>
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
        {JSON.stringify({ userAgent, hasWebSpatialToken }, null, 2)}
      </pre>
      <p style={{ fontSize: 14, color: '#444' }}>
        View page source: JSON above and the loading placeholder should appear
        in HTML; eager <code>&lt;Model&gt;</code> markup should not.
      </p>

      <h2 style={{ marginTop: 24 }}>Client-only spatial (eager entry)</h2>
      <ClientOnly
        fallback={
          <p
            role="status"
            data-testid="eager-island-loading"
            style={{
              padding: 16,
              borderRadius: 8,
              background: '#f5f5f5',
              border: '1px dashed #999',
            }}
          >
            Client island loading — eager spatial SDK is not executed during
            SSR.
          </p>
        }
      >
        <EagerSpatialIsland />
      </ClientOnly>
    </section>
  )
}
