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
        Worked examples of <code>@webspatial/react-sdk</code> under Next.js 15
        App Router. Each page exercises a different scenario from the{' '}
        <code>lazy-load-spatial-runtime</code> spec.
      </p>
      <ul style={{ lineHeight: 1.8 }}>
        <li>
          <Link href="/lazy">
            <strong>/lazy</strong>
          </Link>{' '}
          — default lazy entry (<code>@webspatial/react-sdk</code>) wrapped in{' '}
          <code>&lt;SpatialBoot&gt;</code>. Recommended shape for web-first
          apps.
        </li>
        <li>
          <Link href="/lazy-gate">
            <strong>/lazy-gate</strong>
          </Link>{' '}
          — <code>&lt;SpatialBoot fallback=&#123;…&#125;&gt;</code>; optional
          loading UI while boot completes before children mount.
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
          — internal validation: RSC calling the non–public{' '}
          <code>@webspatial/react-sdk/server</code> entry (see package README).
          For real apps, branch on <code>User-Agent</code> per WebSpatial docs —
          not this demo pattern.
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
