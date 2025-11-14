import { BackgroundMaterial, CornerRadius, Vec3, WindowStyle } from './types'

// 基础命令接口，类似于Swift中的CommandDataProtocol
interface CommandDataProtocol {
  commandType: string
}

// 空间对象命令接口
interface SpatialObjectCommand extends CommandDataProtocol {
  id: string
}

// 空间化元素属性接口
interface SpatializedElementProperties extends SpatialObjectCommand {
  name?: string
  clientX?: number
  clientY?: number
  width?: number
  height?: number
  depth?: number
  backOffset?: number
  rotationAnchor?: Vec3
  opacity?: number
  visible?: boolean
  scrollWithParent?: boolean
  zIndex?: number
  enableDragStart?: boolean
  enableDragGesture?: boolean
  enableDragEndGesture?: boolean
  enableRotateStartGesture?: boolean
  enableRotateGesture?: boolean
  enableRotateEndGesture?: boolean
  enableMagnifyStartGesture?: boolean
  enableMagnifyGesture?: boolean
  enableMagnifyEndGesture?: boolean
  enableTapGesture?: boolean
}

// 更新空间场景属性命令
export class UpdateSpatialSceneProperties implements CommandDataProtocol {
  commandType = 'UpdateSpatialSceneProperties'
  id?: string
  material?: BackgroundMaterial
  cornerRadius?: CornerRadius
  opacity?: number
}

// 创建空间场景命令
export class CreateSpatialScene implements CommandDataProtocol {
  commandType = 'CreateSpatialScene'
  id?: string
  name?: string
  version?: string
  properties?: Record<string, any>
}

// 向空间场景添加空间化元素命令
export class AddSpatializedElementToSpatialScene
  implements CommandDataProtocol
{
  commandType = 'AddSpatializedElementToSpatialScene'
  spatializedElementId: string = ''
}

// 检查空间场景命令
export class InspectSpatialScene implements CommandDataProtocol {
  commandType = 'InspectSpatialScene'
  id?: string
}

// 创建空间化2D元素命令
export class CreateSpatialized2DElement implements CommandDataProtocol {
  commandType = 'CreateSpatialized2DElement'
  id: string = ''
  url: string = ''
}

// 更新空间化2D元素属性命令
export class UpdateSpatialized2DElementProperties
  implements SpatializedElementProperties
{
  commandType = 'UpdateSpatialized2DElementProperties'
  id: string = ''
  name?: string
  clientX?: number
  clientY?: number
  width?: number
  height?: number
  depth?: number
  backOffset?: number
  rotationAnchor?: Vec3
  opacity?: number
  visible?: boolean
  scrollWithParent?: boolean
  zIndex?: number
  enableDragStart?: boolean
  enableDragGesture?: boolean
  enableDragEndGesture?: boolean
  enableRotateStartGesture?: boolean
  enableRotateGesture?: boolean
  enableRotateEndGesture?: boolean
  enableMagnifyStartGesture?: boolean
  enableMagnifyGesture?: boolean
  enableMagnifyEndGesture?: boolean
  enableTapGesture?: boolean
  scrollPageEnabled?: boolean
  material?: BackgroundMaterial
  cornerRadius?: CornerRadius
}

// 更新空间化元素变换命令
export class UpdateSpatializedElementTransform implements SpatialObjectCommand {
  commandType = 'UpdateSpatializedElementTransform'
  id: string = ''
  matrix?: number[] // 添加matrix属性以匹配Swift中的定义
}

// 创建空间化静态3D元素命令
export class CreateSpatializedStatic3DElement implements CommandDataProtocol {
  commandType = 'CreateSpatializedStatic3DElement'
  modelURL: string = ''
}

// 创建空间化动态3D元素命令
export class CreateSpatializedDynamic3DElement implements CommandDataProtocol {
  commandType = 'CreateSpatializedDynamic3DElement'
  test: boolean = false
}

