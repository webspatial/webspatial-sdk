import { WindowGroupOptions } from '@xrsdk/runtime/'
import { getSession } from './utils/getSession'

export const defaultSceneConfig: WindowGroupOptions = {
  defaultSize: {
    width: 900,
    height: 700,
  },
  resizability: 'automatic',
}

const CONTEXT_WINDOW_URL = 'webspatial://createContextWindow'
const originalOpen = window.open
export class XRApp {
  private static instance: XRApp
  static getInstance() {
    if (!XRApp.instance) {
      XRApp.instance = new XRApp()
    }
    return XRApp.instance
  }
  init() {
    ;(window as any).open = this.open
  }
  deinit() {
    ;(window as any).open = originalOpen
  }
  private configMap: Record<string, WindowGroupOptions> = {} // name=>config
  private getConfig(name?: string) {
    if (name === undefined || !this.configMap[name]) return undefined
    return this.configMap[name]
  }

  // This not work for some reason, use raw JSB instead
  // async show(windowID:string, cfg: WindowGroupOptions) {
  //   try {
  //     let session = getSession()!
  //     await session.createWindowGroup(
  //       'Plain', // only support Plain for now
  //       {
  //         sceneData: {
  //           method: 'showRoot',
  //           sceneConfig: cfg,
  //           // url: url,
  //           windowID
  //         },
  //       },
  //     )
  //   } catch (error) {
  //     console.error(error)
  //   }
  // }
  open = (url?: string, target?: string, features?: string) => {
    const newWindow = originalOpen(url, target, features)
    if (url === CONTEXT_WINDOW_URL) return newWindow
    // if target is special
    if (target === '_self' || target === '_parent' || target === '_top') {
      return newWindow
    }
    // should open new scene or focus to
    // make sure _webSpatialID exist
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
            await session.createWindowGroup(
              'Plain', // only support Plain for now
              {
                sceneData: {
                  method: 'createRoot',
                  sceneConfig: cfg,
                  url: url,
                  windowID: (newWindow as any)._webSpatialID,
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
