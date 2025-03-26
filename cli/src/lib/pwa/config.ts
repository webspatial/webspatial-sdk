import { parseRouter } from '../utils/utils'
import { validateURL } from './validate'
import { join, normalize, relative, resolve } from 'path'

export function configId(
  manifestJson: Record<string, any>,
  bundleId: string,
  isDev: boolean,
) {
  if (isDev) {
    manifestJson.id = 'com.WebSpatial.test'
  } else if (bundleId) {
    manifestJson.id = bundleId
  } else {
    const url = new URL(manifestJson.id)
    let arr = url.host.split('.').reverse()
    manifestJson.id = arr.join('.')
  }
}

export function configStartUrl(
  manifestJson: Record<string, any>,
  base: string,
) {
  const isStartUrl = validateURL(manifestJson.start_url)
  const isBaseUrl = validateURL(base)
  let start_url = manifestJson.start_url
  if (!isStartUrl && !isBaseUrl) {
    const staticWebRoot = resolve('./static-web')
    const resolvedPath = resolve(staticWebRoot, base, start_url)
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
  return start_url
}

export function configScope(manifestJson: Record<string, any>) {
  let scope = manifestJson.scope ?? ''
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
  if (display !== 'minimal-ui' && display !== 'standalone') {
    display = 'standalone'
  }
  if (
    manifestJson.display_override &&
    manifestJson.display_override.length > 0
  ) {
    const mIndex = manifestJson.display_override.indexOf('minimal-ui')
    const sIndex = manifestJson.display_override.indexOf('standalone')
    if (mIndex >= 0 && sIndex >= 0) {
      display = sIndex > mIndex ? 'standalone' : 'minimal-ui'
    } else if (mIndex >= 0) {
      display = 'minimal-ui'
    } else if (sIndex >= 0) {
      display = 'standalone'
    }
  }
  manifestJson.display = display
}

export function configMainScene(manifestJson: Record<string, any>) {
  const resizabilities = ['automatic', 'contentMinSize', 'contentSize']
  let mainScene = {
    defaultSize: {
      width: 1280,
      height: 1280,
    },
    resizability: 'automatic',
  }
  if (manifestJson.xr_main_scene) {
    if (typeof manifestJson.xr_main_scene === 'object') {
      mainScene.defaultSize.width =
        Number(manifestJson.xr_main_scene.default_size?.width) > 0
          ? manifestJson.xr_main_scene.default_size.width
          : 1280
      mainScene.defaultSize.height =
        Number(manifestJson.xr_main_scene.default_size?.height) > 0
          ? manifestJson.xr_main_scene.default_size.height
          : 1280
      mainScene.resizability = resizabilities.includes(
        manifestJson.xr_main_scene.resizability,
      )
        ? manifestJson.xr_main_scene.resizability
        : 'automatic'

      manifestJson.mainScene = mainScene
    } else if (typeof manifestJson.xr_main_scene === 'string') {
      manifestJson.mainScene = 'dynamic' // only support this
    }
    // other type like string should be ignored
  }
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
