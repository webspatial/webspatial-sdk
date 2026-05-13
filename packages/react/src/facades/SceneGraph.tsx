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
 *
 * **PARITY (spec tasks.md §15.6)**: Path 2 unpinned in
 * `runtime-capabilities` today; the parity test is tracked as `it.todo`
 * under §15.8 (see `src/__tests__/parity.test.tsx`). Once the real-impl
 * unsupported branch lands or the spec amendment defines it, the
 * existing transparent-children behavior here MUST stay aligned.
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
