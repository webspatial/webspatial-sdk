import { getPlatform } from './platform-runtime'
import { SpatialComponent } from './reality/component/SpatialComponent'
import { SpatialEntity } from './reality/entity/SpatialEntity'
import { SpatialMaterial } from './reality/material/SpatialMaterial'
import { SpatializedDynamic3DElement } from './SpatializedDynamic3DElement'
import { SpatializedElement } from './SpatializedElement'
import { SpatialObject } from './SpatialObject'

import {
  Spatialized2DElementProperties,
  SpatializedElementProperties,
  SpatializedStatic3DElementProperties,
  SpatialSceneProperties,
  SpatialSceneCreationOptions,
  SpatialUnlitMaterialOptions,
  SpatialGeometryOptions,
  SpatialGeometryType,
  ModelComponentOptions,
  SpatialEntityProperties,
  ModelAssetOptions,
  SpatialModelEntityCreationOptions,
  SpatialEntityEventType,
  Vec3,
  AttachmentEntityOptions,
  AttachmentEntityUpdateOptions,
  BackgroundMaterialType,
  CornerRadius,
  ModelLoadingMode,
  ModelSource,
  SpatialTextureResourceOptions,
} from './types/types'
import type { OrnamentOptions } from './Ornament'
import {
  normalizeAttachmentBackgroundMaterial,
  normalizeAttachmentCornerRadius,
} from './reality/attachmentSurface'
import { composeSRT } from './utils'
import type {
  ControlSpatializedElementAnimationCommand,
  CreateSpatializedElementAnimationCommand,
} from './types/motion/spatializedElementMotion'
import type {
  ControlEntityAnimationCommand,
  CreateEntityAnimationCommand,
  SetEntityAnimationCommand,
  UpdateEntityAnimationCommand,
} from './types/motion/entityMotion'

abstract class JSBCommand {
  commandType: string = ''
  protected abstract getParams(): Record<string, any> | undefined

  async execute() {
    const param = this.getParams()
    const msg = param ? JSON.stringify(param) : ''
    const platform = await getPlatform()
    return platform.callJSB(this.commandType, msg)
  }
}

export class UpdateEntityPropertiesCommand extends JSBCommand {
  commandType = 'UpdateEntityProperties'

  constructor(
    public entity: SpatialEntity,
    public properties: Partial<SpatialEntityProperties>,
  ) {
    super()
  }

  protected getParams() {
    const transform = composeSRT(
      this.properties.position ?? this.entity.position,
      this.properties.rotation ?? this.entity.rotation,
      this.properties.scale ?? this.entity.scale,
    ).toFloat64Array()
    return {
      entityId: this.entity.id,
      transform,
    }
  }
}

export class UpdateEntityEventCommand extends JSBCommand {
  commandType = 'UpdateEntityEvent'

  constructor(
    public entity: SpatialEntity,
    public type: SpatialEntityEventType,
    public isEnable: boolean,
  ) {
    super()
  }

  protected getParams() {
    return {
      type: this.type,
      entityId: this.entity.id,
      isEnable: this.isEnable,
    }
  }
}

// todo: to be used in SpatialEntity
export class UpdateEntityEventsCommand extends JSBCommand {
  // let types:[String:Bool]
  // let entityId:String
  constructor(
    public entity: SpatialEntity,
    public types: Record<SpatialEntityEventType, boolean>,
  ) {
    super()
  }

  protected getParams() {
    return {
      entityId: this.entity.id,
      types: this.types,
    }
  }
}

export class UpdateSpatialSceneProperties extends JSBCommand {
  properties: Partial<SpatialSceneProperties>
  commandType = 'UpdateSpatialSceneProperties'

  constructor(properties: Partial<SpatialSceneProperties>) {
    super()
    this.properties = properties
  }

  protected getParams() {
    return this.properties
  }
}

export class UpdateSceneConfig extends JSBCommand {
  config: SpatialSceneCreationOptions
  commandType = 'UpdateSceneConfig'

  constructor(config: SpatialSceneCreationOptions) {
    super()
    this.config = config
  }

  protected getParams(): Record<string, any> | undefined {
    return { config: this.config }
  }
}

export class FocusScene extends JSBCommand {
  commandType = 'FocusScene'

  constructor(public id: string) {
    super()
  }

  protected getParams(): Record<string, any> | undefined {
    return { id: this.id }
  }
}

export class GetSpatialSceneState extends JSBCommand {
  commandType = 'GetSpatialSceneState'

  constructor() {
    super()
  }

  protected getParams(): Record<string, any> | undefined {
    return {}
  }
}

