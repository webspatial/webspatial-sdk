import {
  Children,
  ForwardedRef,
  forwardRef,
  isValidElement,
  ReactNode,
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
import type {
  ModelSource,
  SpatializedStatic3DElement,
} from '@webspatial/core-sdk'
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
  type: 'modelloaded' | 'modelloadfailed',
  targetGetter: () => SpatializedStatic3DElementRef,
): ModelLoadEvent {
  const event = new CustomEvent(type, {
    bubbles: false,
    cancelable: false,
  })
  // An own accessor shadows Event.prototype.target while `event` stays a real
  // CustomEvent, so native methods (stopPropagation, ...) keep working.
  Object.defineProperty(event, 'target', {
    get: targetGetter,
    configurable: true,
  })
  return event as ModelLoadEvent
}

const createLoadSuccessEvent = (
  targetGetter: () => SpatializedStatic3DElementRef,
) => createLoadEvent('modelloaded', targetGetter)

const createLoadFailureEvent = (
  targetGetter: () => SpatializedStatic3DElementRef,
) => createLoadEvent('modelloadfailed', targetGetter)

function collectSources(children: ReactNode): ModelSource[] {
  const sources: ModelSource[] = []
  Children.forEach(children, child => {
    if (
      !isValidElement<{ src?: string; type?: string }>(child) ||
      child.type !== 'source'
    ) {
      return
    }
    const { src, type } = child.props
    if (src) {
      sources.push({ src: getAbsoluteURL(src), type })
    }
  })
  return sources
}

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: Deferred<T>['resolve']
  const promise = new Promise<T>(r => {
    resolve = r
  })
  return { promise, resolve }
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
  } = props
  const portalInstanceFromContext = useContext(PortalInstanceContext)
  const portalInstanceObject =
    props.portalInstanceObject ?? portalInstanceFromContext
  const portalDom = portalInstanceObject?.dom

  const modelURL = useMemo(() => getAbsoluteURL(src), [src])
  const posterURL = useMemo(() => getAbsoluteURL(poster), [poster])
  const { sources, sourcesKey } = useMemo(() => {
    const collected = collectSources(children)
    return { sources: collected, sourcesKey: JSON.stringify(collected) }
  }, [children])

  // Whether the current model (URL + sources) has been on screen. Once seen,
  // lazy loading stays promoted to eager until the asset changes.
  const wasVisible = useRef(false)

  // A new asset must re-earn visibility before lazy promotion. `loading` is
  // deliberately not a dependency: switching eager -> lazy keeps eager.
  useEffect(() => {
    wasVisible.current = false
  }, [modelURL, sourcesKey])

  // Observe visibility while lazy; promote to eager on first intersection.
  useEffect(() => {
    if (loading !== 'lazy') {
      wasVisible.current = true
      return
    }
    if (wasVisible.current) {
      return
    }
    // Portal invariant: never promote to eager while the portal dom is
    // missing; wait for frame sync to re-run this effect via portalDom.
    if (!portalDom) {
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
    observer.observe(portalDom)
    return () => observer.disconnect()
  }, [modelURL, sourcesKey, loading, portalDom, spatializedElement])

  useEffect(() => {
    // Native cannot clear via null/undefined; send '' to clear a previously
    // set URL, otherwise leave undefined so the update is skipped.
    // TODO: Can native side handle null instead of ''
    const nextModelURL =
      modelURL !== undefined
        ? modelURL
        : spatializedElement.modelUrl
          ? ''
          : undefined
    spatializedElement.updateProperties({
      modelURL: nextModelURL,
      sources,
      autoplay: autoPlay,
      loop,
      posterURL: posterURL ?? '',
      loading: loading === 'lazy' && !wasVisible.current ? 'lazy' : 'eager',
    })
    // `sources` is represented by sourcesKey to skip identical arrays;
    // portalDom is deliberately not a dependency (no resend on frame sync).
  }, [
    modelURL,
    sourcesKey,
    autoPlay,
    loop,
    posterURL,
    loading,
    spatializedElement,
  ])

  useEffect(() => {
    const wrap = (
      handler: ((event: ModelLoadEvent) => void) | undefined,
      createEvent: (
        targetGetter: () => SpatializedStatic3DElementRef,
      ) => ModelLoadEvent,
    ) =>
      handler && portalDom
        ? () =>
            handler(
              createEvent(() => portalDom as SpatializedStatic3DElementRef),
            )
        : undefined
    spatializedElement.onLoadCallback = wrap(onLoad, createLoadSuccessEvent)
    spatializedElement.onLoadFailureCallback = wrap(
      onError,
      createLoadFailureEvent,
    )
  }, [onLoad, onError, portalDom, spatializedElement])

  return null
}

