import {
  ForwardedRef,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  const { src, spatializedElement, onLoad, onError } = props
  const spatializedStatic3DElement =
    spatializedElement as SpatializedStatic3DElement

  const portalInstanceObject: PortalInstanceObject = useContext(
    PortalInstanceContext,
  )!

  const currentSrc: string = useMemo(() => getAbsoluteURL(src), [src])

  useEffect(() => {
    if (src) {
      spatializedStatic3DElement.updateProperties({ modelURL: currentSrc })
    }
  }, [currentSrc])

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

async function createSpatializedElement() {
  return getSession()!.createSpatializedStatic3DElement()
}

function SpatializedStatic3DElementContainerBase(
  props: SpatializedStatic3DContainerProps,
  ref: ForwardedRef<SpatializedStatic3DElementRef>,
) {
  const extraRefProps = useCallback(
    (domProxy: SpatializedStatic3DElementRef) => {
      let modelTransform = new DOMMatrixReadOnly()

      const rawDom = ((domProxy as any).__raw as any) || (domProxy as any)
      const WAIT_PROMISE_KEY = '__webspatial_wait_spatialized_static3d_element'
      const WAIT_RESOLVE_KEY =
        '__webspatial_wait_spatialized_static3d_element_resolve'
      const WAIT_CURRENT_KEY =
        '__webspatial_spatialized_static3d_element_current'

      const getSpatializedElementSync =
        (): SpatializedStatic3DElement | null => {
          return (
            ((rawDom as any)
              .__spatializedElement as SpatializedStatic3DElement) ||
            ((domProxy as any)
              .__spatializedElement as SpatializedStatic3DElement) ||
            null
          )
        }

      const ensureSpatializedElement =
        (): Promise<SpatializedStatic3DElement> => {
          const existing = getSpatializedElementSync()
          if (existing) {
            return Promise.resolve(existing)
          }

          if ((rawDom as any)[WAIT_PROMISE_KEY]) {
            return (rawDom as any)[WAIT_PROMISE_KEY]
          }

          let resolveFn: ((el: SpatializedStatic3DElement) => void) | undefined
          const promise = new Promise<SpatializedStatic3DElement>(resolve => {
            resolveFn = resolve
          })
          ;(rawDom as any)[WAIT_PROMISE_KEY] = promise
          ;(rawDom as any)[WAIT_RESOLVE_KEY] = resolveFn

          const resolveIfReady = (el: any) => {
            if (!el) {
              return
            }
            ;(rawDom as any)[WAIT_CURRENT_KEY] = el
            const r = (rawDom as any)[WAIT_RESOLVE_KEY] as
              | ((e: SpatializedStatic3DElement) => void)
              | undefined
            if (r) {
              ;(rawDom as any)[WAIT_RESOLVE_KEY] = undefined
              r(el)
            }
          }

          try {
            const desc = Object.getOwnPropertyDescriptor(
              rawDom,
              '__spatializedElement',
            )
            if (!desc || desc.configurable) {
              // Use an accessor so that Object.assign(dom, { __spatializedElement }) triggers the setter.
              Object.defineProperty(rawDom, '__spatializedElement', {
                configurable: true,
                enumerable: true,
                get() {
                  return (rawDom as any)[WAIT_CURRENT_KEY]
                },
                set(v) {
                  resolveIfReady(v)
                },
              })
            }
          } catch {
            // Fallback to rAF polling (should be rare).
            const poll = () => {
              const el = getSpatializedElementSync()
              if (el) {
                resolveIfReady(el)
                return
              }
              requestAnimationFrame(poll)
            }
            requestAnimationFrame(poll)
          }

          return promise
        }

      return {
        get currentSrc() {
          return getAbsoluteURL(props.src)
        },
        get ready() {
          return ensureSpatializedElement()
            .then(el => el.ready)
            .then((success: boolean) => {
              if (success) {
                return createLoadSuccessEvent(() => domProxy)
              }
              throw createLoadFailureEvent(() => domProxy)
            })
        },
        get entityTransform() {
          return modelTransform
        },
        set entityTransform(value: DOMMatrixReadOnly) {
          modelTransform = value
          // Defer update until the spatialized element is attached.
          void ensureSpatializedElement().then(el => {
            el.updateModelTransform(modelTransform)
          })
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
