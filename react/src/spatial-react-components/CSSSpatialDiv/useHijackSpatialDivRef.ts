import { BackgroundMaterialType } from '@xrsdk/runtime'
import { MutableRefObject, useCallback } from 'react'
import { SpatialReactComponentRef } from '../SpatialReactComponent/types'
import { SpatialCustomVars } from './const'
import { InjectClassName } from './injectClassStyle'

function makeOriginalKey(key: string) {
  return `__original_${key}`
}

export function useHijackSpatialDivRef(
  refIn: SpatialReactComponentRef,
  cssParserRef: MutableRefObject<HTMLElement | undefined>,
) {
  const ref = cssParserRef
  const spatialDivRef = useCallback(
    (domElement: HTMLElement) => {
      if (domElement && refIn) {
        const domStyle = domElement.style
        const domStyleProxy = new Proxy(domStyle, {
          get(target, prop: string) {
            if (
              typeof target[prop as keyof CSSStyleDeclaration] === 'function'
            ) {
              return function (this: any, ...args: any[]) {
                if (prop === 'setProperty') {
                  const [property, value] = args
                  if (property === SpatialCustomVars.backgroundMaterial) {
                    ref.current?.style.setProperty(
                      SpatialCustomVars.backgroundMaterial,
                      value as BackgroundMaterialType,
                    )
                  } else if (property === SpatialCustomVars.back) {
                    ref.current?.style.setProperty(
                      SpatialCustomVars.back,
                      value as string,
                    )
                  } else if (property === 'transform') {
                    ref.current?.style.setProperty(property, value as string)
                    return true
                  }
                } else if (prop === 'removeProperty') {
                  const [property] = args
                  if (
                    property === SpatialCustomVars.backgroundMaterial ||
                    property === SpatialCustomVars.back ||
                    property === 'transform'
                  ) {
                    ref.current?.style.removeProperty(property)
                  }
                } else if (prop === 'getPropertyValue') {
                  const [property] = args
                  if (property === 'transform') {
                    return ref.current?.style[property]
                  }
                }
                return (target[prop as keyof CSSStyleDeclaration] as Function)(
                  ...args,
                )
              }
            }

            if (prop === 'transform') {
              return ref.current?.style[prop]
            }

            return Reflect.get(target, prop)
          },
          set(target, property, value) {
            if (property === SpatialCustomVars.backgroundMaterial) {
              ref.current?.style.setProperty(
                SpatialCustomVars.backgroundMaterial,
                value as BackgroundMaterialType,
              )
            } else if (property === SpatialCustomVars.back) {
              ref.current?.style.setProperty(
                SpatialCustomVars.back,
                value as string,
              )
            } else if (property === 'transform') {
              ref.current?.style.setProperty(property, value as string)
              return true
            }
            return Reflect.set(target, property, value)
          },
        })

        // hijack classList
        const domClassList = domElement.classList
        const domClassMethodKeys: Array<
          'add' | 'remove' | 'toggle' | 'replace'
        > = ['add', 'remove', 'toggle', 'replace']
        domClassMethodKeys.forEach(key => {
          const hiddenKey = makeOriginalKey(key)
          const hiddenKeyExist = (domClassList as any)[hiddenKey] !== undefined
          const originalMethod = hiddenKeyExist
            ? (domClassList as any)[hiddenKey]
            : domClassList[key].bind(domClassList)

          ;(domClassList as any)[hiddenKey] = originalMethod

          domClassList[key] = function (this: any, ...args: any[]) {
            const result = (originalMethod as Function)(...args)
            if (ref.current) {
              // update CSSParser className
              ref.current.className =
                domElement.className + ' ' + InjectClassName
            }
            return result
          }
        })

        const proxyDomElement = new Proxy(domElement, {
          get(target, prop) {
            if (prop === 'style') {
              return domStyleProxy
            }

            if (typeof target[prop as keyof HTMLElement] === 'function') {
              return function (this: any, ...args: any[]) {
                return (target[prop as keyof HTMLElement] as Function)(...args)
              }
            }

            return Reflect.get(target, prop, target)
          },
          set(target, prop, value) {
            if (ref.current) {
              if (prop === 'className') {
                ref.current.className = value + ' ' + InjectClassName
              }
            }

            return Reflect.set(target, prop, value)
          },
        })

        if (typeof refIn === 'function') {
          refIn(proxyDomElement)
        } else {
          refIn.current = proxyDomElement
        }
      } else if (refIn) {
        if (typeof refIn === 'function') {
          refIn(null)
        } else {
          refIn.current = null
        }
      }
    },
    [refIn],
  )

  return spatialDivRef
}
