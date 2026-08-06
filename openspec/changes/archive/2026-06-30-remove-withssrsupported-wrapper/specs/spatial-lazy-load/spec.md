## MODIFIED Requirements

### Requirement: SSR and hydration safety

In a server-side rendering context the default entry MUST behave as web mode: facades render their per-component default fallback, hook placeholders return their documented defaults, the bridge MUST NOT schedule any dynamic import, and registered `onSpatialLoadError` callbacks MUST NOT be invoked. The default entry MUST work under any React 18+ SSR API (including `renderToString`, `renderToPipeableStream`, `renderToReadableStream`, and React 19 `prerender*`) and inside React Server Components when the facade or hook is consumed via a Client Component.

**Entry routing (normative)**

- Applications that rely on SSR (streaming or synchronous), initial HTML snapshots that include WebSpatial primitives, or hydration of those primitives with the façade contracts in this Requirement MUST use the lazy-load **default entry** `@webspatial/react-sdk`. Facade SSR / hydration semantics in this Requirement apply **only** when spatial primitives resolve through that entry.
- The **eager** entry `@webspatial/react-sdk/eager` targets **client-rendered** spatial UI: spatial primitives imported from the eager entry MUST NOT be server-rendered as part of a supported configuration. Consumers MUST mount eager-imported spatial subtrees only on the client (e.g. Next.js `dynamic(..., { ssr: false })`, conditional render after `typeof window !== 'undefined'`, or a client-only route tree) **or** MUST use the default entry for SSR pages where those primitives participate in server HTML output. SSR or mixed SSR/CSR setups that eagerly import primitives from `@webspatial/react-sdk/eager` **AND** evaluate them during server render are **out of scope** for SDK guarantees — behavior MAY include hydration mismatches or runtime divergence; remediation is routing those imports to the default entry or gating the subtree to CSR. Because the eager entry does not place an internal SSR gate in front of its real spatial hosts, this CSR-only obligation is the consumer's responsibility.

To make hydration safe, the SDK MUST follow these constraints:

