import { useRef, useEffect } from 'react'

export function useDetectLayoutDomUpdated(onDomUpdated: () => void) {
  const ref = useRef<HTMLDivElement>(null)

  // detect dom resize
  // Trigger native resize on web resize events
  useEffect(() => {
    if (!ref.current) {
      console.warn('Ref is not attached to the DOM')
      return
    }

    let ro = new ResizeObserver(elements => {
      onDomUpdated()
    })

    ro.observe(ref.current!)
    return () => {
      ro.disconnect()
    }
  }, [])

  // detect dom style and class change
  useEffect(() => {
    if (!ref.current) {
      console.warn('Ref is not attached to the DOM')
      return
    }
    let ro = new MutationObserver(elements => {
      onDomUpdated()
    })

    ro.observe(ref.current!, {
      attributeFilter: ['class', 'style'],
      subtree: true,
      attributeOldValue: false,
    })
    return () => {
      ro.disconnect()
    }
  }, [])

  return ref
}
