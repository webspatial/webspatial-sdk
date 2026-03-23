---
illustration_id: 01
type: flowchart
style: blueprint
---

View Modifier Chain (SwiftUI) — Coordinate System Layers

Layout: top-down flowchart with one main vertical spine and short callout boxes on the right.

STEPS:
1. `content`
2. `.frame(width, height)`
3. `.frame(depth, alignment)`
4. `.frame(depth: 0, alignment: .back)`
5. `.offset(z: smallOffset)` — workaround for glassEffect bug
6. `.transform3DEffect(anchoredTransform)` — full CSS transform with anchor
7. `.offset(z: frameOffsetZ)` — `--xr-back` + `zIndex * bias`
8. `.simultaneousGesture(gesture)` — gesture captures here
9. `.onGeometryChange3D(...)` — stores `proxyTransform` (layout → scene)
10. `.position(x, y)` — CSS layout position

CONNECTIONS:
- Straight arrows between steps (downward).
- Use a distinct arrow color/style to emphasize “applied after” ordering between steps 6 → 7 → 8.

CALLOUTS (right side, linked to the relevant step with thin leader lines):
- Rule A (linked to step 6/7): “CSS transform BEFORE `--xr-back`”
- Rule B (linked to step 7): “`--xr-back` moves along parent Z axis”
- Rule C (linked to step 8): “gesture sees `frameOffsetZ` but NOT visual `.transform3DEffect`”
- Rule D (linked to step 9): “`onGeometryChange3D` captures layout→scene at this level”

LABELS:
- `frameOffsetZ = zIndex * zOrderBias + backOffset (--xr-back)`
- `proxyTransform: layout → SpatialScene`

STYLE:
- Technical blueprint schematic style.
- White/very light cyan lines on a deep blue background with subtle grid.
- Step boxes: rounded rectangles with thin outlines; optional small icons (frame, transform, gesture).
- Typography: clean monospace labels, high readability.

Clean composition with generous white space. Simple or no background. Main elements centered or positioned by content needs.
Text should be large and prominent. Keep minimal, focus on keywords.

ASPECT: 16:9

