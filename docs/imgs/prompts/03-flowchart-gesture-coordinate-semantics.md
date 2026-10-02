---
illustration_id: 03
type: flowchart
style: blueprint
---

Gesture Coordinate Semantics — Scene Hit to Local vs Global

Layout: two-lane pipeline diagram (left lane = element-local / offset, right lane = scene-space / client).

SHARED INPUT (top center):
- `event.location3D` in named coordinate space `"SpatialScene"` (CSS pixels)

LEFT LANE (Element-local / offset*):
1. Input: scene hit point `P_scene`
2. Build: `M = sceneTransform × anchoredCSSTransform` (layout + --xr-back/zIndex + CSS transform with transform-origin)
3. Compute: `P_local = inverse(M) × P_scene`
4. Output: `location3D` / `offsetX/Y/Z`
5. Note box: “Top-left front-face tap ⇒ offset ≈ (0, 0, 0). Target transform does not leak.”

RIGHT LANE (Scene-space / client*):
1. Input: same `P_scene`
2. Output: `globalLocation3D` / `clientX/Y/Z` = `P_scene` as-is
3. Note box: “Window / SpatialScene pixels; moves when the element moves.”

CENTER CALLOUT:
- Do not use SwiftUI `.local` space of the gesture modifier.
- `.offset(z:)` and `.transform3DEffect` are inverted explicitly via `M`, not inferred from the modifier chain.

CONNECTIONS:
- Use arrows within each lane (top-down).
- Dashed line from shared input to both lanes: “same scene hit, two spaces.”

STYLE:
- Blueprint schematic style with grid background.
- White text/lines; accent color on `inverse(M)` and `"SpatialScene"`.
- Monospace font for identifiers.

Clean composition with generous white space. Simple or no background. Main elements centered or positioned by content needs.
Text should be large and prominent. Keep minimal, focus on keywords.

ASPECT: 16:9
