interface SpatialObjectInfo {
  id: string
  name: string
  isDestroyed: boolean
}

interface SpatialComponentInfo extends SpatialObjectInfo {
  type: string
  entity: string
}

interface SpatialEntityInfo extends SpatialObjectInfo {
  position: string
  scale: string
  zIndex: number
  visible: boolean
  childEntities: Record<string, SpatialEntityInfo>
  coordinateSpace: 'App' | 'Dom' | 'Root'
  parent: string
  parentWindowContainer: string
  components: Array<SpatialComponentInfo>
}

interface SpatialWindowComponentInfo extends SpatialComponentInfo {
  scrollWithParent: boolean
  resolutionX: number
  resolutionY: number
  parentWebviewID: string
  parentWindowContainerID: string
  childWindowContainers: Array<string>
  spawnedNativeWebviewsCount: number
  childResources: Record<string, SpatialObjectInfo>
  cornerRadius: {
    topLeading: number
    bottomLeading: number
    topTrailing: number
    bottomTrailing: number
  }
  backgroundMaterial: string
  isScrollEnabled: boolean
  isOpaque: boolean
}

interface WindowContainerInfo extends SpatialObjectInfo {
  childEntities: Record<string, SpatialEntityInfo>
}
