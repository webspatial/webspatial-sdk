---
illustration_id: 03
type: flowchart
style: blueprint
---

Gesture Coordinate Semantics — Local vs Scene Space

Layout: two-lane pipeline diagram (left lane = element-local semantic, right lane = scene-space).

LEFT LANE (Element-local / semantic local):
1. Input: `event.location3D (x, y, z)` captured at `.simultaneousGesture`
2. Compute: `frameZ = zIndex * zOrderBias + backOffset (--xr-back)`
3. Output: `localPoint3D = (x, y, z - frameZ)`
4. Note box: “Front face tap ⇒ offsetZ ≈ 0”

RIGHT LANE (Scene-space / SpatialScene):
1. Input: `event.location3D (raw)`
2. Apply: `globalPoint3D = proxyTransform * (x, y, z, 1)`
3. Output: `Point3D in SpatialScene`

CENTER CALLOUT (bridging both lanes):
- Show the identity/no-op:
  - `proxyTransform · T(0,0,frameZ) · (x, y, z−frameZ) = proxyTransform · (x, y, z)`
- Label: “Subtract-then-add frameZ is a no-op; apply proxyTransform to raw point.”

CONNECTIONS:
- Use arrows within each lane (top-down).
- Use thin dashed line between lanes to show “same raw source, different semantics”.

STYLE:
- Blueprint schematic style with grid background.
- White text/lines; use accent color to highlight `frameZ` and the identity equation.
- Monospace font for identifiers.

Clean composition with generous white space. Simple or no background. Main elements centered or positioned by content needs.
Text should be large and prominent. Keep minimal, focus on keywords.

ASPECT: 16:9

