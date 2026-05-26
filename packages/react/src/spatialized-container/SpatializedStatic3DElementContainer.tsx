import {
  Children,
  ForwardedRef,
  forwardRef,
  isValidElement,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { SpatializedContainer } from './SpatializedContainer'
import { getSession } from '../utils'
import {
  ModelLoadEvent,
  SpatializedStatic3DContainerProps,
  SpatializedStatic3DContentProps,
  SpatializedStatic3DElementRef,
} from './types'
import { ModelSource, SpatializedStatic3DElement } from '@webspatial/core-sdk'
import { PortalInstanceContext } from './context/PortalInstanceContext'

function getAbsoluteURL(url: string): string
function getAbsoluteURL(url: undefined): undefined
function getAbsoluteURL(url: string | undefined): string | undefined
function getAbsoluteURL(url?: string) {
  if (!url) return url
  try {
    return new URL(url, document.baseURI).toString()
  } catch {
    return url
  }
}

function createLoadEvent(
  type: string,
  targetGetter: () => SpatializedStatic3DElementRef,
): ModelLoadEvent {
  const event = new CustomEvent(type, {
    bubbles: false,
    cancelable: false,
  })
  const proxyEvent = new Proxy(event, {
    get(target, prop) {
      if (prop === 'target' || prop === 'currentTarget') {
        return targetGetter()
      }
      return Reflect.get(target, prop)
    },
  })
  return proxyEvent as ModelLoadEvent
}

function createLoadFailureEvent(
  targetGetter: () => SpatializedStatic3DElementRef,
): ModelLoadEvent {
  return createLoadEvent('modelloadfailed', targetGetter)
}

function createLoadSuccessEvent(
  targetGetter: () => SpatializedStatic3DElementRef,
): ModelLoadEvent {
  return createLoadEvent('modelloaded', targetGetter)
}

function collectSources(children: React.ReactNode): ModelSource[] {
  const sources: ModelSource[] = []
  Children.forEach(children, child => {
    if (
      isValidElement(child) &&
      (child as ReactElement<{ src?: string; type?: string }>).type === 'source'
    ) {
      const { src, type } = (
        child as ReactElement<{ src?: string; type?: string }>
      ).props
      if (src) {
        sources.push({ src: getAbsoluteURL(src), type })
      }
    }
  })
  return sources
}

type Static3DDomProxy = SpatializedStatic3DElementRef & {
  __spatializedElement?: SpatializedStatic3DElement
  __innerSpatializedElement?: () => SpatializedStatic3DElement | undefined
}

function getDomSpatializedStaticElement(
  domProxy: SpatializedStatic3DElementRef,
): SpatializedStatic3DElement | undefined {
  const proxy = domProxy as Static3DDomProxy
  // Nested standard branches expose the DOM/ref while the portal branch owns
  // the actual static 3D element, so resolve through either DOM binding.
  return proxy.__spatializedElement ?? proxy.__innerSpatializedElement?.()
}

function SpatializedContent(props: SpatializedStatic3DContentProps) {
  const {
    src,
    poster,
    children,
    spatializedElement,
    onLoad,
    onError,
    autoPlay,
    loop,
    loading = 'eager',
    stagemode = 'none',
    motion,
  } = props
  const portalInstanceObject = useContext(PortalInstanceContext)
  const wasVisible = useRef(false)

  const modelURL = useMemo(() => getAbsoluteURL(src), [src])
  const posterURL = useMemo(() => getAbsoluteURL(poster), [poster])
  const sources = useMemo(() => collectSources(children), [children])
  const sourcesKey = useMemo(() => JSON.stringify(sources), [sources])

  // Observe when model becomes visible and then stop until sources change
  useEffect(() => {
    const target = portalInstanceObject?.dom
    wasVisible.current = false
    if (loading !== 'lazy') {
      wasVisible.current = true
      return
    }
    if (!target) {
      return
    }
    if (typeof IntersectionObserver === 'undefined') {
      wasVisible.current = true
      spatializedElement.updateProperties({ loading: 'eager' })
      return
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        wasVisible.current = true
        observer.disconnect()
        spatializedElement.updateProperties({ loading: 'eager' })
      }
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [modelURL, sourcesKey, portalInstanceObject?.dom])

  useEffect(() => {
    if (loading !== 'lazy') wasVisible.current = true
    // If modelURL was previously set and now is undefined then a dummy
    // value needs to be sent to clear the old value
    // TODO: Can native side handle null instead of ''
    spatializedElement.updateProperties({
      modelURL: modelURL ?? (spatializedElement.modelUrl ? '' : modelURL),
      sources,
      autoplay: autoPlay,
      loop,
      posterURL: posterURL ?? '',
      loading: loading === 'lazy' && wasVisible.current ? 'eager' : loading,
      stagemode,
    })
  }, [modelURL, sourcesKey, autoPlay, loop, posterURL, loading, stagemode])

  useEffect(() => {
    const dom = portalInstanceObject?.dom
    if (onLoad && dom) {
      spatializedElement.onLoadCallback = () => {
        onLoad(
          createLoadSuccessEvent(() => dom as SpatializedStatic3DElementRef),
        )
      }
    } else {
      spatializedElement.onLoadCallback = undefined
    }
  }, [onLoad, portalInstanceObject?.dom])

  useEffect(() => {
    const dom = portalInstanceObject?.dom
    if (onError && dom) {
      spatializedElement.onLoadFailureCallback = () => {
        onError(
          createLoadFailureEvent(() => dom as SpatializedStatic3DElementRef),
        )
      }
    } else {
      spatializedElement.onLoadFailureCallback = undefined
    }
  }, [onError, portalInstanceObject?.dom])

  useEffect(() => {
    if (!motion || !spatializedElement) return
    motion.__setElement?.(spatializedElement)
    return () => {
      motion.__onUnbind?.()
      motion.__setElement?.(null as any)
    }
  }, [motion, spatializedElement])

  return <></>
}

function SpatializedStatic3DElementContainerBase(
  props: SpatializedStatic3DContainerProps,
  ref: ForwardedRef<SpatializedStatic3DElementRef>,
) {
  const { motion, ...containerProps } = props
  const spatializedContent = useMemo(() => {
    function ContentWithMotion(contentProps: SpatializedStatic3DContentProps) {
      return <SpatializedContent {...contentProps} motion={motion} />
    }
    return ContentWithMotion
  }, [motion])
  const promiseRef = useRef<Promise<SpatializedStatic3DElement> | null>(null)

  const createSpatializedElement = useCallback(() => {
    promiseRef.current = getSession()!.createSpatializedStatic3DElement(
      getAbsoluteURL(props.src),
      collectSources(props.children),
      props.loading === 'lazy' ? 'lazy' : 'eager',
    )
    return promiseRef.current
  }, [])
  const extraRefProps = useCallback(
    (domProxy: SpatializedStatic3DElementRef) => {
      return {
        get currentSrc(): string {
          const spatializedElement = getDomSpatializedStaticElement(domProxy)
          return spatializedElement?.currentSrc ?? ''
        },
        get ready(): Promise<ModelLoadEvent> {
          const spatializedElement = getDomSpatializedStaticElement(domProxy)
          const readySource = spatializedElement
            ? Promise.resolve(spatializedElement)
            : promiseRef.current
          if (!readySource) {
            return Promise.reject(createLoadFailureEvent(() => domProxy))
          }
          return readySource
            .then(element => element.ready)
            .then(success => {
              if (success) return createLoadSuccessEvent(() => domProxy)
              throw createLoadFailureEvent(() => domProxy)
            })
        },
        get entityTransform(): DOMMatrixReadOnly {
          const spatializedElement = getDomSpatializedStaticElement(domProxy)
          return spatializedElement?.entityTransform ?? new DOMMatrixReadOnly()
        },
        set entityTransform(value: DOMMatrixReadOnly) {
          const spatializedElement = getDomSpatializedStaticElement(domProxy)
          if (spatializedElement) {
            spatializedElement.entityTransform = value
          }
        },
        async play(): Promise<void> {
          const spatializedElement = getDomSpatializedStaticElement(domProxy)
          await spatializedElement?.play()
        },
        async pause(): Promise<void> {
          const spatializedElement = getDomSpatializedStaticElement(domProxy)
          await spatializedElement?.pause()
        },
        get paused(): boolean {
          const spatializedElement = getDomSpatializedStaticElement(domProxy)
          return spatializedElement?.paused ?? true
        },
        get duration(): number {
          const spatializedElement = getDomSpatializedStaticElement(domProxy)
          return spatializedElement?.duration ?? 0
        },
        get playbackRate(): number {
          const spatializedElement = getDomSpatializedStaticElement(domProxy)
          return spatializedElement?.playbackRate ?? 1
        },
        set playbackRate(value: number) {
          const spatializedElement = getDomSpatializedStaticElement(domProxy)
          if (spatializedElement) {
            spatializedElement.playbackRate = value
          }
        },
        get currentTime(): number {
          const spatializedElement = getDomSpatializedStaticElement(domProxy)
          return spatializedElement?.currentTime ?? 0
        },
        set currentTime(value: number) {
          const spatializedElement = getDomSpatializedStaticElement(domProxy)
          if (spatializedElement) {
            spatializedElement.currentTime = value
          }
        },
      }
    },
    [motion],
  )

  return (
    <SpatializedContainer<SpatializedStatic3DElementRef>
      ref={ref}
      component="div"
      createSpatializedElement={createSpatializedElement}
      spatializedContent={spatializedContent}
      extraRefProps={extraRefProps}
      {...containerProps}
    />
  )
}

export const SpatializedStatic3DElementContainer = forwardRef(
  SpatializedStatic3DElementContainerBase,
)
