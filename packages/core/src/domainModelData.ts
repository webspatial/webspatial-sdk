import {
  BackgroundMaterialType,
  CornerRadius,
  SpatialTransform,
  Vec3,
} from '../dist'

// inspect return value

interface SpatialObjectData {
  id: string
  name: string
}

interface ProtocolDefData {
  url: string
  protocol: string
}

interface SpatialAppData {
  displayMode: string
  startUrl: string
  scope: string
  protocolDefinition: Array<ProtocolDefData>
}

interface SpatialSceneData extends SpatialObjectData {
  width: number
  height: number
  url: string
  windowStyle: 'Plain' | 'Volumetric'
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number

  backgroundMaterial: BackgroundMaterialType
  cornerRadius: CornerRadius

  spatialized2DElement: Array<Spatialized2DElementData>
  spatializedModel3DElement: Array<SpatializedModel3DElementData>
  spatializedDynamic3DElement: Array<SpatializedDynamic3DElementData>
}

interface SpatializedElementData extends SpatialObjectData {
  width: Number
  height: Number
  transform: SpatialTransform
  rotationAnchor: Vec3
  opacity: number
  visible: boolean

  parent: String
}

interface SpatializedModel3DElementData extends SpatializedElementData {
  contentMode: 'fill' | 'fit'
  aspectRatio: number
  resizable: boolean
  modelURL: string
}

interface Spatialized2DElementData extends SpatializedElementData {
  children: Array<SpatializedElementData>
  window: WindowProxy
  backgroundMaterial: BackgroundMaterialType
  cornerRadius: CornerRadius

  scrollEnabled: boolean
  zIndex: number
}

interface SpatialComponentData extends SpatialObjectData {
  entity: string
}

interface SpatialEntityData extends SpatialObjectData {
  children: Array<SpatialEntityData>
  parent: string
  components: Array<SpatialComponentData>

  transform: SpatialTransform
}

interface SpatializedDynamic3DElementData extends SpatializedElementData {
  children: Array<SpatialEntityData>
}
