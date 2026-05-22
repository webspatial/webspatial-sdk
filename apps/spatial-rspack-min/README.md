# spatial-rspack-min

Minimal Rspack + React consumer fixture for `@webspatial/react-sdk`.

It verifies the lazy-load v1 bundler contract without any WebSpatial-specific
Rspack plugin:

- ESM package exports resolve for `@webspatial/react-sdk` and
  `@webspatial/react-sdk/eager`.
- TypeScript and Rspack's SWC transform both resolve JSX through
  `jsxImportSource: "@webspatial/react-sdk"`.
- The lazy entry can call `bootSpatial()` and leave
  `@webspatial/react-sdk/spatial` as a split dynamic-import chunk.

The Rspack config includes a small compatibility rule:
`resolve.fullySpecified: false` for JavaScript modules. The current
`@webspatial/core-sdk` ESM build preserves extensionless relative imports
inside its own `dist/` files, while Rspack's strict ESM resolver requires
extension probing to resolve those package-internal imports.

## Commands

```bash
pnpm --filter spatial-rspack-min dev
pnpm --filter spatial-rspack-min build
pnpm run test:rspack-compat
```
