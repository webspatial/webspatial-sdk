import { ForwardedRef, useCallback, useEffect, useRef } from 'react'
import { SpatialCustomStyleVars, SpatializedElementRef } from '../types'
import { BackgroundMaterialType } from '@webspatial/core-sdk'
import { extractAndRemoveCustomProperties, joinToCSSText } from '../utils'

function makeOriginalKey(key: string) {
  return `__original_${key}`
}

export class SpatialContainerRefProxy<T extends SpatializedElementRef> {
  private transformVisibilityTaskContainerDom: HTMLElement | null = null
  /** Raw Standard host element (styled root). Used to mirror class onto the transform probe. */
  private standardRawDom: HTMLElement | null = null
  private standardClassObserver: MutationObserver | null = null
  /**
   * When set, Standard's DOM className is forwarded here so TransformVisibilityTaskContainer
   * can render it from React state (avoids React clobbering imperative class updates).
   */
  private mirrorClassNotify: ((className: string) => void) | null = null
  /** Last class string applied to the probe + used to skip redundant syncs. */
  private lastMirroredClassName: string | null = null
  /** Coalesce multiple class sync triggers in the same turn (Observer + classList, etc.). */
  private classSyncMicrotaskQueued = false
  private ref: ForwardedRef<SpatializedElementRef<T>>
  public domProxy?: T | null
  private styleProxy?: CSSStyleDeclaration

  // extre ref props, used to add extra props to ref
  private extraRefProps?: ((domProxy: T) => Record<string, unknown>) | undefined

  constructor(
    ref: ForwardedRef<SpatializedElementRef<T>>,
    extraRefProps?: (domProxy: T) => Record<string, unknown>,
  ) {
    this.ref = ref
    this.extraRefProps = extraRefProps
  }

  setMirrorClassNotify(fn: ((className: string) => void) | null) {
    this.mirrorClassNotify = fn
    if (fn && this.standardRawDom) {
      this.flushSyncTransformClassFromStandard(true)
    }
  }

  private disconnectStandardClassObserver() {
    this.standardClassObserver?.disconnect()
    this.standardClassObserver = null
  }

  private attachStandardClassObserver() {
    this.disconnectStandardClassObserver()
    if (!this.standardRawDom) {
      return
    }
    this.standardClassObserver = new MutationObserver(() => {
      this.scheduleSyncTransformClassFromStandard()
    })
    this.standardClassObserver.observe(this.standardRawDom, {
      attributes: true,
      attributeFilter: ['class'],
    })
  }

  /**
   * Merge multiple sync requests (e.g. classList hook + MutationObserver) into one microtask.
   */
  private scheduleSyncTransformClassFromStandard() {
    if (this.classSyncMicrotaskQueued) {
      return
    }
    this.classSyncMicrotaskQueued = true
    queueMicrotask(() => {
      this.classSyncMicrotaskQueued = false
      this.flushSyncTransformClassFromStandard(false)
    })
  }

  /**
   * Source of truth: Standard host DOM (incl. styled-components runtime class changes).
   * @param force when true, skip same-string short-circuit (e.g. mirror notify just registered).
   */
  private flushSyncTransformClassFromStandard(force: boolean) {
    if (!this.standardRawDom) {
      return
    }
    const name = this.standardRawDom.className
    const probe = this.transformVisibilityTaskContainerDom
    if (
      !force &&
      probe &&
      probe.className === name &&
      this.lastMirroredClassName === name
    ) {
      return
    }
    this.lastMirroredClassName = name
    if (probe) {
      probe.className = name
    }
    this.mirrorClassNotify?.(name)
  }

