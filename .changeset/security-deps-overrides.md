---
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
