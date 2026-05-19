import type { Route } from './+types/home'
import { Link } from 'react-router'

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'spatial-remix-min' },
    {
      name: 'description',
      content:
        'React Router 7 (Remix-style) + Vite SSR + WebSpatial React SDK demo',
    },
  ]
}

export default function Home() {
  return (
    <main style={{ padding: 24, maxWidth: 720, lineHeight: 1.6 }}>
      <h1>spatial-remix-min</h1>
      <p>
        Minimal <strong>React Router 7</strong> (Remix-style) +{' '}
        <strong>Vite</strong> SSR app consuming published{' '}
        <code>@webspatial/react-sdk</code> <code>workspace:*</code> — sibling to{' '}
        <code>spatial-next-min</code> (Next) and <code>spatial-vite-min</code>{' '}
        (Vite SPA).
      </p>
      <ul>
        <li>
          <Link to="/lazy">
            <strong>/lazy</strong>
          </Link>{' '}
          — default lazy entry, <code>useBootSpatial()</code> after mount,{' '}
          <code>Model</code> + <code>enable-xr</code> (set{' '}
          <code>jsxImportSource</code> in tsconfig).
        </li>
        <li>
          <Link to="/lazy-gate">
            <strong>/lazy-gate</strong>
          </Link>{' '}
          — <code>&lt;SpatialBoot gate fallback=&#123;…&#125;&gt;</code>; spatial
          subtree mounts only after <code>bootSpatial()</code> resolves.
        </li>
        <li>
          <Link to="/server-ua">
            <strong>/server-ua</strong>
          </Link>{' '}
          — route <code>loader</code> reads <code>User-Agent</code> (SSR-safe
          request branching; use official UA rules in production).
        </li>
      </ul>
      <p style={{ marginTop: 24, color: '#555' }}>
        Build SDK first:{' '}
        <code>pnpm -r --filter &apos;@webspatial/*&apos; build</code> from repo
        root, then <code>pnpm --filter spatial-remix-min dev</code>.
      </p>
    </main>
  )
}