export abstract class SpatializedElementCommand extends JSBCommand {
  constructor(readonly spatialObject: SpatialObject) {
    super()
  }

  protected getParams() {
    const extraParams = this.getExtraParams()
    return { id: this.spatialObject.id, ...extraParams }
  }

  protected abstract getExtraParams(): Record<string, any> | undefined
}

export class UpdateSpatialized2DElementProperties extends SpatializedElementCommand {
  properties: Partial<Spatialized2DElementProperties>
  commandType = 'UpdateSpatialized2DElementProperties'

  constructor(
    spatialObject: SpatialObject,
    properties: Partial<SpatializedElementProperties>,
  ) {
    super(spatialObject)
    this.properties = properties
  }

  protected getExtraParams() {
    return this.properties
  }
}

export class UpdateSpatializedDynamic3DElementProperties extends SpatializedElementCommand {
  properties: Partial<Spatialized2DElementProperties>
  commandType = 'UpdateSpatializedDynamic3DElementProperties'

  constructor(
    spatialObject: SpatialObject,
    properties: Partial<SpatializedElementProperties>,
  ) {
    super(spatialObject)
    this.properties = properties
  }

  protected getExtraParams() {
    return {
      id: this.spatialObject.id,
      ...this.properties,
    }
  }
}

export class UpdateUnlitMaterialProperties extends SpatializedElementCommand {
  properties: Partial<SpatialUnlitMaterialOptions>
  commandType = 'UpdateUnlitMaterialProperties'

  constructor(
    spatialObject: SpatialObject,
    properties: Partial<SpatialUnlitMaterialOptions>,
  ) {
    super(spatialObject)
    this.properties = properties
  }

  protected getExtraParams() {
    return this.properties
  }
}

export class UpdateSpatializedElementTransform extends SpatializedElementCommand {
  matrix: DOMMatrix
  commandType = 'UpdateSpatializedElementTransform'

  constructor(spatialObject: SpatialObject, matrix: DOMMatrix) {
    super(spatialObject)
    this.matrix = matrix
  }

  protected getExtraParams() {
    return { matrix: Array.from(this.matrix.toFloat64Array()) }
  }
}

export class UpdateSpatializedStatic3DElementProperties extends SpatializedElementCommand {
  properties: Partial<SpatializedStatic3DElementProperties>
  commandType = 'UpdateSpatializedStatic3DElementProperties'

  constructor(
    spatialObject: SpatialObject,
    properties: Partial<SpatializedStatic3DElementProperties>,
  ) {
    super(spatialObject)
    this.properties = properties
  }

  protected getExtraParams() {
    return this.properties
  }
}

export class AddSpatializedElementToSpatialized2DElement extends SpatializedElementCommand {
  commandType = 'AddSpatializedElementToSpatialized2DElement'
  spatializedElement: SpatializedElement

  constructor(
    spatialObject: SpatialObject,
    spatializedElement: SpatializedElement,
  ) {
    super(spatialObject)
    this.spatializedElement = spatializedElement
  }

  protected getExtraParams() {
    return { spatializedElementId: this.spatializedElement.id }
  }
}

export class AddSpatializedElementToSpatialScene extends JSBCommand {
  commandType = 'AddSpatializedElementToSpatialScene'
  spatializedElement: SpatializedElement

  constructor(spatializedElement: SpatializedElement) {
    super()
    this.spatializedElement = spatializedElement
  }

  protected getParams() {
    return {
      spatializedElementId: this.spatializedElement.id,
    }
  }
}

export class AddOrnamentToSceneCommand extends JSBCommand {
  commandType = 'AddOrnamentToScene'

  constructor(readonly ornamentId: string) {
    super()
  }

  protected getParams() {
    return {
      ornamentId: this.ornamentId,
    }
  }
}

export class UpdateOrnamentCommand extends JSBCommand {
  commandType = 'UpdateOrnament'

  constructor(
    readonly id: string,
    readonly options: OrnamentOptions,
  ) {
    super()
  }

  protected getParams() {
    return {
      id: this.id,
      ...this.options,
    }
  }
}

export class CreateSpatializedStatic3DElementCommand extends JSBCommand {
  commandType = 'CreateSpatializedStatic3DElement'

  constructor(
    readonly modelURL?: string,
    readonly sources?: ModelSource[],
    readonly loading: ModelLoadingMode = 'eager',
  ) {
    super()
    this.modelURL = modelURL
    this.sources = sources
    this.loading = loading
  }

  protected getParams() {
    return {
      modelURL: this.modelURL,
      sources: this.sources,
      loading: this.loading,
    }
  }
}

