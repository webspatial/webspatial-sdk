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
import { ModelDragEvent } from '@xrsdk/runtime'

export interface Model3DProps {
  spatialTransform?: PartialSpatialTransformType
  modelUrl: string
  visible: boolean
  contentMode?: 'fill' | 'fit'
  resizable?: boolean
  aspectRatio?: number
  className?: string
  style?: CSSProperties | undefined

  // children will be rendered when failure
  children?: React.ReactNode

  onLoad?: (event: ModelLoadEvent) => void

  onDragStart?: (dragEvent: ModelDragEvent) => void
  onDrag?: (dragEvent: ModelDragEvent) => void
  onDragEnd?: (dragEvent: ModelDragEvent) => void

  onTap?: () => void
  onDoubleTap?: () => void
  onLongPress?: () => void
}

export interface ModelElement extends HTMLDivElement {
  ready: boolean
  currentSrc: string
}

export interface ModelLoadEvent {
  target: ModelElement
}

export type Model3DComponentRef = ForwardedRef<ModelElement>

export function Model3DBase(props: Model3DProps, refIn: Model3DComponentRef) {
  const {
    className,
    style = {},
    modelUrl,
    visible,
    spatialTransform,
    contentMode = 'fit',
    resizable = true,
    aspectRatio = 0,
    // onFailure,
    // onSuccess,
    onLoad,

    children,

    onDragStart,
    onDrag,
    onDragEnd,

    onTap,
    onDoubleTap,
    onLongPress,
  } = props

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
  const { model3DNativeRef, phase, failureReason } = useModel3DNative(
    modelUrl,
    onModel3DContainerReadyCb,

    {
      onDragStart,
      onDrag,
      onDragEnd,
      onTap,
      onDoubleTap,
      onLongPress,
    },
  )

  const onSuccess = useCallback(() => {
    ;(layoutInstanceRef.current! as ModelElement).ready = true
    if (onLoad) {
      onLoad({
        target: layoutInstanceRef.current! as ModelElement,
      })
    }
  }, [onLoad])

  const onFailure = useCallback(
    (_: string) => {
      ;(layoutInstanceRef.current! as ModelElement).ready = false
      if (onLoad) {
        onLoad({
          target: layoutInstanceRef.current! as ModelElement,
        })
      }
    },
    [onLoad],
  )

  useEffect(() => {
    if (phase === 'failure') {
      onFailure(failureReason)
    } else if (phase === 'success') {
      onSuccess()
    }
  }, [phase])

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

  useEffect(() => {
    if (model3DNativeRef.current) {
      model3DNativeRef.current.setContentMode(contentMode)
    }
  }, [model3DNativeRef.current, contentMode])

  useEffect(() => {
    if (model3DNativeRef.current) {
      model3DNativeRef.current.setResizable(resizable)
    }
  }, [model3DNativeRef.current, resizable])

  useEffect(() => {
    if (model3DNativeRef.current) {
      model3DNativeRef.current.setAspectRatio(aspectRatio)
    }
  }, [model3DNativeRef.current, aspectRatio])

  const layoutDomStyle: CSSProperties = {
    ...style,
    visibility: phase === 'failure' ? 'visible' : 'hidden',
    transform: '',
  }

  const proxyRef = new Proxy<typeof layoutInstanceRef>(layoutInstanceRef, {
    get(target, prop, receiver) {
      return Reflect.get(target, prop, receiver)
    },
    set(target, prop, value, receiver) {
      if (prop === 'current') {
        const domElement = value as ModelElement

        if (domElement) {
          domElement.ready = false
          domElement.currentSrc = modelUrl
        }

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

  useEffect(() => {
    return () => {
      if (layoutInstanceRef.current) {
        const modelElement = layoutInstanceRef.current as ModelElement
        modelElement.ready = false
        modelElement.currentSrc = modelUrl
      }
    }
  }, [modelUrl])

  return (
    <div className={className} style={layoutDomStyle} ref={proxyRef}>
      {phase === 'failure' && children}
    </div>
  )
}

export const Model3D = forwardRef(Model3DBase)

Model3D.displayName = 'Model3D'
