---
'@webspatial/builder': patch
---

Upgrade the builder CLI image pipeline to `jimp` 1.x so the workspace no
longer resolves the vulnerable `jimp@0.22.x -> file-type@16.x` chain flagged
by Dependabot. This keeps the existing icon loading and generation flow while
refreshing the lockfile to patched transitive versions.

Verified with `pnpm -C packages/cli test` and `pnpm audit --json`.
