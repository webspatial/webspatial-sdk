import { enableDebugTool } from '@webspatial/react-sdk'
enableDebugTool()

declare global {
  interface Window {
    inspectRootWindowContainer: () => Promise<WindowContainerInfo>
  }
}

export function inspectRootWindowContainer(): Promise<WindowContainerInfo> {
  return window.inspectRootWindowContainer()
}

export async function getRootSpatialEntityInfo(): Promise<SpatialEntityInfo> {
  const rootWindowContainer = await inspectRootWindowContainer()
  return Object.values(rootWindowContainer.childEntities)[0]
}

export async function getRootSpatialWindowComponentInfo(): Promise<SpatialWindowComponentInfo> {
  const rootSpatialEntityInfo = await getRootSpatialEntityInfo()
  return rootSpatialEntityInfo.components[0] as SpatialWindowComponentInfo
}

export function getEntitySpatialWindowComponentInfo(
  spatialEntityInfo: SpatialEntityInfo,
): SpatialWindowComponentInfo {
  return spatialEntityInfo.components.find(
    (component: SpatialComponentInfo) => {
      return component.type === 'SpatialWindowComponent'
    },
  ) as SpatialWindowComponentInfo
}

export function parseSIMD3(simd3description: string) {
  const match = simd3description.match(/\(([\d.]+),\s*([\d.]+),\s*([\d.]+)\)/)
  if (match) {
    const x = parseFloat(match[1])
    const y = parseFloat(match[2])
    const z = parseFloat(match[3])
    return { x, y, z }
  } else {
    throw new Error('Invalid SIMD3 description format')
  }
}
