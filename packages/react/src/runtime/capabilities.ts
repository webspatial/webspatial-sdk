export type WebSpatialRuntimeType = 'visionos' | 'picoos' | 'puppeteer' | null

export type WebSpatialRuntimeSnapshot = {
  type: WebSpatialRuntimeType
  shellVersion: string | null
}

const COMPONENT_KEYS = [
  'Model',
  'Reality',
  'Entity',
  'BoxEntity',
  'SphereEntity',
  'ConeEntity',
  'CylinderEntity',
  'PlaneEntity',
  'SceneGraph',
  'ModelAsset',
  'ModelEntity',
  'UnlitMaterial',
  'Material',
  'AttachmentAsset',
  'AttachmentEntity',
] as const

const CSS_KEYS = [
  '-xr-background-material',
  '-xr-back',
  '-xr-depth',
  '-xr-transform',
] as const

const GESTURE_KEYS = [
  'SpatialTapEvent',
  'SpatialDragStartEvent',
  'SpatialDragEvent',
  'SpatialDragEndEvent',
  'SpatialRotateEvent',
  'SpatialRotateEndEvent',
  'SpatialMagnifyEvent',
  'SpatialMagnifyEndEvent',
] as const

const JS_SCENE_KEYS = [
  'useMetrics',
  'convertCoordinate',
  'initScene',
  'WindowScene',
  'VolumeScene',
] as const

const ELEMENT_DOM_DEPTH_KEYS = ['xrClientDepth', 'xrOffsetBack'] as const
const WINDOW_DOM_DEPTH_KEYS = ['xrInnerDepth', 'xrOuterDepth'] as const
const DOM_DEPTH_KEYS = [
  ...ELEMENT_DOM_DEPTH_KEYS,
  ...WINDOW_DOM_DEPTH_KEYS,
] as const

const TOP_LEVEL_KEYS = [
  ...COMPONENT_KEYS,
  ...CSS_KEYS,
  ...GESTURE_KEYS,
  ...JS_SCENE_KEYS,
  ...DOM_DEPTH_KEYS,
] as const

export type CapabilityKey = (typeof TOP_LEVEL_KEYS)[number]

const ALIAS_TO_CANONICAL: Record<string, string> = {
  Box: 'BoxEntity',
  Sphere: 'SphereEntity',
  Cone: 'ConeEntity',
  Cylinder: 'CylinderEntity',
  Plane: 'PlaneEntity',
  World: 'SceneGraph',
}

const SUB_TOKENS_BY_NAME: Readonly<Record<string, readonly string[]>> = {
  Material: ['unlit'],
  WindowScene: ['defaultSize', 'resizability'],
  VolumeScene: [
    'defaultSize',
    'resizability',
    'worldScaling',
    'worldAlignment',
    'baseplateVisibility',
  ],
  SpatialRotateEvent: ['constrainedToAxis'],
  Model: [
    'autoplay',
    'loop',
    'stagemode',
    'poster',
    'loading',
    'source',
    'ready',
    'currentSrc',
    'entityTransform',
    'paused',
    'duration',
    'playbackRate',
    'play',
    'pause',
    'currentTime',
  ],
}

type CapabilityVersionRow = {
  version: string
  flags: Record<string, boolean>
}

const VISIONOS_DEBUG_SHELL_VERSION_PLACEHOLDER = 'WS_SHELL_VERSION'

let runtimeCache: WebSpatialRuntimeSnapshot | undefined

export function resetRuntimeCacheForTests(): void {
  runtimeCache = undefined
}

export function parseShellToken(ua: string): {
  version: string | null
  source: 'wsapp' | 'picoapp' | null
} {
  const ws = /\bWSAppShell\/([\w.-]+)/i.exec(ua)
  if (ws?.[1]) return { version: ws[1], source: 'wsapp' }
  const pico = /\bPicoWebApp\/([\w.-]+)/i.exec(ua)
  if (pico?.[1]) return { version: pico[1], source: 'picoapp' }
  return { version: null, source: null }
}

export function computeRuntimeFromUserAgent(
  userAgent: string | undefined,
): WebSpatialRuntimeSnapshot {
  if (userAgent === undefined || userAgent === '') {
    return { type: null, shellVersion: null }
  }
  if (userAgent.includes('Puppeteer')) {
    const { version } = parseShellToken(userAgent)
    return { type: 'puppeteer', shellVersion: version }
  }

  const { version, source } = parseShellToken(userAgent)
  if (!version) {
    return { type: null, shellVersion: null }
  }

  if (source === 'picoapp' || inferPicoOs(userAgent)) {
    return { type: 'picoos', shellVersion: version }
  }

  if (source === 'wsapp') {
    return /Mac OS X/i.test(userAgent)
      ? { type: 'visionos', shellVersion: version }
      : { type: null, shellVersion: version }
  }

  return { type: null, shellVersion: version }
}

export function supports(
  name: CapabilityKey,
  tokens?: readonly string[],
): boolean
export function supports(name: string, tokens?: readonly string[]): boolean
export function supports(name: string, tokens?: readonly string[]): boolean {
  if (typeof name !== 'string') return false
  const canonical = normalizeCapabilityName(name)
  if (!isKnownTopLevel(canonical)) return false

  const tokList =
    tokens === undefined ? [] : Array.isArray(tokens) ? [...tokens] : []
  if (tokList.some(t => typeof t !== 'string')) return false

  for (const t of tokList) {
    if (!isKnownSubToken(canonical, t)) return false
  }

  const rt = getRuntime()
  if (rt.type === 'puppeteer') return true
  if (rt.type === null || rt.shellVersion === null) return false
  if (
    rt.type === 'visionos' &&
    rt.shellVersion === VISIONOS_DEBUG_SHELL_VERSION_PLACEHOLDER
  ) {
    return true
  }

  const parsedShell = parseSemverOrNull(rt.shellVersion)
  if (!parsedShell) return false
  if (rt.type !== 'visionos' && rt.type !== 'picoos') return false

  const row = selectRow(rt.type, parsedShell)
  if (!row) return false

  if (tokList.length === 0) {
    return row.flags[canonical] === true
  }
  if (row.flags[canonical] !== true) return false
  return tokList.every(t => row.flags[`${canonical}:${t}`] === true)
}

