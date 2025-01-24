import { LoggerLevel } from './private/log'
import { SpatialEntity } from './SpatialEntity'
import { SpatialWindowGroup } from './SpatialWindowGroup'
import { WebSpatial, WebSpatialResource } from './private/WebSpatial'
import { WindowGroupOptions, WindowStyle } from './types'

import { SpatialMesh, SpatialPhysicallyBasedMaterial } from './resource'
import {
  SpatialModelComponent,
  SpatialInputComponent,
  SpatialWindowComponent,
  SpatialViewComponent,
  SpatialModel3DComponent,
} from './component'

/**
 * Animation callback with timestamp
 */
type animCallback = (time: DOMHighResTimeStamp) => void

/**
 * Session use to establish a connection to the spatial renderer of the system. All resources must be created by the session
 */
export class SpatialSession {
  /** @hidden */
  _engineUpdateListeners = Array<animCallback>()
  /** @hidden */
  _frameLoopStarted = false

  /**
   * Add event listener callback to be called each frame
   * @param callback callback to be called each update
   */
  addOnEngineUpdateEventListener(callback: animCallback) {
    this._engineUpdateListeners.push(callback)

    if (!this._frameLoopStarted) {
      this._frameLoopStarted = true
      WebSpatial.onFrame((time: number, delta: number) => {
        for (var cb of this._engineUpdateListeners) {
          cb(time)
        }
      })
    }
  }

  /**
   * Creates a Entity
   * @returns Entity
   */
  async createEntity() {
    let entity = await WebSpatial.createResource(
      'Entity',
      WebSpatial.getCurrentWindowGroup(),
      WebSpatial.getCurrentWebPanel(),
    )
    return new SpatialEntity(entity)
  }

  /**
   * Creates a WindowComponent
   * [TODO] should creation of components be moved to entity? and these made private?
   * @returns WindowComponent
   */
  async createWindowComponent(wg?: SpatialWindowGroup) {
    let entity = await WebSpatial.createResource(
      'SpatialWebView',
      wg ? wg._wg : WebSpatial.getCurrentWindowGroup(),
      WebSpatial.getCurrentWebPanel(),
    )
    return new SpatialWindowComponent(entity)
  }

  /**
   * Creates a ViewComponent used to display 3D content within the entity
   * @returns SpatialViewComponent
   */
  async createViewComponent(wg?: SpatialWindowGroup) {
    let entity = await WebSpatial.createResource(
      'SpatialView',
      wg ? wg._wg : WebSpatial.getCurrentWindowGroup(),
      WebSpatial.getCurrentWebPanel(),
    )
    return new SpatialViewComponent(entity)
  }

  /**
   * Creates a ModelComponent used to display geometry + material of a 3D model
   * @returns ModelComponent
   */
  async createModelComponent(options?: { url: string }) {
    var opts = undefined
    if (options) {
      opts = { modelURL: options.url }
    }
    let entity = await WebSpatial.createResource(
      'ModelComponent',
      WebSpatial.getCurrentWindowGroup(),
      WebSpatial.getCurrentWebPanel(),
      opts,
    )
    return new SpatialModelComponent(entity)
  }

  /**
   * Creates a Model3DComponent
   * @returns Model3DComponent
   */
  async createModel3DComponent(options?: { url: string }) {
    var opts = undefined
    if (options) {
      opts = { modelURL: options.url }
    }
    let entity = await WebSpatial.createResource(
      'Model3DComponent',
      WebSpatial.getCurrentWindowGroup(),
      WebSpatial.getCurrentWebPanel(),
      opts,
    )
    return new SpatialModel3DComponent(entity)
  }

  /**
   * Creates a InputComponent
   * [Experimental] Creates a InputComponent used to handle click and drag events of the entity containing a model
   * @returns InputComponent
   */
  async createInputComponent() {
    let entity = await WebSpatial.createResource(
      'InputComponent',
      WebSpatial.getCurrentWindowGroup(),
      WebSpatial.getCurrentWebPanel(),
    )
    var ic = new SpatialInputComponent(entity)
    WebSpatial.inputComponents[ic._resource.id] = ic
    return ic
  }

