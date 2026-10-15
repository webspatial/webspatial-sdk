import { LazyDemo } from '@/components/LazyDemo'

// This page itself is a Server Component — Next.js renders the static
// shell on the server (including the facade fallback HTML returned by
// `<LazyDemo />`'s server pass) before shipping anything to the client.
// All spatial-specific code lives inside `LazyDemo` behind a
// `'use client'` directive.
export const metadata = { title: '/lazy — spatial-next-min' }

export default function LazyPage() {
  return <LazyDemo />
}