// 创建空间实体命令
export class CreateSpatialEntity implements CommandDataProtocol {
  commandType = 'CreateSpatialEntity'
  name?: string
}

// 创建几何属性命令
export class CreateGeometryProperties implements CommandDataProtocol {
  commandType = 'CreateGeometry'
  type: string = ''
  width?: number
  height?: number
  depth?: number
  cornerRadius?: number
  splitFaces?: boolean
  radius?: number
}

// 创建无光照材质命令
export class CreateUnlitMaterial implements CommandDataProtocol {
  commandType = 'CreateUnlitMaterial'
  color?: string
  textureId?: string
  transparent?: boolean
  opacity?: number
}

// 创建纹理命令
export class CreateTexture implements CommandDataProtocol {
  commandType = 'CreateTexture'
  url: string = ''
}

// 创建模型资源命令
export class CreateModelAsset implements CommandDataProtocol {
  commandType = 'CreateModelAsset'
  url: string = ''
}

// 创建空间模型实体命令
export class CreateSpatialModelEntity implements CommandDataProtocol {
  commandType = 'CreateSpatialModelEntity'
  modelAssetId: string = ''
  name?: string
}

// 创建模型组件命令
export class CreateModelComponent implements CommandDataProtocol {
  commandType = 'CreateModelComponent'
  geometryId: string = ''
  materialIds: string[] = []
}

// 向实体添加组件命令
export class AddComponentToEntity implements CommandDataProtocol {
  commandType = 'AddComponentToEntity'
  entityId: string = ''
  componentId: string = ''
}

// 向动态3D添加实体命令
export class AddEntityToDynamic3D implements CommandDataProtocol {
  commandType = 'AddEntityToDynamic3D'
  dynamic3dId: string = ''
  entityId: string = ''
}

// 向实体添加实体命令
export class AddEntityToEntity implements CommandDataProtocol {
  commandType = 'AddEntityToEntity'
  childId: string = ''
  parentId: string = ''
}

// 设置实体父级命令
export class SetParentForEntity implements CommandDataProtocol {
  commandType = 'SetParentToEntity'
  childId: string = ''
  parentId?: string
}

// 从父级移除实体命令
export class RemoveEntityFromParent implements CommandDataProtocol {
  commandType = 'RemoveEntityFromParent'
  entityId: string = ''
}

// 更新实体属性命令
export class UpdateEntityProperties implements CommandDataProtocol {
  commandType = 'UpdateEntityProperties'
  entityId: string = ''
  transform: Record<string, number> = {}
}

// 更新实体事件命令
export class UpdateEntityEvent implements CommandDataProtocol {
  commandType = 'UpdateEntityEvent'
  type: string = ''
  entityId: string = ''
  isEnable: boolean = false
}

// 从实体转换到实体命令
export class ConvertFromEntityToEntity implements CommandDataProtocol {
  commandType = 'ConvertFromEntityToEntity'
  fromEntityId: string = ''
  toEntityId: string = ''
  position: Vec3
  constructor() {
    this.position = { x: 0, y: 0, z: 0 }
  }
}

// 从实体转换到场景命令
export class ConvertFromEntityToScene implements CommandDataProtocol {
  commandType = 'ConvertFromEntityToScene'
  fromEntityId: string = ''
  position: Vec3
  constructor() {
    this.position = { x: 0, y: 0, z: 0 }
  }
}

// 从场景转换到实体命令
export class ConvertFromSceneToEntity implements CommandDataProtocol {
  commandType = 'ConvertFromSceneToEntity'
  entityId: string = ''
  position: Vec3
  constructor() {
    this.position = { x: 0, y: 0, z: 0 }
  }
}

// 检查命令 - 重命名以匹配Swift中的InspectCommand
export class InspectCommand implements CommandDataProtocol {
  commandType = 'Inspect'
  id?: string
}

// 保留原有的Inspect类以保持兼容性
export class Inspect implements CommandDataProtocol {
  commandType = 'Inspect'
  id: string = ''
}