export class CreateSpatializedDynamic3DElementCommand extends JSBCommand {
  protected getParams(): Record<string, any> | undefined {
    return { test: true }
  }
  commandType = 'CreateSpatializedDynamic3DElement'
}

export class CreateSpatialEntityCommand extends JSBCommand {
  constructor(private name?: string) {
    super()
  }
  protected getParams(): Record<string, any> | undefined {
    return { name: this.name }
  }
  commandType = 'CreateSpatialEntity'
}

export class CreateModelComponentCommand extends JSBCommand {
  constructor(private options: ModelComponentOptions) {
    super()
  }
  protected getParams(): Record<string, any> | undefined {
    let geometryId = this.options.mesh.id
    let materialIds = this.options.materials.map(material => material.id)
    return { geometryId, materialIds }
  }
  commandType = 'CreateModelComponent'
}

export class CreateSpatialModelEntityCommand extends JSBCommand {
  constructor(private options: SpatialModelEntityCreationOptions) {
    super()
  }
  protected getParams(): Record<string, any> | undefined {
    return this.options
  }
  commandType = 'CreateSpatialModelEntity'
}

export class CreateModelAssetCommand extends JSBCommand {
  constructor(private options: ModelAssetOptions) {
    super()
  }
  protected getParams(): Record<string, any> | undefined {
    return { url: this.options.url }
  }
  commandType = 'CreateModelAsset'
}

export class CreateSpatialGeometryCommand extends JSBCommand {
  constructor(
    private type: SpatialGeometryType,
    private options: SpatialGeometryOptions = {},
  ) {
    super()
  }
  protected getParams(): Record<string, any> | undefined {
    return { type: this.type, ...this.options }
  }
  commandType = 'CreateGeometry'
}

export class CreateSpatialUnlitMaterialCommand extends JSBCommand {
  constructor(private options: SpatialUnlitMaterialOptions) {
    super()
  }
  protected getParams(): Record<string, any> | undefined {
    return this.options
  }
  commandType = 'CreateUnlitMaterial'
}

export class AddComponentToEntityCommand extends JSBCommand {
  constructor(
    public entity: SpatialEntity,
    public comp: SpatialComponent,
  ) {
    super()
  }
  protected getParams(): Record<string, any> | undefined {
    return {
      entityId: this.entity.id,
      componentId: this.comp.id,
    }
  }
  commandType = 'AddComponentToEntity'
}

export class RemoveComponentFromEntityCommand extends JSBCommand {
  constructor(
    public entity: SpatialEntity,
    public comp: SpatialComponent,
  ) {
    super()
  }
  protected getParams(): Record<string, any> | undefined {
    return {
      entityId: this.entity.id,
      componentId: this.comp.id,
    }
  }
  commandType = 'RemoveComponentFromEntity'
}

export class SetMaterialsOnEntityCommand extends JSBCommand {
  constructor(
    public entityId: string,
    public materials: SpatialMaterial[],
  ) {
    super()
  }
  protected getParams(): Record<string, any> | undefined {
    return {
      entityId: this.entityId,
      materialIds: this.materials.map(m => m.id),
    }
  }
  commandType = 'SetMaterialsOnEntity'
}

export class AddEntityToDynamic3DCommand extends JSBCommand {
  constructor(
    public d3dEle: SpatializedDynamic3DElement,
    public entity: SpatialEntity,
  ) {
    super()
  }
  protected getParams(): Record<string, any> | undefined {
    return {
      entityId: this.entity.id,
      dynamic3dId: this.d3dEle.id,
    }
  }

  commandType = 'AddEntityToDynamic3D'
}

export class AddEntityToEntityCommand extends JSBCommand {
  constructor(
    public parent: SpatialEntity,
    public child: SpatialEntity,
  ) {
    super()
  }
  protected getParams(): Record<string, any> | undefined {
    return {
      parentId: this.parent.id,
      childId: this.child.id,
    }
  }
  commandType = 'AddEntityToEntity'
}

export class RemoveEntityFromParentCommand extends JSBCommand {
  constructor(public entity: SpatialEntity) {
    super()
  }
  protected getParams(): Record<string, any> | undefined {
    return {
      entityId: this.entity.id,
    }
  }
  commandType = 'RemoveEntityFromParent'
}

export class SetParentForEntityCommand extends JSBCommand {
  // childId, parentId
  constructor(
    public childId: string,
    public parentId?: string,
  ) {
    super()
  }
  protected getParams(): Record<string, any> | undefined {
    return {
      childId: this.childId,
      parentId: this.parentId,
    }
  }
  commandType = 'SetParentToEntity'
}