  /**
   * Creates a MeshResource containing geometry data
   * @returns MeshResource
   */
  async createMeshResource(options?: any) {
    let entity = await WebSpatial.createResource(
      'MeshResource',
      WebSpatial.getCurrentWindowGroup(),
      WebSpatial.getCurrentWebPanel(),
      options,
    )
    return new SpatialMesh(entity)
  }

  /**
   * Creates a PhysicallyBasedMaterial containing PBR material data
   * @returns PhysicallyBasedMaterial
   */
  async createPhysicallyBasedMaterial(options?: any) {
    let entity = await WebSpatial.createResource(
      'PhysicallyBasedMaterial',
      WebSpatial.getCurrentWindowGroup(),
      WebSpatial.getCurrentWebPanel(),
      options,
    )
    return new SpatialPhysicallyBasedMaterial(entity)
  }

  /**
   * Creates a WindowGroup to display content within an anchored area managed by the OS
   * By default, the windowGroup will act as children of current spatialWindowComponent.
   * If the cfg param is provided, the windowGroup is standalone.
   * [TOOD] rename this to be more clear what it does
   * @param {WindowStyle} [style='Plain'] - The style of the window to be created. Defaults to 'Plain'.
   * @param {Object} [cfg={}] - Configuration object for the window group. If provided, the window group will be standalone.
   * @param {Object} [cfg.sceneData] - Configuration for the scene data associated with the window group.
   * @param {string} [cfg.sceneData.method] - The method to be used for loading the scene.
   * @param {WindowGroupOptions} [cfg.sceneData.sceneConfig] - Configuration options for the scene.
   * @param {string} [cfg.sceneData.url] - The URL to load the scene from.
   * @param {string} [cfg.sceneData.windowID] - The ID of the window to be created.
   * @returns WindowGroup
   */
  async createWindowGroup(
    style: WindowStyle = 'Plain',
    cfg: {
      sceneData?: {
        method?: 'createRoot' | 'showRoot'
        sceneConfig?: WindowGroupOptions
        url?: string
        windowID?: string
        windowGroupID?: string
      }
    } = {},
  ) {
    return new SpatialWindowGroup(
      await WebSpatial.createWindowGroup(style, cfg),
    )
  }

  /**
   * Retrieves the window for this page
   * @returns the window component corresponding to the js running on this page
   * [TODO] discuss implications of this not being async
   */
  getCurrentWindowComponent() {
    return new SpatialWindowComponent(WebSpatial.getCurrentWebPanel())
  }

  /**
   * Retrieves the parent window for this page or null if this is the root page
   * @returns the window component or null
   */
  async getParentWindowComponent() {
    let parentResp: any = await WebSpatial.updateResource(
      WebSpatial.getCurrentWebPanel(),
      { getParentID: '' },
    )
    if (parentResp.data.parentID === '') {
      return new Promise<SpatialWindowComponent | null>((res, rej) => {
        res(null)
      })
    } else {
      var res = new WebSpatialResource()
      res.id = parentResp.data.parentID
      return new SpatialWindowComponent(res)
    }
  }

  /**
   * [TODO] should these log apis be private?
   * @param logLevel
   */
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
   * [TODO] make this private
   */
  async ping(msg: string) {
    return await WebSpatial.ping(msg)
  }

  /**
   * Debugging to get internal state from native code
   * [TODO] make this private
   * @returns data as a js object
   */
  async getStats() {
    return (await WebSpatial.getStats()) as any
  }

  /**
   * [TODO] make this private
   */
  async inspect(spatialObjectId: string = WebSpatial.getCurrentWebPanel().id) {
    return WebSpatial.inspect(spatialObjectId)
  }

