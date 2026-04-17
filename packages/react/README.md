<div align="left">
  <img src="../../assets/logo.png" alt="WebSpatial Logo" width="400"/>
</div>
<br/>

# React SDK for WebSpatial

The React SDK from the WebSpatial SDK makes the WebSpatial API immediately available inside React.

## Documentation

- [Introduction](https://webspatial.dev/docs/introduction)
- [Quick Example](https://webspatial.dev/docs/quick-example)
- [Core Concepts](https://webspatial.dev/docs/core-concepts)
- [Development Guide](https://webspatial.dev/docs/development-guide)

## Component API doc generation (experimental)

The React SDK now includes a component-doc extraction workflow for key public
components.

From repo root:

```bash
pnpm docs:components
pnpm docs:components:check
```

`docs:components:check` is also run in GitHub Actions CI so generated files stay aligned with source.

Generated output is written to:

- `docs/generated/react-components.json`
- `docs/generated/react-components.md`
