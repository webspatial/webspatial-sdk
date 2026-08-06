'use client'

import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { OrnamentPoint3D } from '@webspatial/core-sdk'

import { Ornament } from '../ornament'
import { getSession } from '../utils/getSession'
import {
  applySpatialDomStylePatch,
  findSpatialDomBinding,
  normalizeSpatialSceneInspect,
  type SpatialDomBinding,
  type SpatialDomStylePatch,
  type WebSpatialInspectorNode,
  type WebSpatialInspectorSnapshot,
} from './sceneGraph'

const WEBSPATIAL_INSPECT_CHANGE_EVENT = 'webspatialinspectchange'
const INSPECT_REFRESH_DEBOUNCE_MS = 120

export type WebSpatialInspectorProps = {
  editable?: boolean
  width?: number
  height?: number
  attachmentAnchor?: OrnamentPoint3D
  contentAlignment?: OrnamentPoint3D
}

type EditorDraft = Required<SpatialDomStylePatch>

const palette = {
  canvas: '#081015',
  raised: '#12222b',
  line: '#24404b',
  lineStrong: '#315967',
  text: '#e8f1f3',
  muted: '#8ca2aa',
  cyan: '#58d4df',
  cyanDim: '#163b42',
  amber: '#f6bd60',
  amberDim: '#49391f',
  red: '#ff7a78',
} as const

const mono =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace'

const buttonStyle: CSSProperties = {
  border: `1px solid ${palette.lineStrong}`,
  borderRadius: 6,
  background: palette.raised,
  color: palette.text,
  fontFamily: mono,
  fontSize: 11,
  lineHeight: '28px',
  minHeight: 28,
  padding: '0 10px',
  cursor: 'pointer',
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function booleanValue(value: unknown, fallback = true): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function editorDraftFromNode(node: WebSpatialInspectorNode): EditorDraft {
  return {
    width: numberValue(node.raw.width),
    height: numberValue(node.raw.height),
    opacity: numberValue(node.raw.opacity, 1),
    visible: booleanValue(node.raw.visible),
    depth: numberValue(node.raw.depth),
    backOffset: numberValue(node.raw.backOffset),
    zIndex: numberValue(node.raw.zIndex),
  }
}

function findNode(
  node: WebSpatialInspectorNode,
  id: string | null,
): WebSpatialInspectorNode | null {
  if (!id) return null
  if (node.id === id) return node
  for (const child of node.children) {
    const match = findNode(child, id)
    if (match) return match
  }
  return null
}

function nodeGlyph(node: WebSpatialInspectorNode): string {
  switch (node.kind) {
    case 'scene':
      return 'SC'
    case 'spatial-div':
      return '2D'
    case 'model':
      return '3D'
    case 'reality':
      return 'RV'
    case 'entity':
      return 'EN'
    case 'ornament':
      return 'OR'
    case 'group':
      return 'GR'
    default:
      return '??'
  }
}

function compareText(left: string, right: string): number {
  const displayOrder = left.localeCompare(right, 'en', {
    numeric: true,
    sensitivity: 'base',
  })
  return displayOrder || (left < right ? -1 : left > right ? 1 : 0)
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue)
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([leftKey], [rightKey]) => compareText(leftKey, rightKey))
        .map(([key, child]) => [key, stableValue(child)]),
    )
  }
  return value
}

function valuePreview(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return value
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value)
  }
  try {
    const serialized = JSON.stringify(stableValue(value))
    return serialized.length > 180
      ? `${serialized.slice(0, 177)}...`
      : serialized
  } catch {
    return String(value)
  }
}

const PROPERTY_ORDER = [
  'id',
  'name',
  'type',
  'parent',
  'position',
  'rotation',
  'scale',
  'transform',
  'width',
  'height',
  'depth',
  'clientX',
  'clientY',
  'backOffset',
  'zIndex',
  'opacity',
  'visible',
  'scrollWithParent',
  'scrollPageEnabled',
  'scrollOffset',
  'cornerRadius',
  'backgroundMaterial',
  'options',
  'modelURL',
  'model',
  'enableGesture',
  'enableInteractive',
  'enableTap',
  'enableTapGesture',
  'enableDrag',
  'enableDragStartGesture',
  'enableDragGesture',
  'enableDragEndGesture',
  'enableRotate',
  'enableRotateGesture',
  'enableRotateEndGesture',
  'enableMagnify',
  'enableMagnifyGesture',
  'enableMagnifyEndGesture',
] as const

const PROPERTY_ORDER_INDEX = new Map<string, number>(
  PROPERTY_ORDER.map((name, index) => [name, index]),
)

