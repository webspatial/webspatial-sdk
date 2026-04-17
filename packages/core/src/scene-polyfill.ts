import { createSpatialSceneCommand, FocusScene } from './JSBCommand'
import { SpatialScene } from './SpatialScene'
import {
  SpatialSceneCreationOptions,
  SpatialSceneType,
  SpatialSceneState,
  isValidSceneUnit,
  isValidSpatialSceneType,
  isValidWorldScalingType,
  isValidWorldAlignmentType,
  isValidBaseplateVisibilityType,
  PWAManifest,
  XRSpatialSceneConfig,
  XRSpatialSceneDefaults,
} from './types/types'
import { SpatialSceneCreationOptionsInternal } from './types/internal'
import { deepCloneJSON } from './utils'
import { pointToPhysical, physicalToPoint } from './physicalMetrics'

const defaultSceneConfig: SpatialSceneCreationOptions = {
  defaultSize: {
    width: 1280,
    height: 720,
  },
}

const defaultSceneConfigVolume: SpatialSceneCreationOptions = {
  defaultSize: {
    width: '0.94m',
    height: '0.94m',
    depth: '0.94m',
  },
}

let xr_window_defaults: SpatialSceneCreationOptions = {
  ...defaultSceneConfig,
}
let xr_volume_defaults: SpatialSceneCreationOptions = {
  ...defaultSceneConfigVolume,
}

const INTERNAL_SCHEMA_PREFIX = 'webspatial://'

/**
 * Deep-merge two plain object trees (no arrays, no special classes).
 * - Creates a shallow clone of base, then recursively merges properties from over.
 * - When both sides at a key are plain objects, merges recursively; otherwise, replaces with over.
 * - Ignores arrays (treated as replace).
 * Intended for small configuration objects like manifest overrides.
 */
function deepMergePlain<
  T extends Record<string, any>,
  U extends Record<string, any> | undefined,
>(base: T, over: U): T & (U extends undefined ? {} : U) {
  if (!over) return { ...(base || {}) } as any
  const out: any = { ...(base || {}) }
  for (const k of Object.keys(over)) {
    const bv = out[k]
    const ov = (over as any)[k]
    if (
      ov &&
      typeof ov === 'object' &&
      !Array.isArray(ov) &&
      bv &&
      typeof bv === 'object' &&
      !Array.isArray(bv)
    ) {
      out[k] = deepMergePlain(bv, ov)
    } else {
      out[k] = ov
    }
  }
  return out
}

/**
 * Normalize XRSpatialSceneDefaults (manifest shape) into SpatialSceneCreationOptions (runtime shape).
 * - Only remap default_size -> defaultSize when present.
 * - Leaves other keys (resizability, worldScaling, etc.) unchanged.
 * - Units are left as-is; downstream formatting is handled by formatSceneConfig.
 */
function normalizeXRDefaultsToSceneOptions(
  src: XRSpatialSceneDefaults | Record<string, any>,
): SpatialSceneCreationOptions {
  const out: any = { ...(src || {}) }
  const ds =
    (src as any).defaultSize !== undefined
      ? (src as any).defaultSize
      : (src as any).default_size
  if (ds !== undefined) {
    out.defaultSize = ds
  }
  if ('default_size' in out) {
    delete out.default_size
  }
  return out
}

class SceneManager {
  private originalOpen: any
  private static instance: SceneManager
  private manifestReady: Promise<void> | null = null
  static getInstance() {
    if (!SceneManager.instance) {
      SceneManager.instance = new SceneManager()
    }
    return SceneManager.instance
  }

  init(window: WindowProxy) {
    this.manifestReady = this.setupManifest()
    this.originalOpen = window.open.bind(window)
    ;(window as any).open = this.open
  }

  // Stores the latest formatted config used by the platform (per scene name).
  // This object contains normalized values and is safe for internal consumption.
  private configMap: Record<string, SpatialSceneCreationOptionsInternal> = {}
  // Stores the raw callback return value (per scene name) to feed into the next initScene call as `pre`.
  // We keep this unformatted so developers receive exactly what they last returned.
  private callbackReturnMap: Record<string, SpatialSceneCreationOptions> = {}
  private getConfig(name?: string) {
    if (name === undefined || !this.configMap[name]) return undefined
    return this.configMap[name]
  }

