import {
  CSSProperties,
  ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import { useDetectLayoutDomUpdated } from './useDetectLayoutDomUpdated'
import { useModel3DNative } from './useModel3DNative'
import { PartialSpatialTransformType } from './types'
import { PopulatePartialSpatialTransformType } from './utils'
import {
  ModelDragEvent as SpatialModelDragEvent,
  Vec3,
} from '@webspatial/core-sdk'

export interface ModelEvent {
  target: ModelElement
}

export interface ModelDragEvent extends ModelEvent {
  eventType: 'dragstart' | 'dragend' | 'drag'
  translation3D: Vec3
  startLocation3D: Vec3
}

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

  onLoad?: (event: ModelEvent) => void

  onDragStart?: (dragEvent: ModelDragEvent) => void
  onDrag?: (dragEvent: ModelDragEvent) => void
  onDragEnd?: (dragEvent: ModelDragEvent) => void

  onTap?: (event: ModelEvent) => void
  onDoubleTap?: (event: ModelEvent) => void
  onLongPress?: (event: ModelEvent) => void
}

export interface ModelElement extends HTMLDivElement {
  ready: boolean
  currentSrc: string
}

export type ModelElementRef = ForwardedRef<ModelElement>

export function Model3DBase(props: Model3DProps, refIn: ModelElementRef) {
  const {
    className,
    style = {},
    modelUrl,
    visible,
    spatialTransform,
    contentMode = 'fit',
    resizable = true,
    aspectRatio = 0,
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

  const onDragStartCb = useCallback(
    (spatialDragEvent: SpatialModelDragEvent) => {
      if (onDragStart) {
        const dragEvent: ModelDragEvent = {
          ...spatialDragEvent,
          target: layoutInstanceRef.current! as ModelElement,
        }
        onDragStart(dragEvent)
      }
    },
    [onDragStart],
  )

  const onDragCb = useCallback(
    (spatialDragEvent: SpatialModelDragEvent) => {
      if (onDrag) {
        const dragEvent: ModelDragEvent = {
          ...spatialDragEvent,
          target: layoutInstanceRef.current! as ModelElement,
        }
        onDrag(dragEvent)
      }
    },
    [onDrag],
  )

  const onDragEndCb = useCallback(
    (spatialDragEvent: SpatialModelDragEvent) => {
      if (onDragEnd) {
        const dragEvent: ModelDragEvent = {
          ...spatialDragEvent,
          target: layoutInstanceRef.current! as ModelElement,
        }
        onDragEnd(dragEvent)
      }
    },
    [onDragEnd],
  )

  const onTapCb = useCallback(() => {
    if (onTap) {
      const event: ModelEvent = {
        target: layoutInstanceRef.current! as ModelElement,
      }
      onTap(event)
    }
  }, [onTap])

  const onDoubleTapCb = useCallback(() => {
    if (onDoubleTap) {
      const event: ModelEvent = {
        target: layoutInstanceRef.current! as ModelElement,
      }
      onDoubleTap(event)
    }
  }, [onDoubleTap])

  const onLongPressCb = useCallback(() => {
    if (onLongPress) {
      const event: ModelEvent = {
        target: layoutInstanceRef.current! as ModelElement,
      }
      onLongPress(event)
    }
  }, [onLongPress])

  const layoutInstanceRef = useDetectLayoutDomUpdated(onDomUpdated)
  const { model3DNativeRef, phase, failureReason } = useModel3DNative(
    modelUrl,
    onModel3DContainerReadyCb,

    {
      onDragStart: onDragStart ? onDragStartCb : undefined,
      onDrag: onDrag ? onDragCb : undefined,
      onDragEnd: onDragEnd ? onDragEndCb : undefined,
      onTap: onTap ? onTapCb : undefined,
      onDoubleTap: onDoubleTap ? onDoubleTapCb : undefined,
      onLongPress: onLongPress ? onLongPressCb : undefined,
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
      const modelElement = layoutInstanceRef.current! as ModelElement
      modelElement.ready = false
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

  const proxyRef = useMemo(
    () =>
      new Proxy<typeof layoutInstanceRef>(layoutInstanceRef, {
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
      }),
    [layoutInstanceRef, refIn],
  )

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