  updateStandardSpatializedContainerDom(dom: HTMLElement | null) {
    const self = this

    if (!dom) {
      this.disconnectStandardClassObserver()
      this.standardRawDom = null
      this.lastMirroredClassName = null
      this.domProxy = undefined
      this.styleProxy = undefined
      this.updateDomProxyToRef()
      return
    }

    this.standardRawDom = dom

    let cacheExtraRefProps: Record<string, unknown> | undefined
    const domProxy = new Proxy<SpatializedElementRef<T>>(
      dom as SpatializedElementRef<T>,
      {
        get(target, prop) {
          if (prop === '__raw') {
            return target
          }
          if (prop === 'xrClientDepth') {
            return target.style.getPropertyValue(SpatialCustomStyleVars.depth)
          }
          if (prop === 'xrOffsetBack') {
            return target.style.getPropertyValue(SpatialCustomStyleVars.back)
          }
          if (prop === 'style') {
            if (!self.styleProxy) {
              self.styleProxy = new Proxy<CSSStyleDeclaration>(target.style, {
                get(target, prop) {
                  if (prop === 'visibility' || prop === 'transform') {
                    return self.transformVisibilityTaskContainerDom?.style.getPropertyValue(
                      prop as string,
                    )
                  }
                  const value = Reflect.get(target, prop)
                  if (typeof value === 'function') {
                    if (
                      prop === 'setProperty' ||
                      prop === 'removeProperty' ||
                      prop === 'getPropertyValue'
                    ) {
                      return function (this: any, ...args: any[]) {
                        const validProperties = ['visibility', 'transform']
                        const [property] = args

                        if (validProperties.includes(property)) {
                          if (prop === 'setProperty') {
                            const [, kValue] = args
                            self.transformVisibilityTaskContainerDom?.style.setProperty(
                              property,
                              kValue as string,
                            )
                          } else if (prop === 'removeProperty') {
                            self.transformVisibilityTaskContainerDom?.style.removeProperty(
                              property,
                            )
                          } else if (prop === 'getPropertyValue') {
                            return self.transformVisibilityTaskContainerDom?.style.getPropertyValue(
                              property,
                            )
                          }
                        } else {
                          return value.apply(this, args)
                        }
                      }.bind(target)
                    } else {
                      return value.bind(target)
                    }
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
                    const toFilteredCSSProperties = ['transform', 'visibility']
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
              return extraProps[prop]
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
            if (value && String(value).indexOf('xr-spatial-default') === -1) {
              value = value + ' xr-spatial-default'
            }
          }

          // check extraRefProps setter
          if (typeof prop === 'string' && self.extraRefProps) {
            if (!cacheExtraRefProps) {
              cacheExtraRefProps = self.extraRefProps(domProxy)
            }
            cacheExtraRefProps[prop] = value
          }

          const ok = Reflect.set(target, prop, value)
          if (ok && prop === 'className') {
            self.scheduleSyncTransformClassFromStandard()
          }
          return ok
        },
      },
    )
    this.domProxy = domProxy

    // hijack classList
    const domClassList = dom.classList
    const domClassMethodKeys: Array<'add' | 'remove' | 'toggle' | 'replace'> = [
      'add',
      'remove',
      'toggle',
      'replace',
    ]
    domClassMethodKeys.forEach(key => {
      const hiddenKey = makeOriginalKey(key)
      const hiddenKeyExist = (domClassList as any)[hiddenKey] !== undefined
      const originalMethod = hiddenKeyExist
        ? (domClassList as any)[hiddenKey]
        : domClassList[key].bind(domClassList)

      ;(domClassList as any)[hiddenKey] = originalMethod

      domClassList[key] = function (this: any, ...args: any[]) {
        const result = (originalMethod as Function)(...args)
        self.scheduleSyncTransformClassFromStandard()

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

    this.attachStandardClassObserver()
    this.scheduleSyncTransformClassFromStandard()
  }

  updateTransformVisibilityTaskContainerDom(dom: HTMLElement | null) {
    this.transformVisibilityTaskContainerDom = dom
    if (!dom) {
      this.lastMirroredClassName = null
    }
    this.scheduleSyncTransformClassFromStandard()
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
export function hijackGetComputedStyle() {
  const rawFn = window.getComputedStyle.bind(window)
  window.getComputedStyle = (element, pseudoElt) => {
    const dom = (element as any).__raw

    if (dom) {
      return rawFn(dom, pseudoElt)
    }
    return rawFn(element, pseudoElt)
  }
}

export function useDomProxy<T extends SpatializedElementRef>(
  ref: ForwardedRef<T>,
  extraRefProps?: (domProxy: T) => Record<string, unknown>,
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
