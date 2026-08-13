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
        Worked examples of the lazy default entry (
        <code>@webspatial/react-sdk</code>) under Next.js 15 App Router.
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
          — pure RSC: branch on <code>User-Agent</code> per WebSpatial docs (no
          SDK server detection API).
        </li>
      </ul>
      <p>
        Open each page in <strong>plain Chrome</strong> first (you will see
        facade fallback DOM), then open the same page in the Apple Vision Pro
        simulator or a PICO emulator to see the real spatial primitives take
        over after <code>bootSpatial()</code> resolves.
      </p>
      <p>
        For eager-entry examples, use <code>apps/spatial-next-eager-min</code>.
      </p>
    </div>
  )
}
