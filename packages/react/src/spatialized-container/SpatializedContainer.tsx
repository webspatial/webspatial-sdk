import {
  ForwardedRef,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
} from 'react'
import {
  SpatializedContainerContext,
  SpatializedContainerObject,
} from './context/SpatializedContainerContext'
import { getSession } from '../utils/getSession'
import { SpatialLayerContext } from './context/SpatialLayerContext'
import { SpatializedElementRef, SpatializedContainerProps } from './types'
import { StandardSpatializedContainer } from './StandardSpatializedContainer'
import { PortalSpatializedContainer } from './PortalSpatializedContainer'
import { PortalInstanceContext } from './context/PortalInstanceContext'
import { SpatialID } from './SpatialID'
import { TransformVisibilityTaskContainer } from './TransformVisibilityTaskContainer'
import { useDomProxy } from './hooks/useDomProxy'
import { useInsideAttachment } from '../reality/context/InsideAttachmentContext'
import {
  useSpatialEvents,
  useSpatialEventsWhenSpatializedContainerExist,
} from './hooks/useSpatialEvents'
import { SpatialWindowContext } from './context/SpatialWindowContext'

/**
 * Degraded fallback: strips spatial-only props and renders plain HTML.
 * This is a separate component so that SpatializedContainerBase never
 * has to conditionally skip its hooks.
 */
function DegradedContainer<T extends SpatializedElementRef>({
  innerRef,
  enableOnSpatialContentReadyFallback,
  ...inprops
}: SpatializedContainerProps<T> & {
  innerRef: ForwardedRef<SpatializedElementRef<T>>
  enableOnSpatialContentReadyFallback: boolean
}) {
  type DegradedProps = SpatializedContainerProps<T> & {
    'enable-xr'?: unknown
    sizingMode?: unknown
  }
  const {
    component: Component,
    children,
    ['enable-xr']: _enableXR,
    onSpatialTap: _onSpatialTap,
    onSpatialDragStart: _onSpatialDragStart,
    onSpatialDrag: _onSpatialDrag,
    onSpatialDragEnd: _onSpatialDragEnd,
    onSpatialRotate: _onSpatialRotate,
    onSpatialRotateEnd: _onSpatialRotateEnd,
    onSpatialMagnify: _onSpatialMagnify,
    onSpatialMagnifyEnd: _onSpatialMagnifyEnd,
    spatialEventOptions: _spatialEventOptions,
    spatializedContent: _content,
    createSpatializedElement: _create,
    getExtraSpatializedElementProperties: _getExtra,
    extraRefProps: _extraRef,
    sizingMode: _sizingMode,
    // `onSpatialContentReady` is destructured out (NOT spread to the DOM
    // element) so it never leaks as an attribute. Per the product-confirmed
    // semantics it fires ONLY when a real WebSpatial spatial content host
    // exists (the portal path via `useSpatialContentReady`); a degraded plain
    // HTML host has no such host, so the callback MUST NOT be invoked here —
    // this covers both the non-WebSpatial and attachment-degraded paths.
    // Exception: when `enableOnSpatialContentReadyFallback` is true (plain
    // non-WebSpatial, not inside Attachment), the layout effect below may
    // invoke it with the real DOM host for overlay/Radix portal consumers.
    onSpatialContentReady: _onSpatialContentReady,
    ...restProps
  } = inprops as DegradedProps

  const [hostEl, setHostEl] = useState<HTMLElement | null>(null)
  const callbackRef = useRef(_onSpatialContentReady)
  callbackRef.current = _onSpatialContentReady

  useLayoutEffect(() => {
    if (
      !enableOnSpatialContentReadyFallback ||
      !hostEl ||
      !hostEl.isConnected ||
      !callbackRef.current
    ) {
      return () => {}
    }

    let cleanup: void | (() => void)
    try {
      cleanup = callbackRef.current({ host: hostEl })
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[WebSpatial] onSpatialContentReady threw', e)
      }
    }

    return () => {
      if (typeof cleanup !== 'function') return
      try {
        cleanup()
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[WebSpatial] onSpatialContentReady cleanup threw', e)
        }
      }
    }
  }, [enableOnSpatialContentReadyFallback, hostEl])

  const setHostRef = useCallback(
    (node: SpatializedElementRef<T> | null) => {
      if (typeof innerRef === 'function') {
        innerRef(node)
      } else if (innerRef != null) {
        innerRef.current = node
      }
      setHostEl(node as HTMLElement | null)
    },
    [innerRef],
  )

  const host = (
    <Component ref={setHostRef} {...restProps}>
      {children}
    </Component>
  )

  // Degraded SpatialDiv still renders in the host page document. Expose that
  // window through SpatialWindowContext so useSpatialPortalContainer() works
  // for Radix menus without an app-level fallback (spec: provider absent →
  // undefined only when not inside any SpatialDiv subtree).
  if (typeof window !== 'undefined') {
    return (
      <SpatialWindowContext.Provider value={window as unknown as WindowProxy}>
        {host}
      </SpatialWindowContext.Provider>
    )
  }

  return host
}

