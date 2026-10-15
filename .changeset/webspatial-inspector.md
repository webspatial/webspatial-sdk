---
'@webspatial/react-sdk': minor
'@webspatial/core-sdk': patch
'@webspatial/platform-visionos': patch
'web-content': patch
---

Add an experimental Ornament-based `WebSpatialInspector` for viewing native
scene nodes, inspecting node state, highlighting DOM-backed placeholders, and
editing supported placeholder layout properties.

The inspector refreshes on WebSpatial tree-structure events and manual Refresh
actions instead of polling continuously, ignores layout/property sync commands,
sorts the displayed node tree with a stable order, and only displays nodes that
are mounted in the page scene tree.

Include Reality entity transforms in visionOS inspect payloads, and keep the
Reality root inspect hierarchy synchronized when entities are added, removed,
or reparented.

Add a test-server page that exercises SpatialDiv, Model, Reality, and the
Inspector edit/highlight workflow.
