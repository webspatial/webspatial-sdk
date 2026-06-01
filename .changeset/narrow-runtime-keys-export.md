---
'@webspatial/core-sdk': minor
---

**BREAKING (narrow `@webspatial/core-sdk/runtime` surface):** Removed capability key registry constants (`TOP_LEVEL_KEYS`, `SUB_TOKENS_BY_NAME`, `COMPONENT_KEYS`, `CSS_KEYS`, `GESTURE_KEYS`, `JS_SCENE_KEYS`, `DOM_DEPTH_KEYS`, `ELEMENT_DOM_DEPTH_KEYS`, `WINDOW_DOM_DEPTH_KEYS`) from the public `@webspatial/core-sdk/runtime` entry. The `CapabilityKey` type and `supports()` API are unchanged.

SDK demos, contract tests, and capability-matrix tooling should import the registry from `@webspatial/core-sdk/runtime/keys` instead. Application code should continue to use `WebSpatialRuntime.supports()` with the `CapabilityKey` type from `@webspatial/react-sdk`.