  waitManifest(): Promise<void> {
    return this.manifestReady ?? Promise.resolve()
  }

  // Ensure URL is absolute; only convert when a relative path is provided
  // - Keep external and special schemes untouched (http, https, data, blob, about, file, mailto, etc.)
  // - Handle protocol-relative URLs (//example.com/path)
  // - Resolve relative paths against document.baseURI (respects <base href>)
  private ensureAbsoluteUrl(raw?: string): string | undefined {
    if (!raw) return raw
    // Already has a scheme (includes internal webspatial:// which is handled earlier)
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) {
      return raw
    }
    // Protocol-relative URL
    if (raw.startsWith('//')) {
      return `${window.location.protocol}${raw}`
    }
    // Resolve against base URI
    try {
      return new URL(raw, document.baseURI).toString()
    } catch {
      // Fallback: leave unchanged
      return raw
    }
  }

  private async setupManifest() {
    const manifest = await this.getPWAManifest()
    try {
      const xr = manifest?.xr_spatial_scene
      if (!xr || typeof xr !== 'object') return
      const { overrides, ...topLevel } = xr as XRSpatialSceneConfig
      // Merge top-level defaults with per-scene overrides.
      const windowRaw = deepMergePlain(topLevel, overrides?.window_scene)
      const volumeRaw = deepMergePlain(topLevel, overrides?.volume_scene)
      const windowNext = normalizeXRDefaultsToSceneOptions(windowRaw)

      const volumeNext = normalizeXRDefaultsToSceneOptions(volumeRaw)
      if (windowNext && Object.keys(windowNext).length > 0) {
        xr_window_defaults = windowNext
      }
      if (volumeNext && Object.keys(volumeNext).length > 0) {
        xr_volume_defaults = volumeNext
      }
    } catch (error: any) {
      console.warn(
        'SceneManager.setupManifest failed; using built-in defaults.',
        error?.message || error,
      )
    }
  }

  private open = (url?: string, target?: string, features?: string) => {
    // bypass internal
    if (url?.startsWith(INTERNAL_SCHEMA_PREFIX)) {
      if (
        url.includes('createSpatialized2DElement') ||
        url.includes('createAttachment')
      ) {
        const token = //@ts-ignore
          (window.webSpatial || window.__webspatialShell__)?.genToken?.()
        if (token) {
          const command = url.includes('createAttachment')
            ? 'createAttachment'
            : 'createSpatialized2DElement'
          const host = window.location.host
          const protocol = window.location.protocol
          const finalURL = `${protocol}//${host}/${token}/?command=${command}`
          const rid = new URL(url).searchParams.get('rid')
          const final = new URL(finalURL)
          if (rid) final.searchParams.set('rid', rid)
          return this.originalOpen(final.toString(), target, features)
        }
      }
      return this.originalOpen(url, target, features)
    }

    // Normalize only relative URLs to absolute for platform handling
    url = this.ensureAbsoluteUrl(url)

    // if target is special
    if (target === '_self' || target === '_parent' || target === '_top') {
      const newWindow = this.originalOpen(url, target, features)
      return newWindow
    }

    let cfg = target ? this.getConfig(target) : undefined

    if (cfg === undefined) {
      // if no config, use default window config
      const preFormatted = deepCloneJSON(getSceneDefaultConfig('window'))

      const [ans] = formatSceneConfig(preFormatted, 'window')
      cfg = { ...ans, type: 'window' }
    }

    const cmd = new createSpatialSceneCommand(url!, cfg, target, features)
    const result = cmd.executeSync()

    const id = result.data?.id

    if (id) {
      // send JSB to focus
      let focusCmd = new FocusScene(id)
      focusCmd.execute()
    }

    return result.data?.windowProxy
  }
  initScene(
    name: string,
    callback: (pre: SpatialSceneCreationOptions) => SpatialSceneCreationOptions,
    options?: { type: SpatialSceneType },
  ) {
    const sceneType = options?.type ?? 'window'
    const defaultConfigRaw = getSceneDefaultConfig(sceneType)
    const previousOrDefault =
      this.callbackReturnMap[name] ??
      ((): SpatialSceneCreationOptions => {
        // Clone default config to avoid mutating shared defaults during formatting.
        const cloned = deepCloneJSON(defaultConfigRaw)
        return cloned
      })()
    const rawReturnVal = callback(previousOrDefault)
    const sanitizedReturnVal = sanitizeSceneOptionsUnits(
      deepCloneJSON(rawReturnVal),
    )
    const clonedForFormat = deepCloneJSON(sanitizedReturnVal)
    // Merge normalized user return with scene-type defaults before final formatting.
    // This ensures missing fields fall back to the appropriate xr_window_defaults / xr_volume_defaults.
    const baseDefaults = deepCloneJSON(getSceneDefaultConfig(sceneType))
    const mergedForFormat = deepMergePlain(baseDefaults, clonedForFormat)

    const [formattedConfig, errors] = formatSceneConfig(
      mergedForFormat,
      sceneType,
    )

    if (errors.length > 0) {
      console.warn(`initScene ${name} with errors: ${errors.join(', ')}`)
    }
    this.callbackReturnMap[name] = sanitizedReturnVal
    this.configMap[name] = {
      ...formattedConfig,
      type: sceneType,
    }
  }
  /**
   * Resolve and load a PWA manifest as JSON:
   * 1) Determine href:
   *    - Prefer explicit manifestUrl if provided;
   *    - Fallback to <link rel="manifest">, preferring the raw attribute over computed href.
   * 2) Normalize href to absolute using ensureAbsoluteUrl (respects <base href>).
   * 3) Handle data URLs inline:
   *    - data:...;base64,... â†’ atob then JSON.parse
   *    - data:...,... â†’ decodeURIComponent then JSON.parse
   * 4) Fetch with credentials same-origin first; if that fails (e.g., CORS), attempt unauthenticated fetch.
   * 5) Parse as JSON; if response body is text, parse the text as JSON.
   */
  async getPWAManifest(manifestUrl?: string): Promise<PWAManifest | undefined> {
    let href: string | undefined = manifestUrl
    if (!href) {
      const el = document.querySelector(
        'link[rel="manifest"]',
      ) as HTMLLinkElement | null
      href = el?.getAttribute('href') || el?.href
    }
    if (!href) return
    href = this.ensureAbsoluteUrl(href)
    if (!href) return
    if (href.startsWith('data:')) {
      // Inline data URL manifest: data:[<mediatype>][;base64],<data>
      try {
        const comma = href.indexOf(',')
        if (comma < 0) return
        const meta = href.slice(5, comma)
        const data = href.slice(comma + 1)
        const isBase64 = /;base64/i.test(meta)
        const decoded = isBase64 ? atob(data) : decodeURIComponent(data)
        return JSON.parse(decoded)
      } catch {
        return
      }
    }
    try {
      // Same-origin fetch with credentials first.
      const res = await fetch(href, { credentials: 'same-origin' })
      if (!res.ok) throw new Error(String(res.status))
      try {
        return await res.json()
      } catch {
        const t = await res.text()
        return JSON.parse(t)
      }
    } catch {
      try {
        // Fallback: unauthenticated fetch (may help when same-origin credentials fail due to CORS).
        const res = await fetch(href)
        if (!res.ok) return
        try {
          return await res.json()
        } catch {
          const t = await res.text()
          return JSON.parse(t)
        }
      } catch {
        return
      }
    }
  }
}

