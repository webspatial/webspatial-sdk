import { BackgroundMaterialType } from '@xrsdk/runtime'
import { MutableRefObject, useCallback } from 'react'
import { SpatialReactComponentRef } from '../SpatialReactComponent/types'
import { SpatialCustomVars } from './const'
import { InjectClassName } from './injectClassStyle'
import { extractAndRemoveCustomProperties, joinToCSSText } from './utils'

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

            if (prop === 'visibility') {
              return ref.current?.style.visibility
            }

            if (prop === 'cssText') {
              // todo: concat target cssText with ref.current.style's spatialStyle like back/transform/visibility/zIndex/backgroundMaterial
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
            } else if (property === 'visibility') {
              ref.current?.style.setProperty(property, value as string)
              return true
            } else if (property === 'cssText') {
              // parse cssText, filter out spatialStyle like back/transform/visibility/zIndex/backgroundMaterial
              const toFilteredCSSProperties = [
                'transform',
                'visibility',
                SpatialCustomVars.back,
                SpatialCustomVars.backgroundMaterial,
              ]
              const { extractedValues, filteredCssText } =
                extractAndRemoveCustomProperties(
                  value as string,
                  toFilteredCSSProperties,
                )

              // update cssText for CSSParserDiv
              toFilteredCSSProperties.forEach(key => {
                // update cssText for CSSParserDiv according to extractedValues
                if (extractedValues[key]) {
                  ref.current?.style.setProperty(key, extractedValues[key])
                } else {
                  ref.current?.style.removeProperty(key)
                }
              })

              const appendedCSSText = joinToCSSText({
                transform: 'none',
                visibility: 'hidden',
              })

              // set cssText for spatialDiv
              return Reflect.set(
                target,
                property,
                [appendedCSSText, filteredCssText].join(';'),
              )
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

        const __getComputedStyle = (
          originalGetComputedStyle: any,
          pseudoElt: any,
        ) => {
          return originalGetComputedStyle(domElement, pseudoElt)
        }

        const proxyDomElement = new Proxy(domElement, {
          get(target, prop) {
            if (prop === 'style') {
              return domStyleProxy
            }

            if (prop === '__isSpatialDiv') {
              return true
            }

            if (prop === '__getComputedStyle') {
              return __getComputedStyle
            }

            if (typeof target[prop as keyof HTMLElement] === 'function') {
              return function (this: any, ...args: any[]) {
                if ('removeAttribute' === prop) {
                  const [property] = args
                  if (property === 'style') {
                    domStyleProxy.cssText = ''
                    return true
                  }
                }
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
              if (prop === 'style') {
                domStyleProxy.cssText = joinToCSSText(value)
                return true
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
