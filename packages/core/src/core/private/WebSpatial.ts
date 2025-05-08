import { RemoteCommand } from './remote-command'
import {
  WindowStyle,
  WindowContainerOptions,
  LoadingMethodKind,
  sceneDataShape,
  sceneDataJSBShape,
} from '../types'

declare global {
  interface Window {
    // Location for webspatial custom functions
    __WebSpatialData: {
      androidNativeMessage: Function
      getNativeVersion: Function
    }

    // Location for webspatial internal callbacks (eg. completion events)
    __SpatialWebEvent: Function

    // Used to access webkit specific api
    webkit: any

    // Marks the page as unloaded so it doesn't send additional events
    __WebSpatialUnloaded: boolean

    // Internal id information mapping to internal state about the native window
    _webSpatialID: string
    _webSpatialGroupID: string
    _webSpatialParentGroupID: string

    // Will be removed in favor of __WebSpatialData
    WebSpatailNativeVersion: string
  }
}

export class WindowContainer {
  id = ''
}

export class WebSpatialResource {
  id = ''
  windowContainerId = ''
  data = {} as any

  receiveEvent() {}
}

export class WebSpatial {
  public static eventPromises: any = {}

  public static transactionStarted = false
  public static transactionCommands = Array<RemoteCommand>()

  // store event receivers
  private static eventReceivers: { [resourceId: string]: (data: any) => void } =
    {}

  public static registerEventReceiver(
    resourceId: string,
    callback: (data: any) => void,
  ) {
    this.eventReceivers[resourceId] = callback
  }

  public static unregisterEventReceiver(resourceId: string) {
    delete this.eventReceivers[resourceId]
  }

  static init() {
    window.__SpatialWebEvent = (e: any) => {
      if (e.resourceId) {
        var callback = WebSpatial.eventReceivers[e.resourceId]
        callback(e.data)
      } else {
        var p = WebSpatial.eventPromises[e.requestID]
        if (p) {
          if (e.success) {
            p.res(e)
          } else {
            p.rej(e)
          }
        }
      }
    }
  }

  static startTransaction() {
    WebSpatial.transactionStarted = true
    WebSpatial.transactionCommands = []
  }

  static async sendTransaction() {
    WebSpatial.transactionStarted = false
    var cmd = new RemoteCommand('multiCommand', {
      commandList: WebSpatial.transactionCommands,
    })

    var result = await new Promise((res, rej) => {
      WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
      WebSpatial.sendCommand(cmd)
    })
    return result
  }

  static getBackend() {
    if (window.webkit) {
      return 'AVP'
    } else {
      return 'UNKNOWN'
    }
  }

  static async sendCommand(cmd: RemoteCommand) {
    if (window.__WebSpatialUnloaded) {
      return
    }
    if (WebSpatial.transactionStarted) {
      WebSpatial.transactionCommands.push(cmd as any)
      return
    }

    var msg = JSON.stringify(cmd)

    if (WebSpatial.getBackend() == 'AVP') {
      window.webkit.messageHandlers.bridge.postMessage(msg)
      return
    } else {
      window.__WebSpatialData.androidNativeMessage(msg)
      return
    }
  }

  static getImmersiveWindowContainer() {
    var wg = new WindowContainer()
    wg.id = 'Immersive'
    return wg
  }

  static getCurrentWindowContainer() {
    var wg = new WindowContainer()
    wg.id = 'current'
    return wg
  }

  static getCurrentWebPanel() {
    var wg = new WebSpatialResource()
    wg.id = 'current'
    wg.windowContainerId = WebSpatial.getCurrentWindowContainer().id
    return wg
  }

  static async createScene(
    style: WindowStyle = 'Plain',
    cfg: {
      sceneData: sceneDataShape
    },
  ) {
    const { window: newWindow, ...sceneData } = cfg.sceneData
    const jsbSceneData: sceneDataJSBShape = {
      ...sceneData,
      windowID: newWindow._webSpatialID,
      windowContainerID: newWindow._webSpatialGroupID,
    }
    var cmd = new RemoteCommand('createScene', {
      windowStyle: style,
      sceneData: jsbSceneData,
      windowContainerID: window._webSpatialParentGroupID, // parent WindowContainerID
    })

    try {
      await new Promise((res, rej) => {
        WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
        WebSpatial.sendCommand(cmd)
      })
      return true
    } catch (error) {
      return false
    }
  }

  static async createWindowContainer(
    style: WindowStyle = 'Plain',
    windowContainer: WindowContainer | null,
    parentWebView: WebSpatialResource | null,
  ) {
    var cmd = new RemoteCommand('createWindowContainer', {
      windowStyle: style,
      windowContainerID: windowContainer ? windowContainer.id : undefined,
      resourceID: parentWebView ? parentWebView.id : undefined,
    })

    var result = await new Promise((res, rej) => {
      WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
      WebSpatial.sendCommand(cmd)
    })
    var res = new WindowContainer()
    res.id = (result as any).data.createdID
    return res
  }

