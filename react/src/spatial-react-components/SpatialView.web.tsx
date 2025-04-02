import type { SpatialEntity } from '@webspatial/core-sdk'
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

    // Remove props that cant be used on the div
    const { onViewLoad, onViewUnload, ...divProps } = props
    return <div ref={divRef} {...divProps} />
  },
)

/**
 * [Experimental] Allows embedding 3D dynamic content within the webpage
 */
export const SpatialView = SpatialViewEl