function comparePropertyEntries(
  [leftKey]: [string, unknown],
  [rightKey]: [string, unknown],
): number {
  const leftIndex = PROPERTY_ORDER_INDEX.get(leftKey) ?? Number.MAX_SAFE_INTEGER
  const rightIndex =
    PROPERTY_ORDER_INDEX.get(rightKey) ?? Number.MAX_SAFE_INTEGER
  return leftIndex - rightIndex || compareText(leftKey, rightKey)
}

function InspectorTreeNode({
  node,
  depth,
  selectedId,
  expandedIds,
  onToggle,
  onSelect,
}: {
  node: WebSpatialInspectorNode
  depth: number
  selectedId: string | null
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onSelect: (id: string) => void
}) {
  const hasChildren = node.children.length > 0
  const expanded = expandedIds.has(node.id)
  const selected = selectedId === node.id

  return (
    <div>
      <div
        style={{
          alignItems: 'center',
          background: selected ? palette.amberDim : 'transparent',
          borderLeft: `2px solid ${
            selected ? palette.amber : depth > 0 ? palette.line : 'transparent'
          }`,
          display: 'grid',
          gap: 6,
          gridTemplateColumns: '18px 24px minmax(0, 1fr)',
          marginLeft: depth * 13,
          minHeight: 30,
          padding: '2px 6px 2px 3px',
        }}
      >
        <button
          type="button"
          aria-label={
            hasChildren
              ? `${expanded ? 'Collapse' : 'Expand'} ${node.label}`
              : undefined
          }
          onClick={() => {
            if (hasChildren) onToggle(node.id)
          }}
          style={{
            border: 0,
            background: 'transparent',
            color: hasChildren ? palette.muted : palette.lineStrong,
            cursor: hasChildren ? 'pointer' : 'default',
            fontFamily: mono,
            fontSize: 11,
            height: 24,
            padding: 0,
          }}
        >
          {hasChildren ? (expanded ? 'v' : '>') : '-'}
        </button>
        <span
          style={{
            alignItems: 'center',
            background: node.synthetic ? palette.raised : palette.cyanDim,
            border: `1px solid ${
              selected ? palette.amber : palette.lineStrong
            }`,
            borderRadius: 4,
            color: selected ? palette.amber : palette.cyan,
            display: 'inline-flex',
            fontFamily: mono,
            fontSize: 9,
            height: 18,
            justifyContent: 'center',
          }}
        >
          {nodeGlyph(node)}
        </span>
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          style={{
            border: 0,
            background: 'transparent',
            color: palette.text,
            cursor: 'pointer',
            minWidth: 0,
            padding: '4px 0',
            textAlign: 'left',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: 12,
              lineHeight: '14px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {node.label}
          </span>
          <span
            style={{
              color: palette.muted,
              display: 'block',
              fontFamily: mono,
              fontSize: 9,
              lineHeight: '12px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {node.type} · {node.id}
          </span>
        </button>
      </div>
      {hasChildren && expanded
        ? node.children.map(child => (
            <InspectorTreeNode
              key={`${node.id}:${child.id}`}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  )
}

function PropertyTable({ node }: { node: WebSpatialInspectorNode }) {
  const entries = Object.entries(node.raw)
    .filter(
      ([key]) =>
        key !== 'children' &&
        key !== 'root' &&
        key !== 'components' &&
        key !== 'spatialObjectList',
    )
    .sort(comparePropertyEntries)

  if (entries.length === 0) {
    return (
      <div style={{ color: palette.muted, fontSize: 11 }}>
        This grouping node has no native properties.
      </div>
    )
  }

  return (
    <div
      style={{
        border: `1px solid ${palette.line}`,
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      {entries.map(([key, value], index) => (
        <div
          key={key}
          style={{
            borderTop: index === 0 ? 0 : `1px solid ${palette.line}`,
            display: 'grid',
            gap: 8,
            gridTemplateColumns: '110px minmax(0, 1fr)',
            padding: '7px 8px',
          }}
        >
          <span
            style={{
              color: palette.muted,
              fontFamily: mono,
              fontSize: 10,
              overflowWrap: 'anywhere',
            }}
          >
            {key}
          </span>
          <span
            title={valuePreview(value)}
            style={{
              color: palette.text,
              fontFamily: mono,
              fontSize: 10,
              overflowWrap: 'anywhere',
            }}
          >
            {valuePreview(value)}
          </span>
        </div>
      ))}
    </div>
  )
}

function NumberEditor({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span
        style={{
          color: palette.muted,
          fontFamily: mono,
          fontSize: 9,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={event => onChange(Number(event.target.value))}
        style={{
          background: palette.canvas,
          border: `1px solid ${palette.lineStrong}`,
          borderRadius: 5,
          boxSizing: 'border-box',
          color: palette.text,
          fontFamily: mono,
          fontSize: 11,
          height: 30,
          outline: 'none',
          padding: '0 7px',
          width: '100%',
        }}
      />
    </label>
  )
}

function Editor({
  node,
  binding,
  refresh,
}: {
  node: WebSpatialInspectorNode
  binding: SpatialDomBinding
  refresh: () => Promise<void>
}) {
  const [draft, setDraft] = useState<EditorDraft>(() =>
    editorDraftFromNode(node),
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDraft(editorDraftFromNode(node))
  }, [
    node.id,
    node.raw.backOffset,
    node.raw.depth,
    node.raw.height,
    node.raw.opacity,
    node.raw.visible,
    node.raw.width,
    node.raw.zIndex,
  ])

  const update = <K extends keyof EditorDraft>(
    key: K,
    value: EditorDraft[K],
  ) => {
    setDraft(current => ({ ...current, [key]: value }))
  }

  return (
    <section
      style={{
        background: palette.raised,
        border: `1px solid ${palette.lineStrong}`,
        borderRadius: 7,
        padding: 10,
      }}
    >
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 9,
        }}
      >
        <strong style={{ fontFamily: mono, fontSize: 10 }}>
          DOM-backed edits
        </strong>
        <span style={{ color: palette.muted, fontSize: 9 }}>
          page CSS remains authoritative
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gap: 8,
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        }}
      >
        <NumberEditor
          label="Width"
          value={draft.width}
          min={0}
          onChange={value => update('width', value)}
        />
        <NumberEditor
          label="Height"
          value={draft.height}
          min={0}
          onChange={value => update('height', value)}
        />
        <NumberEditor
          label="Opacity"
          value={draft.opacity}
          min={0}
          max={1}
          step={0.05}
          onChange={value => update('opacity', value)}
        />
        <NumberEditor
          label="Depth"
          value={draft.depth}
          onChange={value => update('depth', value)}
        />
        <NumberEditor
          label="Back"
          value={draft.backOffset}
          onChange={value => update('backOffset', value)}
        />
        <NumberEditor
          label="Z index"
          value={draft.zIndex}
          onChange={value => update('zIndex', value)}
        />
      </div>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 8,
          justifyContent: 'space-between',
          marginTop: 9,
        }}
      >
        <label
          style={{
            alignItems: 'center',
            color: palette.text,
            display: 'flex',
            fontFamily: mono,
            fontSize: 10,
            gap: 6,
          }}
        >
          <input
            type="checkbox"
            checked={draft.visible}
            onChange={event => update('visible', event.target.checked)}
          />
          Visible
        </label>
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true)
            applySpatialDomStylePatch(binding.element, draft)
            try {
              if (binding.syncSpatializedElement) {
                await binding.syncSpatializedElement()
                await refresh()
              }
            } finally {
              setSaving(false)
            }
          }}
          style={{
            ...buttonStyle,
            background: palette.cyanDim,
            borderColor: palette.cyan,
            color: palette.cyan,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Applying...' : 'Apply to page'}
        </button>
      </div>
    </section>
  )
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        alignItems: 'center',
        color: palette.muted,
        display: 'flex',
        fontFamily: mono,
        fontSize: 11,
        height: '100%',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  )
}

function createHighlightOverlay(): {
  overlay: HTMLDivElement
  label: HTMLDivElement
} {
  const overlay = document.createElement('div')
  const label = document.createElement('div')
  overlay.dataset.webspatialInspectorHighlight = ''
  Object.assign(overlay.style, {
    border: `2px solid ${palette.amber}`,
    boxShadow: `0 0 0 1px ${palette.canvas}, 0 0 22px rgba(246, 189, 96, 0.42)`,
    boxSizing: 'border-box',
    pointerEvents: 'none',
    position: 'fixed',
    zIndex: '2147483647',
  })
  Object.assign(label.style, {
    background: palette.amber,
    borderRadius: '3px 3px 0 0',
    bottom: '100%',
    color: palette.canvas,
    fontFamily: mono,
    fontSize: '10px',
    fontWeight: '700',
    left: '-2px',
    lineHeight: '20px',
    maxWidth: '320px',
    overflow: 'hidden',
    padding: '0 6px',
    position: 'absolute',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  })
  overlay.appendChild(label)
  return { overlay, label }
}

export function WebSpatialInspector({
  editable = false,
  width = 760,
  height = 560,
  attachmentAnchor = 'trailing',
  contentAlignment = 'leading',
}: WebSpatialInspectorProps): React.ReactElement {
  const [snapshot, setSnapshot] = useState<WebSpatialInspectorSnapshot | null>(
    null,
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [binding, setBinding] = useState<SpatialDomBinding | null>(null)
  const requestInFlightRef = useRef(false)
  const refreshPendingRef = useRef(false)
  const mountedRef = useRef(true)
  const refreshTimerRef = useRef<number>()
  const inspectorRootRef = useCallback((element: HTMLDivElement | null) => {
    if (element) {
      element.ownerDocument.title = 'WebSpatial Inspector'
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (refreshTimerRef.current !== undefined) {
        window.clearTimeout(refreshTimerRef.current)
      }
    }
  }, [])

  const refresh = useCallback(async (): Promise<void> => {
    if (requestInFlightRef.current) {
      refreshPendingRef.current = true
      return
    }
    requestInFlightRef.current = true
    try {
      do {
        refreshPendingRef.current = false
        try {
          const scene = getSession()?.getSpatialScene()
          if (!scene) {
            throw new Error('No active WebSpatial session')
          }
          const next = normalizeSpatialSceneInspect(await scene.inspect())
          if (!mountedRef.current) break
          setSnapshot(next)
          setError(null)
          setExpandedIds(current => {
            if (current.size > 0) return current
            return new Set([
              next.root.id,
              ...next.root.children.map(child => child.id),
            ])
          })
          setSelectedId(current =>
            current && findNode(next.root, current) ? current : next.root.id,
          )
        } catch (cause) {
          if (mountedRef.current) {
            setError(cause instanceof Error ? cause.message : String(cause))
          }
        }
      } while (mountedRef.current && refreshPendingRef.current)
    } finally {
      requestInFlightRef.current = false
    }
  }, [])

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current !== undefined) {
      window.clearTimeout(refreshTimerRef.current)
    }
    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = undefined
      void refresh()
    }, INSPECT_REFRESH_DEBOUNCE_MS)
  }, [refresh])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    document.addEventListener(WEBSPATIAL_INSPECT_CHANGE_EVENT, scheduleRefresh)
    return () => {
      document.removeEventListener(
        WEBSPATIAL_INSPECT_CHANGE_EVENT,
        scheduleRefresh,
      )
    }
  }, [scheduleRefresh])

  const selectedNode = useMemo(
    () => (snapshot ? findNode(snapshot.root, selectedId) : null),
    [selectedId, snapshot],
  )

  useEffect(() => {
    if (!selectedNode?.canHaveDomHost) {
      setBinding(null)
      return
    }
    setBinding(findSpatialDomBinding(selectedNode.id))
  }, [selectedNode])

  useEffect(() => {
    if (!selectedNode || !binding) return
    const { overlay, label } = createHighlightOverlay()
    label.textContent = `${selectedNode.label} · ${selectedNode.id}`
    document.body.appendChild(overlay)

    let animationFrame = 0
    const update = () => {
      if (!binding.element.isConnected) {
        overlay.style.display = 'none'
      } else {
        const rect = binding.element.getBoundingClientRect()
        overlay.style.display = 'block'
        overlay.style.left = `${rect.left}px`
        overlay.style.top = `${rect.top}px`
        overlay.style.width = `${Math.max(rect.width, 2)}px`
        overlay.style.height = `${Math.max(rect.height, 2)}px`
      }
    }
    const scheduleUpdate = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(update)
    }
    const resizeObserver = new ResizeObserver(scheduleUpdate)
    resizeObserver.observe(binding.element)
    const mutationObserver = new MutationObserver(mutations => {
      if (mutations.some(mutation => !overlay.contains(mutation.target))) {
        scheduleUpdate()
      }
    })
    mutationObserver.observe(binding.element.ownerDocument.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
      characterData: true,
      childList: true,
      subtree: true,
    })
    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('scroll', scheduleUpdate, true)
    scheduleUpdate()

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      window.removeEventListener('resize', scheduleUpdate)
      window.removeEventListener('scroll', scheduleUpdate, true)
      overlay.remove()
    }
  }, [binding, selectedNode])

  const toggleExpanded = (id: string) => {
    setExpandedIds(current => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Ornament
      attachmentAnchor={attachmentAnchor}
      contentAlignment={contentAlignment}
      width={width}
      height={height}
      cornerRadius={{
        topLeading: 12,
        bottomLeading: 12,
        topTrailing: 12,
        bottomTrailing: 12,
      }}
      style={{
        '--xr-background-material': 'thin',
        background: palette.canvas,
        color: palette.text,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        ref={inspectorRootRef}
        style={{
          background: palette.canvas,
          boxSizing: 'border-box',
          color: palette.text,
          display: 'grid',
          gridTemplateRows: '48px minmax(0, 1fr) 26px',
          height: '100vh',
          overflow: 'hidden',
          width: '100vw',
        }}
      >
        <header
          style={{
            alignItems: 'center',
            borderBottom: `1px solid ${palette.line}`,
            display: 'flex',
            gap: 12,
            justifyContent: 'space-between',
            padding: '0 12px',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                alignItems: 'baseline',
                display: 'flex',
                gap: 8,
              }}
            >
              <strong
                style={{
                  fontSize: 13,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                WebSpatial Inspector
              </strong>
              <span
                style={{
                  color: palette.cyan,
                  fontFamily: mono,
                  fontSize: 9,
                }}
              >
                native
              </span>
            </div>
            <div
              style={{
                color: palette.muted,
                fontFamily: mono,
                fontSize: 9,
                marginTop: 2,
              }}
            >
              {snapshot
                ? `${snapshot.nodeCount} nodes · ${new Date(
                    snapshot.capturedAt,
                  ).toLocaleTimeString()}`
                : 'Waiting for scene snapshot'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => void refresh()}
              style={buttonStyle}
            >
              Refresh
            </button>
          </div>
        </header>

        <main
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(250px, 0.9fr) minmax(300px, 1.1fr)',
            minHeight: 0,
          }}
        >
          <section
            aria-label="WebSpatial node tree"
            style={{
              borderRight: `1px solid ${palette.line}`,
              minHeight: 0,
              overflow: 'auto',
              padding: '8px 7px 16px',
            }}
          >
            {snapshot ? (
              <InspectorTreeNode
                node={snapshot.root}
                depth={0}
                selectedId={selectedId}
                expandedIds={expandedIds}
                onToggle={toggleExpanded}
                onSelect={setSelectedId}
              />
            ) : (
              <EmptyState>{error ?? 'Inspecting native scene...'}</EmptyState>
            )}
          </section>

          <section
            aria-label="Selected node details"
            style={{
              minHeight: 0,
              overflow: 'auto',
              padding: 12,
            }}
          >
            {selectedNode ? (
              <div style={{ display: 'grid', gap: 10 }}>
                <div>
                  <div
                    style={{
                      alignItems: 'center',
                      display: 'flex',
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        background: palette.cyanDim,
                        border: `1px solid ${palette.lineStrong}`,
                        borderRadius: 4,
                        color: palette.cyan,
                        fontFamily: mono,
                        fontSize: 9,
                        padding: '3px 5px',
                      }}
                    >
                      {nodeGlyph(selectedNode)}
                    </span>
                    <strong style={{ fontSize: 16 }}>
                      {selectedNode.label}
                    </strong>
                  </div>
                  <div
                    style={{
                      color: palette.muted,
                      fontFamily: mono,
                      fontSize: 9,
                      marginTop: 5,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {selectedNode.type} · {selectedNode.id}
                  </div>
                </div>

                <div
                  style={{
                    alignItems: 'center',
                    background: binding ? palette.cyanDim : palette.raised,
                    border: `1px solid ${
                      binding ? palette.cyan : palette.line
                    }`,
                    borderRadius: 6,
                    color: binding ? palette.cyan : palette.muted,
                    display: 'flex',
                    fontFamily: mono,
                    fontSize: 10,
                    justifyContent: 'space-between',
                    padding: '7px 9px',
                  }}
                >
                  <span>
                    {binding
                      ? 'DOM placeholder linked'
                      : selectedNode.canHaveDomHost
                        ? 'DOM placeholder not available'
                        : 'Native-only node'}
                  </span>
                  <span>{binding ? 'highlighting page' : 'no highlight'}</span>
                </div>

                {editable && binding ? (
                  <Editor
                    node={selectedNode}
                    binding={binding}
                    refresh={refresh}
                  />
                ) : null}

                <PropertyTable node={selectedNode} />
              </div>
            ) : (
              <EmptyState>
                Select a node to inspect its native state.
              </EmptyState>
            )}
          </section>
        </main>

        <footer
          style={{
            alignItems: 'center',
            borderTop: `1px solid ${palette.line}`,
            color: error ? palette.red : palette.muted,
            display: 'flex',
            fontFamily: mono,
            fontSize: 9,
            justifyContent: 'space-between',
            padding: '0 10px',
          }}
        >
          <span>
            {error
              ? `Inspect failed: ${error}`
              : 'Updates when the mounted tree changes'}
          </span>
          <span>{editable ? 'Edit mode' : 'Read only'}</span>
        </footer>
      </div>
    </Ornament>
  )
}
