# WebSpatial React SDK：`SpatialBoot` 产品对齐稿

> **Status:** Implemented in `@webspatial/react-sdk` (see `packages/react/src/runtime/SpatialBoot.tsx`; boot state via internal `useBootSpatial.ts`)  
> **Phase 1 (public):** Boot completes before spatial UI mounts; boot failure → `onError`, no children  
> **Phase 2 (planned):** `gate={false}`, optional public `useBootSpatial`, richer boot-progress APIs

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

**Phase 1 public docs do not teach:**

- `gate` (default `gate={true}` in code — boot then mount)
- `fallback` (optional loading UI while boot is in flight)
- Render-first-then-boot (`gate={false}`, phase 2)

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
| `fallback` | Advanced / fixtures | Shown while boot is in flight; default **blank** if omitted |

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

**Phase 2:** `gate={false}`; optional public `useBootSpatial` for custom status UI without `<SpatialBoot>`.

---

## 4. SSR / Next / Remix

- Server **page** imports a **`'use client'`** module that returns `<SpatialBoot>…</SpatialBoot>`.
- **SSR does not run `bootSpatial()`** (`useEffect` is client-only).
- With default gate, **spatial `children` are usually absent from server HTML**; they mount on the client after boot.

---

## 5. Phase 2 (planned)

| Topic | Phase 2 |
| ----- | ------- |
| `gate={false}` | Mount immediately; facade fallback → real after boot |
| Public `useBootSpatial` | Custom boot progress / manual `boot()` if product requests it |
| Document `fallback` in main guide | Loading shells during boot |

---

## 6. Resolved product questions (2026-05)

| # | Decision |
| - | -------- |
| Ship scope | Phase 1 exports `<SpatialBoot>` only (React sugar); `useBootSpatial` internal |
| Boot failure | **`onError` only; children do not mount** |
| Default gate | **`true`**; phase-1 public docs omit the prop name |
| Plain web | Boot resolves immediately; children mount on first client tick after mount |

---

## 7. Revision history

| Date | Notes |
| ---- | ----- |
| 2026-05-19 | Initial draft |
| 2026-05-19 | Phase 1: default `gate={true}`, boot failure does not mount children |
| 2026-05-19 | **Position B:** `useBootSpatial` not on public export surface |
