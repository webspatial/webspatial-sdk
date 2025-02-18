import { useRef, useEffect, useState } from 'react'
import { Model3DNative } from './Model3DNative'
import { ModelDragEvent } from '@xrsdk/runtime'

export function useModel3DNative(
  modelUrl: string,
  onModel3DNativeReadyCb: (model3DNative: Model3DNative) => void,

  eventHandlers: {
    onDragStart?: (dragEvent: ModelDragEvent) => void
    onDrag?: (dragEvent: ModelDragEvent) => void
    onDragEnd?: (dragEvent: ModelDragEvent) => void
    onTap?: () => void
    onDoubleTap?: () => void
    onLongPress?: () => void
  },
) {
  let model3DNativeRef = useRef<Model3DNative | null>(null)

  const [phase, setPhase] = useState<'loading' | 'success' | 'failure'>(
    'loading',
  )
  const [failureReason, setFailureReason] = useState('')

  useEffect(() => {
    let isDestroyed = false

    const model3DContainer = new Model3DNative()

    model3DNativeRef.current = model3DContainer

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

        {
          onDragStart: (dragEvent: ModelDragEvent) => {
            eventHandlers.onDragStart?.(dragEvent)
          },
          onDrag: (dragEvent: ModelDragEvent) => {
            eventHandlers.onDrag?.(dragEvent)
          },
          onDragEnd: (dragEvent: ModelDragEvent) => {
            eventHandlers.onDragEnd?.(dragEvent)
          },
          onTap: () => {
            eventHandlers.onTap?.()
          },
          onDoubleTap: () => {
            eventHandlers.onDoubleTap?.()
          },
          onLongPress: () => {
            eventHandlers.onLongPress?.()
          },
        },
      )
      .then(() => {
        if (!isDestroyed) [onModel3DNativeReadyCb(model3DContainer)]
      })

    return () => {
      isDestroyed = true

      model3DContainer.destroy()

      model3DNativeRef.current = null
    }
  }, [modelUrl])

  return { model3DNativeRef, phase, failureReason }
}
