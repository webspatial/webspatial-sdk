import { headers } from 'next/headers'
import { detectWebSpatialRequest } from '@/lib/webspatial-request'

export const metadata = {
  title: '/server-only-util — UA-only SSR (spatial-next-eager-min)',
}

export default async function ServerOnlyUtilPage() {
  const requestHeaders = await headers()
  const requestUserAgent = requestHeaders.get('user-agent') ?? '(unset)'
  const runtime = detectWebSpatialRequest(requestUserAgent)

  return (
    <section>
      <h1>RSC + User-Agent branching (engineering demo)</h1>
      <p>
        This Server Component reads <code>User-Agent</code> only — no{' '}
        <code>@webspatial/react-sdk/eager</code> import.
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
        {JSON.stringify({ userAgent: requestUserAgent, runtime }, null, 2)}
      </pre>
    </section>
  )
}
