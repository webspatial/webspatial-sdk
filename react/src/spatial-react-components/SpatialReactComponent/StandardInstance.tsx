import React, {
  CSSProperties,
  useRef,
  ReactNode,
  useLayoutEffect,
  useEffect,
  useContext,
  forwardRef,
} from 'react'
import { useForceUpdate } from '../hooks/useForceUpdate'
import { SpatialIsStandardInstanceContext } from './SpatialIsStandardInstanceContext'
import { SpatialReactContext } from './SpatialReactContext'
import { SpatialReactComponentRef } from './types'

function useDetectDomRectChange() {
  const ref = useRef<HTMLElement>(null)

  const forceUpdate = useForceUpdate()

  const spatialReactContextObject = useContext(SpatialReactContext)

  useLayoutEffect(() => {
    ref.current && spatialReactContextObject?.notifyDomChange(ref.current)
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

interface StandardInstanceProps {
  El: React.ElementType
  children?: ReactNode
  style?: CSSProperties | undefined

  // for debug
  debugShowStandardInstance?: boolean
}
export const StandardInstance = forwardRef(function (
  inProps: StandardInstanceProps,
  refIn: SpatialReactComponentRef,
) {
  const { El, style: inStyle, debugShowStandardInstance, ...props } = inProps
  const extraStyle = {
    visibility: debugShowStandardInstance ? undefined : 'hidden',
    transition: 'none',
  }
  const style = { ...inStyle, ...extraStyle }

  var ref = useDetectDomRectChange()

  const proxyRef = new Proxy<typeof ref>(ref, {
    get(target, prop, receiver) {
      return Reflect.get(target, prop, receiver)
    },
    set(target, prop, value, receiver) {
      if (prop === 'current') {
        const domElement = value as HTMLDivElement
        if (refIn) {
          if (typeof refIn === 'function') {
            refIn(domElement)
          } else {
            refIn.current = domElement
          }
        }
      }
      return Reflect.set(target, prop, value, receiver)
    },
  })

  return (
    <SpatialIsStandardInstanceContext.Provider value={true}>
      <El ref={proxyRef} style={style} {...props} />
    </SpatialIsStandardInstanceContext.Provider>
  )
})

StandardInstance.displayName = 'StandardInstance'
