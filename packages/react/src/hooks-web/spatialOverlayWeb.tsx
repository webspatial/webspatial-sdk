'use client'

import { useCallback, useEffect, useId, useMemo, useReducer } from 'react'
import { createPortal } from 'react-dom'

import type {
  SpatialOverlayPortalOption,
  UseSpatialOverlayOptions,
  UseSpatialOverlayResult,
} from '../spatialized-container/SpatialOverlay.types'

type WebOverlayEntry = {
  target: HTMLDivElement | null
  subscribers: Set<() => void>
}

const webOverlayEntries = new Map<string, WebOverlayEntry>()

function getWebOverlayEntry(overlayId: string): WebOverlayEntry {
  let entry = webOverlayEntries.get(overlayId)
  if (!entry) {
    entry = { target: null, subscribers: new Set() }
    webOverlayEntries.set(overlayId, entry)
  }
  return entry
}

function setWebOverlayTarget(overlayId: string, node: HTMLDivElement | null) {
  const entry = getWebOverlayEntry(overlayId)
  if (entry.target === node) return
  entry.target = node
  entry.subscribers.forEach(subscriber => subscriber())
}

function subscribeWebOverlayEntry(
  overlayId: string,
  subscriber: () => void,
): () => void {
  const entry = getWebOverlayEntry(overlayId)
  entry.subscribers.add(subscriber)
  return () => {
    entry.subscribers.delete(subscriber)
    if (entry.subscribers.size === 0 && !entry.target) {
      webOverlayEntries.delete(overlayId)
    }
  }
}

function useWebOverlayEntry(overlayId: string): WebOverlayEntry {
  const [, forceUpdate] = useReducer(version => version + 1, 0)
  useEffect(() => {
    const unsubscribe = subscribeWebOverlayEntry(overlayId, forceUpdate)
    forceUpdate()
    return unsubscribe
  }, [overlayId])
  return getWebOverlayEntry(overlayId)
}

function WebOverlayMenuOption({
  overlayId,
  content,
}: {
  overlayId: string
  content: React.ReactNode
}) {
  const entry = useWebOverlayEntry(overlayId)
  return entry.target
    ? createPortal(content, entry.target, `${overlayId}:portal`)
    : null
}

function createWebPortalMenuOption(
  overlayId: string,
): SpatialOverlayPortalOption {
  return content => (
    <WebOverlayMenuOption overlayId={overlayId} content={content} />
  )
}

function WebOverlayTarget({
  overlayId,
  portalTargetName,
  children,
}: {
  overlayId: string
  portalTargetName: string
  children?: React.ReactNode
}) {
  const setTarget = useCallback(
    (node: HTMLDivElement | null) => {
      setWebOverlayTarget(overlayId, node)
    },
    [overlayId],
  )

  return (
    <div ref={setTarget} data-name={portalTargetName}>
      {children}
    </div>
  )
}

/**
 * Plain-web overlay bridge: one DOM target for plugin item injection.
 * Kept in hooks-web so the default entry does not pull spatialized-container.
 */
export function useSpatialOverlayWeb({
  overlayId: providedOverlayId,
  portalTargetName,
}: UseSpatialOverlayOptions): UseSpatialOverlayResult {
  const generatedOverlayId = useId()
  const overlayId = providedOverlayId ?? generatedOverlayId
  const [, forceUpdate] = useReducer(version => version + 1, 0)

  useEffect(() => {
    const unsubscribe = subscribeWebOverlayEntry(overlayId, forceUpdate)
    forceUpdate()
    return unsubscribe
  }, [overlayId])

  const OverlayTarget = useCallback(
    ({
      children,
    }: {
      measurementContent?: React.ReactNode
      children?: React.ReactNode
    }) => (
      <WebOverlayTarget
        overlayId={overlayId}
        portalTargetName={portalTargetName}
      >
        {children}
      </WebOverlayTarget>
    ),
    [overlayId, portalTargetName],
  )

  const portalMenuOption = useMemo(
    () => createWebPortalMenuOption(overlayId),
    [overlayId],
  )

  return { OverlayTarget, portalMenuOption }
}
