import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { PortalInstanceObject } from '../../spatialized-container/context/PortalInstanceContext'
import { SpatializedContainer } from '../../spatialized-container/SpatializedContainer'
import { useBindSpatializedMotion } from '../../spatialized-container/motion/useBindSpatializedMotion'
import { RealityContext, RealityContextValue } from '../context'
import { useInsideAttachment } from '../context/InsideAttachmentContext'
import { getSession } from '../../utils/getSession'
import { ResourceRegistry } from '../utils'
import { AttachmentRegistry } from '../context/AttachmentContext'
import { SpatializedElementRef } from '../../spatialized-container/types'
import { SpatializedElement } from '@webspatial/core-sdk'
import type { SpatializedMotionBindingInternal } from '../../spatialized-container/motion/motionBindingTypes'
import { EntityEventHandler } from '../type'
import { useRealityEvents } from '../hooks'
import { markWebSpatialPrimitive } from '../../jsx/primitive-marker'

export type RealityProps = Omit<
  React.ComponentPropsWithRef<'div'>,
  'onSpatialContentReady'
> &
  EntityEventHandler & {
    /** Native root-transform motion on the Reality container (`SpatializedDynamic3DElement`). */
    'xr-animation'?: SpatializedMotionBindingInternal
  }

type RealityPortalInstanceBridgeProps = {
  /** The active portal instance backing the current Reality root host. */
  portalInstanceObject: PortalInstanceObject
  /** Updates the parent Reality component with the current portal instance. */
  onPortalInstanceChange: (
    portalInstanceObject: PortalInstanceObject | null,
  ) => void
}

/**
 * Keeps the parent Reality component synchronized with the current portal
 * instance so root-motion suppression can coordinate with portal DOM sync.
 *
 * @param props - Portal bridge registration callbacks.
 * @returns Null because the bridge only synchronizes lifecycle state.
 */
function RealityPortalInstanceBridge({
  portalInstanceObject,
  onPortalInstanceChange,
}: RealityPortalInstanceBridgeProps) {
  useEffect(() => {
    onPortalInstanceChange(portalInstanceObject)

    return () => {
      // Clear any active suppression when the portal instance is replaced.
      portalInstanceObject.setSuppressedFields(null)
      portalInstanceObject.setTerminalTransformOwner(null)
      onPortalInstanceChange(null)
    }
  }, [onPortalInstanceChange, portalInstanceObject])

  return null
}

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
      'xr-animation': xrAnimation,
      ...props
    } = inProps
    const ctxRef = useRef<RealityContextValue | null>(null)

    const creationId = useRef(0)

    const [isReady, setIsReady] = useState(false)
    const [portalInstanceObject, setPortalInstanceObject] =
      useState<PortalInstanceObject | null>(null)

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
      const session = getSession()
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

    const content = useCallback(
      ({
        portalInstanceObject: inPortalInstanceObject,
      }: {
        portalInstanceObject: PortalInstanceObject
      }) => (
        <RealityPortalInstanceBridge
          portalInstanceObject={inPortalInstanceObject}
          onPortalInstanceChange={setPortalInstanceObject}
        />
      ),
      [],
    )

    useRealityEvents({
      instance: ctxRef.current?.reality ?? null,
      onSpatialTap,
      onSpatialDragStart,
      onSpatialDrag,
      onSpatialDragEnd,
      onSpatialRotate,
      onSpatialRotateEnd,
      onSpatialMagnify,
      onSpatialMagnifyEnd,
    })

    useBindSpatializedMotion({
      binding: xrAnimation,
      element: isReady ? (ctxRef.current?.reality ?? null) : null,
      kind: 'dynamic3d',
      style: props.style,
      authoredProps: props as Record<string, unknown>,
      onSuppressedFieldsChange: suppressedFields => {
        portalInstanceObject?.setSuppressedFields(suppressedFields)
      },
      onMotionFieldMetadataChange: (field, metadata) => {
        portalInstanceObject?.setMotionFieldMetadata(field, metadata)
      },
    })

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
// Brand the real implementation too: the eager entry exports THIS `Reality`,
// and the JSX runtime must short-circuit it rather than wrapping it.
markWebSpatialPrimitive(Reality, 'Reality')
