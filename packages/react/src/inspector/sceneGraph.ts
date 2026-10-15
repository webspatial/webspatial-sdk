import type { SpatializedElement } from '@webspatial/core-sdk'

type InspectRecord = Record<string, unknown>

export type WebSpatialInspectorNodeKind =
  | 'scene'
  | 'spatial-div'
  | 'model'
  | 'reality'
  | 'entity'
  | 'ornament'
  | 'group'
  | 'unknown'

export type WebSpatialInspectorNode = {
  id: string
  label: string
  type: string
  kind: WebSpatialInspectorNodeKind
  raw: InspectRecord
  children: WebSpatialInspectorNode[]
  canHaveDomHost: boolean
  synthetic?: boolean
}

export type WebSpatialInspectorSnapshot = {
  capturedAt: number
  root: WebSpatialInspectorNode
  nodeCount: number
}

export type SpatialDomBinding = {
  element: HTMLElement
  syncSpatializedElement?: () => Promise<void>
}

export type SpatialDomStylePatch = Partial<{
  width: number
  height: number
  opacity: number
  visible: boolean
  depth: number
  backOffset: number
  zIndex: number
}>

type SpatialDomElement = HTMLElement & {
  __spatializedElement?: SpatializedElement
  __innerSpatializedElement?: () => SpatializedElement | undefined
  __syncSpatializedElement?: () => Promise<void>
}

function isRecord(value: unknown): value is InspectRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asRecord(value: unknown): InspectRecord {
  return isRecord(value) ? value : {}
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function collectionEntries(
  value: unknown,
): Array<[fallbackId: string, value: InspectRecord]> {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      isRecord(item) ? [[String(index), item]] : [],
    )
  }
  if (!isRecord(value)) return []
  return Object.entries(value).flatMap(([key, item]) =>
    isRecord(item) ? [[key, item]] : [],
  )
}

function nodeId(raw: InspectRecord, fallbackId: string): string {
  return asString(raw.id) ?? fallbackId
}

function nativeType(raw: InspectRecord, fallback: string): string {
  return asString(raw.type) ?? fallback
}

const NODE_KIND_ORDER: Record<WebSpatialInspectorNodeKind, number> = {
  scene: 0,
  'spatial-div': 10,
  model: 20,
  reality: 30,
  entity: 40,
  ornament: 60,
  group: 70,
  unknown: 90,
}

function compareText(left: string, right: string): number {
  const displayOrder = left.localeCompare(right, 'en', {
    numeric: true,
    sensitivity: 'base',
  })
  return displayOrder || (left < right ? -1 : left > right ? 1 : 0)
}

function compareNodes(
  left: WebSpatialInspectorNode,
  right: WebSpatialInspectorNode,
): number {
  return (
    NODE_KIND_ORDER[left.kind] - NODE_KIND_ORDER[right.kind] ||
    compareText(left.label, right.label) ||
    compareText(left.type, right.type) ||
    compareText(left.id, right.id)
  )
}

function sortNodeTree(node: WebSpatialInspectorNode): WebSpatialInspectorNode {
  return {
    ...node,
    children: node.children.map(sortNodeTree).sort(compareNodes),
  }
}

function parseEntity(
  raw: InspectRecord,
  fallbackId: string,
  isRoot = false,
): WebSpatialInspectorNode {
  const id = nodeId(raw, fallbackId)
  const type = nativeType(
    raw,
    isRoot
      ? 'SpatialRootEntity'
      : raw.model !== undefined
        ? 'SpatialModelEntity'
        : 'SpatialEntity',
  )
  const name = asString(raw.name)
  const children = collectionEntries(raw.children).map(([key, child]) =>
    parseEntity(child, key),
  )

  return {
    id,
    label: name ?? (isRoot ? 'Reality root' : type),
    type,
    kind: 'entity',
    raw,
    children,
    canHaveDomHost: false,
  }
}

function spatializedKind(type: string): WebSpatialInspectorNodeKind {
  if (type.includes('Spatialized2DElement')) return 'spatial-div'
  if (type.includes('SpatializedStatic3DElement')) return 'model'
  if (type.includes('SpatializedDynamic3DElement')) return 'reality'
  return 'unknown'
}

function spatializedLabel(
  kind: WebSpatialInspectorNodeKind,
  raw: InspectRecord,
): string {
  const name = asString(raw.name)
  if (name) return name
  if (kind === 'spatial-div') return 'SpatialDiv'
  if (kind === 'model') return 'Model'
  if (kind === 'reality') return 'Reality'
  return 'Spatial object'
}

