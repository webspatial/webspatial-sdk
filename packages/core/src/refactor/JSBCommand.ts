import { createPlatform } from './platform-adapter'
import { WebSpatialProtocolResult } from './platform-adapter/interface'
import { BackgroundMaterialType, CornerRadius } from './types'

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
  commandType = 'updateSpatialSceneMaterial'

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
  commandType = 'updateSpatialSceneCorner'

  constructor(cornerRadius: CornerRadius) {
    super()
    this.cornerRadius = cornerRadius
  }

  protected getParams() {
    return { cornerRadius: this.cornerRadius }
  }
}

export class PingCommand extends JSBCommand {
  commandType = 'ping'

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
