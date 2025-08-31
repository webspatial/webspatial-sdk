import {
  useContext,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback,
} from 'react'

import {
  SpatializedContainerContext,
  SpatializedContainerObject,
} from '../context/SpatializedContainerContext'

export function use2DFrameDetector() {
  const ref = useRef<HTMLElement>(null)

  const spatializedContainerObject: SpatializedContainerObject = useContext(
    SpatializedContainerContext,
  )!

  const notify2DFrameChange = useCallback(() => {
    ref.current &&
      spatializedContainerObject.notify2DFramePlaceHolderChange(ref.current)
  }, [ref.current, spatializedContainerObject])

  useLayoutEffect(notify2DFrameChange, [notify2DFrameChange])

  // listen to webview container size change and notifyDomChange
  // document.body.clientWidth may change as page loads.
  // when creating a new scene, clientWidth changes from 0 to some positive value.
  // this cannot be detected by ResizeObserver which only observe the dom element itself
  useEffect(() => {
    if (!ref.current || !spatializedContainerObject) {
      console.warn(
        'Ref is not attached to the DOM or spatializedContainerObject is not available',
      )
      return
    }

    window.addEventListener('resize', notify2DFrameChange)

    return () => {
      window.removeEventListener('resize', notify2DFrameChange)
    }
  }, [])

  // detect dom resize
  // Trigger native resize on web resize events
  useEffect(() => {
    if (!ref.current) {
      console.warn('Ref is not attached to the DOM')
      return
    }

    const ro = new ResizeObserver(notify2DFrameChange)
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
    const ro = new MutationObserver(notify2DFrameChange)
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
