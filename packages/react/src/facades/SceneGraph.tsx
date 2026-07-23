'use client'

import { ReactNode } from 'react'
import { requireSpatialImpl } from '../runtime/bridge'
import { useSpatialReady } from '../runtime/useSpatialReady'
import { getBootForgottenDiagnostic } from './shared/warnBootForgotten'

export type SceneGraphProps = {
  children?: ReactNode
}

/**
 * Default-entry facade for `SceneGraph`. Fallback is `null` (children NOT
 * mounted), matching entity / asset facades and the usual authoring shape
 * under `<Reality>` (whose fallback already suppresses the child subtree).
 * Per spec per-component fallback table ("`SceneGraph` / `World` → `null`").
 *
 * **PARITY (spec tasks.md §15.6)**: Path 2 unpinned in
 * `runtime-capabilities` today; the parity test is tracked as `it.todo`
 * under §15.8 (see `src/__tests__/parity.test.tsx`). Once the real-impl
 * unsupported branch lands or the spec amendment defines it, the
 * existing `null` fallback here MUST stay aligned.
 */
export function SceneGraph({ children }: SceneGraphProps) {
  const ready = useSpatialReady()
  if (!ready) {
    return getBootForgottenDiagnostic('SceneGraph')
  }
  const RealSceneGraph = requireSpatialImpl().SceneGraph
  return <RealSceneGraph>{children}</RealSceneGraph>
}
SceneGraph.displayName = 'SceneGraph'

// Public alias matches src/reality/components/index.tsx (`export {
// SceneGraph as World } from './SceneGraph'`).
export { SceneGraph as World }
