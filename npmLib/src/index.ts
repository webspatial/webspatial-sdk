import { WebSpatial, WebSpatialResource, WindowGroup, WindowStyle } from './webSpatialPrivate'

// Types
type animCallback = (time: DOMHighResTimeStamp, frame: SpatialFrame) => void

export class SpatialWindowGroup {
  /** @hidden */
  constructor(
    /** @hidden */
    public _wg: WindowGroup
  ) {

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

  /** @hidden */
  private _destroyed = false
  /** @hidden */
  constructor(
    /** @hidden */
    public _entity: WebSpatialResource
  ) {

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
  /** @hidden */
  constructor(
    /** @hidden */
    public _resource: WebSpatialResource
  ) {
  }

  /**
   * Marks resource to be released (it should no longer be used)
   */
  async destroy() {
    await WebSpatial.destroyResource(this._resource)
  }
}

/**
* Used to position an iframe in 3D space
*/
export class SpatialIFrameComponent extends SpatialResource {
  /**
   * Loads a url page in the iframe
   * @param url url to load
   */
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

  /**
   * Sets the resolution of the IFrame, the resulting dimensions when rendered will be equal to 1/1360 units
   * eg. if the resolution is set to 1360x1360 it will be a 1x1 plane
   * @param x width in pixels
   * @param y height in pixels
   */
  async setResolution(x: number, y: number) {
    await WebSpatial.updateResource(this._resource, { resolution: { x: x, y: y } })
  }

  /**
   * Sends a message to the iframe telling it to display the content string
   * @param content Content to be displayed
   */
  async sendContent(content: string) {
    await WebSpatial.updateResource(this._resource, { sendContent: content })
  }

  /**
   * Sets the style that should be applied to the iframe
   * @param options style options
   */
  async setStyle(options: any) {
    await WebSpatial.updateResource(this._resource, { style: options })
  }

  /**
   * Enable/Disable scrolling in the iframe (defaults to enabled), if disabled, scrolling will be applied to the root page
   * @param enabled value to set
   */
  async setScrollEnabled(enabled: boolean) {
    await WebSpatial.updateResource(this._resource, { scrollEnabled: enabled })
  }

  /**
   * Sets how the iframe should be rendered. 
   * If inline, position will be relative to root webpage (0,0,0) will place the center of the iframe at the top left of the page and coordinate space will be in pixels.
   * If not inline, position will be relative to the window group origin, (0,0,0) will be the center of the window group and units will be in units of the window group (eg. meters for immersive window group)
   * @param isInline value to set
   */
  async setInline(isInline: boolean) {
    await WebSpatial.updateResource(this._resource, { inline: isInline })
  }
}

/**
* Used to position a model in 3D space, made up of a mesh and materials to be applied to the mesh
*/
export class SpatialModelComponent extends SpatialResource {
  /**
   * Sets the mesh to be displayed by the component
   * @param mesh mesh to set
   */
  async setMesh(mesh: SpatialMeshResource) {
    await WebSpatial.updateResource(this._resource, { meshResource: mesh._resource.id })
  }

  /**
   * Sets the materials that should be applied to the mesh
   * @param materials array of materials to set
   */
  async setMaterials(materials: Array<SpatialPhysicallyBasedMaterial>) {
    await WebSpatial.updateResource(this._resource, { materials: materials.map((m) => { return m._resource.id }) })
  }
}

/**
* Used to position a model in 3D space inline to the webpage (Maps to Model3D tag)
* Positioning behaves the same as a spatial iframe marked as inline
*/
export class SpatialModelUIComponent extends SpatialResource {
  /**
   * Sets the url of the model to load
   * @param url url of the model to load
   */
  async setURL(url: string) {
    await WebSpatial.updateResource(this._resource, { url: url })
  }
  async setAspectRatio(aspectRatio: string) {
    await WebSpatial.updateResource(this._resource, { aspectRatio: aspectRatio })
  }
  /**
   * Sets the resolution of the component to be displayed (behaves the same as inline iframe)
   * @param x resolution in pixels
   * @param y resolution in pixels
   */
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

  /**
   * Syncs state of color, metallic, roupghness to the renderer
   */
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
  /** @hidden */
  _currentFrame = new SpatialFrame()
  /** @hidden */
  _animationFrameCallbacks = Array<animCallback>()
  /** @hidden */
  _frameLoopStarted = false

  /**
   * Request a callback to be called before the next render update
   * @param callback callback to be called before next render update
   */
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
  /**
   * Creates a Entity
   * @returns Entity
   */
  async createEntity() {
    let entity = await WebSpatial.createResource("Entity", WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel());
    return new SpatialEntity(entity)
  }

  /**
   * Creates a IFrameComponent
   * @returns IFrameComponent
   */
  async createIFrameComponent(wg?: SpatialWindowGroup) {
    let entity = await WebSpatial.createResource("SpatialWebView", wg ? wg._wg : WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel());
    return new SpatialIFrameComponent(entity)
  }

  /**
   * Creates a ModelUIComponent
   * @returns ModelUIComponent
   */
  async createModelUIComponent(options?: any) {
    let entity = await WebSpatial.createResource("ModelUIComponent", WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel(), options);
    return new SpatialModelUIComponent(entity)
  }

  /**
   * Creates a ModelComponent
   * @returns ModelComponent
   */
  async createModelComponent(options?: { url: string }) {
    var opts = undefined
    if (options) {
      opts = { modelURL: options.url }
    }
    let entity = await WebSpatial.createResource("ModelComponent", WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel(), opts);
    return new SpatialModelComponent(entity)
  }

  /**
   * Creates a MeshResource
   * @returns MeshResource
   */
  async createMeshResource(options?: any) {
    let entity = await WebSpatial.createResource("MeshResource", WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel(), options);
    return new SpatialMeshResource(entity)
  }

  /**
   * Creates a PhysicallyBasedMaterial
   * @returns PhysicallyBasedMaterial
   */
  async createPhysicallyBasedMaterial(options?: any) {
    let entity = await WebSpatial.createResource("PhysicallyBasedMaterial", WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel(), options);
    return new SpatialPhysicallyBasedMaterial(entity)
  }

  /**
   * Creates a WindowGroup
   * @returns WindowGroup
   */
  async createWindowGroup(style: WindowStyle = "Plain") {
    return new SpatialWindowGroup(await WebSpatial.createWindowGroup(style))
  }

  /**
   * Retrieves the iframe for this page
   * @returns the iframe component corresponding to the js running on this page
   */
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

  /** Opens the immersive space */
  async openImmersiveSpace() {
    return await WebSpatial.openImmersiveSpace()
  }

  /** Closes the immersive space */
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