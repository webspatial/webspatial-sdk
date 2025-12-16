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
  if (url.startsWith('http') || url.startsWith('//')) {
    return url
  }
  return window.location.origin + url
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
  const { src, loading, autoplay, loop, spatializedElement, onLoad, onError } =
    props
  const spatializedStatic3DElement =
    spatializedElement as SpatializedStatic3DElement

  const portalInstanceObject: PortalInstanceObject = useContext(
    PortalInstanceContext,
  )!

  const currentSrc: string = useMemo(() => getAbsoluteURL(src), [src])

  useEffect(() => {
    let observer: IntersectionObserver | null = null
    let loaded = false
    const dom = portalInstanceObject.dom
    const loadNow = () => {
      if (!loaded && src) {
        loaded = true
        spatializedStatic3DElement.updateProperties({ modelURL: currentSrc })
      }
    }
    const mode = loading
    if (mode === 'lazy' && dom) {
      observer = new IntersectionObserver(
        entries => {
          const entry = entries[0]
          if (entry && entry.isIntersecting) {
            loadNow()
            if (observer) {
              observer.disconnect()
              observer = null
            }
          }
        },
        { root: null, rootMargin: '200px', threshold: 0 },
      )
      observer.observe(dom)
    } else {
      loadNow()
    }
    return () => {
      if (observer) {
        observer.disconnect()
      }
    }
  }, [currentSrc])

  useEffect(() => {
    if (loop !== undefined) {
      spatializedStatic3DElement.updateProperties({
        animationLoop: !!loop,
      } as any)
    }
  }, [loop])

  useEffect(() => {
    if (onLoad) {
      spatializedStatic3DElement.onLoadCallback = () => {
        if (autoplay) {
          spatializedStatic3DElement.updateProperties({
            animationPaused: false,
          } as any)
        }
        onLoad(
          createLoadSuccessEvent(
            () => (portalInstanceObject.dom as any).__targetProxy,
          ),
        )
      }
    } else {
      spatializedStatic3DElement.onLoadCallback = undefined
    }
  }, [onLoad, autoplay])

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
  const { stageMode } = props
  const extraRefProps = useCallback(
    (domProxy: SpatializedStatic3DElementRef) => {
      const modelTransform = new DOMMatrix()
      let needupdate = false
      const triggerUpdate = () => {
        const spatializedElement = (domProxy as any)
          .__spatializedElement as SpatializedStatic3DElement
        spatializedElement.updateModelTransform(modelTransform)
        needupdate = false
      }
      const domMatrixProxy = new Proxy(modelTransform, {
        get(target, prop, receiver) {
          const value = Reflect.get(target, prop, receiver)
          if (typeof value === 'function') {
            return function (...args: any[]) {
              requestAnimationFrame(triggerUpdate)
              return value.apply(target, args)
            }
          } else {
            return value
          }
        },
        set(target, prop, value) {
          const success = Reflect.set(target, prop, value)
          if (!needupdate) {
            needupdate = true
            requestAnimationFrame(triggerUpdate)
          }
          return success
        },
      })

      return {
        currentSrc: () => getAbsoluteURL(props.src),
        ready: () => {
          const spatializedElement = (domProxy as any)
            .__spatializedElement as SpatializedStatic3DElement

          const promise = spatializedElement.ready.then((success: boolean) => {
            if (success) {
              return createLoadSuccessEvent(() => domProxy)
            }
            throw createLoadFailureEvent(() => domProxy)
          })
          return promise
        },
        entityTransform: () => domMatrixProxy,
        play: () => {
          const spatializedElement = (domProxy as any)
            .__spatializedElement as SpatializedStatic3DElement
          spatializedElement.updateProperties({
            animationPaused: false,
          } as any)
        },
        pause: () => {
          const spatializedElement = (domProxy as any)
            .__spatializedElement as SpatializedStatic3DElement
          spatializedElement.updateProperties({
            animationPaused: true,
          } as any)
        },
        paused: () => (domProxy as any).paused ?? true,
        duration: () => (domProxy as any).duration ?? 0,
        currentTime: () => (domProxy as any).currentTime ?? 0,
        playbackRate: () => (domProxy as any).playbackRate ?? 1,
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
      {...(stageMode === 'orbit'
        ? {
            onSpatialDragStart: e => {
              const domProxy = e.currentTarget as any
              ;(domProxy as any).__orbitState = {
                yaw: 0,
                pitch: 0,
              }
            },
            onSpatialDrag: e => {
              const domProxy = e.currentTarget as any
              const state = (domProxy as any).__orbitState || {
                yaw: 0,
                pitch: 0,
              }
              const dx = e.detail.translation3D.x
              const dy = e.detail.translation3D.y
              const sensitivity = 30
              state.yaw += dx * sensitivity
              state.pitch = Math.max(
                -85,
                Math.min(85, state.pitch + dy * sensitivity),
              )
              const et: DOMMatrix = (domProxy as any).entityTransform
              et.rotateSelf(dy * sensitivity, dx * sensitivity, 0)
              ;(domProxy as any).__orbitState = state
            },
          }
        : {})}
      {...props}
    />
  )
}

export const SpatializedStatic3DElementContainer = forwardRef(
  SpatializedStatic3DElementContainerBase,
)
