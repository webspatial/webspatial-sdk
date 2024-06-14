import { WebSpatial, WebSpatialResource } from './webSpatialPrivate'

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
  constructor(public _entity: WebSpatialResource) {

  }
  async updateTransform() {
    await WebSpatial.updateResource(this._entity, this.transform)
  }

  async setComponent(component: SpatialResource) {
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

export class SpatialResource {
  constructor(public _resource: WebSpatialResource) {
  }
  async destroy() {
    await WebSpatial.destroyResource(this._resource)
  }
}

export class SpatialIFrameComponent extends SpatialResource {
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


export class SpatialModelComponent extends SpatialResource {
  async setMesh(mesh: SpatialMeshResource) {
    await WebSpatial.updateResource(this._resource, { meshResource: mesh._resource.id })
  }
  async setMaterials(materials: Array<SpatialPhysicallyBasedMaterial>) {
    await WebSpatial.updateResource(this._resource, { materials: materials.map((m) => { return m._resource.id }) })
  }
}

export class SpatialModelUIComponent extends SpatialResource {
  async setURL(url: string) {
    await WebSpatial.updateResource(this._resource, { url: url })
  }
  async setAspectRatio(aspectRatio: string) {
    await WebSpatial.updateResource(this._resource, { aspectRatio: aspectRatio })
  }
  async setResolution(x: number, y: number) {
    await WebSpatial.updateResource(this._resource, { resolution: { x: x, y: y } })
  }
}

export class SpatialMeshResource extends SpatialResource {
}

export class SpatialPhysicallyBasedMaterial extends SpatialResource {
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
export class SpatialSession {
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

  async createModelUIComponent(options?: any) {
    let entity = await WebSpatial.createResource("ModelUIComponent", WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel(), options);
    return new SpatialModelUIComponent(entity)
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