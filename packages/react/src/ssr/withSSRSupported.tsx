import React, { ComponentType, forwardRef, PropsWithoutRef } from 'react'
import { useSSRPhase } from './useSSRPhase'

export type SSRPhase = 'ssr' | 'hydrate' | 'after-hydrate'

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
