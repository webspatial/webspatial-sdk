import {
  ForwardedRef,
  forwardRef,
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
import { SpatializedStatic3DElement } from '@webspatial/core-sdk'
import {
  PortalInstanceObject,
  PortalInstanceContext,
} from './context/PortalInstanceContext'
import { WebSpatialRuntime } from '../webSpatialRuntime'

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

function SpatializedContent(props: SpatializedStatic3DContentProps) {
  const { src, spatializedElement, onLoad, onError, autoPlay, loop } = props
  const spatializedStatic3DElement =
    spatializedElement as SpatializedStatic3DElement

  const portalInstanceObject: PortalInstanceObject = useContext(
    PortalInstanceContext,
  )!

  const currentSrc: string = useMemo(() => getAbsoluteURL(src), [src])

  useEffect(() => {
    if (src) {
      spatializedStatic3DElement.updateProperties({
        modelURL: currentSrc,
        autoplay: autoPlay,
        loop,
      })
    }
  }, [currentSrc, autoPlay, loop])

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
    promiseRef.current = getSession()!.createSpatializedStatic3DElement(url)
    return promiseRef.current
  }, [])
  const extraRefProps = useCallback(
    (domProxy: SpatializedStatic3DElementRef) => {
      const { supports } = WebSpatialRuntime
      let modelTransform = new DOMMatrixReadOnly()
      const extras: Record<string, unknown> = {}

      if (supports('Model', ['currentSrc'])) {
        Object.defineProperty(extras, 'currentSrc', {
          enumerable: true,
          configurable: true,
          get(): string {
            return getAbsoluteURL(props.src)
          },
        })
      }
      if (supports('Model', ['ready'])) {
        Object.defineProperty(extras, 'ready', {
          enumerable: true,
          configurable: true,
          get(): Promise<ModelLoadEvent> {
            return promiseRef
              .current!.then(spatializedElement => spatializedElement.ready)
              .then(success => {
                if (success) return createLoadSuccessEvent(() => domProxy)
                throw createLoadFailureEvent(() => domProxy)
              })
          },
        })
      }
      if (supports('Model', ['entityTransform'])) {
        Object.defineProperty(extras, 'entityTransform', {
          enumerable: true,
          configurable: true,
          get(): DOMMatrixReadOnly {
            return modelTransform
          },
          set(value: DOMMatrixReadOnly) {
            modelTransform = value
            const spatializedElement = (domProxy as any)
              .__spatializedElement as SpatializedStatic3DElement | undefined
            spatializedElement?.updateModelTransform(modelTransform)
          },
        })
      }

      return extras
    },
    [props.src],
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