export class ConvertFromEntityToEntityCommand extends JSBCommand {
  constructor(
    public fromEntityId: string,
    public toEntityId: string,
    public fromPosition: Vec3,
  ) {
    super()
  }
  protected getParams(): Record<string, any> | undefined {
    return {
      fromEntityId: this.fromEntityId,
      toEntityId: this.toEntityId,
      position: this.fromPosition,
    }
  }
  commandType = 'ConvertFromEntityToEntity'
}

export class ConvertFromEntityToSceneCommand extends JSBCommand {
  constructor(
    public fromEntityId: string,
    public position: Vec3,
  ) {
    super()
  }

  protected getParams(): Record<string, any> | undefined {
    return {
      fromEntityId: this.fromEntityId,
      position: this.position,
    }
  }

  commandType = 'ConvertFromEntityToScene'
}

export class ConvertFromSceneToEntityCommand extends JSBCommand {
  //  let entityId: String
  // let position:Vec3
  constructor(
    public entityId: string,
    public position: Vec3,
  ) {
    super()
  }
  protected getParams(): Record<string, any> | undefined {
    return {
      entityId: this.entityId,
      position: this.position,
    }
  }
  commandType = 'ConvertFromSceneToEntity'
}

export class ConvertCoordinateCommand extends JSBCommand {
  constructor(
    public position: Vec3,
    public fromId: string,
    public toId: string,
  ) {
    super()
  }
  protected getParams(): Record<string, any> | undefined {
    return {
      position: this.position,
      fromId: this.fromId,
      toId: this.toId,
    }
  }
  commandType = 'ConvertCoordinate'
}

export class CreateTextureCommand extends JSBCommand {
  constructor(private url: string) {
    super()
  }
  protected getParams(): Record<string, any> | undefined {
    return {
      url: this.url,
    }
  }
  commandType = 'CreateTexture'
}

export class UpdateTexturePropertiesCommand extends SpatializedElementCommand {
  properties: Partial<SpatialTextureResourceOptions>
  commandType = 'UpdateTextureProperties'

  constructor(
    spatialObject: SpatialObject,
    properties: Partial<SpatialTextureResourceOptions>,
  ) {
    super(spatialObject)
    this.properties = properties
  }

  protected getExtraParams() {
    return this.properties
  }
}

export class InspectCommand extends JSBCommand {
  commandType = 'Inspect'

  constructor(readonly id: string = '') {
    super()
  }

  protected getParams() {
    return this.id ? { id: this.id } : { id: '' }
  }
}

export class DestroyCommand extends JSBCommand {
  commandType = 'Destroy'

  constructor(readonly id: string) {
    super()
  }

  protected getParams() {
    return { id: this.id }
  }
}

export class CheckWebViewCanCreateCommand extends JSBCommand {
  commandType = 'CheckWebViewCanCreate'

  constructor(readonly id: string = '') {
    super()
  }

  protected getParams() {
    return { id: this.id }
  }
}

export class InitializeAttachmentCommand extends JSBCommand {
  commandType = 'InitializeAttachment'
  constructor(
    private attachmentId: string,
    private options: AttachmentEntityOptions,
  ) {
    super()
  }
  protected getParams() {
    return {
      id: this.attachmentId,
      placementId: this.options.placement.id,
      position: this.options.position ?? { x: 0, y: 0, z: 0 },
      rotation: this.options.rotation ?? { x: 0, y: 0, z: 0 },
      scale: this.options.scale ?? { x: 1, y: 1, z: 1 },
      width: this.options.width,
      height: this.options.height,
      ownerViewId: this.options.ownerViewId,
      cornerRadius: normalizeAttachmentCornerRadius(this.options.cornerRadius),
      backgroundMaterial: normalizeAttachmentBackgroundMaterial(
        this.options.backgroundMaterial,
      ),
    }
  }
}

export class UpdateAttachmentEntityCommand extends JSBCommand {
  commandType = 'UpdateAttachmentEntity'
  constructor(
    private attachmentId: string,
    private options: AttachmentEntityUpdateOptions,
  ) {
    super()
  }
  protected getParams() {
    // Omitted fields stay omitted so the native side preserves the
    // attachment's existing effective values on partial updates.
    const { cornerRadius, backgroundMaterial, ...rest } = this.options
    const params: {
      id: string
      cornerRadius?: CornerRadius
      backgroundMaterial?: BackgroundMaterialType
    } & Omit<
      AttachmentEntityUpdateOptions,
      'cornerRadius' | 'backgroundMaterial'
    > = {
      id: this.attachmentId,
      ...rest,
    }
    if (cornerRadius !== undefined) {
      params.cornerRadius = normalizeAttachmentCornerRadius(cornerRadius)
    }
    if (backgroundMaterial !== undefined) {
      params.backgroundMaterial =
        normalizeAttachmentBackgroundMaterial(backgroundMaterial)
    }
    return params
  }
}

