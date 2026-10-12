## MODIFIED Requirements

### Requirement: Stateless utility APIs and pure re-exports remain in the default entry

A subset of the public API consists of **stateless utility functions, pure constants, and type re-exports** that are independent of `@webspatial/react-sdk/spatial`. They MUST live in the default entry's static module graph, MUST NOT participate in the bridge / facade / placeholder pattern, MUST NOT statically or dynamically import from `@webspatial/react-sdk/spatial`, and MUST function correctly without `bootSpatial()` ever being called.

These APIs split into two groups by mechanism:

**Group B — bridge-session-aware utilities** route through the React SDK bridge (`getSpatialImpl()?.getSession?.()`) after `bootSpatial()` has resolved. They MUST NOT import `@webspatial/core-sdk` spatial runtime modules from the default entry (capability probes via the inlined `@webspatial/core-sdk/runtime` subset are permitted).

| API | Behavior when no session is reachable |
| --- | --- |
| `initScene(name, callback, options?)` | Returns `undefined` without side effects when the bridge has no session |
| `convertCoordinate(position, { from, to })` | Throws `WebSpatialRuntimeError` per the `runtime-capabilities` spec's "Unsupported behavior contracts" Requirement (`supports('convertCoordinate')` false, no session, or invalid refs) |
| `enableDebugTool()` | Returns immediately when `typeof window === 'undefined'`; in browser runtime attaches `inspectCurrentSpatialScene` and `getSpatialized2DElement` to `window`; diagnostic helpers read the bridge session lazily and throw a descriptive `bootSpatial()`-pointing error if no session is available |

**Group C — pure constants, type re-exports, and React Context**:

| API | Description |
| --- | --- |
| `WebSpatialRuntime.supports(name, tokens?)` | Synchronous capability lookup against the React SDK's local copy of the runtime-capability table. Pure data, no spatial chunk or core-sdk runtime dependency. Behavior pinned by the `runtime-capabilities` spec. |
| `WebSpatialRuntimeError` | Local `Error` subclass matching the runtime-capability error contract. |
| `CapabilityKey` | TypeScript type exported from the React SDK local capability helper. Compile-time only. |
| `version` | A `string` constant injected at build time via `__WEBSPATIAL_REACT_SDK_VERSION__`. |
| Component / Hook / Entity / Model type-only re-exports (e.g. `SpatializedElementRef`, `EntityRef`, `ModelRef`, `ModelProps`) | Compile-time only; no runtime presence. |

**Subtle consequence**: an application running in a WebSpatial runtime that does NOT call `bootSpatial()` will see facades render their fallback; Group B utilities other than `convertCoordinate` gracefully degrade, while `convertCoordinate` throws until the bridge session is ready.

#### Scenario: Group B utilities work without `bootSpatial()`

- **WHEN** an application invokes `initScene(...)` or `enableDebugTool()`
- **AND** has not awaited `bootSpatial()`
- **THEN** the calls MUST behave per the `runtime-capabilities` spec's "Unsupported behavior contracts" Requirement (graceful degradation: noop / SSR-safe noop for `enableDebugTool`)
- **AND** the spatial chunk MUST NOT be loaded as a side effect of these calls

#### Scenario: `convertCoordinate` requires supported runtime and session

- **WHEN** an application invokes `convertCoordinate(...)` without a supported runtime or without an awaited `bootSpatial()` session
- **THEN** the call MUST throw `WebSpatialRuntimeError` per the `runtime-capabilities` spec
- **AND** the spatial chunk MUST NOT be loaded solely as a side effect of the failed call

#### Scenario: `WebSpatialRuntime.supports` works without `bootSpatial()`

- **WHEN** an application calls `WebSpatialRuntime.supports('Model')` (or any other capability key) at any point in the page lifetime
- **THEN** the call MUST resolve synchronously against the React SDK's local capability table without scheduling any dynamic import
- **AND** the result MUST follow the `runtime-capabilities` Requirement contracts (`false` in non-WebSpatial browsers; `true` / `false` per the shell-version capability table in WebSpatial runtimes)

#### Scenario: Group C pure helpers are SSR-safe and side-effect free

- **WHEN** `WebSpatialRuntimeError` is constructed or thrown by application code
- **THEN** it MUST behave as a standard `Error` subclass without requiring the spatial chunk or a core-sdk runtime import

#### Scenario: Type-only re-exports vanish at runtime

- **WHEN** the published `dist/index.js` is inspected for runtime values
- **THEN** TypeScript type-only re-exports (e.g. `SpatializedElementRef`, `EntityRef`, `ModelRef`, `ModelProps`) MUST contribute zero runtime bytes (consistent with `export type` semantics in tsup output)
