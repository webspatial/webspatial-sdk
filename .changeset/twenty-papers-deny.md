---
'@webspatial/builder': patch
---

Remediate Dependabot alert #126 by upgrading the builder CLI direct
`node-fetch` dependency from `2.6.7` to `2.6.12`, and add a workspace
`pnpm.overrides` guardrail to force any `node-fetch@<2.6.12` resolution
onto patched versions.
