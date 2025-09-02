import { ForwardedRef, useCallback, useEffect, useRef } from 'react'
import { SpatialCustomStyleVars, SpatializedElementRef } from '../types'

class SpatialContainerRefProxy {
  private transformVisibilityTaskContainerDom: HTMLElement | null = null
  private ref: ForwardedRef<SpatializedElementRef>
  private domProxy?: SpatializedElementRef | null

  constructor(ref: ForwardedRef<SpatializedElementRef>) {
    this.ref = ref
  }

  updateStandardSpatializedContainerDom(dom: HTMLElement | null) {
    if (dom) {
      const domProxy = new Proxy<SpatializedElementRef>(
        dom as SpatializedElementRef,
        {
          get(target, prop) {
            if (prop === '__raw') {
              return target
            }
            if (prop === 'clientDepth') {
              return target.style.getPropertyValue(SpatialCustomStyleVars.depth)
            }
            if (prop === 'offsetBack') {
              return target.style.getPropertyValue(SpatialCustomStyleVars.back)
            }
            if (prop === 'getBoundingClientRect') {
              // todo:
              return target.style.getPropertyValue(SpatialCustomStyleVars.back)
            }
            const value = Reflect.get(target, prop)
            if (typeof value === 'function') {
              return value.bind(target)
            }
            return value
          },
          set(target, prop, value) {
            console.warn(`can't set property!`)
            return false
          },
        },
      )
      this.domProxy = domProxy
      this.updateDomProxyToRef()
    }
  }

  updateTransformVisibilityTaskContainerDom(dom: HTMLElement | null) {
    this.transformVisibilityTaskContainerDom = dom
    this.updateDomProxyToRef()
  }

  private updateDomProxyToRef() {
    const ref = this.ref
    if (!ref) {
      return
    }
    if (this.domProxy && this.transformVisibilityTaskContainerDom) {
      if (typeof ref === 'function') {
        ref(this.domProxy)
      } else {
        ref.current = this.domProxy
      }
    } else {
      if (typeof ref === 'function') {
        ref(null)
      } else {
        ref.current = null
      }
    }
  }

  updateRef(ref: ForwardedRef<SpatializedElementRef>) {
    this.ref = ref
  }
}

export function useDomProxy(ref: ForwardedRef<SpatializedElementRef>) {
  const spatialContainerRefProxy = useRef<SpatialContainerRefProxy>(
    new SpatialContainerRefProxy(ref),
  )

  useEffect(() => {
    spatialContainerRefProxy.current.updateRef(ref)
  }, [ref])

  const transformVisibilityTaskContainerCallback = useCallback(
    (el: HTMLElement | null) => {
      spatialContainerRefProxy.current.updateTransformVisibilityTaskContainerDom(
        el,
      )
    },
    [],
  )

  const standardSpatializedContainerCallback = useCallback(
    (el: HTMLElement | null) => {
      spatialContainerRefProxy.current.updateStandardSpatializedContainerDom(el)
    },
    [],
  )

  return {
    transformVisibilityTaskContainerCallback,
    standardSpatializedContainerCallback,
  }
}
