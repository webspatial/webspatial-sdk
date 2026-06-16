import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useReducer,
  type ComponentType,
} from 'react'
import { createPortal } from 'react-dom'
import { useSpatialOverlayRenderTarget } from './context/SpatialOverlayRenderTargetContext'
import { useSpatialPortalContainer } from './context/SpatialWindowContext'

export type SpatialOverlayPortalOption = (
  content: React.ReactNode,
  measurementContent?: React.ReactNode,
) => React.ReactNode

export type SpatialOverlayProps = {
  overlayId?: string
  measurementContent?: React.ReactNode
  portalTargetName: string
  onPortalTargetChange?: (node: HTMLDivElement | null) => void
  children?: React.ReactNode
}

export type UseSpatialOverlayOptions = {
  overlayId?: string
  portalTargetName: string
}

export type UseSpatialOverlayResult = {
  OverlayTarget: ComponentType<{
    measurementContent?: React.ReactNode
    children?: React.ReactNode
  }>
  portalMenuOption: SpatialOverlayPortalOption
}

type SpatialOverlayEntry = {
  measurementTarget: HTMLDivElement | null
  portalTarget: HTMLDivElement | null
  subscribers: Set<() => void>
}

const overlayEntries = new Map<string, SpatialOverlayEntry>()

function getOverlayEntry(overlayId: string) {
  let entry = overlayEntries.get(overlayId)
  if (!entry) {
    entry = {
      measurementTarget: null,
      portalTarget: null,
      subscribers: new Set(),
    }
    overlayEntries.set(overlayId, entry)
  }
  return entry
}

function notifyOverlayEntry(entry: SpatialOverlayEntry) {
  entry.subscribers.forEach(subscriber => subscriber())
}

function setOverlayTarget(
  overlayId: string,
  key: 'measurementTarget' | 'portalTarget',
  node: HTMLDivElement | null,
) {
  const entry = getOverlayEntry(overlayId)
  if (entry[key] === node) return
  entry[key] = node
  notifyOverlayEntry(entry)
}

function subscribeOverlayEntry(
  overlayId: string,
  subscriber: () => void,
): () => void {
  const entry = getOverlayEntry(overlayId)
  entry.subscribers.add(subscriber)
  return () => {
    entry.subscribers.delete(subscriber)
    if (
      entry.subscribers.size === 0 &&
      !entry.measurementTarget &&
      !entry.portalTarget
    ) {
      overlayEntries.delete(overlayId)
    }
  }
}

/**
 * Subscribe to an overlay entry so the consumer re-renders when the measurement
 * / portal targets mount. This is what lets a `portalMenuOption(...)` node work
 * from a separate plugin React root that never called `useSpatialOverlay()`:
 * the targets usually attach after the plugin first renders, so without a
 * subscription the `createPortal` calls would stay `null` forever.
 */
function useOverlayEntry(overlayId: string): SpatialOverlayEntry {
  const [, forceUpdate] = useReducer(version => version + 1, 0)
  useEffect(() => {
    const unsubscribe = subscribeOverlayEntry(overlayId, forceUpdate)
    // Targets may have mounted between render and effect; re-sync once.
    forceUpdate()
    return unsubscribe
  }, [overlayId])
  return getOverlayEntry(overlayId)
}

type SpatialOverlayMenuOptionProps = {
  overlayId: string
  portalTargetName: string
  content: React.ReactNode
  measurementContent: React.ReactNode
}

function SpatialOverlayMenuOption({
  overlayId,
  portalTargetName,
  content,
  measurementContent,
}: SpatialOverlayMenuOptionProps) {
  const entry = useOverlayEntry(overlayId)

  return (
    <>
      {entry.measurementTarget
        ? createPortal(
            <div
              aria-hidden="true"
              data-name={`${portalTargetName}-measurement-item`}
            >
              {measurementContent}
            </div>,
            entry.measurementTarget,
            `${overlayId}:measurement`,
          )
        : null}
      {entry.portalTarget
        ? createPortal(content, entry.portalTarget, `${overlayId}:portal`)
        : null}
    </>
  )
}

function createPortalMenuOption(
  overlayId: string,
  portalTargetName: string,
): SpatialOverlayPortalOption {
  return (content, measurementContent = content) => (
    <SpatialOverlayMenuOption
      overlayId={overlayId}
      portalTargetName={portalTargetName}
      content={content}
      measurementContent={measurementContent}
    />
  )
}

/**
 * Experimental bridge for overlay content rendered by SpatialDiv.
 *
 * In the standard instance, this renders inert measurement content so positioning
 * libraries and native surface sizing can observe the expected dimensions. In
 * the portal instance, this exposes a target for real interactive content.
 */
export function SpatialOverlay(props: SpatialOverlayProps) {
  const { portalTargetName, onPortalTargetChange, children } = props
  const measurementContent = props.measurementContent ?? children
  const overlayId = props.overlayId ?? portalTargetName
  const overlayRenderTarget = useSpatialOverlayRenderTarget()
  const spatialPortalContainer = useSpatialPortalContainer()
  const setMeasurementTarget = useCallback(
    (node: HTMLDivElement | null) => {
      setOverlayTarget(overlayId, 'measurementTarget', node)
    },
    [overlayId],
  )

  const setPortalTarget = useCallback(
    (node: HTMLDivElement | null) => {
      setOverlayTarget(overlayId, 'portalTarget', node)
      onPortalTargetChange?.(node)
    },
    [onPortalTargetChange, overlayId],
  )

  const isPortalTarget =
    overlayRenderTarget === 'portal' ||
    (overlayRenderTarget == null && !!spatialPortalContainer)

  if (!isPortalTarget) {
    return (
      <div
        ref={setMeasurementTarget}
        aria-hidden="true"
        data-name={`${portalTargetName}-measurement`}
      >
        {measurementContent}
      </div>
    )
  }

  return (
    <div ref={setPortalTarget} data-name={portalTargetName}>
      {children}
    </div>
  )
}

export function useSpatialOverlay({
  overlayId: providedOverlayId,
  portalTargetName,
}: UseSpatialOverlayOptions): UseSpatialOverlayResult {
  const generatedOverlayId = useId()
  const overlayId = providedOverlayId ?? generatedOverlayId
  const [, forceUpdate] = useReducer(version => version + 1, 0)

  useEffect(() => {
    const unsubscribe = subscribeOverlayEntry(overlayId, forceUpdate)
    forceUpdate()
    return unsubscribe
  }, [overlayId])

  const OverlayTarget = useCallback(
    ({
      measurementContent,
      children,
    }: {
      measurementContent?: React.ReactNode
      children?: React.ReactNode
    }) => (
      <SpatialOverlay
        overlayId={overlayId}
        measurementContent={measurementContent}
        portalTargetName={portalTargetName}
      >
        {children}
      </SpatialOverlay>
    ),
    [overlayId, portalTargetName],
  )

  const portalMenuOption = useMemo(
    () => createPortalMenuOption(overlayId, portalTargetName),
    [overlayId, portalTargetName],
  )

  return { OverlayTarget, portalMenuOption }
}