  /**
   * [TODO] make this private
   */
  async inspectRootWindowGroup() {
    return WebSpatial.inspectRootWindowGroup()
  }

  /** Opens the immersive space */
  async openImmersiveSpace() {
    return await WebSpatial.openImmersiveSpace()
  }

  /** Closes the immersive space */
  async dismissImmersiveSpace() {
    return await WebSpatial.dismissImmersiveSpace()
  }

  private static _immersiveWindowGroup = null as null | SpatialWindowGroup
  /**
   * Retreives the windowgroup corresponding to the Immersive space
   * @returns the immersive window group
   */
  async getImmersiveWindowGroup() {
    if (SpatialSession._immersiveWindowGroup) {
      return SpatialSession._immersiveWindowGroup
    } else {
      SpatialSession._immersiveWindowGroup = new SpatialWindowGroup(
        WebSpatial.getImmersiveWindowGroup(),
      )
      return SpatialSession._immersiveWindowGroup
    }
  }

  // Retreives the window group that is the parent to this spatial web page
  private static _currentWindowGroup = null as null | SpatialWindowGroup

  /**
   * Gets the current window group for the window
   * [TODO] discuss what happens if it doesnt yet have a windowgroup
   * @returns the current window group for the window
   */
  getCurrentWindowGroup() {
    if (SpatialSession._currentWindowGroup) {
      return SpatialSession._currentWindowGroup
    } else {
      SpatialSession._currentWindowGroup = new SpatialWindowGroup(
        WebSpatial.getCurrentWindowGroup(),
      )
      return SpatialSession._currentWindowGroup
    }
  }

  /**
   * Start a transaction that queues up commands to submit them all at once to reduce ipc overhead
   * @param fn function to be run, within this function, promises will not resolve
   * @returns promise for the entire transaction completion
   */
  transaction(fn: Function) {
    WebSpatial.startTransaction()
    fn()
    return WebSpatial.sendTransaction()
  }

  /**
   * Creates a window context object that is compatable with SpatialWindowComponent's setFromWindow API
   * @returns window context
   */
  async createWindowContext() {
    let openedWindow = window.open('webspatial://createWindowContext')
    if (WebSpatial.getBackend() != 'AVP') {
      // Currently there is a bug with webview which requires us to trigger a navigation before native code can interact with created webview
      var counter = 0
      while ((openedWindow!.window as any).testAPI == null) {
        if (counter > 15) {
          openedWindow?.close()
          openedWindow = window.open('about:blank')
          counter = 0
          this.log('unexpected error when trying to open new window, retrying.')
        }
        var locName = 'about:blank?x' + counter
        openedWindow!!.location.href = locName
        counter++

        await new Promise(resolve => setTimeout(resolve, 10))
      }
      ;(openedWindow! as any)._webSpatialID = (
        openedWindow!.window as any
      ).testAPI.getWindowID()
    } else {
      while ((openedWindow!.window as any)._webSpatialID == undefined) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
    openedWindow!.document.head.innerHTML =
      '<meta name="viewport" content="width=device-width, initial-scale=1">'
    return openedWindow
  }

  // Get Entity by id. Currently for debugging only.
  /** @hidden */
  async _getEntity(id: string) {
    const entityInfo = await WebSpatial.inspect(id)
    const [_, x, y, z] = entityInfo.position.match(/(\d+\.?\d*)/g)
    const [__, sx, sy, sz] = entityInfo.scale.match(/(\d+\.?\d*)/g)

    var res = new WebSpatialResource()
    res.id = id
    res.windowGroupId = WebSpatial.getCurrentWindowGroup().id
    const entity = new SpatialEntity(res)
    entity.transform.position.x = parseFloat(x)
    entity.transform.position.y = parseFloat(y)
    entity.transform.position.z = parseFloat(z)

    entity.transform.scale.x = parseFloat(sx)
    entity.transform.scale.y = parseFloat(sy)
    entity.transform.scale.z = parseFloat(sz)

    return entity
  }
}