- **Client-component directive**: every facade module and every public hook module that calls React hooks MUST begin with the `'use client'` directive. The directive MUST be preserved through the build into the published `dist/` files. Without this directive, the React Server Components compiler will treat facades as Server Components and fail the moment they call hooks. Files that do not call React hooks (`runtime/bridge.ts`, `runtime/boot.ts`, `runtime/detect.ts`, `runtime/errors.ts`, the constant-only `useMetrics` placeholder source, plain type-only modules) MUST NOT carry the directive — they remain server-callable.
- **Hydration-aware readiness**: `useSpatialReady()` MUST be implemented with `useSyncExternalStore` (or another React-hydration-aware primitive that exposes a server snapshot). This guarantees that the value used during hydration matches the SSR snapshot, and React's built-in transition swaps to the live snapshot only after hydration commits — preventing any mismatch warning regardless of when `bootSpatial()` resolves relative to `hydrateRoot()`.
- **`getServerSnapshot` stability**: the `getServerSnapshot` argument passed to `useSyncExternalStore` inside `useSpatialReady` MUST be a single module-level constant function returning `false`. It MUST NOT be a fresh closure created per call (which would trigger React's "Snapshot is unstable" warning). The same module-level constant MAY also serve as the plain-web `getSnapshot` (per the `useSpatialReady` short-circuit) since both must report `false`.
- **Internal spatial hosts are reached only post-hydration**: on the default entry the real `Model` / `SpatializedContainer` (and similar heavy hosts) MUST be reachable only through the facade delegate path (`facades/*`), which renders them only after `useSpatialReady()` reports ready. Because that facade gate holds `false` through SSR **and** the client hydration pass, a real host's first render is always a fresh client mount that occurs AFTER hydration commits — never during SSR or the hydration pass. Real hosts therefore MUST NOT carry an additional internal SSR wrapper (`withSSRSupported`) on the default entry; the facade gate is the single hydration gate. Eager-entry spatial hosts are CSR-only per "Entry routing" and carry no SDK-provided SSR gate.
- **Deterministic facade rendering**: given identical props, a facade's fallback rendering MUST produce identical DOM across renders and across server/client. The SDK only guarantees mismatch-free hydration when (a) facade props are identical between server and client, and (b) `useSpatialReady` follows the `useSyncExternalStore` constraint above.

Both `await bootSpatial(); hydrateRoot(...)` (boot before hydrate; bridge ready when hydrate starts) and `hydrateRoot(...); bootSpatial()` (hydrate first, boot after) MUST be supported. The `useSyncExternalStore`-based `useSpatialReady` makes both timings hydration-safe — but the "fallback flash" trade-off differs by rendering path:

- **Pure CSR path** (`await bootSpatial(); createRoot(...).render(...)`): the first React commit calls `getSnapshot()` (returning `true` since the bridge is already ready) and renders real spatial implementations directly. No fallback-to-real DOM swap occurs.
- **SSR + hydrate path with boot BEFORE hydrate** (`await bootSpatial()` followed by `hydrateRoot(...)`, with `await bootSpatial(); renderToString(...)` on the server): the **client hydration pass** still uses `getServerSnapshot()` returning `false` (per "First client render matches server render regardless of boot timing"), so the first client render produces fallback DOM matching the server-rendered HTML; the swap to real implementations happens on the next React commit. Hydration is mismatch-safe but the fallback-to-real swap is NOT avoidable in this path.
- **SSR + hydrate path with boot AFTER hydrate** (`hydrateRoot(...); void bootSpatial()`): hydration pass renders fallback (matching server); on `bootSpatial()` resolution the next commit swaps to real. Trades faster initial hydration for a slightly later swap point compared to boot-before.

Applications choose between SSR boot-before and SSR boot-after based on whether they want the spatial chunk fetch to start in parallel with HTML streaming (boot-before) or after the page is interactive (boot-after); the visible fallback-to-real swap is identical in both SSR sub-cases.

#### Scenario: Server render does not touch spatial chunk and does not invoke error listeners

- **WHEN** an application server-renders a tree containing facades or hook placeholders under any React 18+ SSR API (including `renderToString`, `renderToPipeableStream`, `renderToReadableStream`, React 19 `prerender*`, and React Server Components Client-Component rendering)
- **THEN** the spatial chunk MUST NOT be requested
- **AND** all facades MUST render their per-component default fallback markup
- **AND** `bootSpatial()` invoked during SSR MUST resolve without scheduling a dynamic import
- **AND** any `onSpatialLoadError` callbacks registered before SSR MUST NOT be invoked during SSR

#### Scenario: Streaming SSR is equivalent to synchronous SSR

- **WHEN** the application uses `renderToPipeableStream` or `renderToReadableStream` rather than synchronous `renderToString`
- **THEN** facade rendering, hook placeholder behavior, and bridge no-op semantics MUST be identical to the synchronous case
- **AND** facades MUST NOT introduce Suspense boundaries on their own
- **AND** the spatial chunk MUST NOT be requested in any chunk of the stream

#### Scenario: RSC client-component facade

- **WHEN** an application using React Server Components imports a facade (e.g. `Model`) into a Server Component file
- **THEN** the facade module MUST be honored as a Client Component reference (because the facade source begins with `'use client'`)
- **AND** the Server Component MUST NOT execute the facade's React hooks during the RSC render
- **AND** the RSC payload MUST contain the standard Client-Component reference for that node
- **AND** subsequent client-side hydration of the RSC payload MUST render the facade as in any other CSR / hydration scenario covered by this Requirement

#### Scenario: getServerSnapshot returns a stable constant

- **WHEN** `useSpatialReady()` is invoked under SSR
- **THEN** the `getServerSnapshot` argument passed to its internal `useSyncExternalStore` MUST be a single module-level function reference returning `false`
- **AND** repeated calls to that `getServerSnapshot` within the same SSR pass MUST return the same `false` value (referential and structural equality)
- **AND** React MUST NOT log a "The result of `getServerSnapshot` should be cached" warning for this hook

#### Scenario: First client render matches server render regardless of boot timing

- **WHEN** a tree containing facades is server-rendered and then hydrated on the client
- **AND** `bootSpatial()` may have been awaited before `hydrateRoot(...)`, after `hydrateRoot(...)`, or never
- **THEN** the first client render during hydration MUST produce DOM identical to the server render — i.e. fallback rendering for every facade
- **AND** hydration MUST complete without React hydration-mismatch warnings
- **AND** this contract is delivered by `useSpatialReady`'s `useSyncExternalStore`-based implementation, which uses `getServerSnapshot` (returning `false`) during hydration and only switches to the live snapshot after hydration commits

#### Scenario: Switch to spatial happens after hydration commits

- **WHEN** `bootSpatial()` resolves at any point — before, during, or after hydration
- **THEN** the switch from facade fallback to real spatial implementation MUST happen on a render cycle scheduled AFTER hydration commits, never during the hydration pass
- **AND** any DOM changes resulting from the switch MUST NOT be attributed to a hydration mismatch
- **AND** if `bootSpatial()` was awaited before `hydrateRoot(...)`, the hydration pass MUST still render fallback (matching server output); the swap to real implementation MUST happen on the next React commit
- **AND** because the real host's first render is a fresh client mount after hydration commits, it MUST render the real implementation directly without any internal SSR placeholder pass

#### Scenario: Mismatch responsibility is limited to deterministic facade output

- **WHEN** the application supplies different props to a facade server-side vs client-side (for example because the server reads a request-specific value the client cannot reproduce, or because data fetching produces different results across the two passes)
- **THEN** the resulting hydration mismatch MUST be considered the application's responsibility, NOT a violation of this spec
- **AND** the SDK only guarantees mismatch-free hydration when facade props are identical between server and client and the SSR-related implementation constraints in this Requirement's preamble are met
