import { ForwardedRef, useCallback, useEffect, useRef } from 'react'
import { SpatialCustomStyleVars, SpatializedElementRef } from '../types'
import { supports } from '@webspatial/core-sdk'
import { extractAndRemoveCustomProperties, joinToCSSText } from '../utils'

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
  /** Last value dispatched to `ref` (undefined = none yet); avoids duplicate null/proxy writes. */
  private lastOutgoingToRef: T | null | undefined = undefined
  private installedProperties: PropertyKey[] = []

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
    if (!dom) {
      this.disconnectStandardClassObserver()
      this.clearInstalledProperties()
      this.standardRawDom = null
      this.lastMirroredClassName = null
      this.domProxy = undefined
      this.updateDomProxyToRef()
      return
    }

    if (this.standardRawDom === dom && this.domProxy) {
      this.scheduleSyncTransformClassFromStandard()
      return
    }

    this.clearInstalledProperties()
    this.standardRawDom = dom
    this.domProxy = dom as SpatializedElementRef<T>
    this.installSpatialRefBehavior(dom as SpatializedElementRef<T>)

    this.updateDomProxyToRef()

    this.attachStandardClassObserver()
    this.scheduleSyncTransformClassFromStandard()
  }

  private clearInstalledProperties() {
    const dom = this.standardRawDom
    if (!dom) return
    for (const prop of this.installedProperties) {
      delete (dom as any)[prop]
    }
    this.installedProperties = []
  }

  private defineDomProperty(
    dom: HTMLElement,
    prop: PropertyKey,
    descriptor: PropertyDescriptor,
  ) {
    Object.defineProperty(dom, prop, {
      configurable: true,
      ...descriptor,
    })
    this.installedProperties.push(prop)
  }

  private installSpatialRefBehavior(dom: SpatializedElementRef<T>) {
    const self = this

    const rawStyle = dom.style
    const rawRemoveProperty = rawStyle.removeProperty.bind(rawStyle)
    const rawGetPropertyValue = rawStyle.getPropertyValue.bind(rawStyle)
    const rawRemoveAttribute = dom.removeAttribute.bind(dom)
    const spatialStyleProperties = ['visibility', 'transform']
    const styleProxy = new Proxy<CSSStyleDeclaration>(rawStyle, {
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
              const [property] = args

              if (spatialStyleProperties.includes(property)) {
                if (prop === 'setProperty') {
                  const [, kValue, priority] = args
                  self.transformVisibilityTaskContainerDom?.style.setProperty(
                    property,
                    kValue as string,
                    priority as string | undefined,
                  )
                } else if (prop === 'removeProperty') {
                  return self.transformVisibilityTaskContainerDom?.style.removeProperty(
                    property,
                  )
                } else if (prop === 'getPropertyValue') {
                  return self.transformVisibilityTaskContainerDom?.style.getPropertyValue(
                    property,
                  )
                }
                return undefined
              }
              return value.apply(this, args)
            }.bind(target)
          }
          return value.bind(target)
        }
        return value
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

        if (Object.values(SpatialCustomStyleVars).includes(prop as string)) {
          target.setProperty(prop as string, value as string)
          return true
        }
        if (prop === 'cssText') {
          // parse cssText, filter out spatialStyle like transform/visibility
          const { extractedValues, filteredCssText } =
            extractAndRemoveCustomProperties(
              value as string,
              spatialStyleProperties,
            )

          // update cssText for transformVisibilityTaskContainerDom
          spatialStyleProperties.forEach(key => {
            if (extractedValues[key]) {
              self.transformVisibilityTaskContainerDom?.style.setProperty(
                key,
                extractedValues[key],
              )
            } else {
              rawRemoveProperty(key)
            }
          })

          const appendedCSSText = joinToCSSText({
            transform: 'none',
            visibility: 'hidden',
          })

          return Reflect.set(
            target,
            prop,
            [appendedCSSText, filteredCssText].join(';'),
          )
        }
        return Reflect.set(target, prop, value)
      },
    })

    this.defineDomProperty(dom, 'style', {
      get() {
        return styleProxy
      },
      set(value) {
        styleProxy.cssText = String(value)
      },
    })

    this.defineDomProperty(dom, 'className', {
      get() {
        return dom.getAttribute('class') ?? ''
      },
      set(value) {
        let next = String(value)
        if (next && next.indexOf('xr-spatial-default') === -1) {
          next = `${next} xr-spatial-default`
        }
        dom.setAttribute('class', next)
        self.scheduleSyncTransformClassFromStandard()
      },
    })

    this.defineDomProperty(dom, 'removeAttribute', {
      value(property: string) {
        if (property === 'style') {
          rawStyle.cssText =
            'visibility: hidden; transition: none; transform: none;'
          self.transformVisibilityTaskContainerDom?.style.removeProperty(
            'visibility',
          )
          self.transformVisibilityTaskContainerDom?.style.removeProperty(
            'transform',
          )
          return
        }
        if (property === 'class') {
          dom.className = 'xr-spatial-default'
          return
        }
        return rawRemoveAttribute(property)
      },
    })

    if (supports('xrClientDepth')) {
      this.defineDomProperty(dom, 'xrClientDepth', {
        get() {
          return rawGetPropertyValue(SpatialCustomStyleVars.depth)
        },
      })
    }
    if (supports('xrOffsetBack')) {
      this.defineDomProperty(dom, 'xrOffsetBack', {
        get() {
          return rawGetPropertyValue(SpatialCustomStyleVars.back)
        },
      })
    }

    if (this.extraRefProps) {
      const extraProps = this.extraRefProps(dom)
      for (const prop of Object.keys(extraProps)) {
        this.defineDomProperty(dom, prop, {
          get() {
            return extraProps[prop]
          },
          set(value) {
            extraProps[prop] = value
          },
        })
      }
    }
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
    const next: T | null =
      this.domProxy && this.transformVisibilityTaskContainerDom
        ? this.domProxy
        : null
    if (this.lastOutgoingToRef === next) {
      return
    }
    this.lastOutgoingToRef = next
    if (next) {
      if (typeof ref === 'function') {
        ref(next)
      } else {
        ref.current = next
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
    if (this.ref === ref) {
      return
    }
    this.ref = ref
    this.lastOutgoingToRef = undefined
    this.updateDomProxyToRef()
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
