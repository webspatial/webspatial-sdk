# WebSpatial React SDK：`SpatialBoot` / `useBootSpatial` 产品对齐稿

> **Status:** Implemented in `@webspatial/react-sdk` (see `packages/react/src/runtime/useBootSpatial.ts`, `SpatialBoot.tsx`)  
> **Phase 1 (public):** Boot completes before spatial UI mounts; boot failure → `onError`, no children  
> **Phase 2 (planned):** Document render-first-then-boot (`gate={false}`) as advanced progressive enhancement

**Related material**

- Migration: [`docs/migration/lazy-load-spatial-runtime.md`](../migration/lazy-load-spatial-runtime.md)
- Product alignment: [`docs/react-sdk-product-alignment.md`](../react-sdk-product-alignment.md)
- Consumer fixtures: `apps/spatial-vite-min/`, `apps/spatial-remix-min/`, `apps/spatial-next-min/`

---

## 1. Phase 1 — public integration (simplified API story)

**Tell developers one workflow:**

1. Wrap the spatial app (or route subtree) in **`<SpatialBoot>`**.
2. The SDK calls **`bootSpatial()`** after mount.
3. **`children` mount only after boot succeeds** (WebSpatial: spatial chunk loaded; plain web: immediate resolve).
4. If boot fails with **`WebSpatialBootError`**, **`onError` runs** and **`children` do not mount** — the app shows error UI in `onError` (toast, full-page error, retry via `bootSpatial()` / `useBootSpatial().boot()`).

**Phase 1 public docs do not teach:**

- `gate` (behavior is always “boot then mount”; default `gate={true}` in code)
- `fallback` (optional advanced prop — blank screen while boot if omitted)
- Render-first-then-boot / facade fallback flash (`gate={false}`, phase 2)

**Canonical imperative API remains `bootSpatial()`** — `<SpatialBoot>` only wraps it for React trees.

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
        // Required UX path on failure — children are NOT mounted
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
| `fallback` | Advanced / fixtures only | Shown while boot is in flight; default **blank** if omitted |

### 2.2 `bootSpatial()` (still required conceptually)

Callable outside React. `<SpatialBoot>` invokes it automatically. Apps may still call it for retries:

```ts
import { bootSpatial } from '@webspatial/react-sdk'

await bootSpatial() // retry after onError
```

**CSR optional optimization:** `await bootSpatial()` before `createRoot().render(<SpatialBoot>…)` — reduces time with an empty subtree; phase-1 docs can mention in a footnote, not as the main Next/Remix path.

### 2.3 `useBootSpatial()` (advanced)

Exposes `status`, `error`, `boot()`. Phase-1 docs: use when you need boot progress UI without wrapping in `<SpatialBoot>`, or for custom gating. Most apps should use `<SpatialBoot>` only.

### 2.4 `useSpatialReady()`

Read-only: is the bridge loaded? Use for **custom** degraded UI (`CapabilityDemo` pattern) or debugging. Facades already use it internally.

---

## 3. Implementation notes (engineering)

```
bootSpatial()
     ↑
useBootSpatial()   — status / onError / boot()
     ↑
SpatialBoot        — default gate={true}: showChildren = (status === 'ready')
```

| `status` | `children` (default gate) | `onError` |
| -------- | ------------------------- | --------- |
| `idle` / `booting` | Not mounted | — |
| `ready` | Mounted | — |
| `failed` | **Not mounted** | Called |

**Phase 2:** `gate={false}` → `showChildren = true` immediately; facades use fallback until ready (today’s pre-phase-1 demos).

---

## 4. SSR / Next / Remix

- Server **page** imports a **`'use client'`** module that returns `<SpatialBoot>…</SpatialBoot>`.
- **SSR does not run `bootSpatial()`** (`useEffect` is client-only).
- With default gate, **spatial `children` are usually absent from server HTML**; they mount on the client after boot.
- Layout chrome (non-spatial) can still SSR normally.

Do **not** claim phase-1 `<SpatialBoot>` eliminates SSR or provides full spatial facade HTML on the server.

---

## 5. Phase 2 (planned, not phase-1 docs)

| Topic | Phase 2 |
| ----- | ------- |
| `gate={false}` | Mount immediately; facade fallback → real after boot |
| Document `fallback` in main guide | Loading shells during boot |
| `useBootSpatial` + status UI | First-class boot progress patterns |
| P0-4 full matrix | Pre-await vs in-tree vs gate |

---

## 6. Resolved product questions (2026-05)

| # | Decision |
| - | -------- |
| Ship scope | `useBootSpatial` + `<SpatialBoot>`; phase-1 docs center on `<SpatialBoot>` |
| Boot failure | **`onError` only; children do not mount** |
| Default gate | **`true`**; phase-1 public docs omit the prop name |
| Plain web | Boot resolves immediately; children mount on first client tick after mount |

---

## 7. Revision history

| Date | Notes |
| ---- | ----- |
| 2026-05-19 | Initial draft (Option A: explicit `gate`, default false) |
| 2026-05-19 | **Phase 1 alignment:** default `gate={true}`, boot failure does not mount children, simplified public docs |
