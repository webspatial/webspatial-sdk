import type { Route } from './+types/server-ua'
import { Link } from 'react-router'
import { detectWebSpatialRequest } from '../../../_shared/webspatial-request'

/**
 * Demonstrates SSR + `loader` reading `User-Agent` for request-time branching.
 * Public guidance: classify shells using official WebSpatial documentation —
 * this route only echoes the raw header for fixture transparency.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const userAgent = request.headers.get('user-agent') ?? ''
  const runtime = detectWebSpatialRequest(userAgent)
  return {
    userAgent,
    runtime,
  }
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: '/server-ua — Loader + UA (SSR)' },
    { name: 'description', content: 'Remix-style loader reads User-Agent' },
  ]
}

export default function ServerUaRoute({ loaderData }: Route.ComponentProps) {
  const { userAgent, runtime } = loaderData
  return (
    <section style={{ maxWidth: 720 }}>
      <h1>Server loader + User-Agent</h1>
      <p>
        <Link to="/">Home</Link> · Classify WebSpatial vs plain browsers using
        the <strong>User-Agent</strong> string and{' '}
        <a href="https://webspatial.dev/docs/introduction">official docs</a> —
        not undocumented SDK detection helpers.
      </p>
      <h2 style={{ marginTop: 16 }}>Loader data (SSR)</h2>
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
        {JSON.stringify({ runtime, userAgent }, null, 2)}
      </pre>
    </section>
  )
}