export class WebSpatialRuntimeError extends Error {
  public readonly capability: string

  constructor(capability: string, message?: string) {
    super(
      message ??
        `Capability "${capability}" is not supported in this WebSpatial runtime`,
    )
    this.name = 'WebSpatialRuntimeError'
    this.capability = capability
  }
}

function inferPicoOs(ua: string): boolean {
  return /\bPicoWebApp\//i.test(ua) || /\bPicoBrowser\b/i.test(ua)
}

function getRuntime(): WebSpatialRuntimeSnapshot {
  if (runtimeCache !== undefined) return runtimeCache
  if (typeof navigator === 'undefined') {
    runtimeCache = { type: null, shellVersion: null }
    return runtimeCache
  }
  runtimeCache = computeRuntimeFromUserAgent(navigator.userAgent)
  return runtimeCache
}

function normalizeCapabilityName(name: string): string {
  return ALIAS_TO_CANONICAL[name] ?? name
}

function isKnownTopLevel(name: string): boolean {
  return (TOP_LEVEL_KEYS as readonly string[]).includes(name)
}

function isKnownSubToken(name: string, token: string): boolean {
  const allowed = SUB_TOKENS_BY_NAME[name]
  return allowed !== undefined && allowed.includes(token)
}

function baseTrueFlags(): Record<string, boolean> {
  const flags: Record<string, boolean> = {}
  for (const k of TOP_LEVEL_KEYS) {
    flags[k] = true
  }
  for (const [name, toks] of Object.entries(SUB_TOKENS_BY_NAME)) {
    for (const t of toks) {
      flags[`${name}:${t}`] = true
    }
  }
  return flags
}

function matrixVision_1_5_0_Flags(): Record<string, boolean> {
  const flags = baseTrueFlags()
  for (const t of [
    'autoplay',
    'loop',
    'stagemode',
    'poster',
    'loading',
    'source',
    'paused',
    'duration',
    'playbackRate',
    'play',
    'pause',
    'currentTime',
  ] as const) {
    flags[`Model:${t}`] = false
  }
  flags['SpatialRotateEvent:constrainedToAxis'] = true
  return flags
}

function matrixVision_1_6_0_Flags(): Record<string, boolean> {
  const flags = baseTrueFlags()
  for (const t of ['stagemode', 'poster', 'loading', 'currentTime'] as const) {
    flags[`Model:${t}`] = false
  }
  flags['SpatialRotateEvent:constrainedToAxis'] = true
  return flags
}

function matrixPico_0_1_1_Flags(): Record<string, boolean> {
  const flags = matrixVision_1_5_0_Flags()
  flags.xrInnerDepth = false
  flags.xrOuterDepth = false
  return flags
}

function matrixPico_0_1_2_Flags(): Record<string, boolean> {
  const flags = matrixVision_1_6_0_Flags()
  flags.xrInnerDepth = false
  flags.xrOuterDepth = false
  return flags
}

function compareSemver(a: string, b: string): number {
  const pa = parseSemverParts(a)
  const pb = parseSemverParts(b)
  if (!pa || !pb) {
    return String(a).localeCompare(String(b))
  }
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0
    const db = pb[i] ?? 0
    if (da !== db) return da - db
  }
  return 0
}

function parseSemverParts(v: string): number[] | null {
  const m = /^(\d+)(?:\.(\d+)(?:\.(\d+))?)?/.exec(v.trim())
  if (!m) return null
  const major = Number(m[1])
  const minor = m[2] !== undefined ? Number(m[2]) : 0
  const patch = m[3] !== undefined ? Number(m[3]) : 0
  if ([major, minor, patch].some(n => Number.isNaN(n))) return null
  return [major, minor, patch]
}

function parseSemverOrNull(v: string): string | null {
  const m = /^(\d+(?:\.\d+){0,2})/.exec(v.trim())
  return m ? m[1] : null
}

const CAPABILITY_TABLE: {
  visionos: CapabilityVersionRow[]
  picoos: CapabilityVersionRow[]
} = {
  visionos: [
    { version: '1.5.0', flags: /* @__PURE__ */ matrixVision_1_5_0_Flags() },
    { version: '1.6.0', flags: /* @__PURE__ */ matrixVision_1_6_0_Flags() },
  ],
  picoos: [
    { version: '0.1.1', flags: /* @__PURE__ */ matrixPico_0_1_1_Flags() },
    { version: '0.1.2', flags: /* @__PURE__ */ matrixPico_0_1_2_Flags() },
  ],
}

function selectRow(
  type: 'visionos' | 'picoos',
  shellVersion: string,
): CapabilityVersionRow | null {
  const norm = parseSemverOrNull(shellVersion)
  if (!norm) return null
  const rows = CAPABILITY_TABLE[type]
  if (!rows.length) return null
  const sorted = [...rows].sort((a, b) => compareSemver(a.version, b.version))
  const minV = sorted[0].version
  if (compareSemver(norm, minV) < 0) return null

  let chosen: CapabilityVersionRow | null = null
  for (const row of sorted) {
    if (compareSemver(row.version, norm) <= 0) {
      chosen = row
    } else {
      break
    }
  }
  return chosen
}