function sanitizeSceneOptionsUnits(
  val: SpatialSceneCreationOptions,
): SpatialSceneCreationOptions {
  if (val?.defaultSize) {
    const keys = ['width', 'height', 'depth'] as const
    for (const k of keys) {
      if (
        k in (val.defaultSize as any) &&
        !isValidSceneUnit((val.defaultSize as any)[k])
      ) {
        delete (val.defaultSize as any)[k]
      }
    }
  }
  if (val?.resizability) {
    const keys = ['minWidth', 'minHeight', 'maxWidth', 'maxHeight'] as const
    for (const k of keys) {
      if (
        k in (val.resizability as any) &&
        !isValidSceneUnit((val.resizability as any)[k])
      ) {
        delete (val.resizability as any)[k]
      }
    }
  }
  return val
}

function pxToMeter(px: number): number {
  return pointToPhysical(px)
}

function meterToPx(meter: number): number {
  return physicalToPoint(meter)
}

function formatToNumber(
  str: string | number,
  targetUnit: 'px' | 'm',
  defaultUnit: 'px' | 'm',
): number {
  if (typeof str === 'number') {
    if (
      (defaultUnit === 'px' && targetUnit === 'px') ||
      (defaultUnit === 'm' && targetUnit === 'm')
    ) {
      return str
    }
    // unit not match target
    if (defaultUnit === 'px' && targetUnit === 'm') {
      return pxToMeter(str)
    } else if (defaultUnit === 'm' && targetUnit === 'px') {
      return meterToPx(str)
    }
    // fallback
    return str
  }
  if (targetUnit === 'm') {
    if (str.endsWith('m')) {
      // 1m
      return Number(str.slice(0, -1))
    } else if (str.endsWith('px')) {
      // 100px
      return pxToMeter(Number(str.slice(0, -2)))
    } else {
      throw new Error('formatToNumber: invalid str')
    }
  } else if (targetUnit === 'px') {
    if (str.endsWith('px')) {
      // 100px
      return Number(str.slice(0, -2))
    } else if (str.endsWith('m')) {
      // 1m
      return meterToPx(Number(str.slice(0, -1)))
    } else {
      throw new Error('formatToNumber: invalid str')
    }
  } else {
    throw new Error('formatToNumber: invalid targetUnit')
  }
}

