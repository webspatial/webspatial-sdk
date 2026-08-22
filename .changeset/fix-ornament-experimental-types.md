---
'@webspatial/react-sdk': patch
---

Keep the React Ornament component API scoped to the experimental entry.

- Export `Ornament`, `OrnamentProps`, `OrnamentPoint3D`, and `OrnamentVisibility` from `@webspatial/react-sdk/experimental`.
- Remove Ornament-specific helper type re-exports from the default `@webspatial/react-sdk` entry.
- Make `OrnamentProps` explicitly describe the React component props instead of deriving from the Core SDK `OrnamentOptions` runtime type.
