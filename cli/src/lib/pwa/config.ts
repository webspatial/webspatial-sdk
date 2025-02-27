import { parseRouter } from '../utils/utils'
import { validateURL } from './validate'
import { join } from 'path'

export function configId(manifestJson: Record<string, any>) {
  if (!manifestJson.id) {
    manifestJson.id = manifestJson.start_url
  }
}

export function configStartUrl(
  manifestJson: Record<string, any>,
  manifestUrl: string,
  fromNet: boolean,
) {
  const isUrl = validateURL(manifestJson.start_url)
  let start_url = manifestJson.start_url
  // todo: Supplement according to the suffix .html
  if (fromNet) {
    if (!isUrl) {
      start_url = join(parseRouter(manifestUrl), manifestJson.start_url)
    }
  } else {
    if (!isUrl) {
      start_url = join('./static-web', manifestJson.start_url)
    }
  }
  manifestJson.start_url = start_url
}

export function configScope(
  manifestJson: Record<string, any>,
  fromNet: boolean,
) {
  let scope = ''
  const isUrl = validateURL(manifestJson.scope)
  if (fromNet && isUrl) {
    const scopeURL = new URL(manifestJson.scope)
    const startURL = new URL(manifestJson.start_url)
    if (
      scopeURL.host !== startURL.host ||
      manifestJson.start_url.indexOf(scope) !== 0
    ) {
      scope = parseRouter(manifestJson.start_url)
    }
  } else {
    scope = join(parseRouter(manifestJson.start_url), manifestJson.scope)
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
  if (manifestJson.mainScene) {
    mainScene.defaultSize.width =
      Number(manifestJson.mainScene.defaultSize?.width) > 0
        ? manifestJson.mainScene.defaultSize.width
        : 1280
    mainScene.defaultSize.height =
      Number(manifestJson.mainScene.defaultSize?.height) > 0
        ? manifestJson.mainScene.defaultSize.height
        : 1280
    mainScene.resizability = resizabilities.includes(
      manifestJson.mainScene.resizability,
    )
      ? manifestJson.mainScene.resizability
      : 'automatic'
  }
  manifestJson.mainScene = mainScene
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
