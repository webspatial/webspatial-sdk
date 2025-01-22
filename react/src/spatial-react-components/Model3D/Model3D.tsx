import {
  CSSProperties,
  ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
} from 'react'
import { useDetectLayoutDomUpdated } from './useDetectLayoutDomUpdated'
import { useModel3DNative } from './useModel3DNative'
import { PartialSpatialTransformType } from './types'
import { PopulatePartialSpatialTransformType } from './utils'

export interface Model3DProps {
  spatialTransform?: PartialSpatialTransformType
  modelUrl: string
  visible: boolean

  className?: string
  style?: CSSProperties | undefined
}

export type Model3DComponentRef = ForwardedRef<typeof Model3DComponent>

export function Model3DComponent(
  props: Model3DProps,
  ref: Model3DComponentRef = null,
) {
  const { className, style = {}, modelUrl, visible, spatialTransform } = props

  const theSpatialTransform =
    PopulatePartialSpatialTransformType(spatialTransform)

  const onDomUpdated = useCallback(() => {
    if (model3DNativeRef.current && layoutInstanceRef.current) {
      const model3DNative = model3DNativeRef.current
      model3DNative.updateByDom(layoutInstanceRef.current, {
        spatialTransform: theSpatialTransform,
      })
    }
  }, [])

  const onModel3DContainerReadyCb = useCallback(() => {
    if (model3DNativeRef.current && layoutInstanceRef.current) {
      model3DNativeRef.current.updateByDom(layoutInstanceRef.current, {
        spatialTransform: theSpatialTransform,
      })
    }
  }, [])

  const layoutInstanceRef = useDetectLayoutDomUpdated(onDomUpdated)
  const model3DNativeRef = useModel3DNative(modelUrl, onModel3DContainerReadyCb)

  useEffect(() => {
    if (model3DNativeRef.current) {
      model3DNativeRef.current.setVisible(visible)
    }
  }, [model3DNativeRef.current, visible])

  const layoutDomStyle: CSSProperties = {
    ...style,
    visibility: 'hidden',
    transform: '',
  }

  console.log('dbg style', style, layoutDomStyle)

  return (
    <div className={className} style={layoutDomStyle} ref={layoutInstanceRef} />
  )
}

export const Model3D = forwardRef(Model3DComponent)

Model3D.displayName = 'Model3D'
