import { useRef, useEffect, ForwardedRef, useMemo } from 'react'
import { notifyDOMUpdate } from '../notifyUpdateStandInstanceLayout'

export function useMonitorDomChange(inRef: ForwardedRef<HTMLElement>) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new MutationObserver(mutationsList => {
      notifyDOMUpdate(mutationsList)
    })

    const config = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    }

    ref.current && observer.observe(ref.current, config)

    return () => {
      observer.disconnect()
    }
  }, [])

  const proxyRef = useMemo(
    () =>
      new Proxy(ref, {
        set: function (target, key, value) {
          if (key === 'current') {
            if (inRef) {
              if (typeof inRef === 'function') {
                inRef(value)
              } else if (inRef) {
                inRef.current = value
              }
            }
          }
          return Reflect.set(target, key, value)
        },
      }),
    [],
  )

  return proxyRef
}
