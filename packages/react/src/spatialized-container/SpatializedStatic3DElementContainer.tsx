/**
 * Backs the public `<Model />` component (see `../Model.tsx`).
 *
 * Layout, top to bottom:
 * - URL / `<source>` / load-event helpers
 * - `createElementHandle` — async lifecycle of the native element
 * - `createModelRefApi` — imperative surface installed on `ref.current`
 * - `useLazyLoadingPromotion` — visibility-gated lazy → eager promotion
 * - `SpatializedContent` — syncs props and callbacks to the native element
 * - `SpatializedStatic3DElementContainerBase` — wires everything into
 *   `SpatializedContainer`
 */
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
  useState,
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
  ModelLoadingMode,
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

/** Collects `<source src type>` children into model fallback sources. */
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

/**
 * Owns the async lifecycle of the native element for one container instance:
 * the latest creation promise, the resolved element, and `ready` reads that
 * happen before creation starts.
 */
function createElementHandle() {
  let element: SpatializedStatic3DElement | null = null
  let promise: Promise<SpatializedStatic3DElement> | null = null
  let preCreation: {
    promise: Promise<SpatializedStatic3DElement>
    resolve: (value: Promise<SpatializedStatic3DElement>) => void
  } | null = null

  return {
    /** Latest resolved element, if any. */
    get element() {
      return element
    },
    /** Resolves with the element; safe to call before creation starts. */
    whenCreated(): Promise<SpatializedStatic3DElement> {
      if (promise) return promise
      if (!preCreation) {
        let resolve!: (value: Promise<SpatializedStatic3DElement>) => void
        const pending = new Promise<SpatializedStatic3DElement>(r => {
          resolve = r
        })
        preCreation = { promise: pending, resolve }
      }
      return preCreation.promise
    },
    /** Adopts a new creation promise; older in-flight creations are ignored. */
    track(nextPromise: Promise<SpatializedStatic3DElement>) {
      promise = nextPromise
      preCreation?.resolve(nextPromise)
      nextPromise.then(nextElement => {
        if (promise === nextPromise) {
          element = nextElement
        }
      })
    },
  }
}

type ElementHandle = ReturnType<typeof createElementHandle>

/**
 * Imperative API installed on `ref.current` (via `extraRefProps`, see
 * `hooks/useDomProxy.ts`). Mirrors the HTML `<model>` element surface, backed
 * by the native element once it resolves; until then reads return inert
 * defaults and writes are dropped.
 */
function createModelRefApi(
  handle: ElementHandle,
  domProxy: SpatializedStatic3DElementRef,
) {
  let modelTransform = new DOMMatrixReadOnly()
  return {
    get currentSrc(): string {
      return handle.element?.currentSrc ?? ''
    },
    get ready(): Promise<ModelLoadEvent> {
      return handle
        .whenCreated()
        .then(element => element.ready)
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
      handle.element?.updateModelTransform(value)
    },
    async play(): Promise<void> {
      await handle.element?.play()
    },
    async pause(): Promise<void> {
      await handle.element?.pause()
    },
    get paused(): boolean {
      return handle.element?.paused ?? true
    },
    get duration(): number {
      return handle.element?.duration ?? 0
    },
    get playbackRate(): number {
      return handle.element?.playbackRate ?? 1
    },
    set playbackRate(value: number) {
      if (handle.element) {
        handle.element.playbackRate = value
      }
    },
    get currentTime(): number {
      return handle.element?.currentTime ?? 0
    },
    set currentTime(value: number) {
      if (handle.element) {
        handle.element.currentTime = value
      }
    },
  }
}

/**
 * Tracks whether the current asset (model URL + sources) has been on screen
 * and promotes a lazy element to eager on first intersection. Returns the
 * loading mode to send with property updates.
 *
 * Semantics (pinned by SpatializedStatic3DElementContainer.test.tsx):
 * - Once an asset has been seen — or was ever loaded eagerly — it stays
 *   promoted, so switching eager → lazy keeps eager.
 * - A new asset must re-earn visibility before promotion.
 * - Never promote while the portal dom is missing (frame sync pending); the
 *   observer attaches once the dom appears.
 */
