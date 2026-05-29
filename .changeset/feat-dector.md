---
'@webspatial/core-sdk': minor
'@webspatial/react-sdk': minor
---

The Core SDK lets you query WebSpatial runtime capabilities and shell versions at runtime (`supports`, `getRuntime`) and resolve JSB-style embedded shells via `resolveJsbAdapterPlatform`. The built-in Android platform adapter is removed from core—integrate Android through your host shell instead.

The React SDK adds runtime gating (`noRuntime`, `webSpatialRuntime`) and updates spatialized components and related hooks so behavior matches runtime availability.
