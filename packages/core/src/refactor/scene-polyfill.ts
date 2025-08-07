import { createSpatialSceneCommand, FocusScene } from './JSBCommand'
import { SpatialScene } from './SpatialScene'
import { SpatialSceneCreationOptions, SpatialSceneStateKind } from './types'

const defaultSceneConfig: SpatialSceneCreationOptions = {
  defaultSize: {
    width: 900,
    height: 700,
  },
}

const INTERNAL_SCHEMA_PREFIX = 'webspatial://'
const originalOpen = window.open

class SceneManager {
  private static instance: SceneManager
  static getInstance() {
    if (!SceneManager.instance) {
      SceneManager.instance = new SceneManager()
    }
    return SceneManager.instance
  }

  init(window: WindowProxy) {
    ;(window as any).open = this.open
  }

  private configMap: Record<string, SpatialSceneCreationOptions> = {} // name=>config
  private getConfig(name?: string) {
    if (name === undefined || !this.configMap[name]) return undefined
    return this.configMap[name]
  }

  private open = (url?: string, target?: string, features?: string) => {
    // bypass internal
    if (url?.startsWith(INTERNAL_SCHEMA_PREFIX)) {
      return originalOpen(url, target, features)
    }

    // if target is special
    if (target === '_self' || target === '_parent' || target === '_top') {
      const newWindow = originalOpen(url, target, features)
      return newWindow
    }

    const cfg = target ? this.getConfig(target) : undefined
    const cmd = new createSpatialSceneCommand(url!, cfg, target, features)
    const result = cmd.executeSync()

    if (typeof target === 'string' && this.configMap[target]) {
      delete this.configMap[target]
    }

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
  ) {
    this.configMap[name] = callback({ ...defaultSceneConfig })
  }
}

export function initScene(
  name: string,
  callback: (pre: SpatialSceneCreationOptions) => SpatialSceneCreationOptions,
) {
  return SceneManager.getInstance().initScene(name, callback)
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
        handleATag(e)

        return false // prevent default action and stop event propagation
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
    }
  }
}

async function injectScenePolyfill() {
  if (!window.opener) return

  const state = await SpatialScene.getInstance().getState()

  // only run this in pending state
  if (state !== SpatialSceneStateKind.pending) return


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
    let cfg = defaultSceneConfig
    if (typeof (window as any).xrCurrentSceneDefaults === 'function') {
      try {
        cfg = await (window as any).xrCurrentSceneDefaults?.()
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
    await SpatialScene.getInstance().updateSceneCreationConfig(cfg)
  })
}

export function injectSceneHook() {
  hijackWindowOpen(window)
  hijackWindowATag(window)
  injectScenePolyfill()
}
