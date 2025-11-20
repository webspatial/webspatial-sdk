import React, {
  useState,
  useEffect,
  ComponentType,
  forwardRef,
  PropsWithoutRef,
  createContext,
  useContext,
} from 'react'

/**
 * A HOC that ensures a component is only rendered on the client side.
 * It returns null during server-side rendering.
 * @param Component The component to be rendered only on the client.
 */
export function withSSRSupported<T extends {}>(Component: ComponentType<T>) {
  const ClientOnlyComponent = (
    props: PropsWithoutRef<T>,
    ref: React.ForwardedRef<any>,
  ) => {
    const phase = useSSRPhase()

    let renderType: 'fake' | 'real' = 'real'

    if (phase === 'ssr' || phase === 'hydrate') {
      renderType = 'fake'
    }

    if (renderType === 'fake') {
      const { style, className } = props as any
      // keep style and className for SSR, prevent style flicker on hydration
      return <div style={style} className={className} ref={ref}></div>
    } else {
      return <Component {...(props as T)} ref={ref} />
    }
  }

  ClientOnlyComponent.displayName = `withClientOnly(${Component.displayName || Component.name || 'Component'})`

  return forwardRef(ClientOnlyComponent)
}

export type SSRPhase = 'ssr' | 'hydrate' | 'after-hydrate'

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
function useSSRPhase(): SSRPhase {
  const isSSRContext = useIsSSR()
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

const SSRContext = createContext(false)

export const SSRProvider = ({
  isSSR: initialIsSSR = true,
  children,
}: {
  isSSR?: boolean
  children: React.ReactNode
}) => {
  const [isSSR, setIsSSR] = useState(initialIsSSR)

  useEffect(() => {
    if (isSSR) {
      setIsSSR(false)
    }
  }, [])

  return <SSRContext.Provider value={isSSR}>{children}</SSRContext.Provider>
}

/**
 * @internal
 */
const useIsSSR = () => {
  return useContext(SSRContext)
}
