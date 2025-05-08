import React, { ForwardedRef, useContext, useEffect, useRef } from 'react'
import { CSSModel3DProps, ModelElementRef } from './types'
import { useHijackSpatialDivRef } from '../CSSSpatialDiv/useHijackSpatialDivRef'
import { Model3D } from './Model3D'
import { CSSProperties } from 'react'
import { SpatialReactContext } from '../SpatialReactComponent/SpatialReactContext'

export function renderCSSModel3DStandardInstance(
  spatialId: string,
  inProps: CSSModel3DProps,
  refIn: ModelElementRef,
) {
  const { style: inStyle = {}, ...props } = inProps
  const style: CSSProperties = {
    ...inStyle,
    transform: 'none',
    visibility: 'hidden',
  }

  // hijack SpatialDiv ref
  var cssParserRef = useRef<HTMLDivElement | null>(null)
  const ref = useHijackSpatialDivRef(
    refIn as ForwardedRef<HTMLDivElement>,
    cssParserRef,
  ) as ModelElementRef

  const rootSpatialReactContextObject = useContext(SpatialReactContext)!

  useEffect(() => {
    const onSubEvent = (dom: HTMLDivElement | null) => {
      cssParserRef.current = dom
    }
    rootSpatialReactContextObject.onSubDivEvent(spatialId, onSubEvent)

    return () => {
      rootSpatialReactContextObject.offSubDivEvent(spatialId)
    }
  }, [])

  return <Model3D style={style} {...props} ref={ref} visible={true} />
}
