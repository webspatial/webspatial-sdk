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
import { ModelSource, SpatializedStatic3DElement } from '@webspatial/core-sdk'
import {
  PortalInstanceObject,
  PortalInstanceContext,
} from './context/PortalInstanceContext'

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
      if (prop === 'target') {
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
  } = props

  const portalInstanceObject = useContext(PortalInstanceContext)!

  const modelURL = useMemo(() => getAbsoluteURL(src), [src])
  const posterURL = useMemo(() => getAbsoluteURL(poster), [poster])
  const sources = useMemo(() => collectSources(children), [children])

  useEffect(() => {
    // If modelURL was previously set and now is undefined then a dummy
    // value needs to be sent to clear the old value
    // TODO: Can native side handle null instead of ''
    spatializedElement.updateProperties({
      modelURL: modelURL ?? (spatializedElement.modelUrl ? '' : modelURL),
      sources,
      autoplay: autoPlay,
      loop,
      posterURL: posterURL ?? '',
    })
  }, [modelURL, JSON.stringify(sources), autoPlay, loop, posterURL])

  useEffect(() => {
    if (onLoad) {
      spatializedElement.onLoadCallback = () => {
        onLoad(
          createLoadSuccessEvent(
            () => (portalInstanceObject.dom as any).__targetProxy,
          ),
        )
      }
    } else {
      spatializedElement.onLoadCallback = undefined
    }
  }, [onLoad])

  useEffect(() => {
    if (onError) {
      spatializedElement.onLoadFailureCallback = () => {
        onError(
          createLoadFailureEvent(
            () => (portalInstanceObject.dom as any).__targetProxy,
          ),
        )
      }
    } else {
      spatializedElement.onLoadFailureCallback = undefined
    }
  }, [onError])

  return <></>
}

function SpatializedStatic3DElementContainerBase(
  props: SpatializedStatic3DContainerProps,
  ref: ForwardedRef<SpatializedStatic3DElementRef>,
) {
  const promiseRef = useRef<Promise<SpatializedStatic3DElement> | null>(null)
  const [spatializedElement, setSpatializedElement] =
    useState<SpatializedStatic3DElement>()

  const createSpatializedElement = useCallback(() => {
    const promise = getSession()!.createSpatializedStatic3DElement(
      getAbsoluteURL(props.src),
      collectSources(props.children),
    )
    promiseRef.current = promise
    promise.then(element => {
      if (promiseRef.current === promise) {
        setSpatializedElement(element)
      }
    })
    return promise
  }, [])
  const extraRefProps = useCallback(
    (domProxy: SpatializedStatic3DElementRef) => {
      let modelTransform = new DOMMatrixReadOnly()
      return {
        get currentSrc(): string {
          return spatializedElement?.currentSrc ?? ''
        },
        get ready(): Promise<ModelLoadEvent> {
          return promiseRef
            .current!.then(spatializedElement => spatializedElement.ready)
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
          spatializedElement?.updateModelTransform(modelTransform)
        },
        async play(): Promise<void> {
          await spatializedElement?.play()
        },
        async pause(): Promise<void> {
          await spatializedElement?.pause()
        },
        get paused(): boolean {
          return spatializedElement?.paused ?? true
        },
        get duration(): number {
          return spatializedElement?.duration ?? 0
        },
        get playbackRate(): number {
          return spatializedElement?.playbackRate ?? 1
        },
        set playbackRate(value: number) {
          if (spatializedElement) {
            spatializedElement.playbackRate = value
          }
        },
        get currentTime(): number {
          return spatializedElement?.currentTime ?? 0
        },
        set currentTime(value: number) {
          if (spatializedElement) {
            spatializedElement.currentTime = value
          }
        },
      }
    },
    [spatializedElement],
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
