import { BackgroundMaterial, CornerRadius, Vec3, WindowStyle } from './types'

// Base command interface, similar to Swift's CommandDataProtocol
interface CommandDataProtocol {
  commandType: string
}

// Spatial object command interface
interface SpatialObjectCommand extends CommandDataProtocol {
  id: string
}

// Spatialized element properties interface
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

// Update spatial scene properties command
export class UpdateSpatialSceneProperties implements CommandDataProtocol {
  commandType = 'UpdateSpatialSceneProperties'
  id?: string
  material?: BackgroundMaterial
  cornerRadius?: CornerRadius
  opacity?: number
}

// Create spatial scene command
export class CreateSpatialScene implements CommandDataProtocol {
  commandType = 'CreateSpatialScene'
  id?: string
  name?: string
  version?: string
  properties?: Record<string, any>
}

// Add spatialized element to spatial scene command
export class AddSpatializedElementToSpatialScene
  implements CommandDataProtocol
{
  commandType = 'AddSpatializedElementToSpatialScene'
  spatializedElementId: string = ''
}

// Inspect spatial scene command
export class InspectSpatialScene implements CommandDataProtocol {
  commandType = 'InspectSpatialScene'
  id?: string
}

// Create spatialized 2D element command
export class CreateSpatialized2DElement implements CommandDataProtocol {
  commandType = 'CreateSpatialized2DElement'
  id: string = ''
  url: string = ''
}

// Update spatialized 2D element properties command
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

// Update spatialized element transform command
export class UpdateSpatializedElementTransform implements SpatialObjectCommand {
  commandType = 'UpdateSpatializedElementTransform'
  id: string = ''
  matrix?: number[] // add matrix property to match Swift definition
}

// Create spatialized static 3D element command
export class CreateSpatializedStatic3DElement implements CommandDataProtocol {
  commandType = 'CreateSpatializedStatic3DElement'
  modelURL: string = ''
}

// Create spatialized dynamic 3D element command
export class CreateSpatializedDynamic3DElement implements CommandDataProtocol {
  commandType = 'CreateSpatializedDynamic3DElement'
  test: boolean = false
}

// Create spatial entity command
export class CreateSpatialEntity implements CommandDataProtocol {
  commandType = 'CreateSpatialEntity'
  name?: string
}

// Create geometry properties command
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

// Create unlit material command
export class CreateUnlitMaterial implements CommandDataProtocol {
  commandType = 'CreateUnlitMaterial'
  color?: string
  textureId?: string
  transparent?: boolean
  opacity?: number
}

// Create texture command
export class CreateTexture implements CommandDataProtocol {
  commandType = 'CreateTexture'
  url: string = ''
}

// Create model asset command
export class CreateModelAsset implements CommandDataProtocol {
  commandType = 'CreateModelAsset'
  url: string = ''
}

// Create spatial model entity command
export class CreateSpatialModelEntity implements CommandDataProtocol {
  commandType = 'CreateSpatialModelEntity'
  modelAssetId: string = ''
  name?: string
}

// Create model component command
export class CreateModelComponent implements CommandDataProtocol {
  commandType = 'CreateModelComponent'
  geometryId: string = ''
  materialIds: string[] = []
}

// Add component to entity command
export class AddComponentToEntity implements CommandDataProtocol {
  commandType = 'AddComponentToEntity'
  entityId: string = ''
  componentId: string = ''
}

// Add entity to dynamic 3D command
export class AddEntityToDynamic3D implements CommandDataProtocol {
  commandType = 'AddEntityToDynamic3D'
  dynamic3dId: string = ''
  entityId: string = ''
}

// Add entity to entity command
export class AddEntityToEntity implements CommandDataProtocol {
  commandType = 'AddEntityToEntity'
  childId: string = ''
  parentId: string = ''
}

// Set parent for entity command
export class SetParentForEntity implements CommandDataProtocol {
  commandType = 'SetParentToEntity'
  childId: string = ''
  parentId?: string
}

