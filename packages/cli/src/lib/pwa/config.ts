import {
  defaultSceneConfig,
  defaultSceneConfigVolume,
  formatToNumber,
  isValidBaseplateVisibilityType,
  isValidSceneUnit,
  isValidWorldAlignmentType,
  isValidWorldScalingType,
  SpatialSceneCreationOptionsInternal,
} from '../utils/sceneUtils'
import { parseRouter } from '../utils/utils'
import { validateURL } from './validate'
import { join, normalize, relative, resolve } from 'path'

export function configId(manifestJson: Record<string, any>, bundleId: string) {
  if (bundleId) {
    manifestJson.id = bundleId
  } else {
    try {
      const url = new URL(manifestJson.id)
      let arr = url.host.split('.').reverse()
      manifestJson.id = arr.join('.')
    } catch (e) {
      throw new Error(`id:${manifestJson.id}  is not a valid url`)
    }
  }
}

export function configStartUrl(
  manifestJson: Record<string, any>,
  base: string,
  manifestUrl: string,
  isNet: boolean,
) {
  let start_url = manifestJson.start_url ?? '/'

  const isStartUrl = validateURL(start_url)
  const hasBase = base.length > 0
  if (hasBase) {
    const isBaseUrl = validateURL(base)
    if (!isStartUrl && !isBaseUrl) {
      const staticWebRoot = resolve('./static-web')
      const resolvedPath = join(base, start_url)
      const normalizedPath = normalize(resolvedPath)
      const safePath = join(staticWebRoot, normalizedPath)
      start_url = relative(process.cwd(), safePath)
        .replace(/^(\.\.\/)+/, './')
        .replace(/\/$/, '')
    } else if (isStartUrl && !isBaseUrl) {
      const startUrl = new URL(start_url)
      const fullPath = startUrl.pathname + startUrl.search + startUrl.hash
      let newBase = new URL(base, startUrl.origin)
      start_url = new URL(fullPath, newBase).href
    } else if (!isStartUrl && isBaseUrl) {
      if (start_url.startsWith('/')) {
        const baseUrl = new URL(base)
        start_url = baseUrl.origin + join(baseUrl.pathname, start_url)
      } else {
        start_url = new URL(start_url, base).href
      }
    } else if (isStartUrl && isBaseUrl) {
      const startUrl = new URL(start_url)
      const baseUrl = new URL(base)
      const startFullPath = startUrl.pathname + startUrl.search + startUrl.hash
      start_url = new URL(startFullPath, baseUrl.origin + baseUrl.pathname).href
    }
  } else {
    if (isNet) {
      const murl = new URL(manifestUrl)
      if (!isStartUrl) {
        const newStartUrl = new URL(start_url, murl.origin)
        start_url = newStartUrl.href
      } else {
        const startUrl = new URL(start_url)
        start_url =
          murl.origin + startUrl.pathname + startUrl.search + startUrl.hash
      }
    } else if (!isStartUrl) {
      const staticWebRoot = resolve('./static-web')
      const resolvedPath = resolve(staticWebRoot, start_url)
      const normalizedPath = normalize(resolvedPath)
      const safePath = join(staticWebRoot, normalizedPath)
      start_url = relative(process.cwd(), safePath)
        .replace(/^(\.\.\/)+/, './')
        .replace(/\/$/, '')
    }
  }

  if (
    !start_url.match(/\.html(\?|$)/) &&
    !(start_url.startsWith('http://') || start_url.startsWith('https://'))
  ) {
    const [path, query] = start_url.split('?')
    start_url = path.endsWith('/') ? `${path}index.html` : `${path}/index.html`
    if (query) start_url += `?${query}`
  }

  return start_url
}

export function configScope(manifestJson: Record<string, any>) {
  let scope = manifestJson.scope ?? '/'
  const isStartUrl = validateURL(manifestJson.start_url)
  const isUrl = validateURL(scope)
  if (isStartUrl && isUrl) {
    const scopeURL = new URL(scope)
    const startURL = new URL(manifestJson.start_url)
    if (
      scopeURL.host !== startURL.host ||
      manifestJson.start_url.indexOf(scope) !== 0
    ) {
      scope = parseRouter(manifestJson.start_url)
    }
  } else if (isStartUrl && !isUrl) {
    scope = new URL(scope, manifestJson.start_url).href
  } else if (!isStartUrl && isUrl) {
    const cleanPath = manifestJson.start_url.replace(/\/[^\/]+$/, '')
    scope = normalize(cleanPath + '/')
  } else {
    scope = join(parseRouter(manifestJson.start_url), scope)
  }
  manifestJson.scope = scope
}

