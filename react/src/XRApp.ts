import { WindowGroupOptions } from '@xrsdk/runtime/'
import { getSession } from './utils/getSession'

export const defaultSceneConfig: WindowGroupOptions = {
  defaultSize: {
    width: 100,
    height: 1000,
  },
  resizability: 'automatic',
}

const CONTEXT_WINDOW_URL = 'webspatial://createWindowContext'
const originalOpen = window.open
export class XRApp {
  private static instance: XRApp
  static getInstance() {
    if (!XRApp.instance) {
      XRApp.instance = new XRApp()
    }
    return XRApp.instance
  }

  handleATag(event: MouseEvent) {
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
  init() {
    ;(window as any).open = this.open

    document.addEventListener('click', this.handleATag)
  }
  deinit() {
    ;(window as any).open = originalOpen

    document.removeEventListener('click', this.handleATag)
  }
  private configMap: Record<string, WindowGroupOptions> = {} // name=>config
  private getConfig(name?: string) {
    if (name === undefined || !this.configMap[name]) return undefined
    return this.configMap[name]
  }

  async show(window: Window, cfg: WindowGroupOptions) {
    try {
      let session = getSession()!
      await session._createScene(
        'Plain', // only support Plain for now
        {
          sceneData: {
            method: 'showRoot',
            sceneConfig: cfg,
            // url: url,
            window,
          },
        },
      )
    } catch (error) {
      console.error(error)
    }
  }
  open = (url?: string, target?: string, features?: string) => {
    const newWindow = originalOpen(url, target, features)
    if (url === CONTEXT_WINDOW_URL) return newWindow
    // if target is special
    if (target === '_self' || target === '_parent' || target === '_top') {
      return newWindow
    }
    // should open new scene or focus to

    // _webSpatialID is assigned for the new webview
    // timer to check _webSpatialID exist
    let cnt = 2
    let timer = setInterval(async () => {
      cnt -= 1
      if (cnt < 0) {
        clearInterval(timer)
        return
      }
      // native should createRoot if it see the windowID for the first time
      // otherwise should focus to
      if ((newWindow as any)._webSpatialID) {
        clearInterval(timer)
        // fixme:
        let session = getSession()
        if (!session) {
          console.error('no session')
        } else {
          const cfg = this.getConfig(target)
          try {
            await session._createScene(
              'Plain', // only support Plain for now
              {
                sceneData: {
                  method: 'createRoot',
                  sceneConfig: cfg,
                  url: url,
                  window: newWindow!,
                  // windowID: (newWindow as any)._webSpatialID,
                  // windowGroupID: (newWindow as any)._webSpatialGroupID,
                },
              },
            )
            // remove config after use
            if (typeof target === 'string' && this.configMap[target]) {
              delete this.configMap[target]
            }
          } catch (error) {
            console.error(error)
          }
        }
      }
    }, 0)
    return newWindow
  }
  initScene(
    name: string,
    callback: (pre: WindowGroupOptions) => WindowGroupOptions,
  ) {
    this.configMap[name] = callback({ ...defaultSceneConfig })
  }
}

export function initScene(
  name: string,
  callback: (pre: WindowGroupOptions) => WindowGroupOptions,
) {
  return XRApp.getInstance().initScene(name, callback)
}
