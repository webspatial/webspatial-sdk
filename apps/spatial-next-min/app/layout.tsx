import type { ReactNode } from 'react'
import Link from 'next/link'

export const metadata = {
  title: 'spatial-next-min',
  description:
    'Minimal Next.js 15 App Router demo for the @webspatial/react-sdk lazy default entry.',
}

// Root layout is a Server Component (no 'use client'). It owns the HTML
// shell and the nav; per-page boot wiring lives in each page's own
// Client Component so the demo stays on one entry root.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          margin: 0,
          color: '#222',
        }}
      >
        <header
          style={{
            borderBottom: '1px solid #ddd',
            padding: '12px 24px',
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link href="/" style={{ fontWeight: 700, textDecoration: 'none' }}>
            spatial-next-min
          </Link>
          <span aria-hidden style={{ color: '#aaa' }}>
            |
          </span>
          <Link href="/lazy">/lazy</Link>
          <Link href="/capability-wrapper">/capability-wrapper</Link>
          <Link href="/server-only-util">/server-only-util</Link>
        </header>
        <main style={{ padding: 24 }}>{children}</main>
      </body>
    </html>
  )
}
