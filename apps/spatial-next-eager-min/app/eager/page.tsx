import { headers } from 'next/headers'
import { EagerSpatialIslandClient } from '@/components/EagerSpatialIslandClient'
import { detectWebSpatialRequest } from '@/lib/webspatial-request'

export const metadata = {
  title: '/eager — SSR shell + eager client island (spatial-next-eager-min)',
}

export default async function EagerPage() {
  const requestHeaders = await headers()
  const userAgent = requestHeaders.get('user-agent') ?? '(unset)'
  const runtime = detectWebSpatialRequest(userAgent)

  return (
    <section>
      <h1>Eager entry (SSR shell + client island)</h1>
      <p>
        This page is a <strong>Server Component</strong>. It reads{' '}
        <code>User-Agent</code> on the server and renders static HTML. Spatial
        UI comes from <code>@webspatial/react-sdk/eager</code> only inside a{' '}
        <code>dynamic(..., &#123; ssr: false &#125;)</code> client island.
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
        {JSON.stringify({ userAgent, runtime }, null, 2)}
      </pre>
      <p style={{ fontSize: 14, color: '#444' }}>
        View page source: you should see the JSON above and the loading
        placeholder text, but <strong>not</strong> eager{' '}
        <code>&lt;Model&gt;</code> markup from the server pass.
      </p>

      <h2 style={{ marginTop: 24 }}>Client-only spatial (eager entry)</h2>
      <EagerSpatialIslandClient />
    </section>
  )
}
