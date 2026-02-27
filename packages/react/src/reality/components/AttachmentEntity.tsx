import React, { useEffect, useRef } from 'react'
import { Attachment } from '@webspatial/core-sdk'
import { useRealityContext, useParentContext } from '../context'

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
        attachmentRef.current = att
        ctx.attachmentRegistry.setContainer(attachmentName, att.getContainer())
      } catch (error) {
        console.error('[AttachmentEntity] init error:', error)
      }
    }

    init()

    return () => {
      cancelled = true
      if (attachmentRef.current) {
        attachmentRef.current.destroy()
        attachmentRef.current = null
      }
      ctx.attachmentRegistry.removeContainer(attachmentName)
    }
  }, [ctx, parent])

  // Update position/size when they change
  useEffect(() => {
    if (!attachmentRef.current) return
    attachmentRef.current.update({ position, size })
  }, [
    position?.[0],
    position?.[1],
    position?.[2],
    size?.width,
    size?.height,
  ])

  return null
}
