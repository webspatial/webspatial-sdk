import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { SpatializedContainer } from '../../spatialized-container/SpatializedContainer'
import { RealityContext, RealityContextValue } from '../context'
import { getSession } from '../../utils/getSession'
import { ResourceRegistry } from '../utils'
import { SpatializedElementRef } from '../../spatialized-container/types'
import { SpatializedElement } from '@webspatial/core-sdk'

type Props = {
  children?: React.ReactNode
} & React.ComponentPropsWithRef<'div'>

export const Reality = forwardRef<SpatializedElementRef, Props>(
  function RealityBase({ children, ...props }, ref) {
    const ctxRef = useRef<RealityContextValue>(null)

    const isCancelled = useRef(false)

    const [isReady, setIsReady] = useState(false)
    useEffect(() => {
      isCancelled.current = false

      return () => {
        isCancelled.current = true
        ctxRef.current?.resourceRegistry.destroy()
        ctxRef.current?.reality.destroy()
        ctxRef.current = null
        setIsReady(false)
      }
    }, [])

    const createReality = useCallback(async () => {
      const resourceRegistry = new ResourceRegistry()
      const session = await getSession()!

      const reality = await session.createSpatializedDynamic3DElement()

      function cleanup() {
        resourceRegistry.destroy()
        reality.destroy()
        setIsReady(false)
      }

      if (isCancelled.current) {
        cleanup()
        return
      }

      const result = await session
        .getSpatialScene()
        .addSpatializedElement(reality)
      if (!result.success) {
        cleanup()
        return
      }
      ctxRef.current = { session, reality, resourceRegistry }
      setIsReady(true)
      return reality as SpatializedElement
    }, [])

    const content = useCallback(({ spatializedElement, ...rest }: any) => {
      return <></>
    }, [])

    return (
      <RealityContext.Provider value={ctxRef.current}>
        <SpatializedContainer<SpatializedElementRef>
          component={'div'}
          ref={ref}
          //@ts-ignore
          createSpatializedElement={createReality}
          spatializedContent={content}
          {...props}
        />
        {isReady && children}
      </RealityContext.Provider>
    )
  },
)
