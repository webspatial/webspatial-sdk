import { createSpatialSceneCommand } from './JSBCommand'
import { SceneOptions } from './types'

export type { SceneOptions }
export const defaultSceneConfig: SceneOptions = {
  defaultSize: {
    width: 900,
    height: 700,
  },
}

const INTERNAL_SCHEMA_PREFIX = 'webspatial://'
const originalOpen = window.open
export class SceneManager {
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

  private configMap: Record<string, SceneOptions> = {} // name=>config
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
    const cmd = new createSpatialSceneCommand(url!, cfg)
    const retWindowProxy = cmd.executeSync(() => {})

    if (typeof target === 'string' && this.configMap[target]) {
      delete this.configMap[target]
    }

    return retWindowProxy
  }
  initScene(name: string, callback: (pre: SceneOptions) => SceneOptions) {
    this.configMap[name] = callback({ ...defaultSceneConfig })
  }
}

export function initScene(
  name: string,
  callback: (pre: SceneOptions) => SceneOptions,
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
