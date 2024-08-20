import { LoggerLevel } from "./Logger"
import { SpatialEntity } from "./SpatialEntity"
import { SpatialIFrameComponent, SpatialModelUIComponent, SpatialModelComponent, SpatialInputComponent, SpatialMeshResource, SpatialPhysicallyBasedMaterial } from "./SpatialResource"
import { SpatialWindowGroup } from "./SpatialWindowGroup"
import { WebSpatial, WindowStyle, WebSpatialResource } from "./webSpatialPrivate"

class SpatialFrame {

}


// Types
type animCallback = (time: DOMHighResTimeStamp, frame: SpatialFrame) => void

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
 * Creates a InputComponent
 * @returns InputComponent
 */
  async createInputComponent() {
    let entity = await WebSpatial.createResource("InputComponent", WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel());
    var ic = new SpatialInputComponent(entity)
    WebSpatial.inputComponents[ic._resource.id] = ic
    return ic
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
   * Retrieves the parent iframe for this page or null if this is the root page
   * @returns the iframe component or null
   */
  async getParentIFrameComponent() {
    let parentResp: any = await WebSpatial.updateResource(WebSpatial.getCurrentWebPanel(), { getParentID: "" })
    if (parentResp.data.parentID === "") {
      return new Promise<SpatialIFrameComponent | null>((res, rej) => { res(null) })
    } else {
      var res = new WebSpatialResource()
      res.id = parentResp.data.parentID
      return new SpatialIFrameComponent(res)
    }
  }

  async setLogLevel(logLevel: LoggerLevel) {
    await WebSpatial.logger.setLevel(logLevel)
  }

  async log(...msg: any[]) {
    await WebSpatial.logger.info(...msg)
  }

  async info(...msg: any[]) {
    await WebSpatial.logger.info(...msg)
  }

  async warn(...msg: any[]) {
    await WebSpatial.logger.warn(...msg)
  }

  async debug(...msg: any[]) {
    await WebSpatial.logger.debug(...msg)
  }

  async error(...msg: any[]) {
    await WebSpatial.logger.error(...msg)
  }

  async trace(...msg: any[]) {
    await WebSpatial.logger.trace(...msg)
  }

  /**
  * Debugging only, used to ping the native renderer
  */
  async ping(msg: string) {
    return await WebSpatial.ping(msg)
  }

  /**
   * Debugging to get internal state from native code
   * @returns data as a js object
   */
  async getStats() {
    return (await WebSpatial.getStats() as any)
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
  getCurrentWindowGroup() {
    return new SpatialWindowGroup(WebSpatial.getCurrentWindowGroup())
  }
}
