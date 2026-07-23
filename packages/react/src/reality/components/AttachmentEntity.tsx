import React, { useEffect, useRef, useState } from 'react'
import { Attachment } from '@webspatial/core-sdk'
import type { Vec3 } from '@webspatial/core-sdk'

import { useRealityContext, useParentContext } from '../context'
import { setOpenWindowStyle } from '../../utils/windowStyleSync'
import { useSyncHeadStyles } from '../../utils/useSyncHeadStyles'

let instanceCounter = 0

type AttachmentEntityProps = {
  attachment: string
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
  width?: number
  height?: number
}

export const AttachmentEntity: React.FC<AttachmentEntityProps> = ({
  attachment: attachmentName,
  position,
  rotation,
  scale,
  width,
  height,
}) => {
  const ctx = useRealityContext()
  const parent = useParentContext()
  const attachmentRef = useRef<Attachment | null>(null)
  const parentIdRef = useRef<string | null>(null)
  const instanceIdRef = useRef(`att_${++instanceCounter}`)
  const attachmentNameRef = useRef(attachmentName)
  const [childWindow, setChildWindow] = useState<WindowProxy | null>(null)

  // Create the attachment when the parent entity is ready
  useEffect(() => {
    if (!ctx || !parent) return

    if (attachmentRef.current) return

    const parentId = parent.id
    parentIdRef.current = parentId

    let cancelled = false

    const init = async () => {
      try {
        const att = await ctx.session.createAttachmentEntity({
          placement: { id: parentId },
          position,
          rotation,
          scale,
          width,
          height,
          ownerViewId: ctx.reality.id,
        })
        if (cancelled) {
          att.destroy()
          return
        }
        // Initial style sync for attachment window
        const windowProxy = att.getWindowProxy()
        setOpenWindowStyle(windowProxy)
        // setOpenWindowStyle() above applies SpatialDiv defaults (inline-block, fit-content)
        // which shrink the body to its content. Attachments need the opposite — the body
        // must fill the RealityKit attachment frame — so override to block/100%.
        windowProxy.document.body.style.display = 'block'
        windowProxy.document.body.style.minWidth = '100%'
        windowProxy.document.body.style.maxWidth = '100%'
        windowProxy.document.body.style.minHeight = '100%'

        // Ensure viewport meta
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

        // Ensure base href for relative URLs
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

  // If attachment name changes at runtime, migrate the container mapping
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

  useSyncHeadStyles(childWindow)

  // Update transform and meter dimensions when they change
  useEffect(() => {
    if (!attachmentRef.current) return
    attachmentRef.current.update({ position, rotation, scale, width, height })
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
    width,
    height,
  ])

  return null
}
