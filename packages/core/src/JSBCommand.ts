import { createPlatform } from './platform-adapter'
import { WebSpatialProtocolResult } from './platform-adapter/interface'
import { SpatializedElement } from './SpatializedElement'
import { SpatialObject } from './SpatialObject'

import {
  Spatialized2DElementProperties,
  SpatializedElementProperties,
  SpatializedStatic3DElementProperties,
  SpatialSceneProperties,
  SpatialSceneCreationOptions,
} from './types/types'

const platform = createPlatform()

abstract class JSBCommand {
  commandType: string = ''
  protected abstract getParams(): Record<string, any> | undefined

  async execute() {
    const param = this.getParams()
    const msg = param ? JSON.stringify(param) : ''
    return platform.callJSB(this.commandType, msg)
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

export class UpdateSpatializedElementTransform extends SpatializedElementCommand {
  matrix: Float64Array
  commandType = 'UpdateSpatializedElementTransform'

  constructor(spatialObject: SpatialObject, matrix: Float64Array) {
    super(spatialObject)
    this.matrix = matrix
  }

  protected getExtraParams() {
    return { matrix: Array.from(this.matrix) }
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
    private config: SpatialSceneCreationOptions | undefined,
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
