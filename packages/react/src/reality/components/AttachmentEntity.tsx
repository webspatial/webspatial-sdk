import React, { useEffect, useRef } from 'react'
import { Attachment } from '@webspatial/core-sdk'
import { useRealityContext, useParentContext } from '../context'
import {
  setOpenWindowStyle,
  syncParentHeadToChild,
} from '../../utils/windowStyleSync'

let instanceCounter = 0

type AttachmentEntityProps = {
  attachment: string
  position?: [number, number, number]
  size: { width: number; height: number }
}

export const AttachmentEntity: React.FC<AttachmentEntityProps> = ({
  attachment: attachmentName,
  position,
  size,
}) => {
  const ctx = useRealityContext()
  const parent = useParentContext()
  const attachmentRef = useRef<Attachment | null>(null)
  const parentIdRef = useRef<string | null>(null)
  const instanceIdRef = useRef(`att_${++instanceCounter}`)

  // Create the attachment when the parent entity is ready
  useEffect(() => {
    if (!ctx || !parent) return

    const parentId = parent.id
    parentIdRef.current = parentId

    let cancelled = false

    const init = async () => {
      try {
        const att = await ctx.session.createAttachmentEntity({
          parentEntityId: parentId,
          position: position ?? [0, 0, 0],
          size,
        })
        if (cancelled) {
          att.destroy()
          return
        }
        // Initial style sync for attachment window
        const windowProxy = att.getWindowProxy()
        setOpenWindowStyle(windowProxy)
        await syncParentHeadToChild(windowProxy)

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
        ctx.attachmentRegistry.addContainer(
          attachmentName,
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
          attachmentName,
          instanceIdRef.current,
        )
        att.destroy()
        attachmentRef.current = null
      }
    }
  }, [ctx, parent])

  // Ongoing style sync when parent document head changes
  useEffect(() => {
    const att = attachmentRef.current
    if (!att) return
    const windowProxy = att.getWindowProxy()
    const observer = new MutationObserver(() => {
      syncParentHeadToChild(windowProxy)
    })
    observer.observe(document.head, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [attachmentRef.current])

  // Update position/size when they change
  useEffect(() => {
    if (!attachmentRef.current) return
    attachmentRef.current.update({ position, size })
  }, [position?.[0], position?.[1], position?.[2], size?.width, size?.height])

  return null
}
