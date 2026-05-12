import { isSSREnv } from '@webspatial/core-sdk'
import type { Spatialized2DElement } from '@webspatial/core-sdk'
import { getSpatialImpl } from '../runtime/bridge'

// Per the lazy-load proposal `tasks.md §12.9` ("Pre-v1 budget calibration"),
// this default-entry utility no longer statically imports `getSession`
// from `./getSession` — that would pull `Spatial` + `SpatialSession`
// (and through `SpatialSession`, the entire spatial creator class graph
// + `scene-polyfill`) into the default-entry bundle. Instead we route
// through `getSpatialImpl()?.getSession?.()`, which only has a session
// available after `await bootSpatial()` resolves. The debug tool already
// requires a spatial session to do anything meaningful (`inspectCurrentSpatialScene`
// can't render without one), so the new "throws if called before boot"
// behavior is strictly an improvement over the previous "throws via
// `getSession()!` non-null assertion".

async function inspectCurrentSpatialScene() {
  const session = getSpatialImpl()?.getSession?.()
  if (!session) {
    throw new Error(
      'inspectCurrentSpatialScene: no spatial session. ' +
        'Call `await bootSpatial()` from `@webspatial/react-sdk` before ' +
        'invoking `window.inspectCurrentSpatialScene()`.',
    )
  }
  const spatialScene = session.getSpatialScene()
  return spatialScene.inspect()
}

function getSpatialized2DElement(
  spatialized2DElement: HTMLDivElement,
): Spatialized2DElement {
  return (
    spatialized2DElement as any
  ).__innerSpatializedElement?.() as Spatialized2DElement
}

export function enableDebugTool() {
  if (isSSREnv()) return

  Object.assign(window, {
    inspectCurrentSpatialScene,
    getSpatialized2DElement,
  })
}
