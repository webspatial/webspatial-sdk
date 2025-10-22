import { ForwardedRef, useCallback, useEffect, useRef } from 'react'
import { SpatialCustomStyleVars, SpatializedElementRef } from '../types'
import { BackgroundMaterialType } from '@webspatial/core-sdk'
import { extractAndRemoveCustomProperties, joinToCSSText } from '../utils'

function makeOriginalKey(key: string) {
  return `__original_${key}`
}

export class SpatialContainerRefProxy<T extends SpatializedElementRef> {
  private transformVisibilityTaskContainerDom: HTMLElement | null = null
  private ref: ForwardedRef<SpatializedElementRef<T>>
  public domProxy?: T | null
  private styleProxy?: CSSStyleDeclaration

  // extre ref props, used to add extra props to ref
  private extraRefProps?:
    | ((domProxy: T) => Record<string, () => any>)
    | undefined

  constructor(
    ref: ForwardedRef<SpatializedElementRef<T>>,
    extraRefProps?: (domProxy: T) => Record<string, () => any>,
  ) {
    this.ref = ref
    this.extraRefProps = extraRefProps
  }

  updateStandardSpatializedContainerDom(dom: HTMLElement | null) {
    const self = this

    if (dom) {
      let cacheExtraRefProps: Record<string, () => any> | undefined
      const domProxy = new Proxy<SpatializedElementRef<T>>(
        dom as SpatializedElementRef<T>,
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
              return (dom as any).__getBoundingClientRect
            }
            if (prop === 'getBoundingClientCube') {
              return (dom as any).__getBoundingClientCube
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
                    } else if (prop === SpatialCustomStyleVars.depth) {
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

            if (typeof prop === 'string' && self.extraRefProps) {
              if (!cacheExtraRefProps) {
                cacheExtraRefProps = self.extraRefProps(domProxy)
              }
              const extraProps = cacheExtraRefProps
              if (extraProps.hasOwnProperty(prop)) {
                return extraProps[prop]()
              }
            }
            const value = Reflect.get(target, prop)
            if (typeof value === 'function') {
              if ('removeAttribute' === prop) {
                return function (this: any, ...args: any[]) {
                  const [property] = args
                  if (property === 'style') {
                    dom.style.cssText =
                      'visibility: hidden; transition: none; transform: none;'
                    if (self.transformVisibilityTaskContainerDom) {
                      self.transformVisibilityTaskContainerDom.style.visibility =
                        ''
                      self.transformVisibilityTaskContainerDom.style.transform =
                        ''
                    }
                    return true
                  }
                  if (property === 'class') {
                    domProxy.className = 'xr-spatial-default'
                    return true
                  }
                }
              }

              return value.bind(target)
            }
            return value
          },
          set(target, prop, value) {
            if (prop === 'className') {
              if (value && value.indexOf('xr-spatial-default') === -1) {
                value = value + ' xr-spatial-default'
              }

              if (self.transformVisibilityTaskContainerDom) {
                self.transformVisibilityTaskContainerDom.className = value
              }
            }

            return Reflect.set(target, prop, value)
          },
        },
      )
      this.domProxy = domProxy

      // hijack classList
      const domClassList = dom.classList
      const domClassMethodKeys: Array<'add' | 'remove' | 'toggle' | 'replace'> =
        ['add', 'remove', 'toggle', 'replace']
      domClassMethodKeys.forEach(key => {
        const hiddenKey = makeOriginalKey(key)
        const hiddenKeyExist = (domClassList as any)[hiddenKey] !== undefined
        const originalMethod = hiddenKeyExist
          ? (domClassList as any)[hiddenKey]
          : domClassList[key].bind(domClassList)

        ;(domClassList as any)[hiddenKey] = originalMethod

        domClassList[key] = function (this: any, ...args: any[]) {
          const result = (originalMethod as Function)(...args)
          // update transformVisibilityTaskContainerDom className
          if (self.transformVisibilityTaskContainerDom) {
            self.transformVisibilityTaskContainerDom.className = dom.className
          }

          return result
        }
      })

      // clear styleProxy
      this.styleProxy = undefined
      this.updateDomProxyToRef()

      // assign domProxy to dom
      Object.assign(dom, {
        __targetProxy: domProxy,
      })
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

  updateRef(ref: ForwardedRef<SpatializedElementRef<T>>) {
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

export function useDomProxy<T extends SpatializedElementRef>(
  ref: ForwardedRef<T>,
  extraRefProps?: (domProxy: T) => Record<string, () => any>,
) {
  const spatialContainerRefProxy = useRef<SpatialContainerRefProxy<T>>(
    new SpatialContainerRefProxy<T>(ref, extraRefProps),
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
    spatialContainerRefProxy,
  }
}
