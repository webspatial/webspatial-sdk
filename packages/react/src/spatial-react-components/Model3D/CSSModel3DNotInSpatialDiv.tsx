import { CSSProperties, ForwardedRef } from 'react'
import { Model3D } from './Model3D'
import { useSpatialStyle } from '../CSSSpatialDiv/useSpatialStyle'
import { useHijackSpatialDivRef } from '../CSSSpatialDiv/useHijackSpatialDivRef'
import { CSSModel3DProps, ModelElementRef } from './types'

export function renderCSSModel3DNotInSpatialDiv(
  inProps: CSSModel3DProps,
  refIn: ModelElementRef,
) {
  const { className, style = {}, ...props } = inProps

  const cssParserDomStyle: CSSProperties = {
    ...style,
    // width: 0,
    // height: 0,
    left: -10000,
    top: -10000,
    opacity: 0,
    pointerEvents: 'none',

    padding: 0,
    position: 'absolute',
  }

  const { ref: cssParserDomRef, spatialStyle, ready } = useSpatialStyle()

  // hijack SpatialDiv ref
  const ref = useHijackSpatialDivRef(
    refIn as ForwardedRef<HTMLDivElement>,
    cssParserDomRef,
  ) as ModelElementRef

  const spatialTransform = {
    position: spatialStyle.position,
    rotation: spatialStyle.rotation,
    scale: spatialStyle.scale,
  }
  const visible = spatialStyle.visible

  const model3DStyle: CSSProperties = {
    ...style,
    transform: spatialStyle.transformExist ? 'translateZ(0)' : 'none',
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
