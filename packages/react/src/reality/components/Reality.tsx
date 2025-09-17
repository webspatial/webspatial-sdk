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

type Props = {
  children?: React.ReactNode
} & React.ComponentPropsWithRef<'div'>

export const Reality = forwardRef<SpatializedElementRef, Props>(
  function RealityBase({ children, ...props }, ref) {
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

    const getReality = useCallback(
      () => Promise.resolve(ctxRef.current?.reality!),
      [],
    )

    const content = useCallback(({ spatializedElement, ...rest }: any) => {
      return <></>
    }, [])

    if (!isReady) return null

    return (
      <RealityContext.Provider value={ctxRef.current}>
        <SpatializedContainer<SpatializedElementRef>
          component={'div'}
          ref={ref}
          createSpatializedElement={getReality}
          spatializedContent={content}
          {...props}
        />
        {children}
      </RealityContext.Provider>
    )
  },
)