function useLazyLoadingPromotion(
  spatializedElement: SpatializedStatic3DElement,
  loading: ModelLoadingMode,
  assetKey: string,
  portalDom: HTMLElement | undefined,
): () => ModelLoadingMode {
  const wasVisible = useRef(false)

  // `loading` is deliberately not a dependency: only an asset change resets.
  useEffect(() => {
    wasVisible.current = false
  }, [assetKey])

  useEffect(() => {
    if (loading !== 'lazy') {
      wasVisible.current = true
      return
    }
    if (wasVisible.current || !portalDom) {
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
  }, [assetKey, loading, portalDom, spatializedElement])

  return useCallback(
    () => (loading === 'lazy' && !wasVisible.current ? 'lazy' : 'eager'),
    [loading],
  )
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
  // Prefer the prop wired by PortalSpatializedContainer; fall back to context.
  const portalInstanceFromContext = useContext(PortalInstanceContext)
  const portalDom = (props.portalInstanceObject ?? portalInstanceFromContext)
    ?.dom

  const posterURL = useMemo(() => getAbsoluteURL(poster), [poster])
  // assetKey identifies the model asset; effects depend on it to react to
  // asset changes without resending identical source arrays.
  const { modelURL, sources, assetKey } = useMemo(() => {
    const modelURL = getAbsoluteURL(src)
    const sources = collectSources(children)
    return { modelURL, sources, assetKey: JSON.stringify([modelURL, sources]) }
  }, [src, children])

  const getEffectiveLoading = useLazyLoadingPromotion(
    spatializedElement,
    loading,
    assetKey,
    portalDom,
  )

  // Sync model properties to the native element. portalDom is deliberately
  // not a dependency: frame sync must not resend properties.
  useEffect(() => {
    // Native cannot clear via null/undefined; send '' to clear a previously
    // set URL, otherwise leave undefined so the update is skipped.
    // TODO: Can native side handle null instead of ''
    const clearedModelURL = spatializedElement.modelUrl ? '' : undefined
    spatializedElement.updateProperties({
      modelURL: modelURL ?? clearedModelURL,
      sources,
      autoplay: autoPlay,
      loop,
      posterURL: posterURL ?? '',
      loading: getEffectiveLoading(),
    })
  }, [
    assetKey,
    autoPlay,
    loop,
    posterURL,
    getEffectiveLoading,
    spatializedElement,
  ])

  // Forward native load callbacks to the React props, targeting ref.current.
  useEffect(() => {
    const target = portalDom as SpatializedStatic3DElementRef | undefined
    spatializedElement.onLoadCallback =
      onLoad && target
        ? () => onLoad(createLoadSuccessEvent(() => target))
        : undefined
    spatializedElement.onLoadFailureCallback =
      onError && target
        ? () => onError(createLoadFailureEvent(() => target))
        : undefined
  }, [onLoad, onError, portalDom, spatializedElement])

  return null
}

function SpatializedStatic3DElementContainerBase(
  props: SpatializedStatic3DContainerProps,
  ref: ForwardedRef<SpatializedStatic3DElementRef>,
) {
  const [elementHandle] = useState(createElementHandle)

  // Reading props through a ref keeps createSpatializedElement's identity
  // stable (it is an effect dependency in useSpatializedElement — HMR
  // invariant) while creation always uses current props.
  const latestPropsRef = useRef(props)
  latestPropsRef.current = props

  const createSpatializedElement = useCallback(() => {
    const { src, children, loading } = latestPropsRef.current
    const promise = getSession()!.createSpatializedStatic3DElement(
      getAbsoluteURL(src),
      collectSources(children),
      loading === 'lazy' ? 'lazy' : 'eager',
    )
    elementHandle.track(promise)
    return promise
  }, [elementHandle])

  const extraRefProps = useCallback(
    (domProxy: SpatializedStatic3DElementRef) =>
      createModelRefApi(elementHandle, domProxy),
    [elementHandle],
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
