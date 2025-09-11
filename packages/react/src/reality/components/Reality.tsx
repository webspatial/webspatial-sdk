import React, { useEffect, useRef } from 'react'
import { RealityContext, RealityContextValue } from '../context'

import { getSession } from '../../utils/getSession'
import { ResourceRegistry } from '../utils'
type Props = {
  children?: React.ReactNode
}

export const Reality: React.FC<Props> = ({ children }) => {
  const [state, setState] = React.useState<RealityContextValue>(null)

  useEffect(() => {
    const init = async () => {
      const resourceRegistry = new ResourceRegistry()
      const session = await getSession()
      if (!session) {
        console.error('getSession failed')
        return
      }
      const reality = await session.createSpatializedDynamic3DElement()
      await session.getSpatialScene().addSpatializedElement(reality)

      setState({ session, reality, resourceRegistry })
    }
    init()
    return () => {
      state?.resourceRegistry.destroy()
    }
  }, [])

  if (!state) return null

  return (
    <RealityContext.Provider value={state}>{children}</RealityContext.Provider>
  )
}
