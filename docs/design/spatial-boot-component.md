# WebSpatial React SDK：`SpatialBoot` 产品对齐稿

> **Status:** Implemented in `@webspatial/react-sdk` (see `packages/react/src/runtime/SpatialBoot.tsx`; boot state via internal `useBootSpatial.ts`)  
> **Phase 1 (public):** Boot completes before spatial UI mounts; boot failure → `onError`, no children  
> **Current contract:** no public `gate` / `fallback`; waiting state renders `null`  
> **Phase 2 (planned):** optional public `useBootSpatial`, richer boot-progress APIs

**Related material**

- Migration: [`docs/migration/lazy-load-spatial-runtime.md`](../migration/lazy-load-spatial-runtime.md)
- Product alignment: [`docs/react-sdk-product-alignment.md`](../react-sdk-product-alignment.md)
- Consumer fixtures: `apps/spatial-vite-min/`, `apps/spatial-remix-min/`, `apps/spatial-next-min/`

---

## 1. Phase 1 — public integration (simplified API story)

**Tell developers one workflow:**

1. Wrap the spatial app (or route subtree) in **`<SpatialBoot>`**.
2. The SDK calls **`bootSpatial()`** after mount (internal implementation detail).
3. **`children` mount only after boot succeeds** (WebSpatial: spatial chunk loaded; plain web: immediate resolve).
4. If boot fails with **`WebSpatialBootError`**, **`onError` runs** and **`children` do not mount** — show error UI in `onError` and retry with **`bootSpatial()`** if needed.

**Phase 1 public surface (two tiers):**

| Tier | API |
| ---- | --- |
| Recommended (React) | `<SpatialBoot>` |
| Advanced (imperative) | `bootSpatial()`, `onSpatialLoadError`, `WebSpatialBootError` |

**Not exported in phase 1:** `useBootSpatial` (internal only; phase 2 MAY add a public hook).

**Phase 1 public docs keep `<SpatialBoot>` contract minimal:**

- Public props: `children`, `onReady`, `onError`
- Waiting state: fixed `null` (no custom loading slot)
- No render-first mode in public API

---

## 2. Public API (phase 1)

### 2.1 `<SpatialBoot>` (recommended React entry)

```tsx
'use client'

import { SpatialBoot, WebSpatialBootError } from '@webspatial/react-sdk'

export function SpatialAppRoot() {
  return (
    <SpatialBoot
      onReady={() => console.log('spatial ready')}
      onError={(err: WebSpatialBootError) => {
        showBootError(err)
      }}
    >
      <YourSpatialPage />
    </SpatialBoot>
  )
}
```

| Prop | Phase-1 docs | Behavior |
| ---- | -------------- | -------- |
| `children` | Yes | Spatial UI; mounts **only** after successful boot |
| `onReady` | Optional | After `bootSpatial()` resolves |
| `onError` | **Strongly recommended** | On `WebSpatialBootError`; **children stay unmounted** |

### 2.2 `bootSpatial()` (advanced / imperative)

Callable outside React. `<SpatialBoot>` invokes it automatically after mount. Use directly for entry-level pre-await, retries after `onError`, or non-React orchestration.

```ts
import { bootSpatial } from '@webspatial/react-sdk'

await bootSpatial()
```

**CSR optional optimization:** `await bootSpatial()` before `createRoot().render(<SpatialBoot>…)` — footnote only for pure CSR apps.

### 2.3 `useSpatialReady()` (advanced)

Read-only bridge readiness. Use for custom degraded UI (`CapabilityDemo` pattern) when not using `<SpatialBoot>` gating. Facades use it internally.

---

## 3. Implementation notes (engineering)

`SpatialBoot` is built with `createSpatialBoot(useBootSpatial)`; the hook is **not** re-exported from `@webspatial/react-sdk` or `@webspatial/react-sdk/eager`.

Default: `showChildren = (status === 'ready')`; on failure, `onError` and children stay unmounted.
While status is not ready, render output is fixed to `null` in current implementation.

---

## 4. SSR / Next / Remix

- Server **page** imports a **`'use client'`** module that returns `<SpatialBoot>…</SpatialBoot>`.
- **SSR does not run `bootSpatial()`** (`useEffect` is client-only).
- **Spatial `children` are absent from server HTML**; they mount on the client after boot.

---

## 5. Advanced / Phase 2

| Topic | Status |
| ----- | ------ |
| Public `useBootSpatial` | Phase 2 if product requests custom boot progress / manual `boot()` |
| Custom loading UI in `<SpatialBoot>` | Not supported in current public contract (`SpatialBoot` waiting state is `null`) |

---

## 6. Resolved product questions (2026-05)

| # | Decision |
| - | -------- |
| Ship scope | Phase 1 exports `<SpatialBoot>` only (React sugar); `useBootSpatial` internal |
| Boot failure | **`onError` only; children do not mount** |
| Waiting behavior | `SpatialBoot` renders `null` before ready (no public `gate` / `fallback`) |
| Plain web | Boot resolves immediately; children mount on first client tick after mount |

---

## 7. Revision history

| Date | Notes |
| ---- | ----- |
| 2026-05-19 | Initial draft |
| 2026-05-19 | Phase 1: boot failure does not mount children |
| 2026-05-19 | **Position B:** `useBootSpatial` not on public export surface |
