import { RefObject, useCallback, useContext, useEffect } from 'react'
import { SpatialStyleInfoUpdateEvent } from '../../notifyUpdateStandInstanceLayout'
import { SpatialTransformVisibility } from '../types'
import { SpatializedContainerContext } from '../context/SpatializedContainerContext'

function parseTransformAndVisibilityProperties(
  node: HTMLElement,
): SpatialTransformVisibility {
  const computedStyle = getComputedStyle(node)

  // handle transform properties
  const transform = computedStyle.getPropertyValue('transform') || 'none'

  // parse visibility
  const visibility = computedStyle.getPropertyValue('visibility') || 'visible'

  return {
    visibility,
    transform,
  }
}

export function useSpatialTransformVisibility(
  spatialId: string,
  ref: RefObject<HTMLElement | null>,
) {
  const spatializedContainerObject = useContext(SpatializedContainerContext)!

  const checkSpatialStyleUpdate = useCallback(() => {
    const spatialTransformVisibility = parseTransformAndVisibilityProperties(
      ref.current!,
    )

    // notify SpatializedContainerContext
    spatializedContainerObject.updateSpatialTransformVisibility(
      spatialId,
      spatialTransformVisibility,
    )
  }, [])

  useEffect(() => {
    checkSpatialStyleUpdate()
  }, [checkSpatialStyleUpdate])

  useEffect(() => {
    // sync spatial style when this dom or sub dom change
    const observer = new MutationObserver(mutationsList => {
      checkSpatialStyleUpdate()
    })
    const config = {
      childList: false,
      subtree: false,
      attributes: true,
      // attributeOldValue: true,
      attributeFilter: ['style', 'class'],
    }
    observer.observe(ref.current!, config)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const headObserver = new MutationObserver(mutations => {
      checkSpatialStyleUpdate()
    })
    headObserver.observe(document.head, { childList: true, subtree: true })
    return () => {
      headObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    const onDomUpdated = (event: Event) => {
      checkSpatialStyleUpdate()
    }

    // check style property change when some external style change
    document.addEventListener(
      SpatialStyleInfoUpdateEvent.domUpdated,
      onDomUpdated,
    )

    return () => {
      document.removeEventListener(
        SpatialStyleInfoUpdateEvent.domUpdated,
        onDomUpdated,
      )
    }
  }, [])
}
