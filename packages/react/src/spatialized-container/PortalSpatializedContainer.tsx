import { useMemo, useContext, useEffect, useCallback, useRef } from 'react'
import type { CSSProperties, ReactNode, Ref } from 'react'
import {
  PortalInstanceObject,
  PortalInstanceContext,
} from './context/PortalInstanceContext'
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
import { isSpatialOverlayContent } from './overlayDetection'
import { useSync2DFrame } from './hooks/useSync2DFrame'
import { useSpatializedElement } from './hooks/useSpatializedElement'
import {
  SpatializedContainerContext,
  SpatializedContainerObject,
} from './context/SpatializedContainerContext'
import { SpatialOverlayRenderTargetContext } from './context/SpatialOverlayRenderTargetContext'

function assignForwardedRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (ref == null) return
  if (typeof ref === 'function') {
    ref(node)
  } else {
    ;(ref as React.MutableRefObject<T | null>).current = node
  }
}

/**
 * Splits the floating content's props into the menu children (rendered into the
 * child spatial webview by `Content`) and the remaining props injected by the
 * floating library (style, data-*, role, handlers) that must be mirrored onto
 * the hidden placeholder host so the library can measure/position it.
 */
function splitOverlayProps(restProps: Record<string, unknown>): {
  children: ReactNode
  radixProps: Record<string, unknown>
} {
  const {
    component: _component,
    children,
    ...radixProps
  } = restProps as {
    component?: unknown
    children?: ReactNode
  } & Record<string, unknown>
  return { children: children ?? null, radixProps }
}

/**
 * Scenario 3 overlay placeholder host. A hidden-but-real DOM host rendered in
 * the parent spatial window where the floating library's `asChild` ref/props
 * land. It renders a hidden copy of the menu children so the library measures a
 * real, non-zero size (mirrors the proven root/standard-instance dual-render).
 * The visible menu is rendered into the child spatial webview by `Content`.
 */
function renderOverlayPlaceholder(
  portalInstanceObject: PortalInstanceObject,
  El: React.ElementType,
  opts: {
    hostRef: Ref<HTMLElement>
    children: ReactNode
    radixProps: Record<string, unknown>
  },
) {
  const spatialIdProps = { [SpatialID]: portalInstanceObject.spatialId }
  const { style: radixStyle, ...radixRest } = opts.radixProps as {
    style?: CSSProperties
  } & Record<string, unknown>
  const style: CSSProperties = {
    ...radixStyle,
    animation: 'none',
    position: 'relative',
    transition: 'none',
    visibility: 'hidden',
    pointerEvents: 'none',
  }
  return (
    <El ref={opts.hostRef} {...radixRest} {...spatialIdProps} style={style}>
      {opts.children}
    </El>
  )
}

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
    (portalInstanceObject.isFloatingOverlay ||
      (position !== 'absolute' && position !== 'fixed'))

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
    hostRef,
    [SpatialID]: spatialId,
    ...restProps
  } = props

  const spatializedContainerObject: SpatializedContainerObject = useContext(
    SpatializedContainerContext,
  )!

  const parentPortalInstanceObject = useContext(PortalInstanceContext)
  const isOverlayMode =
    !!parentPortalInstanceObject &&
    isSpatialOverlayContent(restProps as Record<string, unknown>)
  const portalInstanceObject = useMemo(() => {
    const portal = new PortalInstanceObject(
      spatialId,
      spatializedContainerObject,
      parentPortalInstanceObject,
      getExtraSpatializedElementProperties,
    )
    if (isOverlayMode) {
      portal.setFloatingOverlay(true)
    }
    return portal
  }, [])

  // Overlay placeholder host ref: forward the floating library's `asChild` ref
  // (so it can measure/position the hidden host) and register the host so
  // `notify2DFrameChange` can find and measure it in the parent spatial window.
  const hostRefBox = useRef(hostRef)
  hostRefBox.current = hostRef
  const overlayPlaceholderRef = useCallback(
    (node: HTMLElement | null) => {
      assignForwardedRef(hostRefBox.current, node)
      if (node) {
        spatializedContainerObject.registerSpatialDom(spatialId, node)
        portalInstanceObject.notify2DFrameChange()
      } else {
        spatializedContainerObject.unregisterSpatialDom(spatialId)
      }
    },
    [spatializedContainerObject, spatialId, portalInstanceObject],
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

  let PlaceholderEl: React.ReactNode
  if (isOverlayMode) {
    const { children, radixProps } = splitOverlayProps(
      restProps as Record<string, unknown>,
    )
    PlaceholderEl = renderOverlayPlaceholder(
      portalInstanceObject,
      props.component,
      {
        hostRef: overlayPlaceholderRef,
        children,
        radixProps,
      },
    )
  } else {
    PlaceholderEl = renderPlaceholderInSubPortal(
      portalInstanceObject,
      props.component,
    )
  }

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
        <SpatialOverlayRenderTargetContext.Provider value="portal">
          <Content
            spatializedElement={spatializedElement}
            portalInstanceObject={portalInstanceObject}
            {...restProps}
          />
        </SpatialOverlayRenderTargetContext.Provider>
      )}
      <SpatialOverlayRenderTargetContext.Provider value="measurement">
        {PlaceholderEl}
      </SpatialOverlayRenderTargetContext.Provider>
    </PortalInstanceContext.Provider>
  )
}