export class CreateSpatializedElementAnimationJSBCommand extends JSBCommand {
  commandType = 'CreateSpatializedElementAnimation'

  constructor(private command: CreateSpatializedElementAnimationCommand) {
    super()
  }

  protected getParams() {
    const { elementId, timeline } = this.command
    return {
      elementId,
      timeline,
    }
  }
}

export class ControlSpatializedElementAnimationJSBCommand extends JSBCommand {
  commandType = 'ControlSpatializedElementAnimation'

  constructor(private command: ControlSpatializedElementAnimationCommand) {
    super()
  }

  protected getParams() {
    const { animationId, type } = this.command
    return {
      animationId,
      type,
    }
  }
}

export interface StartBlobTransferParams {
  requestId: string
  src: string
  mimeType: string
  size: number
}

export class StartBlobTransferCommand extends SpatializedElementCommand {
  commandType = 'StartBlobTransfer'

  constructor(
    spatialObject: SpatialObject,
    private params: StartBlobTransferParams,
  ) {
    super(spatialObject)
  }

  protected getExtraParams() {
    return { ...this.params }
  }
}

export interface TransferBlobChunkParams {
  requestId: string
  /** Byte offset of this base64-encoded chunk in the Blob. */
  offset: number
  data: string
}

export class TransferBlobChunkCommand extends SpatializedElementCommand {
  commandType = 'TransferBlobChunk'

  constructor(
    spatialObject: SpatialObject,
    private params: TransferBlobChunkParams,
  ) {
    super(spatialObject)
  }

  protected getExtraParams() {
    return { ...this.params }
  }
}

export interface CompleteBlobTransferParams {
  requestId: string
}

export class CompleteBlobTransferCommand extends SpatializedElementCommand {
  commandType = 'CompleteBlobTransfer'

  constructor(
    spatialObject: SpatialObject,
    private params: CompleteBlobTransferParams,
  ) {
    super(spatialObject)
  }

  protected getExtraParams() {
    return { ...this.params }
  }
}

export interface FailBlobTransferParams {
  requestId: string
  message?: string
}

export class FailBlobTransferCommand extends SpatializedElementCommand {
  commandType = 'FailBlobTransfer'

  constructor(
    spatialObject: SpatialObject,
    private params: FailBlobTransferParams,
  ) {
    super(spatialObject)
  }

  protected getExtraParams() {
    return { ...this.params }
  }
}

/** Sends a canonical Entity animation timeline for a target Entity id. */
export class CreateEntityAnimationJSBCommand extends JSBCommand {
  /** Native bridge command name. */
  commandType = 'CreateEntityAnimation'

  /** Creates a bridge command from its complete wire request. */
  constructor(private command: CreateEntityAnimationCommand) {
    super()
  }

  /** Returns the dedicated Entity animation create payload. */
  protected getParams() {
    return this.command
  }
}

/** Sends a candidate timeline to an existing Entity animation object. */
export class UpdateEntityAnimationJSBCommand extends JSBCommand {
  /** Native bridge command name. */
  commandType = 'UpdateEntityAnimation'

  /** Creates a bridge command from its complete wire request. */
  constructor(private command: UpdateEntityAnimationCommand) {
    super()
  }

  /** Returns the dedicated Entity animation update payload. */
  protected getParams() {
    return this.command
  }
}

/** Sends a playback or lifecycle command to an Entity animation object. */
export class ControlEntityAnimationJSBCommand extends JSBCommand {
  /** Native bridge command name. */
  commandType = 'ControlEntityAnimation'

  /** Creates a bridge command from its complete wire request. */
  constructor(private command: ControlEntityAnimationCommand) {
    super()
  }

  /** Returns the dedicated Entity animation control payload. */
  protected getParams() {
    return this.command
  }
}

/** Sends a sparse committed-transform update to an Entity animation object. */
export class SetEntityAnimationJSBCommand extends JSBCommand {
  /** Native bridge command name. */
  commandType = 'SetEntityAnimation'

  /** Creates a bridge command from its complete wire request. */
  constructor(private command: SetEntityAnimationCommand) {
    super()
  }

  /** Returns the dedicated Entity animation set payload. */
  protected getParams() {
    return this.command
  }
}
