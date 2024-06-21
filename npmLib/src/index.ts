import { WebSpatial, WebSpatialResource, WindowGroup, WindowStyle } from './webSpatialPrivate'

// Types
type animCallback = (time: DOMHighResTimeStamp, frame: SpatialFrame) => void

export class SpatialWindowGroup {
  constructor(public _wg: WindowGroup) {

  }
}

/**
 * Transform containing position, orientation and scale
 */
export class SpatialTransform {
  position = new DOMPoint(0, 0, 0)
  /** Quaternion value for x,y,z,y */
  orientation = new DOMPoint(0, 0, 0, 1)
  scale = new DOMPoint(1, 1, 1)
}

class SpatialFrame {

}

/**
 * Entity used to describe an object that can be added to the scene
 */
export class SpatialEntity {
  transform = new SpatialTransform()
  private _destroyed = false
  constructor(public _entity: WebSpatialResource) {

  }

  /**
   * Syncs the transform with the renderer, must be called to observe updates
   */
  async updateTransform() {
    await WebSpatial.updateResource(this._entity, this.transform)
  }

  /**
  * Attaches a component to the entity to be displayed
  */
  async setComponent(component: SpatialResource) {
    await WebSpatial.setComponent(this._entity, component._resource)
  }

  /**
   * Sets the windowgroup that this entity should be rendered by (this does not effect resource ownership)
   * @param wg the window group that should render this entity
   */
  async setParentWindowGroup(wg: SpatialWindowGroup) {
    await WebSpatial.updateResource(this._entity, { setParentWindowGroupID: wg._wg.id })
  }

  /**
  * Removes a reference to the entity by the renderer and this object should no longer be used. Attached components will not be destroyed
  */
  async destroy() {
    this._destroyed = true
    await WebSpatial.destroyResource(this._entity)
  }


  /**
  * Check if destroy has been called
  */
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

/**
* Used to position an iframe in 3D space
*/
export class SpatialIFrameComponent extends SpatialResource {
  async loadURL(url: string) {
    await WebSpatial.updateResource(this._resource, { url: url })
  }

  /**
   * Sets if this IFrame can be used as the root element of a Plain window group. If set, this can be resized by the OS and its resolution will be set to full
   * @param makeRoot sets if this should be root or not
   */
  async setAsRoot(makeRoot: boolean) {
    await WebSpatial.updateResource(this._resource, { setRoot: makeRoot })
  }

  async setResolution(x: number, y: number) {
    await WebSpatial.updateResource(this._resource, { resolution: { x: x, y: y } })
  }

  async sendContent(x: string) {
    await WebSpatial.updateResource(this._resource, { sendContent: x })
  }

  async setStyle(options: any) {
    await WebSpatial.updateResource(this._resource, { style: options })
  }
}

/**
* Used to position a model in 3D space
*/
export class SpatialModelComponent extends SpatialResource {
  async setMesh(mesh: SpatialMeshResource) {
    await WebSpatial.updateResource(this._resource, { meshResource: mesh._resource.id })
  }
  async setMaterials(materials: Array<SpatialPhysicallyBasedMaterial>) {
    await WebSpatial.updateResource(this._resource, { materials: materials.map((m) => { return m._resource.id }) })
  }
}

/**
* Used to position a model in 3D space inline to the webpage (Maps to Model3D) 
*/
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

/**
* PBR material which can be set on a SpatialModelComponent
*/
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

/**
* Session use to establish a connection to the spatial renderer of the system. All resources must be created by the session
*/
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

  async createIFrameComponent(wg?: SpatialWindowGroup) {
    let entity = await WebSpatial.createResource("SpatialWebView", wg ? wg._wg : WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel());
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

  async createWindowGroup(style: WindowStyle = "Plain") {
    return new SpatialWindowGroup(await WebSpatial.createWindowGroup(style))
  }

  getCurrentIFrameComponent() {
    return new SpatialIFrameComponent(WebSpatial.getCurrentWebPanel())
  }

  /**
   * Debugging only, issues a native log
   */
  async log(obj: any) {
    await WebSpatial.log(obj)
  }

  /**
  * Debugging only, used to ping the native renderer
  */
  async ping(msg: string) {
    return await WebSpatial.ping(msg)
  }

  async openImmersiveSpace() {
    return await WebSpatial.openImmersiveSpace()
  }

  async dismissImmersiveSpace() {
    return await WebSpatial.dismissImmersiveSpace()
  }

  // Retreives the windowgroup corresponding to the Immersive space
  async getImmersiveWindowGroup() {
    return new SpatialWindowGroup(WebSpatial.getImmersiveWindowGroup())
  }

  // Retreives the window group that is the parent to this spatial web page
  async getCurrentWindowGroup() {
    return new SpatialWindowGroup(WebSpatial.getCurrentWindowGroup())
  }
}

/**
 * Base object designed to be placed on navigator.spatial to mirror navigator.xr for webxr
 */
export class Spatial {
  async requestSession() {
    return new SpatialSession()
  }

  isSupported() {
    return (window as any).WebSpatailEnabled
  }
}