// Remove entity from parent command
export class RemoveEntityFromParent implements CommandDataProtocol {
  commandType = 'RemoveEntityFromParent'
  entityId: string = ''
}

// Update entity properties command
export class UpdateEntityProperties implements CommandDataProtocol {
  commandType = 'UpdateEntityProperties'
  entityId: string = ''
  transform: Record<string, number> = {}
}

// Update entity event command
export class UpdateEntityEvent implements CommandDataProtocol {
  commandType = 'UpdateEntityEvent'
  type: string = ''
  entityId: string = ''
  isEnable: boolean = false
}

// Convert from entity to entity command
export class ConvertFromEntityToEntity implements CommandDataProtocol {
  commandType = 'ConvertFromEntityToEntity'
  fromEntityId: string = ''
  toEntityId: string = ''
  position: Vec3
  constructor() {
    this.position = { x: 0, y: 0, z: 0 }
  }
}

// Convert from entity to scene command
export class ConvertFromEntityToScene implements CommandDataProtocol {
  commandType = 'ConvertFromEntityToScene'
  fromEntityId: string = ''
  position: Vec3
  constructor() {
    this.position = { x: 0, y: 0, z: 0 }
  }
}

// Convert from scene to entity command
export class ConvertFromSceneToEntity implements CommandDataProtocol {
  commandType = 'ConvertFromSceneToEntity'
  entityId: string = ''
  position: Vec3
  constructor() {
    this.position = { x: 0, y: 0, z: 0 }
  }
}

// Keep original Inspect class for compatibility
export class Inspect implements CommandDataProtocol {
  commandType = 'Inspect'
  id: string = ''
}

// Destroy command
export class DestroyCommand implements CommandDataProtocol {
  commandType = 'Destroy'
  id: string = ''
}

// Update spatialized static 3D element properties command
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

// Update spatialized dynamic 3D element properties command
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

// Add spatialized element to spatialized 2D element command
export class AddSpatializedElementToSpatialized2DElement
  implements SpatialObjectCommand
{
  commandType = 'AddSpatializedElementToSpatialized2DElement'
  id: string = ''
  spatializedElementId: string = ''
}

// Baseplate visibility enum
export enum BaseplateVisibilityJSB {
  automatic = 'automatic',
  visible = 'visible',
  hidden = 'hidden',
}

// World scaling enum
export enum WorldScalingJSB {
  automatic = 'automatic',
  dynamic = 'dynamic',
}

// World alignment enum
export enum WorldAlignmentJSB {
  adaptive = 'adaptive',
  automatic = 'automatic',
  gravityAligned = 'gravityAligned',
}

// Size interface
interface Size {
  width: number
  height: number
}

// Resize range interface
interface ResizeRange {
  min: Size
  max: Size
}

// Scene options JSB interface
export class XSceneOptionsJSB {
  defaultSize?: Size
  type?: WindowStyle
  resizability?: ResizeRange
  worldScaling?: WorldScalingJSB
  worldAlignment?: WorldAlignmentJSB
  baseplateVisibility?: BaseplateVisibilityJSB
}

// Update scene config command
export class UpdateSceneConfigCommand implements CommandDataProtocol {
  commandType = 'UpdateSceneConfig'
  config: XSceneOptionsJSB
  constructor(data: XSceneOptionsJSB) {
    this.config = data
  }
}

// Focus scene command
export class FocusSceneCommand implements CommandDataProtocol {
  commandType = 'FocusScene'
  id: string
  constructor(id: string) {
    this.id = id
  }
}

// Get spatial scene state command
export class GetSpatialSceneStateCommand implements CommandDataProtocol {
  commandType = 'GetSpatialSceneState'
}

// Export base interfaces for other files to use
export {
  CommandDataProtocol,
  SpatialObjectCommand,
  SpatializedElementProperties,
}
