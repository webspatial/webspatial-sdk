---
'@webspatial/core-sdk': patch
'@webspatial/react-sdk': patch
---

Internal tooling: bring `packages/core` and `packages/react` under the unified root ESLint governance and pre-commit `eslint --fix` flow, enforcing only `unused-imports/no-unused-imports`. No runtime behavior or public API changes; the only source edit removes unused type imports in react test files.
