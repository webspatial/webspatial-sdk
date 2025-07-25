import { createPlatform } from './platform-adapter'
import { BackgroundMaterialType, CornerRadius } from './types'

const platform = createPlatform()

abstract class JSBCommand {
  commandType: string = ''
  protected abstract getParams(): Object

  async execute() {
    const param = this.getParams()
    const msg = JSON.stringify(param)
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
