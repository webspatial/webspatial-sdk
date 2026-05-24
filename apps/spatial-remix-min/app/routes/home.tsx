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
          — lazy entry + <code>&lt;SpatialBoot&gt;</code>, <code>Model</code> +{' '}
          <code>enable-xr</code> (set <code>jsxImportSource</code> in tsconfig).
        </li>
        <li>
          <Link to="/lazy-gate">
            <strong>/lazy-gate</strong>
          </Link>{' '}
          — <code>&lt;SpatialBoot fallback=&#123;…&#125;&gt;</code>; optional
          loading UI while boot completes before children mount.
        </li>
        <li>
          <Link to="/eager-ssr">
            <strong>/eager-ssr</strong>
          </Link>{' '}
          — <strong>SSR + eager:</strong> loader reads <code>User-Agent</code>;
          spatial UI via <code>&lt;ClientOnly&gt;</code> +{' '}
          <code>@webspatial/react-sdk/eager</code> (CSR-gated client island).
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
