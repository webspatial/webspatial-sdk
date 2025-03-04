import { useRef, useEffect, useState, useContext, CSSProperties } from 'react'
import { SpatialReactContext } from '../SpatialReactComponent/SpatialReactContext'
import {
  getInheritedStyleProps,
  domRect2rectType,
  parseTransformOrigin,
} from '../SpatialReactComponent/utils'

export function useSyncDomInfoFromStandardInstance(spatialId: string) {
  const [domRect, setDomRect] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })

  const inheritedPortalStyleRef = useRef<CSSProperties>({})

  const anchorRef = useRef({
    x: 0.5,
    y: 0.5,
    z: 0.5,
  })

  const opacityRef = useRef(1.0)

  const spatialReactContextObject = useContext(SpatialReactContext)

  const inheritedPortalClassNameRef = useRef('')

  const modelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const syncDomRect = () => {
      const dom = spatialReactContextObject?.querySpatialDom(spatialId)
      if (!dom) {
        return
      }
      modelRef.current = dom as HTMLDivElement

      let domRect = dom.getBoundingClientRect()
      let rectType = domRect2rectType(domRect)

      const parentDom =
        spatialReactContextObject?.queryParentSpatialDom(spatialId)

      if (parentDom) {
        const parentDomRect = parentDom.getBoundingClientRect()
        const parentRectType = domRect2rectType(parentDomRect)
        rectType.x -= parentRectType.x
        rectType.y -= parentRectType.y
      }
      const computedStyle = getComputedStyle(dom)
      inheritedPortalStyleRef.current = getInheritedStyleProps(computedStyle)

      const anchor = parseTransformOrigin(computedStyle)
      anchorRef.current = anchor

      const opacity = parseFloat(computedStyle.getPropertyValue('opacity'))
      opacityRef.current = opacity

      inheritedPortalClassNameRef.current = dom.className

      setDomRect(rectType)
    }

    spatialReactContextObject?.onDomChange(spatialId, syncDomRect)

    return () => {
      spatialReactContextObject?.offDomChange(spatialId)
    }
  }, [])

  return {
    modelRef,
    domRect,
    inheritedPortalStyle: inheritedPortalStyleRef.current,
    anchor: anchorRef.current,
    opacity: opacityRef.current,
    className: inheritedPortalClassNameRef.current,
  }
}
