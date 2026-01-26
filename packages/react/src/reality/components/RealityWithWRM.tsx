import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { SpatializedContainer } from '../../spatialized-container/SpatializedContainer'
import { RealityContext, RealityContextValue } from '../context'
import { getSession } from '../../utils/getSession'
import { ResourceRegistry } from '../utils'
import {
  RealityProps,
  SpatializedElementRef,
} from '../../spatialized-container/types'
import { SpatializedElement, SpatialSession } from '@webspatial/core-sdk'
import {
  WRMProvider,
  useWRMStats,
  WRMDevPanel,
  WRMDevToggle,
  useWRMResources,
} from '../../wrm'

const RealityContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const stats = useWRMStats()
  const resources = useWRMResources()
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false)

  return (
    <>
      {children}
      <WRMDevToggle
        isOpen={isDevPanelOpen}
        onToggle={() => setIsDevPanelOpen(!isDevPanelOpen)}
        stats={stats}
      />
      <WRMDevPanel
        isOpen={isDevPanelOpen}
        onClose={() => setIsDevPanelOpen(false)}
        stats={stats}
        resources={resources}
      />
    </>
  )
}

export const RealityWithWRM = forwardRef<SpatializedElementRef, RealityProps>(
  function RealityBase({ children, ...props }, ref) {
    const ctxRef = useRef<RealityContextValue | null>(null)
    const [session, setSession] = useState<SpatialSession | null>(null)
    const [isReady, setIsReady] = useState(false)
    const creationId = useRef(0)

    const cleanupReality = useCallback(() => {
      ctxRef.current?.resourceRegistry.destroy()
      ctxRef.current?.reality.destroy()
      ctxRef.current = null
      setIsReady(false)
    }, [])

    useEffect(() => {
      return () => {
        creationId.current++
        cleanupReality()
      }
    }, [cleanupReality])

    useEffect(() => {
      try {
        const s = getSession()
        setSession(s)
      } catch (e) {
        console.error(e)
      }
    }, [])

    const createReality = useCallback(async () => {
      const id = ++creationId.current
      const resourceRegistry = new ResourceRegistry()

      if (!session) {
        return null
      }

      const reality = await session.createSpatializedDynamic3DElement()
      const isCancelled = () => id !== creationId.current

      if (isCancelled()) {
        resourceRegistry.destroy()
        reality.destroy()
        return null
      }

      try {
        const result = await session
          .getSpatialScene()
          .addSpatializedElement(reality)

        if (!result.success || isCancelled()) {
          resourceRegistry.destroy()
          reality.destroy()
          return null
        }

        cleanupReality()

        ctxRef.current = { session, reality, resourceRegistry }
        setIsReady(true)
        return reality as SpatializedElement
      } catch (err) {
        console.error('[createReality] failed', err)
        resourceRegistry.destroy()
        reality.destroy()
        return null
      }
    }, [session, cleanupReality])

    const content = useCallback(() => <></>, [])

    if (!session) {
      return null
    }

    return (
      <WRMProvider session={session}>
        <RealityContext.Provider value={ctxRef.current}>
          <SpatializedContainer<SpatializedElementRef>
            component="div"
            ref={ref}
            // @ts-ignore
            createSpatializedElement={createReality}
            spatializedContent={content}
            {...props}
          />
          {isReady && <RealityContent>{children}</RealityContent>}
        </RealityContext.Provider>
      </WRMProvider>
    )
  },
)
