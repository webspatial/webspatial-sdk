import { SpatialHelper } from '@xrsdk/runtime'
import type { SpatialEntity } from '@xrsdk/runtime'
import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from 'react'
import { getSession } from '../utils'

var runAsync = (fn: any) => {
  return fn()
}

interface SpatialViewProps extends React.HTMLAttributes<HTMLDivElement> {
  onViewLoad?: (viewEnt: SpatialEntity) => void
  onViewUnload?: () => void
}

export interface SpatialViewRef extends HTMLDivElement {
  getViewEntity: () => Promise<SpatialEntity | null>
}

const SpatialViewEl = forwardRef<SpatialViewRef, SpatialViewProps>(
  (props, ref) => {
    const divRef = useRef<HTMLDivElement>(null)
    const spatialEntity = useRef<SpatialEntity | null>(null)
    const activePromise = useRef<Promise<any> | null>(null)

    // Add function to get view entity from the spatial view
    useImperativeHandle(ref, () => ({
      ...divRef.current!,
      getViewEntity: async () => {
        if (activePromise.current) {
          await activePromise.current
        }
        return spatialEntity.current!
      },
    }))

    if (getSession() == null) {
      return (
        <div ref={divRef} {...props}>
          WebSpatial is not supported in this browser
        </div>
      )
    }
    useEffect(() => {
      if (__WEB__) return // not supported
      activePromise.current = runAsync(async () => {
        if (activePromise.current) {
          await activePromise.current
        }
        let sh = new SpatialHelper(getSession()!)
        let x = await sh.dom.attachSpatialView(divRef.current!)
        spatialEntity.current = x.entity

        if (props.onViewLoad) {
          props.onViewLoad(x.entity)
        }
      })
      return () => {
        if (__WEB__) return // not supported
        runAsync(async () => {
          await activePromise.current
          spatialEntity.current?.destroy()
          // Teardown
          if (props.onViewUnload) {
            props.onViewUnload()
          }
        })
      }
    }, [])

    // Remove props that cant be used on the div
    const { onViewLoad, onViewUnload, ...divProps } = props
    return <div ref={divRef} {...divProps} />
  },
)

/**
 * [Experimental] Allows embedding 3D dynamic content within the webpage
 */
export const SpatialView = SpatialViewEl
