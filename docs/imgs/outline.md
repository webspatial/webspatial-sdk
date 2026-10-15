---
article: ../visionos-transform-and-gesture-design.md
type: mixed
style: blueprint
density: balanced
image_count: 4
---

# Illustration Outline — visionOS Transform & Gesture Design

## Illustration 01
**Position**: After `## View Modifier Chain` code block
**Purpose**: Visualize SwiftUI modifier ordering + which coordinate space each step establishes
**Visual Content**: Top-down flowchart of the modifier chain with callouts for ordering rules
**Filename**: 01-flowchart-view-modifier-chain.png

## Illustration 02
**Position**: After `### Solution: transform3DEffect with manual anchor`
**Purpose**: Explain anchored transform composition (CSS transform-origin) and concatenation order
**Visual Content**: Blueprint-style equation diagram for `T(+anchor) · M · T(-anchor)` with variable definitions
**Filename**: 02-infographic-anchored-transform-origin.png

## Illustration 03
**Position**: After `## Gesture Coordinate Semantics`
**Purpose**: Clarify target-local vs scene-global gesture coordinates and why the scene point is inverted instead of reading SwiftUI `.local`
**Visual Content**: Two-lane pipeline diagram from one `"SpatialScene"` hit point: `inverse(M)` to element-local `offset*` vs raw point as `client*`
**Filename**: 03-flowchart-gesture-coordinate-semantics.png

## Illustration 04
**Position**: After `## proxyTransform and sceneTransform`
**Purpose**: Show View-layer proxyTransform vs Model-layer sceneTransform, and coordinate conversion APIs
**Visual Content**: Framework diagram with nodes (proxyTransform, proxySceneTransform, sceneTransform, frameZ inputs) and arrows for conversions
**Filename**: 04-framework-proxy-vs-scene-transform.png

## Illustration 05
**Status**: Retired because the test-page matrix changes faster than a generated image can remain accurate
**Replacement**: Keep the route and coverage list as searchable text under `## Test Pages`
