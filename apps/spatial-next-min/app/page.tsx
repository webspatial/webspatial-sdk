import Link from 'next/link'

// Pure Server Component (no 'use client', no spatial import). Demonstrates
// that a default Next.js page in this app does NOT pay any spatial SDK
// bytes if it does not opt in — the bridge / facades only enter the
// client bundle when a Client Component imports them.
export default function HomePage() {
  return (
    <div>
      <h1>spatial-next-min</h1>
      <p>
        Five worked examples of <code>@webspatial/react-sdk</code> under Next.js
        15 App Router. Each page exercises a different scenario from the{' '}
        <code>lazy-load-spatial-runtime</code> spec.
      </p>
      <ul style={{ lineHeight: 1.8 }}>
        <li>
          <Link href="/lazy">
            <strong>/lazy</strong>
          </Link>{' '}
          — default lazy entry (<code>@webspatial/react-sdk</code>) +{' '}
          <code>bootSpatial()</code> in <code>useEffect</code>. Recommended
          shape for web-first apps with progressive enhancement.
        </li>
        <li>
          <Link href="/eager">
            <strong>/eager</strong>
          </Link>{' '}
          — eager entry (<code>@webspatial/react-sdk/eager</code>). Spatial
          implementation is statically linked. Same source as <code>/lazy</code>
          , only the import root changed.
        </li>
        <li>
          <Link href="/capability-wrapper">
            <strong>/capability-wrapper</strong>
          </Link>{' '}
          — application-side branching via <code>useSpatialReady()</code>. The
          pattern the spec recommends when an app wants its own degraded UI
          instead of the SDK&apos;s documented facade fallback.
        </li>
        <li>
          <Link href="/server-only-util">
            <strong>/server-only-util</strong>
          </Link>{' '}
          — pure Server Component using the server-safe SDK subpath (
          <code>@webspatial/react-sdk/server</code>). Calls{' '}
          <code>detectSpatialRuntime(await headers())</code> so the initial HTML
          can branch on whether the requesting device is a WebSpatial runtime —
          no client JS required.
        </li>
      </ul>
      <p>
        Open each page in <strong>plain Chrome</strong> first (you will see
        facade fallback DOM), then open the same page in the Apple Vision Pro
        simulator or a PICO emulator to see the real spatial primitives take
        over after <code>bootSpatial()</code> resolves.
      </p>
      <p>
        See <code>README.md</code> for the &quot;view-source&quot; SSR
        verification checklist and the <code>&apos;use client&apos;</code>{' '}
        boundary rules.
      </p>
    </div>
  )
}
