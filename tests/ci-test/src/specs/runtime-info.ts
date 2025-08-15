import { enableDebugTool } from '@webspatial/react-sdk'
enableDebugTool()

declare global {
  interface Window {
    inspectCurrentSpatialScene: () => Promise<any>
  }
}