export function formatSceneConfig(
  config: SpatialSceneCreationOptions,
  sceneType: SpatialSceneType,
): [SpatialSceneCreationOptions, string[]] {
  // defaultSize and resizability's width/height/depth can be 100 or "100px" or "1m"
  // expect:
  // resizability should format into px
  // defaultSize should format into px if window
  // defaultSize should format into m if volume

  const defaultSceneConfig = getSceneDefaultConfig(sceneType)

  const errors: string[] = []

  const isWindow = sceneType === 'window'
  if (!isValidSpatialSceneType(sceneType)) {
    errors.push(`sceneType`)
  }

  // format defaultSize
  if (config.defaultSize) {
    const iterKeys = ['width', 'height', 'depth']
    for (let k of iterKeys) {
      if (!(k in config.defaultSize)) continue
      if (isValidSceneUnit((config.defaultSize as any)[k])) {
        ;(config.defaultSize as any)[k] = formatToNumber(
          (config.defaultSize as any)[k],
          isWindow ? 'px' : 'm',
          'px',
        )
      } else {
        // delete invalid unit
        delete (config.defaultSize as any)[k]
        errors.push(`defaultSize.${k}`)
      }
    }
  }

  // format resizability
  if (config.resizability) {
    const iterKeys = ['minWidth', 'minHeight', 'maxWidth', 'maxHeight']
    for (let k of iterKeys) {
      if (!(k in config.resizability)) continue
      if (isValidSceneUnit((config.resizability as any)[k])) {
        ;(config.resizability as any)[k] = formatToNumber(
          (config.resizability as any)[k],
          'px',
          'px',
        )
      } else {
        // delete invalid unit
        delete (config.resizability as any)[k]
        errors.push(`resizability.${k}`)
      }
    }
  }

  // check value
  if (config.worldScaling) {
    if (!isValidWorldScalingType(config.worldScaling)) {
      config.worldScaling = 'automatic'
      errors.push('worldScaling')
    }
  }

  if (config.worldAlignment) {
    if (!isValidWorldAlignmentType(config.worldAlignment)) {
      config.worldAlignment = 'automatic'
      errors.push('worldAlignment')
    }
  }

  if (config.baseplateVisibility) {
    if (!isValidBaseplateVisibilityType(config.baseplateVisibility)) {
      config.baseplateVisibility = 'automatic'
      errors.push('baseplateVisibility')
    }
  }

  return [config, errors]
}

