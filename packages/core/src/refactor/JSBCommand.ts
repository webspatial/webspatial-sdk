import { createPlatform } from './platform-adapter'
import { WebSpatialProtocolResult } from './platform-adapter/interface'
import { SpatializedElement } from './SpatializedElement'
import { SpatialObject } from './SpatialObject'
import {
  BackgroundMaterialType,
  CornerRadius,
  Spatialized2DElementProperties,
  SpatializedElementProperties,
  SpatialTransform,
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

export class UpdateSpatialSceneMaterial extends JSBCommand {
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
  spatialTransform: Partial<SpatialTransform>
  commandType = 'UpdateSpatializedElementTransform'

  constructor(
    spatialObject: SpatialObject,
    spatialTransform: Partial<SpatialTransform>,
  ) {
    super(spatialObject)
    this.spatialTransform = spatialTransform
  }

  protected getExtraParams() {
    return this.spatialTransform
  }
}

export class UpdateSpatialized2DElementMaterial extends SpatializedElementCommand {
  material: BackgroundMaterialType
  commandType = 'UpdateSpatialized2DElementMaterial'

  constructor(spatialObject: SpatialObject, material: BackgroundMaterialType) {
    super(spatialObject)
    this.material = material
  }

  protected getExtraParams() {
    return { material: this.material }
  }
}

export class UpdateSpatialized2DElementCorner extends SpatializedElementCommand {
  cornerRadius: CornerRadius
  commandType = 'UpdateSpatialized2DElementCorner'

  constructor(spatialObject: SpatialObject, cornerRadius: CornerRadius) {
    super(spatialObject)
    this.cornerRadius = cornerRadius
  }

  protected getExtraParams() {
    return { cornerRadius: this.cornerRadius }
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
