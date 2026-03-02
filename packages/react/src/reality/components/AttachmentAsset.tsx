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
  const [containers, setContainers] = useState<HTMLElement[]>([])

  useEffect(() => {
    if (!ctx) return
    return ctx.attachmentRegistry.onContainersChange(name, setContainers)
  }, [ctx, name])

  if (!containers.length) return null
  return (
    <>
      {containers.map((c, idx) => createPortal(children, c, `${name}-${idx}`))}
    </>
  )
}