  static async destroyResource(resource: WebSpatialResource) {
    const data = {}
    var cmd = new RemoteCommand('destroyResource', {
      windowContainerID: resource.windowContainerId,
      resourceID: resource.id,
    })

    WebSpatial.sendCommand(cmd)
  }

  static async ping(msg: string) {
    var cmd = new RemoteCommand('ping', {
      windowContainerID: this.getCurrentWindowContainer().id,
      resourceID: this.getCurrentWebPanel().id,
      message: msg,
    })

    if (WebSpatial.transactionStarted) {
      WebSpatial.sendCommand(cmd)
      return null
    } else {
      var result = await new Promise((res, rej) => {
        WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
        WebSpatial.sendCommand(cmd)
      })
      return result
    }
  }

  static async getStats() {
    var cmd = new RemoteCommand('getStats', {
      windowContainerID: this.getCurrentWindowContainer().id,
      resourceID: this.getCurrentWebPanel().id,
    })

    var result = await new Promise((res, rej) => {
      WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
      WebSpatial.sendCommand(cmd)
    })
    return (result as any).data
  }

  static async inspect(spatialObjectId: string) {
    var cmd = new RemoteCommand('inspect', {
      resourceID: spatialObjectId,
    })

    var result = await new Promise((res, rej) => {
      WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
      WebSpatial.sendCommand(cmd)
    })

    return (result as any).data
  }

  static async inspectRootWindowContainer() {
    return this.inspect('root')
  }

  static async setComponent(
    entity: WebSpatialResource,
    resource: WebSpatialResource,
  ) {
    var cmd = new RemoteCommand('setComponent', {
      windowContainerID: entity.windowContainerId,
      resourceID: resource.id,
      entityID: entity.id,
    })

    WebSpatial.sendCommand(cmd)
  }

  static async removeComponent(
    entity: WebSpatialResource,
    resource: WebSpatialResource,
  ) {
    var cmd = new RemoteCommand('removeComponent', {
      windowContainerID: entity.windowContainerId,
      resourceID: resource.id,
      entityID: entity.id,
    })

    WebSpatial.sendCommand(cmd)
  }

  // windowContainer is the group the resource will be tied to (if not provided it will use the current window grou)
  // parentWebView is the SpatialWebView that the resource will be tied to (if not provided, resource will continue to exist even if this page is unloaded)
  static async createResource(
    type: string,
    windowContainer: WindowContainer | null,
    parentWebView: WebSpatialResource | null,
    params = {} as any,
  ) {
    var cmd = new RemoteCommand('createResource', {
      windowContainerID: windowContainer ? windowContainer.id : undefined,
      resourceID: parentWebView ? parentWebView.id : undefined,
      type: type,
      params: params,
    })

    var result = await new Promise((res, rej) => {
      WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
      WebSpatial.sendCommand(cmd)
    })
    var res = new WebSpatialResource()
    res.id = (result as any).data.createdID
    res.windowContainerId = cmd.data.windowContainerID
    return res
  }

  static async updateWindowContainer(wg: WindowContainer, data: any) {
    var cmd = new RemoteCommand('updateWindowContainer', {
      windowContainerID: wg.id,
      update: data,
    })

    var result = await new Promise((res, rej) => {
      WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
      WebSpatial.sendCommand(cmd)
    })
    return result
  }

  static async updateResource(resource: WebSpatialResource, data: any = null) {
    var cmd = new RemoteCommand('updateResource', {
      windowContainerID: resource.windowContainerId,
      resourceID: resource.id,
      update: data || resource.data,
    })

    var result = await new Promise((res, rej) => {
      WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
      WebSpatial.sendCommand(cmd)
    })
    return result
  }

  static async setLoading(method: LoadingMethodKind, style?: string) {
    var cmd = new RemoteCommand('setLoading', {
      windowContainerID: window._webSpatialParentGroupID, // parent WindowContainerID
      loading: {
        method,
        style,
      },
    })

    var result = await new Promise((res, rej) => {
      WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
      WebSpatial.sendCommand(cmd)
    })
    return result
  }

  static async openImmersiveSpace() {
    var cmd = new RemoteCommand('openImmersiveSpace')
    await WebSpatial.sendCommand(cmd)
  }

  static async dismissImmersiveSpace() {
    var cmd = new RemoteCommand('dismissImmersiveSpace')
    await WebSpatial.sendCommand(cmd)
  }

  static onFrame(fn: (curTime: number) => Promise<any>) {
    var dt = 0
    var loop = async () => {
      var curTime = window.performance.now()
      await fn(curTime)
      var updateTime = window.performance.now() - curTime

      // Call update loop targetting 60 fps
      setTimeout(
        () => {
          loop()
        },
        Math.max(1000 / 60 - updateTime, 0),
      )
    }
    loop()
  }
}
WebSpatial.init()
