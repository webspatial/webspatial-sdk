import React, { forwardRef, useMemo } from 'react'
import { SpatializedContainer } from '../../spatialized-container/SpatializedContainer'
import { RealityContext, RealityContextValue } from '../context'
import { getSession } from '../../utils/getSession'
import { ResourceRegistry } from '../utils'
import { SpatializedElementRef } from '../../spatialized-container/types'

async function createRealitySpatializedElement() {
  const session = await getSession()
  if (!session) {
    throw new Error('getSession failed in Reality')
  }
  const reality = await session.createSpatializedDynamic3DElement()
  await session.getSpatialScene().addSpatializedElement(reality)
  return reality
}

type Props = {
  children?: React.ReactNode
} & React.ComponentPropsWithRef<'div'>

export const Reality = forwardRef<SpatializedElementRef, Props>(
  function RealityBase({ children, ...props }, ref) {
    const session = useMemo(() => getSession(), [])
    const resourceRegistry = useMemo(() => new ResourceRegistry(), [])

    React.useEffect(() => {
      return () => resourceRegistry.destroy()
    }, [resourceRegistry])

    return (
      <SpatializedContainer<SpatializedElementRef>
        component={'div'}
        ref={ref}
        createSpatializedElement={createRealitySpatializedElement}
        spatializedContent={({ spatializedElement }) => {
          // spatializedElement is reality
          const ctx: RealityContextValue = {
            session: session!,
            reality: spatializedElement,
            resourceRegistry,
          }

          return (
            <RealityContext.Provider value={ctx}>
              {children}
            </RealityContext.Provider>
          )
        }}
        {...props}
      />
    )
  },
)
