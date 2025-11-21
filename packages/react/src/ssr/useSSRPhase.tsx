import { useContext, useState, useEffect } from 'react'
import { SSRContext } from './SSRContext'
import type { SSRPhase } from './withSSRSupported'
/**
 * A hook to determine the current phase of Server-Side Rendering (SSR).
 *
 * This hook is crucial for components that need to behave differently during
 * various stages of the SSR lifecycle. It helps prevent hydration mismatches
 * in React by providing a clear state for each phase.
 *
 * @returns {SSRPhase} The current SSR phase, which can be one of the following:
 * - `'ssr'`: The component is rendering on the server.
 * - `'hydrate'`: The component is in the hydration phase on the client. This is the first render on the client, which must match the server-rendered output.
 * - `'after-hydrate'`: The component has finished hydrating and is now running purely on the client. This is also the state for apps in Client-Side Rendering (CSR) mode.
 *
 * @example
 * ```tsx
 * const ssrPhase = useSSRPhase();
 *
 * if (ssrPhase === 'ssr' || ssrPhase === 'hydrate') {
 *   return <Spinner />;
 * }
 *
 * return <MyClientOnlyComponent />;
 * ```
 */
export function useSSRPhase(): SSRPhase {
  const isSSRContext = useContext(SSRContext)
  const isServer = typeof window === 'undefined'
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => setHydrated(true), [])

  // Server-side rendering (SSR mode)
  if (isServer) {
    return 'ssr' as const
  }

  // Client-side
  if (isSSRContext) {
    // SSR mode: check hydration state
    return hydrated ? ('after-hydrate' as const) : ('hydrate' as const)
  } else {
    // CSR mode: directly return after-hydrate
    return 'after-hydrate' as const
  }
}
