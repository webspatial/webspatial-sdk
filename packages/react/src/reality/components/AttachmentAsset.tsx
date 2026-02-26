import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRealityContext } from '../context'

type AttachmentAssetProps = {
  name: string
  children?: React.ReactNode
}

export const AttachmentAsset: React.FC<AttachmentAssetProps> = ({
  name,
  children,
}) => {
  const ctx = useRealityContext()
  const [container, setContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!ctx) return
    return ctx.attachmentRegistry.onContainerChange(name, setContainer)
  }, [ctx, name])

  if (!container) return null
  return createPortal(children, container)
}
