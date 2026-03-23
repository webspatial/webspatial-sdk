---
illustration_id: 02
type: infographic
style: blueprint
---

Anchored Transform (CSS transform-origin) — Matrix Composition

Layout: equation-centered infographic with 3 horizontal panels.

ZONES:
- Zone 1 (top): Key formula in large text: `T(+anchor) · M · T(-anchor)`
- Zone 2 (middle): Variable definitions with small schematic:
  - `ax = width * anchor.x`
  - `ay = height * anchor.y`
  - show a rectangle (element) with an anchor point marked; arrows showing translate to/from anchor
- Zone 3 (bottom): Concatenation order explanation:
  - “Apply `T(-anchor)` first (shift origin to anchor)”
  - “Apply `M` (full CSS transform matrix)”
  - “Apply `T(+anchor)` last (shift origin back)”

LABELS:
- `toAnchor = T(-ax, -ay, 0)`
- `fromAnchor = T(+ax, +ay, 0)`
- `anchoredTransform = fromAnchor · M · toAnchor`
- Note: “CSS applies transform functions right-to-left (order preserved by single matrix)”

COLORS:
- Deep blueprint blue background; white lines/text; use 1-2 accent colors for the three operators (`T(+anchor)`, `M`, `T(-anchor)`).

STYLE:
- Technical blueprint schematic style, precise lines, subtle grid.
- Minimal icons; focus on math + geometry.
- Monospace typography for code identifiers.

Clean composition with generous white space. Simple or no background. Main elements centered or positioned by content needs.
Text should be large and prominent. Keep minimal, focus on keywords.

ASPECT: 16:9

