import {
  BackgroundMaterialType,
  CornerRadius,
  SpatialComponent,
  SpatialEntity,
  SpatialMeshResource,
  SpatialModelComponent,
  Vec3,
  Vec4,
} from '../dist'

class SpatialObject {
  private _destroyed = false
  private _name = ''

  getId(): String {
    return ''
  }

  // Set Entity name. Currently for debugging only.
  /** @hidden */
  async _setName(name: string) {
    this._name = name
  }

  async destroy(): Promise<void> {}

  /**
   * Check if destroy has been called
   */
  isDestroyed() {
    return this._destroyed
  }
}

class SpatialTransform {}

class SpatializedElement extends SpatialObject {
  public width: Number
  public height: Number

  public transform: SpatialTransform

  async updateTransform() {}

  /**
   * Sets the resolution of the window, the resulting dimensions when rendered will be equal to 1/1360 units
   * eg. if the resolution is set to 1360x1360 it will be a 1x1 plane
   * See 1360 in spatialViewUI.swift for how this ratio works
   * @param width width in pixels
   * @param height height in pixels
   */
  async setWidth(width: number, height: number) {}

  async setPosition(position: Vec3) {}

  async setRotation(rotation: Vec4) {}

  async setScale(rotation: Vec3) {}

  /**
   * [Experimental] Sets the anchor which the entity this is attached to will rotate around
   * @param rotationAnchor
   */
  async setRotationAnchor(rotationAnchor: Vec3) {}

  /**
   * [Experimental] Sets the opacity of the window after apply material
   * @param opacity
   */
  async setOpacity(opacity: number) {}

  /**
   * Sets if the SpatializedElement should be visible (default: True)
   * @param visible
   */
  async setVisible(visible: boolean) {}

  async removeFromParent() {}
}

class Spatialized2DElement extends SpatializedElement {
  async addElement(element: SpatializedElement): Promise<void> {}

  // to create window async, called by SpatialScene.createSpatialized2DElement()
  async init() {
    // create window
    // setScrollEdgeInsets
  }

  get window() {
    // return webview window handler
    return window
  }

  async setBackgroundMaterial(backgroundMaterial: BackgroundMaterialType) {}

  async setCornerRadius(cornerRadius: number | CornerRadius) {}

  /**
   * Enable/Disable scrolling in the window (defaults to enabled), if disabled, scrolling will be applied to the root page
   * @param enabled value to set
   */
  async setScrollEnabled(enabled: boolean) {}

  /**
   * Defaults to false. If set to true, scrolling the parent page will also scroll this window with it like other dom elements
   * @param scrollWithParent value to set
   */
  async setScrollWithParent(scrollWithParent: boolean) {}

  /**
   * Syncs the zIndex with the renderer
   */
  async updateZIndex(zIndex: number) {}
}

class SpatializedModel3DElement extends SpatializedElement {
  /**
   * Sets how the model fill the rect
   * @param contentMode
   */
  async setContentMode(contentMode: 'fill' | 'fit') {}

  /**
   * Constrains this model dimensions to the specified aspect ratio.
   * with a value of 0, the model will use the original aspect ratio.
   *
   * @param aspectRatio number
   */
  async setAspectRatio(aspectRatio: number) {}
}

/**
 * Entity used to describe an object that can be added to the scene
 */
export class SpatialEntityPlus extends SpatialObject {
  /**
   * Transform corresponding to the entity
   * note: updateTransform must be called for transform to be synced to rendering
   */
  transform = new SpatialTransform()

  /**
   * Syncs the transform with the renderer, must be called to observe updates
   */
  async updateTransform() {}

  private components: Map<Function, SpatialComponent> = new Map()

  /**
   * Attaches a component to the entity to be displayed
   * [TODO] review pass by value vs ref and ownership model for this
   */
  async addComponent(component: SpatialComponent) {}

  /**
   * Removes a component from the entity
   */
  async removeComponent<T extends SpatialComponent>(
    type: new (...args: any[]) => T,
  ) {}

  /**
   * Gets a component from the entity
   */
  getComponent<T extends SpatialComponent>(
    type: new (...args: any[]) => T,
  ): T | undefined {
    return this.components.get(type) as T | undefined
  }

  /**
   * Sets a parent entity, if that entity or its parents are attached to a window container, this entity will be displayed
   * @param e parent entity or null to remove current parent
   */
  async setParent(e: SpatialEntity | null) {}
}

class SpatializedDynamic3DElement extends SpatializedElement {
  private rootEntity: SpatialEntity

  async addEntity(entity: SpatialEntity) {}
}

interface SpatialSceneInfo {}

interface SpatialScene {
  addSpatializedElement(element: SpatializedElement): Promise<void>

  addElement(element: SpatializedElement): Promise<void>

  setBackgroundMaterial(
    backgroundMaterial: BackgroundMaterialType,
  ): Promise<void>

  setCornerRadius(cornerRadius: number | CornerRadius): Promise<void>

  // for debug
  _inspect(): Promise<SpatialSceneInfo>
  _getSpatializedElement(uuid: String): Promise<SpatializedElement>
}

enum SpatialSceneStatus {
  Success,
  Failure,
  Loading,
}

type ProgressUpdateHandler = (status: SpatialSceneStatus, reason: string) => {}

interface SpatialSession {
  getSpatialScene(): Promise<SpatialScene>

  // create SpatialObject
  createSpatialized2DElement(): Promise<Spatialized2DElement>
  createSpatializedModel3DElement(): Promise<SpatializedModel3DElement>
  createDynamic3DElement(): Promise<SpatializedDynamic3DElement>

  createEntity(): Promise<SpatialEntity>
  // Todo: @fukang
  createModelComponent(): Promise<SpatialModelComponent>
  //  Todo: @fukang
  createMeshResource(): Promise<SpatialMeshResource>

  // used to open a new SpatialScene, but return scene's WindowProxy
  createSpatialScene(progressUpdate: ProgressUpdateHandler): WindowProxy // @wangyang need to consider it more seirousely
}
