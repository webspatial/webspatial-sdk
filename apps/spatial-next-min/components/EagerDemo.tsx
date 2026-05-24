'use client'

import Link from 'next/link'
import { EagerSpatialIsland } from '@/components/EagerSpatialIsland'

// Pure client route: spatial evaluates at module load (eager static graph).
// For SSR apps use `/eager-ssr` instead — same island behind `dynamic(..., { ssr: false })`.

export function EagerDemo() {
  return (
    <section>
      <h1>Eager entry</h1>
      <p>
        <code>
          import &#123; Model &#125; from
          &apos;@webspatial/react-sdk/eager&apos;
        </code>
      </p>
      <p>
        Spatial primitives mount immediately — the real implementation is in
        this page&apos;s first JS payload, not behind{' '}
        <code>await bootSpatial()</code>. Use this entry for spatial-only apps;
        use the default entry when you need SSR façade HTML or the 8&nbsp;KB
        lazy sync budget.
      </p>
      <p>
        SSR framework users: see{' '}
        <Link href="/eager-ssr">
          <code>/eager-ssr</code>
        </Link>{' '}
        for the supported CSR-gated pattern.
      </p>
      <EagerSpatialIsland />
    </section>
  )
}
