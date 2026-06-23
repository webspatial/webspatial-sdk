import React, { useEffect, useRef, useState } from 'react'
import { Attachment, Vec3 } from '@webspatial/core-sdk'

import { useRealityContext, useParentContext } from '../context'
import { setOpenWindowStyle } from '../../utils/windowStyleSync'
import { useSyncHeadStyles } from '../../utils/useSyncHeadStyles'

let instanceCounter = 0

// Ids of currently mounted AttachmentEntity instances, used to detect
// duplicate explicit `id` props so registry/portal keys never collide.
const activeInstanceIds = new Set<string>()

export function claimAttachmentInstanceId(explicitId?: string): string {
  let resolved = explicitId ?? `att_${++instanceCounter}`
  if (activeInstanceIds.has(resolved)) {
    const fallback = `${resolved}_${++instanceCounter}`
    console.warn(
      `[AttachmentEntity] Duplicate id "${resolved}", falling back to "${fallback}". Explicit ids must be unique.`,
    )
    resolved = fallback
  }
  activeInstanceIds.add(resolved)
  return resolved
}

export type AttachmentEntityProps = {
  /**
   * Stable explicit identity for this attachment **placement** (portal key).
   * Must be unique across mounted AttachmentEntity instances and must not
   * change for the lifetime of the component. Defaults to an auto-generated id.
   * Distinct from the asset reference (`attachment`), which matches
   * `<AttachmentAsset id>`.
   */
  id?: string
  /**
   * Id of the `<AttachmentAsset>` whose content renders into this surface
   * (same pattern as `model` on `<ModelEntity>` referencing `<ModelAsset id>`).
   */
  attachment: string
  /** Position relative to the parent entity in meters. */
  position?: Vec3
  /** Rotation relative to the parent entity, Euler angles in degrees. */
  rotation?: Vec3
  /** Scale relative to the parent entity. */
  scale?: Vec3
  /** Surface width in world-space meters, like <Plane>. */
  width?: number
  /** Surface height in world-space meters, like <Plane>. */
  height?: number
}

export const AttachmentEntity: React.FC<AttachmentEntityProps> = ({
  id,
  attachment: assetId,
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
  const instanceIdRef = useRef<string | null>(null)
  if (instanceIdRef.current === null) {
    instanceIdRef.current = claimAttachmentInstanceId(id)
  }
  const assetIdRef = useRef(assetId)
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
        if (width === undefined && height === undefined) {
          console.warn(
            '[AttachmentEntity] No width or height provided; the native default size will be used.',
          )
        }
        const att = await ctx.session.createAttachmentEntity({
          parentEntityId: parentId,
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
          assetIdRef.current,
          instanceIdRef.current!,
          att.getContainer(),
        )
      } catch (error) {
        console.error('[AttachmentEntity] init error:', error)
      }
    }

    init()

    return () => {
      cancelled = true
      const instanceId = instanceIdRef.current!
      activeInstanceIds.delete(instanceId)
      const att = attachmentRef.current
      if (att) {
        ctx.attachmentRegistry.removeContainer(assetIdRef.current, instanceId)
        att.destroy()
        attachmentRef.current = null
        setChildWindow(null)
      }
    }
  }, [ctx, parent])

  // If the referenced asset id changes at runtime, migrate the container mapping
  useEffect(() => {
    if (!ctx) return
    const att = attachmentRef.current
    const prevAssetId = assetIdRef.current
    if (att && prevAssetId !== assetId) {
      ctx.attachmentRegistry.removeContainer(
        prevAssetId,
        instanceIdRef.current!,
      )
      ctx.attachmentRegistry.addContainer(
        assetId,
        instanceIdRef.current!,
        att.getContainer(),
      )
      assetIdRef.current = assetId
    } else {
      assetIdRef.current = assetId
    }
  }, [ctx, assetId])

  useSyncHeadStyles(childWindow)

  // Update transform/sizing when props change. `childWindow` is a dep so the
  // effect re-fires once after the async create completes, flushing any prop
  // values that changed while creation was in flight.
  useEffect(() => {
    if (!attachmentRef.current) return
    attachmentRef.current.update({
      position,
      rotation,
      scale,
      width,
      height,
    })
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
    childWindow,
  ])

  return null
}
