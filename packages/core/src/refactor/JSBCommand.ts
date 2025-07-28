import { createPlatform } from './platform-adapter'
import { WebSpatialProtocolResult } from './platform-adapter/interface'
import { SpatializedElement } from './SpatializedElement'
import { SpatialObject } from './SpatialObject'
import {
  BackgroundMaterialType,
  CornerRadius,
  SpatializedElementProperties,
} from './types'

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

export class UpdateSpatialSceneMaterialCommand extends JSBCommand {
  material: BackgroundMaterialType
  commandType = 'UpdateSpatialSceneMaterial'

  constructor(material: BackgroundMaterialType) {
    super()
    this.material = material
  }

  protected getParams() {
    return {
      material: this.material,
    }
  }
}

export class UpdateSpatialSceneCorner extends JSBCommand {
  cornerRadius: CornerRadius
  commandType = 'UpdateSpatialSceneCorer'

  constructor(cornerRadius: CornerRadius) {
    super()
    this.cornerRadius = cornerRadius
  }

  protected getParams() {
    return { cornerRadius: this.cornerRadius }
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

export class UpdateSpatializedElementProperties extends SpatializedElementCommand {
  properties: SpatializedElementProperties
  commandType = 'UpdateSpatializedElementProperties'

  constructor(
    spatialObject: SpatialObject,
    properties: SpatializedElementProperties,
  ) {
    super(spatialObject)
    this.properties = properties
  }

  protected getExtraParams() {
    return this.properties
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

export class PingCommand extends JSBCommand {
  commandType = 'Ping'

  protected getParams() {
    return undefined
  }
}

/* WebSpatial Protocol Begin */
abstract class WebSpatialProtocolCommand extends JSBCommand {
  async execute(): Promise<WebSpatialProtocolResult> {
    let query = undefined
    const params = this.getParams()
    if (params) {
      query = Object.keys(params)
        .map(key => {
          const value = params[key]
          return `${key}=${value}`
        })
        .join('&')
    }

    return platform.callWebSpatialProtocol(this.commandType, query)
  }
}

export class createSpatialized2DElementCommand extends WebSpatialProtocolCommand {
  commandType = 'createSpatialized2DElement'
  protected getParams() {
    return undefined
  }
}

/* WebSpatial Protocol End */
