import { useMemo, useContext, useEffect } from 'react'
import {
  PortalInstanceObject,
  PortalInstanceContext,
} from './context/PortalInstanceContext'
import { Spatialized2DElement } from '@webspatial/core-sdk'
import type { SpatializedMotionBindingInternal } from './motion/motionBindingTypes'
import {
  PortalSpatializedContainerProps,
  SpatialContentReadyCallback,
  SpatialEventOptions,
  SpatializedElementRef,
} from './types'
import type { Vec3 } from '@webspatial/core-sdk'

function constrainedAxisToVec3(
  input: SpatialEventOptions['constrainedToAxis'] | undefined,
): Vec3 {
  if (input == null) return { x: 0, y: 0, z: 0 }
  if (Array.isArray(input)) {
    return { x: input[0] ?? 0, y: input[1] ?? 0, z: input[2] ?? 0 }
  }
  const v = input as Vec3
  return { x: v.x, y: v.y, z: v.z }
}

function constrainedAxisKey(
  input: SpatialEventOptions['constrainedToAxis'] | undefined,
): string {
  const v = constrainedAxisToVec3(input)
  return `${v.x},${v.y},${v.z}`
}

import { SpatialID } from './SpatialID'
import { useSync2DFrame } from './hooks/useSync2DFrame'
import { useSpatializedElement } from './hooks/useSpatializedElement'
import {
  SpatializedContainerContext,
  SpatializedContainerObject,
} from './context/SpatializedContainerContext'

function renderPlaceholderInSubPortal(
  portalInstanceObject: PortalInstanceObject,
  El: React.ElementType,
) {
  const spatialId = portalInstanceObject.spatialId
  const inPortalInstanceEnv = !!portalInstanceObject.parentPortalInstanceObject
  const position =
    portalInstanceObject.computedStyle?.getPropertyValue('position')

  const shouldRenderPlaceHolder =
    inPortalInstanceEnv &&
    portalInstanceObject &&
    portalInstanceObject.domRect &&
    position !== 'absolute' &&
    position !== 'fixed'

  if (!shouldRenderPlaceHolder) {
    return <></>
  }

  const { width, height } = portalInstanceObject.domRect
  const display =
    portalInstanceObject.computedStyle!.getPropertyValue('display')

  const spatialIdProps = { [SpatialID]: spatialId }
  return (
    <El
      {...spatialIdProps}
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
        visibility: 'hidden',
        display,
      }}
    />
  )
}

