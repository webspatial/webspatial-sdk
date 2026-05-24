import { useEffect, useState, type ReactNode } from 'react'

/**
 * Renders `children` only after the client has mounted — equivalent intent to
 * Next.js `dynamic(..., { ssr: false })` for Remix / React Router SSR apps.
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return fallback
  }

  return children
}
