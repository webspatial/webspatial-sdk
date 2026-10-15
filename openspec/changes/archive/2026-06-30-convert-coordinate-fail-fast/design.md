## Context

`convertCoordinate` is a Group B bridge-session-aware utility on the React SDK default entry. Lazy-load routed it through `getSpatialImpl()?.getSession?.()` and returned the input position when unsupported, optionally warning once. Canonical `openspec/specs/runtime-capabilities/spec.md` already documents throw-on-unsupported for `convertCoordinate`, but implementation and lazy-load delta specs diverged.

## Goals / Non-Goals

**Goals**

- Fail fast in non-WebSpatial environments so misuse is obvious at call time.
- Align with `useMetrics` conversion-function throw semantics and `enableDebugTool` diagnostic throw when no session exists.
- Gate on `supports('convertCoordinate')` synchronously (no spatial chunk load).

**Non-Goals**

- Change `initScene` or other Group B utilities (they remain graceful-degrade).
- Change component facades or `useMetrics()` hook call semantics (hook call still does not throw).

## Decisions

### 1. Throw `WebSpatialRuntimeError` at call time

When `supports('convertCoordinate')` is `false`, throw immediately with capability `'convertCoordinate'`. Matches archived runtime-feature-detection contract and avoids silent wrong coordinates in plain web.

### 2. Also throw when session is missing in a supported runtime

When `supports('convertCoordinate')` is `true` but `getSpatialImpl()?.getSession?.()?.getSpatialScene()` is unreachable, throw with a message pointing to `bootSpatial()`. Same class of error as invoking `useMetrics` conversion functions before boot.

### 3. Invalid refs throw, not warn-and-return

Malformed `from` / `to` arguments throw `WebSpatialRuntimeError` with a descriptive message. Callers that need cross-environment code should guard with `WebSpatialRuntime.supports('convertCoordinate')` before calling.

### 4. Implementation imports `supports` from inlined core-sdk runtime

Same pattern as `detect.ts` / `WebSpatialRuntime.supports` — already part of the default-entry static graph; does not schedule the spatial chunk.

## Risks / Trade-offs

- **Breaking for plain-web callers** who relied on silent passthrough → mitigate with `supports()` gate documented in README and migration note.
- **SSR modules that call `convertCoordinate` at module scope** will throw → same fix as other runtime-gated APIs: move call behind client boundary or gate on `supports()`.
