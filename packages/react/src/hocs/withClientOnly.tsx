import React, {
  useState,
  useEffect,
  ComponentType,
  forwardRef,
  PropsWithoutRef,
} from 'react'

/**
 * A HOC that ensures a component is only rendered on the client side.
 * It returns null during server-side rendering.
 * @param Component The component to be rendered only on the client.
 */
export function withClientOnly<T extends {}>(Component: ComponentType<T>) {
  const ClientOnlyComponent = (
    props: PropsWithoutRef<T>,
    ref: React.ForwardedRef<any>,
  ) => {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
      setIsMounted(true)
    }, [])

    if (!isMounted) {
      return null
    }

    return <Component {...(props as T)} ref={ref} />
  }

  ClientOnlyComponent.displayName = `withClientOnly(${Component.displayName || Component.name || 'Component'})`

  return forwardRef(ClientOnlyComponent)
}
