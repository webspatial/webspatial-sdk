---
illustration_id: 05
type: infographic
style: blueprint
---

Test Pages — Coverage Summary (visionOS Spatial Gesture/Transform)

Layout: two-column comparison-style infographic (left = geometry-verify, right = transform-verify) with a top title bar.

ZONES:
- Title bar: “Test Pages: geometry-verify vs transform-verify”
- Left column (geometry-verify):
  - Route: `/#/geometry-verify`
  - Purpose: “Tap gesture coordinate correctness”
  - Coverage tags:
    - `offsetX/Y/Z` and `clientX/Y/Z`
    - Plain / rotated / scaled SpatialDivs
    - Nested SpatialDivs (parent rotated, child offset)
    - 3D Model tap
- Right column (transform-verify):
  - Route: `/#/transform-verify`
  - Purpose: “Visual correctness of --xr-back, CSS transform, transform-origin”
  - Coverage tags:
    - rotateX/Y/Z, scale, translate3d, rotate3d
    - Composed transform order variation
    - transform-origin presets + custom percentages
    - `--xr-back` depth: 0px / 50px / 200px
    - Nested SpatialDiv + interactive playground

LABELS:
- Use concise keywords only; keep readable at a glance.

STYLE:
- Blueprint schematic style with subtle grid.
- Left column and right column use different accent colors, but keep blueprint vibe.
- Monospace route labels.

Clean composition with generous white space. Simple or no background. Main elements centered or positioned by content needs.
Text should be large and prominent. Keep minimal, focus on keywords.

ASPECT: 16:9

