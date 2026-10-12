---
'@webspatial/core-sdk': patch
'@webspatial/react-sdk': patch
---

Internal tooling: bring `packages/core` and `packages/react` under unified root ESLint governance with `unused-imports/no-unused-imports`. Run lint as part of the root test command and CI, while keeping pre-commit limited to formatting and file guards. Preserve intentional negative export type tests with local unused-import exemptions. No runtime behavior or public API changes.
