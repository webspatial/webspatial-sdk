import { useRef, useLayoutEffect, useEffect } from 'react'
import { useForceUpdate } from '../hooks/useForceUpdate'

export function useDetectLayoutDomUpdated(onDomUpdated: () => void) {
  const ref = useRef<HTMLDivElement>(null)

  const forceUpdate = useForceUpdate()

  useLayoutEffect(() => {
    ref.current && onDomUpdated()
  })

  // detect dom resize
  // Trigger native resize on web resize events
  useEffect(() => {
    if (!ref.current) {
      console.warn('Ref is not attached to the DOM')
      return
    }

    let ro = new ResizeObserver(elements => {
      forceUpdate()
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
      forceUpdate()
    })
    ro.observe(ref.current!, {
      attributeFilter: ['class', 'style'],
      subtree: true,
    })
    return () => {
      ro.disconnect()
    }
  }, [])

  return ref
}