export function initScene(
  name: string,
  callback: (pre: SpatialSceneCreationOptions) => SpatialSceneCreationOptions,
  options?: { type: SpatialSceneType },
) {
  return SceneManager.getInstance().initScene(name, callback, options)
}

export function __getSceneConfigSnapshotForTest(
  name: string,
): SpatialSceneCreationOptionsInternal | undefined {
  const mgr = SceneManager.getInstance() as any
  return mgr?.configMap?.[name]
}

export function hijackWindowOpen(window: WindowProxy) {
  SceneManager.getInstance().init(window)
}

export function hijackWindowATag(openedWindow: WindowProxy) {
  openedWindow!.document.onclick = function (e) {
    let element = e.target as HTMLElement | null
    let found = false

    // Look for <a> element in the clicked elements parents and if found override navigation behavior if needed
    while (!found) {
      if (element && element.tagName == 'A') {
        // When using libraries like react route's <Link> it sets an onclick event, when this happens we should do nothing and let that occur

        // if onClick is set for the element, the raw onclick will be noop() trapped so the onclick check is no longer trustable
        // we handle all the scenarios

        if (handleATag(e)) {
          return false // prevent default action and stop event propagation
        }

        return true
      }
      if (element && element.parentElement) {
        element = element.parentElement
      } else {
        break
      }
    }
  }
}

function handleATag(event: MouseEvent) {
  const targetElement = event.target as HTMLElement
  if (targetElement.tagName === 'A') {
    const link = targetElement as HTMLAnchorElement
    const target = link.target
    const url = link.href

    if (target && target !== '_self') {
      event.preventDefault()
      window.open(url, target)
      return true
    }
  }
}

function getSceneDefaultConfig(sceneType: SpatialSceneType) {
  return sceneType === 'window'
    ? xr_window_defaults || defaultSceneConfig
    : xr_volume_defaults || defaultSceneConfigVolume
}

async function injectScenePolyfill() {
  if (!window.opener) return

  const state = await SpatialScene.getInstance().getState()

  // only run this in pending state
  if (state !== SpatialSceneState.pending) return

  function onContentLoaded(callback: any) {
    if (
      document.readyState === 'interactive' ||
      document.readyState === 'complete'
    ) {
      callback()
    } else {
      document.addEventListener('DOMContentLoaded', callback)
    }
  }

  onContentLoaded(async () => {
    await SceneManager.getInstance().waitManifest()
    const sceneType = window.xrCurrentSceneType ?? 'window'
    const rawDefault = getSceneDefaultConfig(sceneType)
    // Provide a formatted 'pre' to the callback for consistent units and types.
    const pre = deepCloneJSON(rawDefault)

    let cfg = pre
    if (typeof window.xrCurrentSceneDefaults === 'function') {
      try {
        cfg = await window.xrCurrentSceneDefaults?.(pre)
      } catch (error) {
        console.error(error)
      }
    }
    // fixme: this duration is too short so that hide and show is at racing, so add a little delay to avoid
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(null)
      }, 1000)
    })

    // Merge callback return with base defaults to ensure missing fields are filled.
    const mergedCfg = deepMergePlain(deepCloneJSON(rawDefault), cfg)
    const [formattedConfig, errors] = formatSceneConfig(mergedCfg, sceneType)
    if (errors.length > 0) {
      console.warn(
        `window.xrCurrentSceneDefaults with errors: ${errors.join(', ')}`,
      )
    }
    const finalCfg = {
      ...formattedConfig,
      type: sceneType,
    }
    await SpatialScene.getInstance().updateSceneCreationConfig(finalCfg)
  })
}

export function injectSceneHook() {
  hijackWindowOpen(window)
  hijackWindowATag(window)
  injectScenePolyfill()
}
