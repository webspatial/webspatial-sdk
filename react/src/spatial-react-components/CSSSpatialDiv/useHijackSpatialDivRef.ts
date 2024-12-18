import { BackgroundMaterialType } from '@xrsdk/runtime/dist'
import { MutableRefObject, useCallback } from 'react'
import { SpatialReactComponentRef } from '../SpatialReactComponent/types'
import { SpatialCustomVars } from './const'

export function useHijackSpatialDivRef(
  refIn: SpatialReactComponentRef,
  cssParserRef: MutableRefObject<HTMLElement | null>,
) {
  const ref = cssParserRef
  const spatialDivRef = useCallback(
    (domElement: HTMLElement) => {
      if (domElement && refIn) {
        const domStyle = domElement.style
        const domStyleProxy = new Proxy(domStyle, {
          get(target, prop: string, receiver) {
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

            return Reflect.get(target, prop, receiver)
          },
          set(target, property, value, receiver) {
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
            return Reflect.set(target, property, value, receiver)
          },
        })

        const proxyDomElement = new Proxy(domElement, {
          get(target, prop) {
            if (prop === 'style') {
              return domStyleProxy
            }

            return Reflect.get(target, prop, target)
          },
          set(target, prop, value) {
            if (prop === 'style') {
              // todo: set style
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