export function PortalSpatializedContainer<T extends SpatializedElementRef>(
  props: PortalSpatializedContainerProps<T> & {
    /** Forwarded to 2D `SpatializedContent` only (SpatialDiv). Ignored elsewhere. */
    onSpatialContentReady?: SpatialContentReadyCallback
  },
) {
  const {
    spatializedContent: Content,
    createSpatializedElement,
    getExtraSpatializedElementProperties,
    onSpatialTap,
    onSpatialDragStart,
    onSpatialDrag,
    onSpatialDragEnd,
    onSpatialRotate,
    onSpatialRotateEnd,
    onSpatialMagnify,
    onSpatialMagnifyEnd,
    spatialEventOptions,
    [SpatialID]: spatialId,
    ...restProps
  } = props

  // Extract animation prop for SpatialDiv animation binding
  const animation = (restProps as any).animation as
    | SpatializedMotionBindingInternal
    | undefined
  if (animation) {
    delete (restProps as any).animation
  }

  const motion = (restProps as any).motion as
    | SpatializedMotionBindingInternal
    | undefined
  if (motion) {
    delete (restProps as any).motion
  }

  const spatializedContainerObject: SpatializedContainerObject = useContext(
    SpatializedContainerContext,
  )!

  const parentPortalInstanceObject = useContext(PortalInstanceContext)
  const portalInstanceObject = useMemo(
    () =>
      new PortalInstanceObject(
        spatialId,
        spatializedContainerObject,
        parentPortalInstanceObject,
        getExtraSpatializedElementProperties,
      ),
    [],
  )
  useEffect(() => {
    portalInstanceObject.init()
    return () => {
      portalInstanceObject.destroy()
    }
  }, [])

  const spatializedElement = useSpatializedElement(
    createSpatializedElement,
    portalInstanceObject,
  )

  useSync2DFrame(
    spatialId,
    portalInstanceObject,
    spatializedContainerObject,
    spatializedElement,
  )
  // ---- SpatialDiv Animation Binding ----
  // When animation prop is present and spatializedElement is available,
  // call __setElement to bind the element to the animation hook.
  useEffect(() => {
    if (!animation || !spatializedElement) return

    const animProps = animation as SpatializedMotionBindingInternal & {
      __setElement?: (el: Spatialized2DElement | null) => void
    }

    // Bind element to animation hook
    if (animProps.__setElement) {
      animProps.__setElement(
        spatializedElement as unknown as Spatialized2DElement,
      )
    }

    // Set suppressed fields on the portal instance to prevent DOM sync
    // from overwriting animation intermediate values
    const suppressedFields = animProps.__getSuppressedFields?.()
    if (suppressedFields) {
      portalInstanceObject.setSuppressedFields(suppressedFields)
    }

    return () => {
      // Unbind on cleanup
      if (animProps.__onUnbind) {
        animProps.__onUnbind()
      }
      if (animProps.__setElement) {
        animProps.__setElement(null)
      }
      portalInstanceObject.setSuppressedFields(null)
    }
  }, [animation, spatializedElement, portalInstanceObject])

  // Keep suppressed fields in sync with animation state changes
  useEffect(() => {
    if (!animation || !spatializedElement) return
    const animProps = animation as SpatializedMotionBindingInternal
    const suppressedFields = animProps.__getSuppressedFields?.()
    portalInstanceObject.setSuppressedFields(suppressedFields ?? null)
  })

  // ---- SpatialDiv Motion binding (Plan B native path) ----
  useEffect(() => {
    if (!motion || !spatializedElement) return

    if (motion.__setElement) {
      motion.__setElement(
        spatializedElement as unknown as import('@webspatial/core-sdk').Spatialized2DElement,
      )
    }

    const suppressedFields = motion.__getSuppressedFields?.()
    if (suppressedFields) {
      portalInstanceObject.setSuppressedFields(suppressedFields)
    }

    return () => {
      motion.__onUnbind?.()
      if (motion.__setElement) {
        motion.__setElement(null)
      }
      portalInstanceObject.setSuppressedFields(null)
    }
  }, [motion, spatializedElement, portalInstanceObject])

  useEffect(() => {
    if (!motion || !spatializedElement) return
    const suppressedFields = motion.__getSuppressedFields?.()
    portalInstanceObject.setSuppressedFields(suppressedFields ?? null)
  })

  const PlaceholderEl = renderPlaceholderInSubPortal(
    portalInstanceObject,
    props.component,
  )

  useEffect(() => {
    if (spatializedElement) {
      // @ts-ignore
      spatializedElement.onSpatialTap = onSpatialTap
    }
  }, [spatializedElement, onSpatialTap])

  useEffect(() => {
    if (spatializedElement) {
      // @ts-ignore
      spatializedElement.onSpatialDrag = onSpatialDrag
    }
  }, [spatializedElement, onSpatialDrag])

  useEffect(() => {
    if (spatializedElement) {
      // @ts-ignore
      spatializedElement.onSpatialDragEnd = onSpatialDragEnd
    }
  }, [spatializedElement, onSpatialDragEnd])

  useEffect(() => {
    if (spatializedElement) {
      // @ts-ignore
      spatializedElement.onSpatialRotate = onSpatialRotate
    }
  }, [spatializedElement, onSpatialRotate])

  useEffect(() => {
    if (spatializedElement) {
      // @ts-ignore
      spatializedElement.onSpatialRotateEnd = onSpatialRotateEnd
    }
  }, [spatializedElement, onSpatialRotateEnd])

  useEffect(() => {
    if (spatializedElement) {
      // @ts-ignore
      spatializedElement.onSpatialMagnify = onSpatialMagnify
    }
  }, [spatializedElement, onSpatialMagnify])

  useEffect(() => {
    if (spatializedElement) {
      // @ts-ignore
      spatializedElement.onSpatialMagnifyEnd = onSpatialMagnifyEnd
    }
  }, [spatializedElement, onSpatialMagnifyEnd])

  useEffect(() => {
    if (spatializedElement) {
      // @ts-ignore
      spatializedElement.onSpatialDragStart = onSpatialDragStart
    }
  }, [spatializedElement, onSpatialDragStart])

  const rotateConstraintKey = constrainedAxisKey(
    spatialEventOptions?.constrainedToAxis,
  )

  useEffect(() => {
    if (!spatializedElement) return
    const axis = constrainedAxisToVec3(spatialEventOptions?.constrainedToAxis)
    void spatializedElement.updateProperties({ rotateConstrainedToAxis: axis })
  }, [spatializedElement, rotateConstraintKey])

  return (
    <PortalInstanceContext.Provider value={portalInstanceObject}>
      {spatializedElement && (
        <Content
          spatializedElement={spatializedElement}
          portalInstanceObject={portalInstanceObject}
          {...restProps}
        />
      )}
      {PlaceholderEl}
    </PortalInstanceContext.Provider>
  )
}