export function configDisplay(manifestJson: Record<string, any>) {
  let display = manifestJson.display
  const modes = ['minimal-ui', 'standalone', 'fullscreen']
  if (!modes.includes(display)) {
    display = 'standalone'
  }
  if (
    manifestJson.display_override &&
    manifestJson.display_override.length > 0
  ) {
    const validModes = manifestJson.display_override
      .map((mode: string, index: number) => ({ mode, index }))
      .filter(({ mode }: { mode: string }) => modes.includes(mode))
      .sort((a: any, b: any) => a.index - b.index)

    if (validModes.length > 0) {
      display = validModes[0].mode
    }
  }
  manifestJson.display = display
}

export function configMainScene(manifestJson: Record<string, any>) {
  let mainScene: SpatialSceneCreationOptionsInternal = {
    ...defaultSceneConfig,
    resizability: {} as any,
    type: 'window',
    worldScaling: 'automatic',
    worldAlignment: 'automatic',
    baseplateVisibility: 'automatic',
  }

  // set type
  if (manifestJson.xr_main_scene?.type == 'volume') {
    mainScene.type = 'volume'
  }

  // set default value by type
  if (mainScene.type == 'volume') {
    mainScene = {
      ...mainScene,
      ...defaultSceneConfigVolume,
    }
  }

  let hasResizability = false
  if (
    manifestJson.xr_main_scene &&
    typeof manifestJson.xr_main_scene === 'object'
  ) {
    let defaultSizeKeys = ['width', 'height', 'depth']

    for (let k of defaultSizeKeys) {
      if (isValidSceneUnit(manifestJson.xr_main_scene.default_size?.[k])) {
        ;(mainScene.defaultSize as any)[k] = formatToNumber(
          manifestJson.xr_main_scene.default_size?.[k],
          mainScene.type === 'window' ? 'px' : 'm',
          mainScene.type === 'window' ? 'px' : 'm',
        )
      } else {
        console.warn('invalid defaultSize type')
      }
    }

    if (typeof manifestJson.xr_main_scene.resizability === 'object') {
      const resizabilities = ['minWidth', 'minHeight', 'maxWidth', 'maxHeight']
      for (var i = 0; i < resizabilities.length; i++) {
        if (
          isValidSceneUnit(
            manifestJson.xr_main_scene.resizability[resizabilities[i]],
          )
        ) {
          hasResizability = true
          //@ts-ignore
          mainScene.resizability[resizabilities[i]] = formatToNumber(
            manifestJson.xr_main_scene.resizability[resizabilities[i]],
            'px',
            mainScene.type === 'window' ? 'px' : 'm',
          )
        } else {
          console.warn('invalid resizability type')
        }
      }
    }
  }
  if (!hasResizability) {
    mainScene.resizability = undefined
  }

  if (isValidWorldScalingType(manifestJson.xr_main_scene?.worldScaling)) {
    mainScene.worldScaling = manifestJson.xr_main_scene.worldScaling
  } else {
    console.warn('invalid worldScaling type')
  }

  if (isValidWorldAlignmentType(manifestJson.xr_main_scene?.worldAlignment)) {
    mainScene.worldAlignment = manifestJson.xr_main_scene.worldAlignment
  } else {
    console.warn('invalid worldAlignment type')
  }

  if (
    isValidBaseplateVisibilityType(
      manifestJson.xr_main_scene?.baseplateVisibility,
    )
  ) {
    mainScene.baseplateVisibility =
      manifestJson.xr_main_scene.baseplateVisibility
  } else {
    console.warn('invalid baseplateVisibility type')
  }

  manifestJson.xr_main_scene = mainScene
}

export function configDeeplink(manifestJson: Record<string, any>) {
  if (
    manifestJson.protocol_handlers &&
    manifestJson.protocol_handlers.length > 0
  ) {
    for (var i = 0; i < manifestJson.protocol_handlers.length; i++) {
      const item = manifestJson.protocol_handlers[i]
      // The DeepLink protocol must be on the security list or start with web+
      if (
        item.protocol &&
        (safelist.includes(item.protocol) ||
          item.protocol.indexOf('web+') === 0)
      ) {
        // If the URL is an absolute path, it must be within the scope range
        if (
          !(validateURL(item.url) && item.url.indexOf(manifestJson.scope) < 0)
        )
          continue
      }
      manifestJson.protocol_handlers.splice(i, 1)
      i--
    }
  }
}

export const safelist = [
  'bitcoin',
  'ftp',
  'ftps',
  'geo',
  'im',
  'irc',
  'ircs',
  'magnet',
  'mailto',
  'matrix',
  'mms',
  'news',
  'nntp',
  'openpgp4fpr',
  'sftp',
  'sip',
  'sms',
  'smsto',
  'ssh',
  'tel',
  'urn',
  'webcal',
  'wtai',
  'xmpp',
]
