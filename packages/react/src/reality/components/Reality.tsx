import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { SpatializedContainer } from '../../spatialized-container/SpatializedContainer'
import { RealityContext, RealityContextValue } from '../context'
import { useInsideAttachment } from '../context/InsideAttachmentContext'
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
    const insideAttachment = useInsideAttachment()
    if (insideAttachment) {
      console.warn(
        '[WebSpatial] Reality cannot be used inside AttachmentAsset.',
      )
      return null
    }
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

    // Ref for deferred cleanup timer. React 18 StrictMode unmounts and
    // remounts synchronously in the same microtask. By deferring cleanup
    // to setTimeout(0), the remount cancels it before it fires. This
    // prevents destroying the native Reality (and all child entities/
    // attachments) during StrictMode's fake unmount/remount cycle.
    const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const cleanupReality = useCallback(() => {
      ctxRef.current?.attachmentRegistry.destroy()
      ctxRef.current?.resourceRegistry.destroy()
      ctxRef.current?.reality.destroy()
      ctxRef.current = null
      setIsReady(false)
    }, [])

    useEffect(() => {
      // Cancel any pending cleanup from StrictMode's fake unmount
      if (cleanupTimerRef.current !== null) {
        clearTimeout(cleanupTimerRef.current)
        cleanupTimerRef.current = null
      }

      return () => {
        creationId.current++
        // Defer cleanup so StrictMode's immediate remount can cancel it.
        // On real unmount, the timer fires and destroys everything.
        // On StrictMode fake unmount, the remount above clears the timer.
        cleanupTimerRef.current = setTimeout(() => {
          cleanupTimerRef.current = null
          cleanupReality()
        }, 0)
      }
    }, [cleanupReality])

    const createReality = useCallback(async () => {
      // If we already have a valid context (StrictMode remount),
      // return the existing reality instead of creating a new one.
      if (ctxRef.current) {
        return ctxRef.current.reality as SpatializedElement
      }

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

        ctxRef.current = {
          session,
          reality,
          resourceRegistry,
          attachmentRegistry,
        }
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
