---
"@webspatial/react-sdk": patch
---

Change `SceneGraph` / `World` facade fallback from transparent child pass-through to `null` (children not mounted), aligning with entity/asset facades and typical `<Reality>`-wrapped trees.
