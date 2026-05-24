import dynamic from 'next/dynamic'
import { headers } from 'next/headers'

// SSR shell (this file is a Server Component) + eager spatial behind
// `dynamic(..., { ssr: false })`. Spec: eager spatial primitives are
// CSR-only; server HTML carries UA metadata and a loading placeholder only.

const EagerSpatialIsland = dynamic(
  () =>
    import('@/components/EagerSpatialIsland').then(m => ({
      default: m.EagerSpatialIsland,
    })),
  {
    ssr: false,
    loading: () => (
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
        Client island loading — eager spatial SDK is not executed during SSR.
      </p>
    ),
  },
)

/** Fixture-only heuristic — follow official WebSpatial UA docs in production. */
function hasWebSpatialShellToken(userAgent: string): boolean {
  return (
    /\b(WSAppShell|PicoWebApp)\b/i.test(userAgent) ||
    /\bPuppeteer\b/i.test(userAgent)
  )
}

export const metadata = {
  title: '/eager-ssr — SSR shell + eager client island (spatial-next-min)',
}

export default async function EagerSsrPage() {
  const requestHeaders = await headers()
  const userAgent = requestHeaders.get('user-agent') ?? '(unset)'
  const hasWebSpatialToken = hasWebSpatialShellToken(userAgent)

  return (
    <section>
      <h1>SSR shell + eager client island</h1>
      <p>
        This page is a <strong>Server Component</strong>. It reads{' '}
        <code>User-Agent</code> on the server and renders static HTML. Spatial
        UI comes from <code>@webspatial/react-sdk/eager</code> only inside a{' '}
        <code>dynamic(..., &#123; ssr: false &#125;)</code> client island — the
        supported pattern when an SSR app wants eager&apos;s single-request
        spatial bundle.
      </p>

      <h2 style={{ marginTop: 24 }}>Server-rendered loader data</h2>
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
        View page source: you should see the JSON above and the loading
        placeholder text, but <strong>not</strong> eager{' '}
        <code>&lt;Model&gt;</code> markup from the server pass.
      </p>

      <h2 style={{ marginTop: 24 }}>Client-only spatial (eager entry)</h2>
      <EagerSpatialIsland />
    </section>
  )
}
