import React, { forwardRef, useEffect, useRef, useState } from 'react'
import { Attachment } from '@webspatial/core-sdk'

import { useRealityContext, useParentContext } from '../context'
import { setOpenWindowStyle } from '../../utils/windowStyleSync'
import { useSyncHeadStyles } from '../../utils/useSyncHeadStyles'
import { EntityProps, EntityEventHandler } from '../type'
import {
  EntityRef,
  EntityRefShape,
  useEntityEvent,
  useEntityId,
  useEntityRef,
  useForceUpdate,
} from '../hooks'

let instanceCounter = 0

type AttachmentEntityProps = EntityProps &
  EntityEventHandler & {
    attachment: string
    size: { width: number; height: number }
  }

export const AttachmentEntity = forwardRef<
  EntityRefShape,
  AttachmentEntityProps
>(
  (
    {
      attachment: attachmentName,
      size,
      id,
      position,
      rotation,
      scale,
      enableInput,
      onSpatialTap,
      onSpatialDragStart,
      onSpatialDrag,
      onSpatialDragEnd,
      onSpatialRotate,
      onSpatialRotateEnd,
      onSpatialMagnify,
      onSpatialMagnifyEnd,
    },
    ref,
  ) => {
    const ctx = useRealityContext()
    const parent = useParentContext()
    const attachmentRef = useRef<Attachment | null>(null)
    const instanceRef = useRef<EntityRef>(new EntityRef(null, ctx))
    const instanceIdRef = useRef(`att_${++instanceCounter}`)
    const attachmentNameRef = useRef(attachmentName)
    const [childWindow, setChildWindow] = useState<WindowProxy | null>(null)
    const forceUpdate = useForceUpdate()

    // Init: create attachment, set up window, register portal, parent, apply transform.
    useEffect(() => {
      if (!ctx || !parent) return
      if (attachmentRef.current) return

      let cancelled = false

      const init = async () => {
        try {
          const att = await ctx.session.createAttachmentEntity({
            size,
            ownerViewId: ctx.reality.id,
          })
          if (cancelled) {
            att.destroy()
            return
          }

          // Child window style setup (existing logic, unchanged).
          const windowProxy = att.getWindowProxy()
          setOpenWindowStyle(windowProxy)
          windowProxy.document.body.style.display = 'block'
          windowProxy.document.body.style.minWidth = '100%'
          windowProxy.document.body.style.maxWidth = '100%'
          windowProxy.document.body.style.minHeight = '100%'

          const viewport = windowProxy.document.querySelector(
            'meta[name="viewport"]',
          )
          if (!viewport) {
            const meta = windowProxy.document.createElement('meta')
            meta.name = 'viewport'
            meta.content =
              'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
            windowProxy.document.head.appendChild(meta)
          }
          const base = windowProxy.document.createElement('base')
          base.href = document.baseURI
          windowProxy.document.head.appendChild(base)

          attachmentRef.current = att
          setChildWindow(windowProxy)
          ctx.attachmentRegistry.addContainer(
            attachmentNameRef.current,
            instanceIdRef.current,
            att.getContainer(),
          )

          // Parent attach — dispatches SetParentForEntityCommand.
          const result = await parent.addEntity(att)
          if (!result.success) throw new Error('parent.addEntity failed')

          // Initial transform — matches useEntity's updateTransform-before-visible flow.
          await att.updateTransform({
            position,
            rotation,
            scale,
          })

          // Publish the entity to the EntityRef so the shared hooks can wire up.
          instanceRef.current.updateEntity(att)
          forceUpdate()
        } catch (error) {
          console.error('[AttachmentEntity] init error:', error)
        }
      }

      init()

      return () => {
        cancelled = true
        const att = attachmentRef.current
        if (att) {
          ctx.attachmentRegistry.removeContainer(
            attachmentNameRef.current,
            instanceIdRef.current,
          )
          att.destroy()
          attachmentRef.current = null
          setChildWindow(null)
        }
      }
    }, [ctx, parent])

    // Attachment name migration (existing behaviour, unchanged).
    useEffect(() => {
      if (!ctx) return
      const att = attachmentRef.current
      const prevName = attachmentNameRef.current
      if (att && prevName !== attachmentName) {
        ctx.attachmentRegistry.removeContainer(prevName, instanceIdRef.current)
        ctx.attachmentRegistry.addContainer(
          attachmentName,
          instanceIdRef.current,
          att.getContainer(),
        )
        attachmentNameRef.current = attachmentName
      } else {
        attachmentNameRef.current = attachmentName
      }
    }, [ctx, attachmentName])

    useSyncHeadStyles(childWindow, { subtree: false })

    // Shared entity hooks (match BoxEntity pattern).
    useEntityId({ id, entity: instanceRef.current.entity })
    useEntityRef(ref, instanceRef.current)
    useEntityEvent({
      instance: instanceRef.current,
      onSpatialTap,
      onSpatialDragStart,
      onSpatialDrag,
      onSpatialDragEnd,
      onSpatialRotate,
      onSpatialRotateEnd,
      onSpatialMagnify,
      onSpatialMagnifyEnd,
    })

    // enableInput — mirrors useEntity's effect exactly.
    useEffect(() => {
      const ent = instanceRef.current.entity
      if (!ent) return
      if (enableInput !== undefined) {
        ent.enableInput = !!enableInput
      }
    }, [instanceRef.current.entity, enableInput])

    // Transform updates — routes through UpdateEntityPropertiesCommand.
    useEffect(() => {
      const att = attachmentRef.current
      if (!att) return
      void att.updateTransform({ position, rotation, scale })
    }, [
      position?.x,
      position?.y,
      position?.z,
      rotation?.x,
      rotation?.y,
      rotation?.z,
      scale?.x,
      scale?.y,
      scale?.z,
    ])

    // Size updates — attachment-specific, routes through UpdateAttachmentSizeCommand.
    useEffect(() => {
      const att = attachmentRef.current
      if (!att) return
      void att.setWidth(size.width)
      void att.setHeight(size.height)
    }, [size.width, size.height])

    return null
  },
)

AttachmentEntity.displayName = 'AttachmentEntity'
