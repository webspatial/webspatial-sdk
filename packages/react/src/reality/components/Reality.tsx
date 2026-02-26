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
import { AttachmentRegistry } from '../context/AttachmentContext'
import {
  RealityProps,
  SpatializedElementRef,
} from '../../spatialized-container/types'
import { SpatializedElement } from '@webspatial/core-sdk'

export const Reality = forwardRef<SpatializedElementRef, RealityProps>(
  function RealityBase({ children, ...inProps }, ref) {
    const {
      onSpatialTap,
      onSpatialDragStart,
      onSpatialDrag,
      onSpatialDragEnd,
      onSpatialRotate,
      onSpatialRotateEnd,
      onSpatialMagnify,
      onSpatialMagnifyEnd,
      ...props
    } = inProps
    const ctxRef = useRef<RealityContextValue | null>(null)

    const creationId = useRef(0)

    const [isReady, setIsReady] = useState(false)

    const cleanupReality = useCallback(() => {
      ctxRef.current?.attachmentRegistry.destroy()
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

    const createReality = useCallback(async () => {
      const id = ++creationId.current
      const resourceRegistry = new ResourceRegistry()
      const attachmentRegistry = new AttachmentRegistry()
      const session = await getSession()
      if (!session) {
        resourceRegistry.destroy()
        attachmentRegistry.destroy()
        return null
      }

      const reality = await session.createSpatializedDynamic3DElement()

      const isCancelled = () => id !== creationId.current

      if (isCancelled()) {
        resourceRegistry.destroy()
        attachmentRegistry.destroy()
        reality.destroy()
        return null
      }

      try {
        const result = await session
          .getSpatialScene()
          .addSpatializedElement(reality)

        if (!result.success || isCancelled()) {
          resourceRegistry.destroy()
          attachmentRegistry.destroy()
          reality.destroy()
          return null
        }

        cleanupReality()

        ctxRef.current = { session, reality, resourceRegistry, attachmentRegistry }
        setIsReady(true)
        return reality as SpatializedElement
      } catch (err) {
        console.error('[createReality] failed', err)
        resourceRegistry.destroy()
        attachmentRegistry.destroy()
        reality.destroy()
        return null
      }
    }, [cleanupReality])

    const content = useCallback(() => <></>, [])

    return (
      <RealityContext.Provider value={ctxRef.current}>
        <SpatializedContainer<SpatializedElementRef>
          component="div"
          ref={ref}
          // @ts-ignore
          createSpatializedElement={createReality}
          spatializedContent={content}
          {...props}
        />
        {isReady && children}
      </RealityContext.Provider>
    )
  },
)
