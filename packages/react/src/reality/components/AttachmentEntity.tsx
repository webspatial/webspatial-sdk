import React, { useEffect, useRef, useState } from 'react'
import {
  Attachment,
  Vec3,
  AttachmentCreationCancelledError,
  scheduleAttachmentDestroy,
  getAttachmentPageGeneration,
  isAttachmentPageStale,
} from '@webspatial/core-sdk'

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

// In-flight createAttachmentEntity calls keyed by instance placement, so React
// StrictMode remounts reuse one native webview instead of opening a second window.
const creationPromises = new Map<string, Promise<Attachment>>()

export function resetAttachmentCreationPromises() {
  creationPromises.clear()
}

function getCreationKey(
  instanceId: string,
  ownerViewId: string,
  parentEntityId: string,
) {
  return `${instanceId}:${ownerViewId}:${parentEntityId}`
}

async function getOrCreateAttachment(
  key: string,
  create: () => Promise<Attachment>,
): Promise<Attachment> {
  let pending = creationPromises.get(key)
  if (!pending) {
    pending = create().finally(() => {
      if (creationPromises.get(key) === pending) {
        creationPromises.delete(key)
      }
    })
    creationPromises.set(key, pending)
  }
  return pending
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

  // Keep the id claimed while mounted (re-claims after StrictMode remount)
  useEffect(() => {
    const claimed = instanceIdRef.current!
    activeInstanceIds.add(claimed)
    return () => {
      activeInstanceIds.delete(claimed)
    }
  }, [])

  // Create the attachment when the parent entity is ready
  useEffect(() => {
    if (!ctx || !parent) return

    if (attachmentRef.current) return

    const parentId = parent.id
    parentIdRef.current = parentId

    let cancelled = false
    const pageGen = getAttachmentPageGeneration()

    const init = async () => {
      try {
        if (width === undefined && height === undefined) {
          console.warn(
            '[AttachmentEntity] No width or height provided; the native default size will be used.',
          )
        }
        const att = await getOrCreateAttachment(
          getCreationKey(instanceIdRef.current!, ctx.reality.id, parentId),
          () =>
            ctx.session.createAttachmentEntity({
              parentEntityId: parentId,
              position,
              rotation,
              scale,
              width,
              height,
              ownerViewId: ctx.reality.id,
            }),
        )
        const instanceId = instanceIdRef.current!
        if (isAttachmentPageStale(pageGen)) {
          scheduleAttachmentDestroy(att.id)
          att.isDestroyed = true
          return
        }
        // StrictMode unmount shares one in-flight create via `getOrCreateAttachment`.
        // A cancelled init must not destroy the attachment while a remount is still
        // active — only tear down when this instance id is no longer mounted.
        if (cancelled) {
          if (!activeInstanceIds.has(instanceId)) {
            scheduleAttachmentDestroy(att.id)
            att.isDestroyed = true
          }
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
        if (error instanceof AttachmentCreationCancelledError) {
          return
        }
        console.error('[AttachmentEntity] init error:', error)
      }
    }

    init()

    return () => {
      cancelled = true
      const instanceId = instanceIdRef.current!
      const att = attachmentRef.current
      if (att) {
        ctx.attachmentRegistry.removeContainer(assetIdRef.current, instanceId)
        attachmentRef.current = null
        setChildWindow(null)
        // Defer destroy so a StrictMode remount can reclaim the same attachment.
        queueMicrotask(() => {
          if (!activeInstanceIds.has(instanceId)) {
            scheduleAttachmentDestroy(att.id)
            att.isDestroyed = true
          }
        })
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
