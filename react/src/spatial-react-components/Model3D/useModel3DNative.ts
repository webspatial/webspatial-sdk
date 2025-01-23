import { useRef, useEffect } from 'react'
import { Model3DNative } from './Model3DNative'

export function useModel3DNative(
  modelUrl: string,
  onModel3DNativeReadyCb: (model3DNative: Model3DNative) => void,
) {
  let model3DNativeRef = useRef<Model3DNative | null>(null)

  useEffect(() => {
    let isDestroyed = false

    const model3DContainer = new Model3DNative()

    model3DNativeRef.current = model3DContainer

    model3DContainer.init(modelUrl).then(() => {
      if (!isDestroyed) [onModel3DNativeReadyCb(model3DContainer)]
    })

    return () => {
      isDestroyed = true

      model3DContainer.destroy()

      model3DNativeRef.current = null
    }
  }, [modelUrl])

  return model3DNativeRef
}