function SpatializedStatic3DElementContainerBase(
  props: SpatializedStatic3DContainerProps,
  ref: ForwardedRef<SpatializedStatic3DElementRef>,
) {
  // Latest-props ref keeps createSpatializedElement's identity stable (it is
  // an effect dependency in useSpatializedElement — HMR invariant) while the
  // element is always created from current props.
  const latestPropsRef = useRef(props)
  latestPropsRef.current = props

  const promiseRef = useRef<Promise<SpatializedStatic3DElement> | null>(null)
  const elementRef = useRef<SpatializedStatic3DElement | null>(null)
  // Settles `ready` reads that happen before the element creation effect runs.
  const pendingPromiseRef = useRef<Deferred<SpatializedStatic3DElement> | null>(
    null,
  )

  const createSpatializedElement = useCallback(() => {
    const { src, children, loading } = latestPropsRef.current
    const promise = getSession()!.createSpatializedStatic3DElement(
      getAbsoluteURL(src),
      collectSources(children),
      loading === 'lazy' ? 'lazy' : 'eager',
    )
    promiseRef.current = promise
    pendingPromiseRef.current?.resolve(promise)
    promise.then(element => {
      // Guard against an older in-flight creation overwriting a newer element
      if (promiseRef.current === promise) {
        elementRef.current = element
      }
    })
    return promise
  }, [])

  const extraRefProps = useCallback(
    (domProxy: SpatializedStatic3DElementRef) => {
      const getElementPromise = () => {
        if (promiseRef.current) return promiseRef.current
        pendingPromiseRef.current ??=
          createDeferred<SpatializedStatic3DElement>()
        return pendingPromiseRef.current.promise
      }
      let modelTransform = new DOMMatrixReadOnly()
      return {
        get currentSrc(): string {
          return elementRef.current?.currentSrc ?? ''
        },
        get ready(): Promise<ModelLoadEvent> {
          return getElementPromise()
            .then(spatializedElement => spatializedElement.ready)
            .then(success => {
              if (success) return createLoadSuccessEvent(() => domProxy)
              throw createLoadFailureEvent(() => domProxy)
            })
        },
        get entityTransform(): DOMMatrixReadOnly {
          return modelTransform
        },
        set entityTransform(value: DOMMatrixReadOnly) {
          modelTransform = value
          elementRef.current?.updateModelTransform(value)
        },
        async play(): Promise<void> {
          await elementRef.current?.play()
        },
        async pause(): Promise<void> {
          await elementRef.current?.pause()
        },
        get paused(): boolean {
          return elementRef.current?.paused ?? true
        },
        get duration(): number {
          return elementRef.current?.duration ?? 0
        },
        get playbackRate(): number {
          return elementRef.current?.playbackRate ?? 1
        },
        set playbackRate(value: number) {
          if (elementRef.current) {
            elementRef.current.playbackRate = value
          }
        },
        get currentTime(): number {
          return elementRef.current?.currentTime ?? 0
        },
        set currentTime(value: number) {
          if (elementRef.current) {
            elementRef.current.currentTime = value
          }
        },
      }
    },
    [],
  )

  return (
    <SpatializedContainer<SpatializedStatic3DElementRef>
      ref={ref}
      component="div"
      createSpatializedElement={createSpatializedElement}
      spatializedContent={SpatializedContent}
      extraRefProps={extraRefProps}
      {...props}
    />
  )
}

export const SpatializedStatic3DElementContainer = forwardRef(
  SpatializedStatic3DElementContainerBase,
)
