import React, { useEffect, useRef, useState } from 'react'
import { Attachment } from '@webspatial/core-sdk'
import { useRealityContext, useParentContext } from '../context'
import {
  yieldToMainThread,
  setupChildWindow,
} from '../../utils/childWindowSetup'
import { useHeadSync } from '../../utils/useHeadSync'

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
  // React 18 types require `| null` for mutable refs; useRef<T>(null) without it returns readonly RefObject.
  const attachmentRef = useRef<Attachment | null>(null)
  const parentIdRef = useRef<string | null>(null)
  const instanceIdRef = useRef(`att_${++instanceCounter}`)
  const attachmentNameRef = useRef(attachmentName)
  const [childWindow, setChildWindow] = useState<WindowProxy | null>(null)
  // Keep the attachment child window's head in sync with the parent (debounced).
  useHeadSync(childWindow)

  // Create the attachment when the parent entity is ready
  useEffect(() => {
    if (!ctx || !parent) return

    const parentId = parent.id
    parentIdRef.current = parentId

    let cancelled = false

    const init = async () => {
      try {
        // Yield so multiple attachments don't call window.open() in one flush.
        await yieldToMainThread()
        const att = await ctx.session.createAttachmentEntity({
          parentEntityId: parentId,
          position: position ?? [0, 0, 0],
          size,
        })
        if (cancelled) {
          att.destroy()
          return
        }
        const windowProxy = att.getWindowProxy()
        // Shared child-window setup; ensures body fill + head/viewport/base tags.
        await setupChildWindow(windowProxy, 'attachment')

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

  // Debounce rapid successive head mutations to avoid redundant style syncs

  // Update position/size when they change
  useEffect(() => {
    if (!attachmentRef.current) return
    attachmentRef.current.update({ position, size })
  }, [position?.[0], position?.[1], position?.[2], size?.width, size?.height])

  return null
}
