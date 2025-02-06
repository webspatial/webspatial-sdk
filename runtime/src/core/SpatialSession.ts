import { SpatialEntity } from './SpatialEntity'
import { SpatialWindowGroup } from './SpatialWindowGroup'
import { WebSpatial, WebSpatialResource } from './private/WebSpatial'
import { LoadingMethodKind, WindowGroupOptions, WindowStyle } from './types'

import {
  SpatialMeshResource,
  SpatialPhysicallyBasedMaterialResource,
} from './resource'
import {
  SpatialModelComponent,
  SpatialInputComponent,
  SpatialWindowComponent,
  SpatialViewComponent,
  SpatialModel3DComponent,
} from './component'
import { RemoteCommand } from './private/remote-command'

/**
 * Animation callback with timestamp
 */
type animCallback = (time: DOMHighResTimeStamp) => Promise<any>

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
      WebSpatial.onFrame(async (time: number) => {
        await Promise.all(
          this._engineUpdateListeners.map(cb => {
            return cb(time)
          }),
        )
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
    return new SpatialMeshResource(entity)
  }

  /**
   * Creates a PhysicallyBasedMaterial containing PBR material data
   * @returns PhysicallyBasedMaterial
   */
  async createPhysicallyBasedMaterialResource(options?: any) {
    let entity = await WebSpatial.createResource(
      'PhysicallyBasedMaterial',
      WebSpatial.getCurrentWindowGroup(),
      WebSpatial.getCurrentWebPanel(),
      options,
    )
    return new SpatialPhysicallyBasedMaterialResource(entity)
  }
  /**
   * Creates a WindowGroup
   * @returns SpatialWindowGroup
   * */
  async createWindowGroup(style: WindowStyle = 'Plain') {
    return new SpatialWindowGroup(await WebSpatial.createWindowGroup(style))
  }

  /**
   * Creates a Scene to display content within an anchored area managed by the OS
   * @hidden
   * @param {WindowStyle} [style='Plain'] - The style of the Scene container to be created with. Defaults to 'Plain'.
   * @param {Object} [cfg={}] - Configuration object for the Scene.
   * @returns Boolean
   */
  async createScene(
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
    return await WebSpatial.createScene(style, cfg)
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
   * Logs a message to the native apps console
   * @param msg mesage to log
   */
  async log(...msg: any[]) {
    await WebSpatial.sendCommand(new RemoteCommand('log', { logString: msg }))
  }

  /**
   * @hidden
   * Debugging only, used to ping the native renderer
   */
  async _ping(msg: string) {
    return await WebSpatial.ping(msg)
  }

  /**
   * @hidden
   * Debugging to get internal state from native code
   * @returns data as a js object
   */
  async _getStats() {
    return (await WebSpatial.getStats()) as any
  }

  /**
   * @hidden
   */
  async _inspect(spatialObjectId: string = WebSpatial.getCurrentWebPanel().id) {
    return WebSpatial.inspect(spatialObjectId)
  }

  /**
   * @hidden
   */
  async _inspectRootWindowGroup() {
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
  // set loading view.
  /** @hidden */
  async setLoading(method: LoadingMethodKind, style?: string) {
    return WebSpatial.setLoading(method, style)
  }
}
