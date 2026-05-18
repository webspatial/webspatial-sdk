---
'@webspatial/react-sdk': major
---

**BREAKING:** Demoted `withSpatialized2DElementContainer`, `withSpatialMonitor`, and the `Spatialized2DElementContainerProps` type from the public surface of `@webspatial/react-sdk` (and the parallel `@webspatial/react-sdk/eager`).

The two factory HOCs were never the documented user-facing way to add spatial behaviour to an intrinsic element — the `enable-xr` / `enable-xr-monitor` JSX markers cover that case and remain fully supported. The factories were a leaky implementation detail that the SDK's own JSX runtime needed in order to compile the markers; they only mattered to consumer code in the edge case of "wrap a component with a *third-party* HOC like `animated(...)` from react-spring".

The factories still exist under their original source paths (`packages/react/src/facades/withSpatialized2DElementContainer.tsx`, `.../withSpatialMonitor.tsx`, `packages/react/src/spatialized-container/Spatialized2DElementContainerFactory.tsx`, `packages/react/src/spatialized-container-monitor/withSpatialMonitor.tsx`) — they're just no longer reachable from the published default / eager entries. The SDK's JSX runtime continues to reach them via the internal `'use client'` boundary at `src/internal/facades-client.ts`, so `<div enable-xr>` keeps working byte-identically.

Migration:

- **JSX consumers (`<div enable-xr>`)** — no change. Your `tsconfig.json`'s `"jsxImportSource": "@webspatial/react-sdk"` setup keeps working as before.
- **Direct factory callers** — replace with a `forwardRef` shim:

  ```tsx
  // Before
  import { withSpatialized2DElementContainer } from '@webspatial/react-sdk'
  import { animated } from '@react-spring/web'
  const AnimatedDiv = animated(withSpatialized2DElementContainer('div'))

  // After — works once tsconfig sets jsxImportSource: "@webspatial/react-sdk"
  import { forwardRef } from 'react'
  import { animated } from '@react-spring/web'

  const SpatialDiv = forwardRef<HTMLDivElement, React.ComponentPropsWithRef<'div'>>(
    function SpatialDiv(props, ref) {
      return <div enable-xr ref={ref} {...props} />
    },
  )
  SpatialDiv.displayName = 'SpatialDiv'

  const AnimatedDiv = animated(SpatialDiv)
  ```

- **`Spatialized2DElementContainerProps` type** — was the props shape of the HOC's wrapped component; no longer useful externally now that the HOC is internal. The type definition still lives at `src/spatialized-container/types.ts` for internal SDK use but is not re-exported.

This change also implicitly resolves the `withSpatialized2DElementContainer / withSpatialMonitor HOC parity` follow-up listed under spec `tasks.md §15.8` — since the factories are no longer public APIs, the SDK is not on the hook for a documented Path 2 unsupported contract for them. The `it.todo` entry in `parity.test.tsx` is removed accordingly.
