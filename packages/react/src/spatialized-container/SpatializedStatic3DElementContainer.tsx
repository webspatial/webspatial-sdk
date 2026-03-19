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
import {
  PortalInstanceObject,
  PortalInstanceContext,
} from './context/PortalInstanceContext'

function getAbsoluteURL(url?: string) {
  if (!url) {
    return ''
  }
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
  const { src, children, spatializedElement, onLoad, onError, autoplay, loop } =
    props
  const spatializedStatic3DElement =
    spatializedElement as SpatializedStatic3DElement

  const portalInstanceObject: PortalInstanceObject = useContext(
    PortalInstanceContext,
  )!

  const currentSrc: string = useMemo(() => getAbsoluteURL(src), [src])
  const childSources = useMemo(() => collectSources(children), [children])

  const sources: ModelSource[] = useMemo(() => {
    const result: ModelSource[] = []
    if (currentSrc) {
      result.push({ src: currentSrc })
    }
    result.push(...childSources)
    return result
  }, [currentSrc, childSources])

  useEffect(() => {
    if (sources.length > 0) {
      spatializedStatic3DElement.updateProperties({
        modelURL: sources[0].src,
        sources,
        autoplay,
        loop,
      })
    }
  }, [JSON.stringify(sources), autoplay, loop])

  useEffect(() => {
    if (onLoad) {
      spatializedStatic3DElement.onLoadCallback = () => {
        onLoad(
          createLoadSuccessEvent(
            () => (portalInstanceObject.dom as any).__targetProxy,
          ),
        )
      }
    } else {
      spatializedStatic3DElement.onLoadCallback = undefined
    }
  }, [onLoad])

  useEffect(() => {
    if (onError) {
      spatializedStatic3DElement.onLoadFailureCallback = () => {
        onError(
          createLoadFailureEvent(
            () => (portalInstanceObject.dom as any).__targetProxy,
          ),
        )
      }
    } else {
      spatializedStatic3DElement.onLoadFailureCallback = undefined
    }
  }, [onError])

  return <></>
}

function SpatializedStatic3DElementContainerBase(
  props: SpatializedStatic3DContainerProps,
  ref: ForwardedRef<SpatializedStatic3DElementRef>,
) {
  const promiseRef = useRef<Promise<SpatializedStatic3DElement> | null>(null)

  const createSpatializedElement = useCallback(() => {
    const url = getAbsoluteURL(props.src)
    // TODO: Add sources to createSpatializedStatic3DElement
    promiseRef.current = getSession()!.createSpatializedStatic3DElement(url)
    return promiseRef.current
  }, [])
  const extraRefProps = useCallback(
    (domProxy: SpatializedStatic3DElementRef) => {
      let modelTransform = new DOMMatrixReadOnly()

      return {
        get currentSrc(): string {
          return getAbsoluteURL(props.src)
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
          const spatializedElement = (domProxy as any).__spatializedElement as
            | SpatializedStatic3DElement
            | undefined
          spatializedElement?.updateModelTransform(modelTransform)
        },
        async play(): Promise<void> {
          const spatializedElement = (domProxy as any).__spatializedElement as
            | SpatializedStatic3DElement
            | undefined
          await spatializedElement?.play()
        },
        async pause(): Promise<void> {
          const spatializedElement = (domProxy as any).__spatializedElement as
            | SpatializedStatic3DElement
            | undefined
          await spatializedElement?.pause()
        },
        get paused(): boolean {
          const spatializedElement = (domProxy as any).__spatializedElement as
            | SpatializedStatic3DElement
            | undefined
          return spatializedElement?.paused ?? true
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
