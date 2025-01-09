import { SpatialInputComponent } from '../component/SpatialInputComponent'
import { Logger, LoggerLevel, NativeLogger, WebLogger } from './log'
import { RemoteCommand } from './remote-command'
import { WindowStyle, WindowGroupOptions } from '../types'

export class Vec3 {
  constructor(
    public x = 0,
    public y = 0,
    public z = 0,
  ) {}
}

export class Vec4 {
  x = 0
  y = 0
  z = 0
  w = 1
}

export class WindowGroup {
  id = ''
}

export class WebSpatialResource {
  id = ''
  windowGroupId = ''
  data = {} as any
}

export class WebSpatial {
  public static eventPromises: any = {}
  public static inputComponents: { [key: string]: SpatialInputComponent } = {}

  public static transactionStarted = false
  public static transactionCommands = Array<RemoteCommand>()

  static init() {
    ;(window as any).__SpatialWebEvent = (e: any) => {
      if (e.inputComponentID) {
        var obj = WebSpatial.inputComponents[e.inputComponentID]
        obj._gotEvent(e.data)
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
    if ((window as any).webkit) {
      return 'AVP'
    } else {
      return 'UNKNOWN'
    }
  }

  static async sendCommand(cmd: RemoteCommand) {
    if ((window as any).__WebSpatialUnloaded) {
      return
    }
    if (WebSpatial.transactionStarted) {
      WebSpatial.transactionCommands.push(cmd as any)
      return
    }

    var msg = JSON.stringify(cmd)

    if (WebSpatial.getBackend() == 'AVP') {
      ;(window as any).webkit.messageHandlers.bridge.postMessage(msg)
      return
    } else {
      ;(window as any).bridge.nativeMessage(msg)
      return
    }
  }

  static logger: Logger = (window as any).WebSpatailEnabled
    ? new NativeLogger(this.sendCommand)
    : new WebLogger('WebSpatial')

  static getImmersiveWindowGroup() {
    var wg = new WindowGroup()
    wg.id = 'Immersive'
    return wg
  }

  static getCurrentWindowGroup() {
    var wg = new WindowGroup()
    wg.id = 'current'
    return wg
  }

  static getCurrentWebPanel() {
    var wg = new WebSpatialResource()
    wg.id = 'current'
    wg.windowGroupId = WebSpatial.getCurrentWindowGroup().id
    return wg
  }

  static async createWindowGroup(style: WindowStyle = 'Plain') {
    var cmd = new RemoteCommand('createWindowGroup', { windowStyle: style })

    var result = await new Promise((res, rej) => {
      WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
      WebSpatial.sendCommand(cmd)
    })
    var res = new WindowGroup()
    res.id = (result as any).data.createdID
    return res
  }

  static async destroyResource(resource: WebSpatialResource) {
    const data = {}
    var cmd = new RemoteCommand('destroyResource', {
      windowGroupID: resource.windowGroupId,
      resourceID: resource.id,
    })

    WebSpatial.sendCommand(cmd)
  }

  static async ping(msg: string) {
    var cmd = new RemoteCommand('ping', {
      windowGroupID: this.getCurrentWindowGroup().id,
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
      windowGroupID: this.getCurrentWindowGroup().id,
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

  static async inspectRootWindowGroup() {
    return this.inspect('root')
  }

  static async setComponent(
    entity: WebSpatialResource,
    resource: WebSpatialResource,
  ) {
    var cmd = new RemoteCommand('setComponent', {
      windowGroupID: entity.windowGroupId,
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
      windowGroupID: entity.windowGroupId,
      resourceID: resource.id,
      entityID: entity.id,
    })

    WebSpatial.sendCommand(cmd)
  }

  // windowGroup is the group the resource will be tied to (if not provided it will use the current window grou)
  // parentWebView is the SpatialWebView that the resource will be tied to (if not provided, resource will continue to exist even if this page is unloaded)
  static async createResource(
    type: string,
    windowGroup: WindowGroup,
    parentWebView: WebSpatialResource,
    params = {} as any,
  ) {
    var cmd = new RemoteCommand('createResource', {
      windowGroupID: windowGroup.id,
      resourceID: parentWebView.id,
      type: type,
      params: params,
    })

    var result = await new Promise((res, rej) => {
      WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
      WebSpatial.sendCommand(cmd)
    })
    var res = new WebSpatialResource()
    res.id = (result as any).data.createdID
    res.windowGroupId = cmd.data.windowGroupID
    return res
  }

  static async updateWindowGroup(wg: WindowGroup, data: any) {
    var cmd = new RemoteCommand('updateWindowGroup', {
      windowGroupID: wg.id,
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
      windowGroupID: resource.windowGroupId,
      resourceID: resource.id,
      update: data || resource.data,
    })

    var result = await new Promise((res, rej) => {
      WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
      WebSpatial.sendCommand(cmd)
    })
    return result
  }

  static async getSceneConfig(sceneName?: string) {
    var cmd = new RemoteCommand('scene', {
      sceneData: {
        method: 'getConfig',
        sceneName,
      },
    })

    var result = await new Promise((res, rej) => {
      WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
      WebSpatial.sendCommand(cmd)
    })
    return result
  }

  static async setSceneConfig(
    sceneName: string,
    sceneConfig: WindowGroupOptions,
  ) {
    var cmd = new RemoteCommand('scene', {
      sceneData: {
        method: 'setConfig',
        sceneName,
        sceneConfig,
      },
    })

    var result = await new Promise((res, rej) => {
      WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
      WebSpatial.sendCommand(cmd)
    })
    return result
  }

  static async removeSceneConfig(sceneName: string) {
    var cmd = new RemoteCommand('scene', {
      sceneData: {
        method: 'delConfig',
        sceneName,
      },
    })

    var result = await new Promise((res, rej) => {
      WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
      WebSpatial.sendCommand(cmd)
    })
    return result
  }

  static async getScene(sceneName?: string) {
    var cmd = new RemoteCommand('scene', {
      sceneData: {
        method: 'getScene',
        sceneName,
      },
    })

    var result = await new Promise((res, rej) => {
      WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
      WebSpatial.sendCommand(cmd)
    })
    return result
  }

  static async openScene(sceneName: string, url: string) {
    var cmd = new RemoteCommand('scene', {
      sceneData: {
        method: 'open',
        sceneName,
        url,
      },
    })

    var result = await new Promise((res, rej) => {
      WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
      WebSpatial.sendCommand(cmd)
    })
    return result
  }

  static async closeScene(sceneName?: string) {
    var cmd = new RemoteCommand('scene', {
      sceneData: {
        method: 'close',
        sceneName,
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

  static onFrame(fn: any) {
    var dt = 0
    var lastTime = window.performance.now()
    var loop = () => {
      setTimeout(() => {
        loop()
      }, 1000 / 60)
      var curTime = window.performance.now()
      fn(curTime, curTime - lastTime)
      lastTime = curTime
    }
    loop()
  }
}
WebSpatial.init()