function parseSpatializedElement(
  raw: InspectRecord,
  fallbackId: string,
): WebSpatialInspectorNode {
  const id = nodeId(raw, fallbackId)
  const type = nativeType(raw, 'SpatializedElement')
  const kind = spatializedKind(type)
  const children = collectionEntries(raw.children).map(([key, child]) =>
    parseSpatializedElement(child, key),
  )
  const root = isRecord(raw.root)
    ? [parseEntity(raw.root, `${id}:root`, true)]
    : []

  return {
    id,
    label: spatializedLabel(kind, raw),
    type,
    kind,
    raw,
    children: [...children, ...root],
    canHaveDomHost:
      kind === 'spatial-div' || kind === 'model' || kind === 'reality',
  }
}

function parseOrnament(
  raw: InspectRecord,
  fallbackId: string,
): WebSpatialInspectorNode {
  return {
    id: nodeId(raw, fallbackId),
    label: asString(raw.name) ?? 'Ornament',
    type: nativeType(raw, 'Ornament'),
    kind: 'ornament',
    raw,
    children: [],
    canHaveDomHost: false,
  }
}

function groupNode(
  id: string,
  label: string,
  children: WebSpatialInspectorNode[],
): WebSpatialInspectorNode {
  return {
    id,
    label,
    type: 'Group',
    kind: 'group',
    raw: {},
    children,
    canHaveDomHost: false,
    synthetic: true,
  }
}

function countNodes(node: WebSpatialInspectorNode): number {
  return node.children.reduce(
    (total, child) => total + countNodes(child),
    node.synthetic ? 0 : 1,
  )
}

export function normalizeSpatialSceneInspect(
  value: unknown,
): WebSpatialInspectorSnapshot {
  const raw = asRecord(value)
  const sceneId = asString(raw.id) ?? 'spatial-scene'
  const sceneChildren = collectionEntries(raw.children).map(([key, child]) =>
    parseSpatializedElement(child, key),
  )
  const ornaments = collectionEntries(raw.ornaments).map(([key, ornament]) =>
    parseOrnament(ornament, key),
  )

  const root: WebSpatialInspectorNode = {
    id: sceneId,
    label: asString(raw.name) ?? 'SpatialScene',
    type: 'SpatialScene',
    kind: 'scene',
    raw,
    children: [...sceneChildren],
    canHaveDomHost: false,
  }

  if (ornaments.length > 0) {
    root.children.push(
      groupNode(`${sceneId}:ornaments`, 'Ornaments', ornaments),
    )
  }
  const sortedRoot = sortNodeTree(root)

  return {
    capturedAt: Date.now(),
    root: sortedRoot,
    nodeCount: countNodes(sortedRoot),
  }
}

function spatialObjectFromElement(
  element: HTMLElement,
): SpatializedElement | undefined {
  const candidate = element as SpatialDomElement
  try {
    return (
      candidate.__spatializedElement ?? candidate.__innerSpatializedElement?.()
    )
  } catch {
    return undefined
  }
}

export function findSpatialDomBinding(
  nativeId: string,
  root: Document = document,
): SpatialDomBinding | null {
  const elements = root.querySelectorAll<HTMLElement>('[data-spatial-id]')
  for (const element of elements) {
    const spatialObject = spatialObjectFromElement(element)
    if (spatialObject?.id === nativeId) {
      return {
        element,
        syncSpatializedElement: (element as SpatialDomElement)
          .__syncSpatializedElement,
      }
    }
  }
  return null
}

function finiteNumber(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function applySpatialDomStylePatch(
  element: HTMLElement,
  patch: SpatialDomStylePatch,
): void {
  if (finiteNumber(patch.width) && patch.width >= 0) {
    element.style.width = `${patch.width}px`
  }
  if (finiteNumber(patch.height) && patch.height >= 0) {
    element.style.height = `${patch.height}px`
  }
  if (finiteNumber(patch.opacity)) {
    element.style.opacity = String(Math.min(1, Math.max(0, patch.opacity)))
  }
  if (typeof patch.visible === 'boolean') {
    element.style.setProperty(
      'visibility',
      patch.visible ? 'visible' : 'hidden',
    )
  }
  if (finiteNumber(patch.depth)) {
    element.style.setProperty('--xr-depth', String(patch.depth))
  }
  if (finiteNumber(patch.backOffset)) {
    element.style.setProperty('--xr-back', String(patch.backOffset))
  }
  if (finiteNumber(patch.zIndex)) {
    element.style.setProperty('--xr-z-index', String(patch.zIndex))
  }
}
