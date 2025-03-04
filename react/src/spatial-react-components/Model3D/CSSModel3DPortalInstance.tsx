import React, { useContext, useEffect } from 'react'
import { CSSModel3DProps } from './types'
import { Model3D } from './Model3D'
import { CSSProperties } from 'react'
import { SpatialReactContext } from '../SpatialReactComponent/SpatialReactContext'
import { useSpatialStyle } from '../CSSSpatialDiv/useSpatialStyle'

export function renderCSSModel3DPortalInstance(
  spatialId: string,
  inProps: CSSModel3DProps,
) {
  const { className, style = {}, ...props } = inProps

  const rootSpatialReactContextObject = useContext(SpatialReactContext)!

  const { ref, spatialStyle, ready } = useSpatialStyle()

  const spatialTransform = {
    position: spatialStyle.position,
    rotation: spatialStyle.rotation,
    scale: spatialStyle.scale,
  }
  const visible = spatialStyle.visible

  useEffect(() => {
    rootSpatialReactContextObject.notifySubDivEvent(spatialId, ref.current)
  }, [ref.current])

  const cssParserDomStyle: CSSProperties = {
    ...style,
    width: 0,
    height: 0,
  }

  const model3DStyle: CSSProperties = {
    ...style,
    transform: 'none',
  }

  return (
    <>
      {ready && (
        <Model3D
          className={className}
          style={model3DStyle}
          spatialTransform={spatialTransform}
          visible={visible}
          {...props}
        />
      )}
      <div className={className} style={cssParserDomStyle} ref={ref} />
    </>
  )
}
