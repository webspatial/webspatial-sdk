import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRealityContext } from '../context'
import type { ContainerEntry } from '../context/AttachmentContext'
import { InsideAttachmentContext } from '../context/InsideAttachmentContext'

type AttachmentAssetProps = {
  id: string
  children?: React.ReactNode
}

export const AttachmentAsset: React.FC<AttachmentAssetProps> = ({
  id,
  children,
}) => {
  const ctx = useRealityContext()
  const [containers, setContainers] = useState<ContainerEntry[]>([])

  useEffect(() => {
    if (!ctx) return
    return ctx.attachmentRegistry.onContainersChange(id, setContainers)
  }, [ctx, id])

  if (!containers.length) return null
  return (
    <InsideAttachmentContext.Provider value={true}>
      {containers.map(({ instanceId, container }) =>
        createPortal(children, container, instanceId),
      )}
    </InsideAttachmentContext.Provider>
  )
}
