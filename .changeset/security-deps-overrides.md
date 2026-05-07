---
'@webspatial/builder': patch
'@webspatial/react-sdk': patch
---

Bump direct esbuild devDependency to ^0.25.0 and extend pnpm.overrides
to pin patched versions for transitive packages flagged by Dependabot
(@xmldom/xmldom, basic-ftp, vite, lodash/lodash-es, path-to-regexp,
flatted, immutable, serialize-javascript, minimatch, rollup,
@modelcontextprotocol/sdk, @remix-run/router, react-router, validator,
glob, postcss, axios, follow-redirects, brace-expansion, picomatch,
ajv, markdown-it, mdast-util-to-hast, body-parser, js-yaml, qs, diff,
tmp, @eslint/plugin-kit, min-document, form-data). No code changes;
verified via pnpm test and visionOS Simulator build.

Follow up by upgrading the remaining direct dependency entry points that
were still resolving stale vulnerable lockfile paths: move
`react-router-dom` to ^6.30.2 in demo apps, upgrade the React SDK test
toolchain to vitest 3.1.2 / @vitejs/plugin-react 4.4.1, align the
builder package to rollup ^4.60.2, and add exact pnpm overrides for
stubborn `yaml`, `rollup`, `minimatch`, and `path-to-regexp` nodes so
the workspace lockfile resolves to patched versions consistently.
