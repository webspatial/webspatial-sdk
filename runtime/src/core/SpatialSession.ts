import { LoggerLevel } from './private/log'
import { SpatialEntity } from './SpatialEntity'
import { SpatialWindowGroup } from './SpatialWindowGroup'
import { WebSpatial, WebSpatialResource } from './private/WebSpatial'
import { WindowStyle } from './types'

import { SpatialMesh, SpatialPhysicallyBasedMaterial } from './resource'
import {
  SpatialModelComponent,
  SpatialInputComponent,
  SpatialWindowComponent,
  SpatialViewComponent,
} from './component'
import { SpatialObject } from './SpatialObject'

class SpatialFrame {}

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
    let entity = await WebSpatial.createResource(
      'Entity',
      WebSpatial.getCurrentWindowGroup(),
      WebSpatial.getCurrentWebPanel(),
    )
    return new SpatialEntity(entity)
  }

  /**
   * Creates a WindowComponent
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
   * Creates a ViewComponent
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
   * Creates a ModelComponent
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
   * Creates a InputComponent
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
   * Creates a MeshResource
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
   * Creates a PhysicallyBasedMaterial
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
   * Creates a WindowGroup
   * @returns WindowGroup
   */
  async createWindowGroup(style: WindowStyle = 'Plain') {
    return new SpatialWindowGroup(await WebSpatial.createWindowGroup(style))
  }

  /**
   * Retrieves the window for this page
   * @returns the window component corresponding to the js running on this page
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
    return (await WebSpatial.getStats()) as any
  }

  async inspect(spatialObjectId: string = WebSpatial.getCurrentWebPanel().id) {
    return WebSpatial.inspect(spatialObjectId)
  }

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

  // Retreives the windowgroup corresponding to the Immersive space
  private static _immersiveWindowGroup = null as null | SpatialWindowGroup
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

  // Start a transaction that queues up commands to submit them all at once to reduce ipc overhead
  transaction(fn: Function) {
    WebSpatial.startTransaction()
    fn()
    return WebSpatial.sendTransaction()
  }

  // Creates a window context object that is compatable with SpatialWindowComponent's setFromWindow API
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
