import React, { useEffect, useRef, useMemo } from 'react'
import ReactDOM from 'react-dom'
import {
  createAttachment,
  Attachment as AttachmentInstance,
} from '../../core/src/Attachment'
import { useParentContext } from './reality/context/ParentContext'

interface AttachmentProps {
  anchor?: [number, number, number]
  offset?: [number, number, number]
  size?: { width: number; height: number }
  children?: React.ReactNode
}

export function Attachment({ anchor, offset, size, children }: AttachmentProps) {
  const parent = useParentContext()
  const attachmentRef = useRef<AttachmentInstance | null>(null)
  const [container, setContainer] = React.useState<HTMLElement | null>(null)

  useEffect(() => {
    console.log('[Attachment] entityId from context:', parent?.id)
  }, [parent])

  useEffect(() => {
    if (!parent) {
      console.warn('<Attachment> must be inside <Entity>')
      return
    }

    let mounted = true

    const create = async () => {
      const attachment = await createAttachment({
        entityId: parent.id,
        anchor,
        offset,
        size,
      })
      if (mounted) {
        attachmentRef.current = attachment
        setContainer(attachment.getContainer())
      } else {
        attachment.destroy()
      }
    }

    create()

    return () => {
      mounted = false
      attachmentRef.current?.destroy()
    }
  }, [parent])

  useEffect(() => {
    attachmentRef.current?.update({ offset, size })
  }, [offset, size])

  if (!container) return null
  return ReactDOM.createPortal(children, container)
}
