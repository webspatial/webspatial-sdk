import React, { useEffect, useRef } from 'react'
import { useRealityContext } from '../context'
type Props = {
  children?: React.ReactNode
  id: string // user id
  src: string // model url
}
export const ModelAsset: React.FC<Props> = ({ children, ...options }) => {
  const ctx = useRealityContext()
  // const materialRef = useRef<SpatialUnlitMaterial>()
  useEffect(() => {
    if (!ctx) return
    const { session, reality, resourceRegistry } = ctx
    const init = async () => {
      const modelAsset = session.createModelAsset({ url: options.src })
      resourceRegistry.add(options.id, modelAsset)
    }
    init()

    return () => {}
  }, [ctx])

  return null
}