// 销毁命令
export class DestroyCommand implements CommandDataProtocol {
  commandType = 'Destroy'
  id: string = ''
}

// 更新空间化静态3D元素属性命令
export class UpdateSpatializedStatic3DElementProperties
  implements SpatializedElementProperties
{
  commandType = 'UpdateSpatializedStatic3DElementProperties'
  id: string = ''
  name?: string
  clientX?: number
  clientY?: number
  width?: number
  height?: number
  depth?: number
  backOffset?: number
  rotationAnchor?: Vec3
  opacity?: number
  visible?: boolean
  scrollWithParent?: boolean
  zIndex?: number
  enableDragStart?: boolean
  enableDragGesture?: boolean
  enableDragEndGesture?: boolean
  enableRotateStartGesture?: boolean
  enableRotateGesture?: boolean
  enableRotateEndGesture?: boolean
  enableMagnifyStartGesture?: boolean
  enableMagnifyGesture?: boolean
  enableMagnifyEndGesture?: boolean
  enableTapGesture?: boolean
  modelURL?: string
  modelTransform?: number[]
}

// 更新空间化动态3D元素属性命令
export class UpdateSpatializedDynamic3DElementProperties
  implements SpatializedElementProperties
{
  commandType = 'UpdateSpatializedDynamic3DElementProperties'
  id: string = ''
  name?: string
  clientX?: number
  clientY?: number
  width?: number
  height?: number
  depth?: number
  backOffset?: number
  rotationAnchor?: Vec3
  opacity?: number
  visible?: boolean
  scrollWithParent?: boolean
  zIndex?: number
  enableDragStart?: boolean
  enableDragGesture?: boolean
  enableDragEndGesture?: boolean
  enableRotateStartGesture?: boolean
  enableRotateGesture?: boolean
  enableRotateEndGesture?: boolean
  enableMagnifyStartGesture?: boolean
  enableMagnifyGesture?: boolean
  enableMagnifyEndGesture?: boolean
  enableTapGesture?: boolean
}

// 向空间化2D元素添加空间化元素命令
export class AddSpatializedElementToSpatialized2DElement
  implements SpatialObjectCommand
{
  commandType = 'AddSpatializedElementToSpatialized2DElement'
  id: string = ''
  spatializedElementId: string = ''
}

// 基础板可见性枚举
export enum BaseplateVisibilityJSB {
  automatic = 'automatic',
  visible = 'visible',
  hidden = 'hidden',
}

// 世界缩放枚举
export enum WorldScalingJSB {
  automatic = 'automatic',
  dynamic = 'dynamic',
}

// 世界对齐枚举
export enum WorldAlignmentJSB {
  adaptive = 'adaptive',
  automatic = 'automatic',
  gravityAligned = 'gravityAligned',
}

// 尺寸接口
interface Size {
  width: number
  height: number
}

// 调整范围接口
interface ResizeRange {
  min: Size
  max: Size
}

// 场景选项JSB接口
export class XSceneOptionsJSB {
  defaultSize?: Size
  type?: WindowStyle
  resizability?: ResizeRange
  worldScaling?: WorldScalingJSB
  worldAlignment?: WorldAlignmentJSB
  baseplateVisibility?: BaseplateVisibilityJSB
}

// 更新场景配置命令
export class UpdateSceneConfigCommand implements CommandDataProtocol {
  commandType = 'UpdateSceneConfig'
  config: XSceneOptionsJSB
  constructor(data: XSceneOptionsJSB) {
    this.config = data
  }
}

// 聚焦场景命令
export class FocusSceneCommand implements CommandDataProtocol {
  commandType = 'FocusScene'
  id: string
  constructor(id: string) {
    this.id = id
  }
}

// 获取空间场景状态命令
export class GetSpatialSceneStateCommand implements CommandDataProtocol {
  commandType = 'GetSpatialSceneState'
}

// 导出基础接口，供其他文件使用
export {
  CommandDataProtocol,
  SpatialObjectCommand,
  SpatializedElementProperties,
}
