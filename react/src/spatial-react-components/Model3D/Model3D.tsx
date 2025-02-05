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

export type Model3DComponentRef = ForwardedRef<HTMLDivElement>

export function Model3DComponent(
  props: Model3DProps,
  refIn: Model3DComponentRef,
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
  }, [
    theSpatialTransform.position.x,
    theSpatialTransform.position.y,
    theSpatialTransform.position.z,
    theSpatialTransform.rotation.x,
    theSpatialTransform.rotation.y,
    theSpatialTransform.rotation.z,
    theSpatialTransform.rotation.w,
    theSpatialTransform.scale.x,
    theSpatialTransform.scale.y,
    theSpatialTransform.scale.z,
  ])

  const onModel3DContainerReadyCb = useCallback(() => {
    if (model3DNativeRef.current && layoutInstanceRef.current) {
      model3DNativeRef.current.updateByDom(layoutInstanceRef.current, {
        spatialTransform: theSpatialTransform,
      })
    }
  }, [
    theSpatialTransform.position.x,
    theSpatialTransform.position.y,
    theSpatialTransform.position.z,
    theSpatialTransform.rotation.x,
    theSpatialTransform.rotation.y,
    theSpatialTransform.rotation.z,
    theSpatialTransform.rotation.w,
    theSpatialTransform.scale.x,
    theSpatialTransform.scale.y,
    theSpatialTransform.scale.z,
  ])

  const layoutInstanceRef = useDetectLayoutDomUpdated(onDomUpdated)
  const model3DNativeRef = useModel3DNative(modelUrl, onModel3DContainerReadyCb)

  useEffect(() => {
    if (model3DNativeRef.current) {
      model3DNativeRef.current.setVisible(visible)
    }
  }, [model3DNativeRef.current, visible])

  useEffect(() => {
    if (model3DNativeRef.current && layoutInstanceRef.current) {
      model3DNativeRef.current.updateByDom(layoutInstanceRef.current, {
        spatialTransform: theSpatialTransform,
      })
    }
  }, [
    theSpatialTransform.position.x,
    theSpatialTransform.position.y,
    theSpatialTransform.position.z,
    theSpatialTransform.rotation.x,
    theSpatialTransform.rotation.y,
    theSpatialTransform.rotation.z,
    theSpatialTransform.rotation.w,
    theSpatialTransform.scale.x,
    theSpatialTransform.scale.y,
    theSpatialTransform.scale.z,
  ])

  const layoutDomStyle: CSSProperties = {
    ...style,
    visibility: 'hidden',
    transform: '',
  }

  const proxyRef = new Proxy<typeof layoutInstanceRef>(layoutInstanceRef, {
    get(target, prop, receiver) {
      return Reflect.get(target, prop, receiver)
    },
    set(target, prop, value, receiver) {
      if (prop === 'current') {
        const domElement = value as HTMLDivElement
        if (refIn) {
          if (typeof refIn === 'function') {
            refIn(domElement)
          } else {
            refIn.current = domElement
          }
        }
      }
      return Reflect.set(target, prop, value, receiver)
    },
  })

  return <div className={className} style={layoutDomStyle} ref={proxyRef} />
}

export const Model3D = forwardRef(Model3DComponent)

Model3D.displayName = 'Model3D'
