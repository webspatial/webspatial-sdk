import React, { useEffect, useRef, useState } from 'react'
import { RealityContext, RealityContextValue } from '../context'

import { getSession } from '../../utils/getSession'
import { ResourceRegistry } from '../utils'
type Props = {
  children?: React.ReactNode
}

export const Reality: React.FC<Props> = ({ children }) => {
  const ctxRef = useRef<RealityContextValue>(null)
  const [isReady, setIsReady] = useState(false)
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      const resourceRegistry = new ResourceRegistry()
      const session = await getSession()
      if (!session) {
        console.error('getSession failed')
        return
      }
      const reality = await session.createSpatializedDynamic3DElement()
      if (cancelled) {
        reality.destroy()
        return
      }
      await session.getSpatialScene().addSpatializedElement(reality)
      ctxRef.current = { session, reality, resourceRegistry }
      setIsReady(true)
    }
    init()
    return () => {
      cancelled = true
      ctxRef.current?.resourceRegistry.destroy()
      ctxRef.current?.reality.destroy()
    }
  }, [])

  if (!isReady) return null

  return (
    <RealityContext.Provider value={ctxRef.current}>
      {children}
    </RealityContext.Provider>
  )
}
