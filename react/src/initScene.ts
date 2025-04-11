import { WindowContainerOptions } from '@webspatial/core-sdk'
import { XRApp } from './XRApp'

export function initScene(
  name: string,
  callback: (pre: WindowContainerOptions) => WindowContainerOptions,
) {
  return XRApp.getInstance().initScene(name, callback)
}
