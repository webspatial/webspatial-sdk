import React, { CSSProperties, forwardRef } from 'react'
import { Model3D, Model3DProps, Model3DComponentRef } from './Model3D'
import { useSpatialStyle } from '../CSSSpatialDiv/useSpatialStyle'
import { useHijackSpatialDivRef } from '../CSSSpatialDiv/useHijackSpatialDivRef'

export type CSSModel3DProps = Omit<Model3DProps, 'spatialTransform' | 'visible'>

export function CSSModel3DComponent(
  inProps: CSSModel3DProps,
  refIn: Model3DComponentRef,
) {
  const { className, style = {}, ...props } = inProps

  const cssParserDomStyle: CSSProperties = {
    ...style,
    width: 0,
    position: 'absolute',
  }

  const { ref: cssParserDomRef, spatialStyle, ready } = useSpatialStyle()

  // hijack SpatialDiv ref
  const ref = useHijackSpatialDivRef(refIn, cssParserDomRef)

  const spatialTransform = {
    position: spatialStyle.position,
    rotation: spatialStyle.rotation,
    scale: spatialStyle.scale,
  }
  const visible = spatialStyle.visible

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
          ref={ref}
          spatialTransform={spatialTransform}
          visible={visible}
          {...props}
        />
      )}
      <div
        className={className}
        style={cssParserDomStyle}
        ref={cssParserDomRef}
      />
    </>
  )
}

export const CSSModel3D = forwardRef(CSSModel3DComponent)

CSSModel3D.displayName = 'CSSModel3D'
