export class Vec3 {
  constructor(public x = 0, public y = 0, public z = 0) {
  }
}

export class Vec4 {
  x = 0
  y = 0
  z = 0
  w = 1
}

export class WindowGroup {
  id = ""
}

export class SpatialResource {
  id = ""
  windowGroupId = ""
  data = {} as any
}

class RemoteCommand {
  private static requestCounter = 0
  command = "cmd"
  data = {} as any
  requestID = ++RemoteCommand.requestCounter
}

type WindowStyle = "Plain" | "Volumetric" | "Immersive"

class WebSpatial {
  public static eventPromises: any = {}

  static init() {
    (window as any).__SpatialWebEvent = (e: any) => {
      var p = WebSpatial.eventPromises[e.requestID];
      if (p) {
        if (e.success) {
          p.res(e)
        } else {
          p.rej(e)
        }

      }
    }
  }

  static async sendCommand(cmd: RemoteCommand) {
    var msg = JSON.stringify(cmd);
    (window as any).webkit.messageHandlers.bridge.postMessage(msg)
  }

  static getImmersiveWindowGroup() {
    var wg = new WindowGroup()
    wg.id = "Immersive"
    return wg
  }

  static getCurrentWindowGroup() {
    var wg = new WindowGroup()
    wg.id = "current"
    return wg
  }

  static getCurrentWebPanel() {
    var wg = new SpatialResource()
    wg.id = "current"
    wg.windowGroupId = WebSpatial.getCurrentWindowGroup().id
    return wg
  }

  static async createWindowGroup(style: WindowStyle = "Plain") {
    var cmd = new RemoteCommand()
    cmd.command = "createWindowGroup"
    cmd.data.windowStyle = style

    var result = await new Promise((res, rej) => {
      WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
      WebSpatial.sendCommand(cmd)
    })
    var res = new WindowGroup()
    res.id = (result as any).data.createdID
    return res
  }

  static async destroyResource(resource: SpatialResource) {
    var cmd = new RemoteCommand()
    cmd.command = "destroyResource"
    cmd.data.windowGroupID = resource.windowGroupId
    cmd.data.resourceID = resource.id

    WebSpatial.sendCommand(cmd)
  }

  static async ping(msg: string) {
    var cmd = new RemoteCommand()
    cmd.command = "ping"
    cmd.data.windowGroupID = this.getCurrentWindowGroup().id
    cmd.data.resourceID = this.getCurrentWebPanel().id
    cmd.data.message = msg
    var result = await new Promise((res, rej) => {
      WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
      WebSpatial.sendCommand(cmd)
    })
    return result
  }

  static async setComponent(entity: SpatialResource, resource: SpatialResource) {
    var cmd = new RemoteCommand()
    cmd.command = "setComponent"
    cmd.data.windowGroupID = entity.windowGroupId
    cmd.data.resourceID = resource.id
    cmd.data.entityID = entity.id
    WebSpatial.sendCommand(cmd)
  }

  // windowGroup is the group the resource will be tied to (if not provided it will use the current window grou)
  // parentWebView is the SpatialWebView that the resource will be tied to (if not provided, resource will continue to exist even if this page is unloaded)
  static async createResource(type: string, windowGroup: WindowGroup, parentWebView: SpatialResource, params = {} as any) {
    var cmd = new RemoteCommand()
    cmd.command = "createResource"
    cmd.data.windowGroupID = windowGroup.id
    cmd.data.resourceID = parentWebView.id
    cmd.data.type = type
    cmd.data.params = params

    var result = await new Promise((res, rej) => {
      WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
      WebSpatial.sendCommand(cmd)
    })
    var res = new SpatialResource()
    res.id = (result as any).data.createdID
    res.windowGroupId = cmd.data.windowGroupID
    return res
  }

  static async updateResource(resource: SpatialResource, data: any = null) {
    var cmd = new RemoteCommand()
    cmd.command = "updateResource"
    cmd.data.windowGroupID = this.getCurrentWindowGroup().id
    cmd.data.resourceID = this.getCurrentWebPanel().id
    cmd.data.resourceID = resource.id
    if (data) {
      cmd.data.update = data
    } else {
      cmd.data.update = resource.data
    }

    var result = await new Promise((res, rej) => {
      WebSpatial.eventPromises[cmd.requestID] = { res: res, rej: rej }
      WebSpatial.sendCommand(cmd)
    })
    return result
  }

  static async log(log: any) {
    if (!(window as any).WebSpatailEnabled) {
      console.log(log)
      return
    }

    var cmd = new RemoteCommand()
    cmd.command = "log"
    if (log !== null && log !== undefined && log.toString) {
      cmd.data.logString = log.toString()
    } else if (log !== null && log !== undefined && typeof log === 'object') {
      cmd.data.logString = JSON.stringify(log)
    } else {
      cmd.data.logString = log
    }

    await WebSpatial.sendCommand(cmd)
  }

  static async openImmersiveSpace() {
    var cmd = new RemoteCommand()
    cmd.command = "openImmersiveSpace"
    await WebSpatial.sendCommand(cmd)
  }

  static async dismissImmersiveSpace() {
    var cmd = new RemoteCommand()
    cmd.command = "dismissImmersiveSpace"
    await WebSpatial.sendCommand(cmd)
  }

  static onFrame(fn: any) {
    var dt = 0
    var lastTime = window.performance.now()
    var loop = () => {
      setTimeout(() => {
        loop()
      }, 1000 / 90);
      var curTime = window.performance.now()
      fn(curTime, curTime - lastTime)
      lastTime = curTime
    }
    loop()

  }
}
WebSpatial.init()
if ((window as any).WebSpatailEnabled) {
  let pos = 0
  let last = 0;
  (window as any)._magicUpdate = () => {
    const now = Date.now();
    let dt = now - last;
    last = now
    if ((dt / 1000) < 1 / 10) {
      pos += 1 * (dt / 1000)
      return Math.sin(pos) * 0.3
    } else {
      return 0
    }
  }
}

export default WebSpatial