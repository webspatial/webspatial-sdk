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

// Public api
class SpatialTransform {
  position = new DOMPoint(0, 0, 0)
  orientation = new DOMPoint(0, 0, 0, 1)
  scale = new DOMPoint(1, 1, 1)
}

class SpatialFrame {

}

export class SpatialEntity {
  transform = new SpatialTransform()
  _destroyed = false
  constructor(public _entity: SpatialResource) {

  }
  async updateTransform() {
    await WebSpatial.updateResource(this._entity, this.transform)
  }

  async setComponent(component: SpatialRes) {
    await WebSpatial.setComponent(this._entity, component._resource)
  }

  async destroy() {
    this._destroyed = true
    await WebSpatial.destroyResource(this._entity)
  }

  isDestroyed() {
    return this._destroyed
  }
}

// class SpatialMesh extends SpatialEntity {
// }

class SpatialRes {
  constructor(public _resource: SpatialResource) {
  }
}

class SpatialIFrameComponent extends SpatialRes {
  async loadURL(url: string) {
    await WebSpatial.updateResource(this._resource, { url: url })
  }
  async setResolution(x: number, y: number) {
    await WebSpatial.updateResource(this._resource, { resolution: { x: x, y: y } })
  }

  async setStyle(options: any) {
    await WebSpatial.updateResource(this._resource, { style: options })
  }
}


export class SpatialModelComponent extends SpatialRes {
  async setMesh(mesh: SpatialMeshResource) {
    await WebSpatial.updateResource(this._resource, { meshResource: mesh._resource.id })
  }
  async setMaterials(materials: Array<SpatialPhysicallyBasedMaterial>) {
    await WebSpatial.updateResource(this._resource, { materials: materials.map((m) => { return m._resource.id }) })
  }
}

export class SpatialMeshResource extends SpatialRes {
}

export class SpatialPhysicallyBasedMaterial extends SpatialRes {
  baseColor = { r: 0.0, g: 0.7, b: 0.7, a: 1.0 }
  metallic = { value: 0.5 }
  roughness = { value: 0.5 }

  async update() {
    await WebSpatial.updateResource(this._resource, {
      baseColor: this.baseColor,
      metallic: this.metallic,
      roughness: this.roughness
    })
  }
}

type animCallback = (time: DOMHighResTimeStamp, frame: SpatialFrame) => void
class SpatialSession {
  _currentFrame = new SpatialFrame()
  _animationFrameCallbacks = Array<animCallback>()
  _frameLoopStarted = false
  requestAnimationFrame(callback: animCallback) {
    this._animationFrameCallbacks.push(callback)

    if (!this._frameLoopStarted) {
      this._frameLoopStarted = true
      WebSpatial.onFrame((time: number, delta: number) => {
        var cbs = this._animationFrameCallbacks
        this._animationFrameCallbacks = []
        for (var cb of cbs) {
          cb(time, this._currentFrame)
        }
      })
    }

  }
  async createEntity() {
    let entity = await WebSpatial.createResource("Entity", WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel());
    return new SpatialEntity(entity)
  }

  async createIFrameComponent() {
    let entity = await WebSpatial.createResource("SpatialWebView", WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel());
    return new SpatialIFrameComponent(entity)
  }

  async createModelComponent(options?: { url: string }) {
    var opts = undefined
    if (options) {
      opts = { modelURL: options.url }
    }
    let entity = await WebSpatial.createResource("ModelComponent", WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel(), opts);
    return new SpatialModelComponent(entity)
  }

  async createMeshResource(options?: any) {
    let entity = await WebSpatial.createResource("MeshResource", WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel(), options);
    return new SpatialMeshResource(entity)
  }


  async createPhysicallyBasedMaterial(options?: any) {
    let entity = await WebSpatial.createResource("PhysicallyBasedMaterial", WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel(), options);
    return new SpatialPhysicallyBasedMaterial(entity)
  }

  getCurrentIFrameComponent() {
    return new SpatialIFrameComponent(WebSpatial.getCurrentWebPanel())
  }

  async log(obj: any) {
    await WebSpatial.log(obj)
  }

  async ping(msg: string) {
    return await WebSpatial.ping(msg)
  }
}

export class Spatial {
  async requestSession() {
    return new SpatialSession()
  }
}