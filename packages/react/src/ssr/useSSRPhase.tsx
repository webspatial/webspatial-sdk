import { useContext, useState, useEffect } from 'react'
import { SSRContext } from './SSRContext'
import type { SSRPhase } from './withSSRSupported'

export function useSSRPhase(): SSRPhase {
  const isServer = typeof window === 'undefined'
  const isSSRContext = useContext(SSRContext)
  const [hydrated, setHydrated] = useState(false)

  // Trigger hydration
  useEffect(() => setHydrated(true), [])

  let phase: SSRPhase

  // Server-side rendering (SSR mode)
  if (isServer) {
    phase = 'ssr'
  }
  // Client-side
  else if (isSSRContext) {
    // SSR mode: check hydration state
    phase = hydrated ? 'after-hydrate' : 'hydrate'
  } else {
    // CSR mode: directly return after-hydrate
    phase = 'after-hydrate'
  }

  return phase
}
