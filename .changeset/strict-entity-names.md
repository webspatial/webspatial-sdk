---
'@webspatial/core-sdk': major
'@webspatial/react-sdk': major
---

Disallow hyphens in WebSpatial entity names.

Entity `name` values must now use USD-safe identifiers without hyphens. Literal hyphenated names are rejected by TypeScript where the name can be inferred.

Use camelCase or underscores instead of hyphens. For example, rename `robot-arm` to `robotArm` or `robot_arm`.
