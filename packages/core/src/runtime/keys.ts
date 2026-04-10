/**
 * Canonical `supports(name)` keys (OpenSpec `review.md` §3).
 * Aliases are normalized before lookup (see `normalizeCapabilityName`).
 */

export const COMPONENT_KEYS = [
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

export const CSS_KEYS = [
  '-xr-background-material',
  '-xr-back',
  '-xr-depth',
  '-xr-transform',
] as const

export const GESTURE_KEYS = [
  'SpatialTapEvent',
  'SpatialDragStartEvent',
  'SpatialDragEvent',
  'SpatialDragEndEvent',
  'SpatialRotateEvent',
  'SpatialRotateEndEvent',
  'SpatialMagnifyEvent',
  'SpatialMagnifyEndEvent',
] as const

export const JS_SCENE_KEYS = [
  'useMetrics',
  'convertCoordinate',
  'initScene',
  'WindowScene',
  'VolumeScene',
] as const

export const DOM_DEPTH_KEYS = [
  'xrClientDepth',
  'xrOffsetBack',
  'xrInnerDepth',
  'xrOuterDepth',
] as const

/** PascalCase / string keys accepted by `supports()`. */
export const TOP_LEVEL_KEYS: readonly string[] = [
  ...COMPONENT_KEYS,
  ...CSS_KEYS,
  ...GESTURE_KEYS,
  ...JS_SCENE_KEYS,
  ...DOM_DEPTH_KEYS,
]

const ALIAS_TO_CANONICAL: Record<string, string> = {
  Box: 'BoxEntity',
  Sphere: 'SphereEntity',
  Cone: 'ConeEntity',
  Cylinder: 'CylinderEntity',
  Plane: 'PlaneEntity',
  World: 'SceneGraph',
}

export function normalizeCapabilityName(name: string): string {
  return ALIAS_TO_CANONICAL[name] ?? name
}

/** Known sub-tokens per canonical top-level `name` (AND semantics). */
export const SUB_TOKENS_BY_NAME: Readonly<Record<string, readonly string[]>> = {
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

export function isKnownTopLevel(name: string): boolean {
  return TOP_LEVEL_KEYS.includes(name)
}

export function isKnownSubToken(name: string, token: string): boolean {
  const allowed = SUB_TOKENS_BY_NAME[name]
  return allowed !== undefined && allowed.includes(token)
}
