---
illustration_id: 04
type: framework
style: blueprint
---

proxyTransform vs sceneTransform — Layered Model

STRUCTURE: hierarchical framework diagram with two horizontal layers (View layer on top, Model layer below) and a right-side API box.

NODES:
- View layer:
  - `gestureState.proxyTransform` (layout → scene)
  - `onGeometryChange3D(...)` (source)
- Model layer:
  - `spatializedElement.proxySceneTransform` (raw proxy)
  - `sceneTransform` (computed)
  - `localZ = T(0,0,frameZ)`
  - `frameZ = zIndex * zOrderBias + backOffset (--xr-back)`
- API box (right):
  - `convertToScene(local)`
  - `convertFromScene(scene)`
  - `convert(local, to target)`

RELATIONSHIPS:
- Arrow: `onGeometryChange3D` → `gestureState.proxyTransform`
- Arrow: raw proxy written to model: `gestureState.proxyTransform` → `spatializedElement.proxySceneTransform`
- Computation arrow: `spatializedElement.proxySceneTransform` + `localZ(frameZ)` → `sceneTransform`
- Equation label near `sceneTransform`:
  - `sceneTransform = proxySceneTransform · localZ(frameZ)`
- Show cross-element conversion equation at bottom:
  - `point_in_B = M_B^{-1} · M_A · point_in_A`

STYLE:
- Blueprint style: grid background, thin white lines.
- Use subtle color accents to distinguish View layer vs Model layer.
- Monospace labels.

Clean composition with generous white space. Simple or no background. Main elements centered or positioned by content needs.
Text should be large and prominent. Keep minimal, focus on keywords.

ASPECT: 16:9

