import { useRef, useEffect, useState } from 'react'
import { Model3DNative } from './Model3DNative'
import { ModelDragEvent, SpatialEntity } from '@webspatial/core-sdk'

export function useModel3DNative(
  modelUrl: string,
  parentEntity: SpatialEntity | undefined,
  eventHandlers: {
    onDragStart?: (dragEvent: ModelDragEvent) => void
    onDrag?: (dragEvent: ModelDragEvent) => void
    onDragEnd?: (dragEvent: ModelDragEvent) => void
    onTap?: () => void
    onDoubleTap?: () => void
    onLongPress?: () => void
  } = {},
  onModel3DNativeReadyCb?: (model3DNative: Model3DNative) => void,
) {
  let model3DNativeRef = useRef<Model3DNative | null>(null)

  const [phase, setPhase] = useState<'loading' | 'success' | 'failure'>(
    'loading',
  )
  const [failureReason, setFailureReason] = useState('')

  useEffect(() => {
    let isDestroyed = false

    const model3DContainer = new Model3DNative(parentEntity)

    model3DContainer
      .init(
        modelUrl,
        () => {
          setPhase('success')
        },
        (error: string) => {
          setPhase('failure')
          setFailureReason(error)
        },
      )
      .then(() => {
        if (!isDestroyed) {
          model3DNativeRef.current = model3DContainer
          if (onModel3DNativeReadyCb) {
            onModel3DNativeReadyCb(model3DContainer)
          }
        }
      })

    return () => {
      isDestroyed = true

      model3DContainer.destroy()

      model3DNativeRef.current = null

      setPhase('loading')
    }
  }, [modelUrl])

  useEffect(() => {
    if (model3DNativeRef.current) {
      model3DNativeRef.current.onDragStart = eventHandlers.onDragStart
    }
  }, [model3DNativeRef.current, eventHandlers.onDragStart])
  useEffect(() => {
    if (model3DNativeRef.current) {
      model3DNativeRef.current.onDrag = eventHandlers.onDrag
    }
  }, [model3DNativeRef.current, eventHandlers.onDrag])
  useEffect(() => {
    if (model3DNativeRef.current) {
      model3DNativeRef.current.onDragEnd = eventHandlers.onDragEnd
    }
  })
  useEffect(() => {
    if (model3DNativeRef.current) {
      model3DNativeRef.current.onTap = eventHandlers.onTap
    }
  }, [model3DNativeRef.current, eventHandlers.onTap])

  useEffect(() => {
    if (model3DNativeRef.current) {
      model3DNativeRef.current.onDoubleTap = eventHandlers.onDoubleTap
    }
  }, [model3DNativeRef.current, eventHandlers.onDoubleTap])
  useEffect(() => {
    if (model3DNativeRef.current) {
      model3DNativeRef.current.onLongPress = eventHandlers.onLongPress
    }
  }, [model3DNativeRef.current, eventHandlers.onLongPress])

  return { model3DNativeRef, phase, failureReason }
}
