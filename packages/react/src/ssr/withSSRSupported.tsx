'use client'

import React, {
  ComponentType,
  forwardRef,
  PropsWithoutRef,
  useSyncExternalStore,
} from 'react'

const noopSubscribe = (_onStoreChange: () => void) => (): void => {}

/** Stable `getSnapshot` — client after hydration reads `true` (show real impl). */
const clientSnapshotReady = (): true => true

/**
 * Stable `getServerSnapshot` + hydration-first-pass snapshot (`false`)
 * placeholder div. Must stay referentially identical across renders.
 */
const serverAndHydratePassSnapshot = (): false => false

/**
 * Hydration-aware gate for components that attach to browser-only spatial
 * infrastructure. SSR and the client hydration pass render a placeholder
 * `<div>` (only `style` and `className` from props); after hydration commits,
 * the wrapped component renders.
 *
 * Implemented with `useSyncExternalStore` and a stable `getServerSnapshot` so
 * React 18+ matches server HTML during `hydrateRoot` — no `SSRProvider` /
 * `SSRContext` is required (see spatial-lazy-load spec "SSR and hydration
 * safety" for the façade path; eager spatial primitives remain CSR-only by
 * product routing).
 *
 * @param Component The component rendered after hydration.
 */
export function withSSRSupported<T extends {}>(Component: ComponentType<T>) {
  const ClientOnlyComponent = (
    props: PropsWithoutRef<T>,
    ref: React.ForwardedRef<any>,
  ) => {
    const showRealImpl = useSyncExternalStore(
      noopSubscribe,
      clientSnapshotReady,
      serverAndHydratePassSnapshot,
    )

    if (!showRealImpl) {
      const { style, className } = props as Record<string, unknown>
      return (
        <div
          style={style as React.CSSProperties | undefined}
          className={className as string | undefined}
          ref={ref}
        ></div>
      )
    }
    return <Component {...(props as T)} ref={ref} />
  }

  ClientOnlyComponent.displayName = `withClientOnly(${Component.displayName || Component.name || 'Component'})`

  return forwardRef(ClientOnlyComponent)
}
