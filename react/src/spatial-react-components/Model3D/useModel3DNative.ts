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
      )
      .then(() => {
        if (!isDestroyed) [onModel3DNativeReadyCb(model3DContainer)]
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