export function SpatializedContainerBase<T extends SpatializedElementRef>(
  inprops: SpatializedContainerProps<T>,
  ref: ForwardedRef<SpatializedElementRef<T>>,
) {
  const isWebSpatialEnv = getSession() !== null
  const insideAttachment = useInsideAttachment()

  if (!isWebSpatialEnv || insideAttachment) {
    if (insideAttachment) {
      console.warn(
        `[WebSpatial] ${inprops.component || 'Spatial element'} cannot be used inside AttachmentAsset. Rendering as plain HTML.`,
      )
    }
    return (
      <DegradedContainer
        {...inprops}
        innerRef={ref}
        enableOnSpatialContentReadyFallback={
          !isWebSpatialEnv && !insideAttachment
        }
      />
    )
  }

  const layer = useContext(SpatialLayerContext) + 1
  const rootSpatializedContainerObject = useContext(
    SpatializedContainerContext,
  ) as unknown as SpatializedContainerObject<T>
  const inSpatializedContainer = !!rootSpatializedContainerObject
  const portalInstanceObject = useContext(PortalInstanceContext)
  const inPortalInstanceEnv = !!portalInstanceObject
  const isInStandardInstance = !inPortalInstanceEnv

  const spatialId = useMemo(() => {
    return !inSpatializedContainer
      ? `root_container`
      : rootSpatializedContainerObject.getSpatialId(layer, isInStandardInstance)
  }, [])
  const spatialIdProps = {
    [SpatialID]: spatialId,
  }
  const {
    onSpatialTap,
    onSpatialDragStart,
    onSpatialDrag,
    onSpatialDragEnd,
    onSpatialRotate,
    onSpatialRotateEnd,
    onSpatialMagnify,
    onSpatialMagnifyEnd,
    extraRefProps,
    ...props
  } = inprops

  if (inSpatializedContainer) {
    if (inPortalInstanceEnv) {
      const spatialEvents = useSpatialEventsWhenSpatializedContainerExist<T>(
        {
          onSpatialTap,
          onSpatialDragStart,
          onSpatialDrag,
          onSpatialDragEnd,
          onSpatialRotate,
          onSpatialRotateEnd,
          onSpatialMagnify,
          onSpatialMagnifyEnd,
        },
        spatialId,
        rootSpatializedContainerObject,
      )

      // nested in another PortalSpatializedContainer
      return (
        <SpatialLayerContext.Provider value={layer}>
          <PortalSpatializedContainer<T>
            hostRef={ref as Ref<HTMLElement>}
            {...spatialIdProps}
            {...props}
            {...spatialEvents}
          />
        </SpatialLayerContext.Provider>
      )
    } else {
      // in standard instance env
      const {
        transformVisibilityTaskContainerCallback,
        standardSpatializedContainerCallback,
        spatialContainerRefProxy,
      } = useDomProxy<T>(ref, extraRefProps)

      const [probeClassName, setProbeClassName] = useState(
        () => props.className ?? '',
      )
      const notifyProbeClass = useCallback((name: string) => {
        setProbeClassName(prev => (prev === name ? prev : name))
      }, [])
      useEffect(() => {
        spatialContainerRefProxy.current.setMirrorClassNotify?.(
          notifyProbeClass,
        )
        return () => {
          spatialContainerRefProxy.current.setMirrorClassNotify?.(null)
        }
      }, [spatialContainerRefProxy, notifyProbeClass])

      useEffect(() => {
        rootSpatializedContainerObject.updateSpatialContainerRefProxyInfo(
          spatialId,
          spatialContainerRefProxy.current,
        )
      }, [spatialContainerRefProxy.current])

      const {
        spatializedContent,
        createSpatializedElement,
        getExtraSpatializedElementProperties,
        spatialEventOptions: _nestedSpatialEventOptions,
        onSpatialContentReady: _nestedOnSpatialContentReady,
        ...restProps
      } = props
      return (
        <SpatialLayerContext.Provider value={layer}>
          <StandardSpatializedContainer<T>
            ref={standardSpatializedContainerCallback}
            {...spatialIdProps}
            {...restProps}
            inStandardSpatializedContainer={true}
          />
          <TransformVisibilityTaskContainer
            ref={transformVisibilityTaskContainerCallback}
            {...spatialIdProps}
            component={props.component}
            className={probeClassName}
            style={props.style}
          />
        </SpatialLayerContext.Provider>
      )
    }
  } else {
    const {
      transformVisibilityTaskContainerCallback,
      standardSpatializedContainerCallback,
      spatialContainerRefProxy,
    } = useDomProxy<T>(ref, extraRefProps)

    const [probeClassName, setProbeClassName] = useState(
      () => props.className ?? '',
    )
    const notifyProbeClass = useCallback((name: string) => {
      setProbeClassName(prev => (prev === name ? prev : name))
    }, [])
    useEffect(() => {
      spatialContainerRefProxy.current.setMirrorClassNotify?.(notifyProbeClass)
      return () => {
        spatialContainerRefProxy.current.setMirrorClassNotify?.(null)
      }
    }, [spatialContainerRefProxy, notifyProbeClass])

    const spatialEvents = useSpatialEvents<T>(
      {
        onSpatialTap,
        onSpatialDragStart,
        onSpatialDrag,
        onSpatialDragEnd,
        onSpatialRotate,
        onSpatialRotateEnd,
        onSpatialMagnify,
        onSpatialMagnifyEnd,
      },
      spatialContainerRefProxy,
    )

    // This is the root spatialized container
    const spatializedContainerObject = useMemo(
      () => new SpatializedContainerObject(),
      [],
    )
    const {
      spatializedContent,
      createSpatializedElement,
      getExtraSpatializedElementProperties,
      spatialEventOptions: _rootSpatialEventOptions,
      onSpatialContentReady: _rootOnSpatialContentReady,
      ...restProps
    } = props

    return (
      <SpatialLayerContext.Provider value={layer}>
        <SpatializedContainerContext.Provider
          value={spatializedContainerObject}
        >
          <StandardSpatializedContainer<T>
            ref={standardSpatializedContainerCallback}
            {...spatialIdProps}
            {...restProps}
            inStandardSpatializedContainer={false}
          />
          <PortalSpatializedContainer<T>
            {...spatialIdProps}
            {...props}
            {...spatialEvents}
          />
          <TransformVisibilityTaskContainer
            ref={transformVisibilityTaskContainerCallback}
            {...spatialIdProps}
            component={props.component}
            className={probeClassName}
            style={props.style}
          />
        </SpatializedContainerContext.Provider>
      </SpatialLayerContext.Provider>
    )
  }
}

// No `withSSRSupported` wrapper: on the default entry this container is reached
// only via the facade HOC delegate (`facades/withSpatialized2DElementContainer`)
// once `useSpatialReady()` is ready — i.e. as a fresh client mount AFTER
// hydration commits, never during the SSR or hydration pass. The eager entry is
// CSR-only for spatial primitives (see `spatial-lazy-load` spec "Entry
// routing"); SSR safety in mixed eager setups is the consumer's responsibility.
export const SpatializedContainer = forwardRef(SpatializedContainerBase) as <
  T extends SpatializedElementRef,
>(
  props: SpatializedContainerProps<T> & {
    ref?: ForwardedRef<SpatializedElementRef<T>>
  },
) => React.ReactElement | null
