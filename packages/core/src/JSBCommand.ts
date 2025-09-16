import { createPlatform } from './platform-adapter'
import { WebSpatialProtocolResult } from './platform-adapter/interface'
import { SpatialComponent } from './reality/component/SpatialComponent'
import { SpatialEntity } from './reality/entity/SpatialEntity'
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
} from './types/types'
import { SpatialSceneCreationOptionsInternal } from './types/internal'
import { composeSRT } from './utils'

const platform = createPlatform()

abstract class JSBCommand {
  commandType: string = ''
  protected abstract getParams(): Record<string, any> | undefined

  async execute() {
    const param = this.getParams()
    const msg = param ? JSON.stringify(param) : ''
    console.log(
      '🚀 ~ JSBCommand ~ execute ~ this.commandType:',
      this.commandType,
      param,
    )
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

export class CreateSpatializedStatic3DElementCommand extends JSBCommand {
  commandType = 'CreateSpatializedStatic3DElement'

  constructor(readonly modelURL: string) {
    super()
    this.modelURL = modelURL
  }

  protected getParams() {
    return { modelURL: this.modelURL }
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

export class CreateTextureResourceCommand extends JSBCommand {
  constructor(private url: string) {
    super()
  }
  protected getParams(): Record<string, any> | undefined {
    return {
      url: this.url,
    }
  }
  commandType = 'CreateTextureResource'
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

/* WebSpatial Protocol Begin */
abstract class WebSpatialProtocolCommand extends JSBCommand {
  target?: string
  features?: string

  async execute(): Promise<WebSpatialProtocolResult> {
    const query = this.getQuery()
    return platform.callWebSpatialProtocol(
      this.commandType,
      query,
      this.target,
      this.features,
    )
  }

  executeSync(): WebSpatialProtocolResult {
    const query = this.getQuery()
    return platform.callWebSpatialProtocolSync(
      this.commandType,
      query,
      this.target,
      this.features,
    )
  }

  private getQuery() {
    let query = undefined
    const params = this.getParams()
    if (params) {
      query = Object.keys(params)
        .map(key => {
          const value = params[key]
          const finalValue =
            typeof value === 'object' ? JSON.stringify(value) : value
          return `${key}=${encodeURIComponent(finalValue)}`
        })
        .join('&')
    }

    return query
  }
}

export class createSpatialized2DElementCommand extends WebSpatialProtocolCommand {
  commandType = 'createSpatialized2DElement'
  protected getParams() {
    return undefined
  }
}

export class createSpatialSceneCommand extends WebSpatialProtocolCommand {
  commandType = 'createSpatialScene'

  constructor(
    private url: string,
    private config: SpatialSceneCreationOptionsInternal | undefined,
    public target?: string,
    public features?: string,
  ) {
    super()
  }
  protected getParams() {
    return {
      url: this.url,
      config: this.config,
    }
  }
}

/* WebSpatial Protocol End */
