import { ForwardedRef, useCallback, useEffect, useRef } from 'react'
import { SpatialCustomStyleVars, SpatializedElementRef } from '../types'
import { BackgroundMaterialType } from '@webspatial/core-sdk'
import { extractAndRemoveCustomProperties, joinToCSSText } from '../utils'

class SpatialContainerRefProxy {
  private transformVisibilityTaskContainerDom: HTMLElement | null = null
  private ref: ForwardedRef<SpatializedElementRef>
  private domProxy?: SpatializedElementRef | null
  private styleProxy?: CSSStyleDeclaration

  constructor(ref: ForwardedRef<SpatializedElementRef>) {
    this.ref = ref
  }

  updateStandardSpatializedContainerDom(dom: HTMLElement | null) {
    const self = this

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
            if (prop === 'style') {
              if (!self.styleProxy) {
                self.styleProxy = new Proxy<CSSStyleDeclaration>(target.style, {
                  get(target, prop) {
                    if (prop === 'visibility') {
                      return self.transformVisibilityTaskContainerDom?.style.getPropertyValue(
                        'visibility',
                      )
                    }
                    if (prop === 'transform') {
                      return self.transformVisibilityTaskContainerDom?.style.getPropertyValue(
                        'transform',
                      )
                    }
                    const value = Reflect.get(target, prop)
                    if (typeof value === 'function') {
                      return value.bind(target)
                    } else {
                      return value
                    }
                  },
                  set(target, prop, value) {
                    if (prop === 'visibility') {
                      self.transformVisibilityTaskContainerDom?.style.setProperty(
                        'visibility',
                        value,
                      )
                      return true
                    }
                    if (prop === 'transform') {
                      self.transformVisibilityTaskContainerDom?.style.setProperty(
                        'transform',
                        value,
                      )
                      return true
                    }

                    if (prop === SpatialCustomStyleVars.backgroundMaterial) {
                      target.setProperty(
                        SpatialCustomStyleVars.backgroundMaterial,
                        value as BackgroundMaterialType,
                      )
                    } else if (prop === SpatialCustomStyleVars.back) {
                      target.setProperty(
                        SpatialCustomStyleVars.back,
                        value as string,
                      )
                    } else if (prop === SpatialCustomStyleVars.xrZIndex) {
                      target.setProperty(
                        SpatialCustomStyleVars.xrZIndex,
                        value as string,
                      )
                    }  else if (prop === SpatialCustomStyleVars.depth) {
                      target.setProperty(
                        SpatialCustomStyleVars.depth,
                        value as string,
                      )
                    } else if (prop === 'cssText') {
                      // parse cssText, filter out spatialStyle like back/transform/visibility/xrZIndex/backgroundMaterial
                      const toFilteredCSSProperties = [
                        'transform',
                        'visibility',
                      ]
                      const { extractedValues, filteredCssText } =
                        extractAndRemoveCustomProperties(
                          value as string,
                          toFilteredCSSProperties,
                        )

                      // update cssText for transformVisibilityTaskContainerDom
                      toFilteredCSSProperties.forEach(key => {
                        // update cssText for transformVisibilityTaskContainerDom according to extractedValues
                        if (extractedValues[key]) {
                          self.transformVisibilityTaskContainerDom?.style.setProperty(
                            key,
                            extractedValues[key],
                          )
                        } else {
                          target.removeProperty(key)
                        }
                      })

                      const appendedCSSText = joinToCSSText({
                        transform: 'none',
                        visibility: 'hidden',
                      })

                      // set cssText for spatialDiv
                      return Reflect.set(
                        target,
                        prop,
                        [appendedCSSText, filteredCssText].join(';'),
                      )
                    }
                    return Reflect.set(target, prop, value)
                  },
                })
              }
              return self.styleProxy
            }
            const value = Reflect.get(target, prop)
            if (typeof value === 'function') {
              return value.bind(target)
            }
            return value
          },
          set(target, prop, value) {
            return Reflect.set(target, prop, value)
          },
        },
      )
      this.domProxy = domProxy
      // clear styleProxy
      this.styleProxy = undefined
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

//  hijack getComputedStyle to get raw dom
function hijackGetComputedStyle() {
  const rawFn = window.getComputedStyle.bind(window)
  window.getComputedStyle = (element, pseudoElt) => {
    const dom = (element as any).__raw

    if (dom) {
      return rawFn(dom, pseudoElt)
    }
    return rawFn(element, pseudoElt)
  }
}
hijackGetComputedStyle()

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
