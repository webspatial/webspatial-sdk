'use client'

import { ReactNode } from 'react'
import { getSpatialImpl } from '../runtime/bridge'
import { useSpatialReady } from '../runtime/useSpatialReady'
import { warnBootForgotten } from './shared/warnBootForgotten'

export type SceneGraphProps = {
  children?: ReactNode
}

/**
 * Default-entry facade for `SceneGraph`. The fallback is a transparent
 * `<>{children}</>` Fragment so users can still author scene-graph trees
 * in plain browsers / before boot, with each individual entity / asset
 * falling back via its own facade. Per spec per-component fallback
 * table ("`SceneGraph` / `World` → `<>{children}</>` (transparent
 * container)").
 */
export function SceneGraph({ children }: SceneGraphProps) {
  const ready = useSpatialReady()
  if (!ready) {
    warnBootForgotten('SceneGraph')
    return <>{children}</>
  }
  const RealSceneGraph = getSpatialImpl()!.SceneGraph
  return <RealSceneGraph>{children}</RealSceneGraph>
}
SceneGraph.displayName = 'SceneGraph'

// Public alias matches src/reality/components/index.tsx (`export {
// SceneGraph as World } from './SceneGraph'`).
export { SceneGraph as World }
