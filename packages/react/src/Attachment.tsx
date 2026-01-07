import React, { useEffect, useRef } from 'react'
import {
  createAttachment,
  Attachment as AttachmentInstance,
} from '@webspatial/core-sdk'
import { useParentContext } from './reality/context/ParentContext'

interface AttachmentProps {
  url: string
  offset?: [number, number, number]
  size?: { width: number; height: number }
}

export function Attachment({ url, offset, size }: AttachmentProps) {
  const parent = useParentContext()
  const attachmentRef = useRef<AttachmentInstance | null>(null)

  useEffect(() => {
    if (!parent) {
      console.warn('<Attachment> must be inside <Entity>')
      return
    }

    let mounted = true

    const create = async () => {
      const attachment = await createAttachment({
        entityId: parent.id,
        url,
        offset,
        size,
      })
      if (mounted) {
        attachmentRef.current = attachment
      } else {
        attachment.destroy()
      }
    }

    create()

    return () => {
      mounted = false
      attachmentRef.current?.destroy()
    }
  }, [parent, url])

  useEffect(() => {
    attachmentRef.current?.update({ offset, size })
  }, [offset, size])

  return null
}
