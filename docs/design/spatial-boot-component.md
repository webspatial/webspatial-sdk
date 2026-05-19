# WebSpatial React SDK：`SpatialBoot` / `useBootSpatial` 产品对齐稿

> **Status:** Implemented in `@webspatial/react-sdk` (see `packages/react/src/runtime/useBootSpatial.ts`, `SpatialBoot.tsx`)  
> **Scope:** Optional sugar APIs on top of existing `bootSpatial()` to lower the barrier for in-tree boot patterns  
> **Does not replace:** `bootSpatial()` as the normative activation entry; lazy CSR still recommends `await bootSpatial()` before `createRoot().render()`

**Related material**

- Migration and boot timing: [`docs/migration/lazy-load-spatial-runtime.md`](../migration/lazy-load-spatial-runtime.md)
- Broader React SDK product alignment: [`docs/react-sdk-product-alignment.md`](../react-sdk-product-alignment.md)
- Normative lazy-load requirements: [`openspec/changes/lazy-load-spatial-runtime/`](../../openspec/changes/lazy-load-spatial-runtime/)
- Consumer-shaped fixtures: `apps/spatial-vite-min/` (`/lazy-gate.html`), `apps/spatial-remix-min/` (`/lazy-gate`), `apps/spatial-next-min/` (`/lazy-gate`)

---

## 1. Background and problem

Under the v1 lazy-load architecture, applications running in a WebSpatial runtime must call `bootSpatial()` to load the spatial chunk; otherwise facades keep rendering documented web fallbacks.

**Pain points today**

- Entry files require an `async function start()` plus `try/catch` and `WebSpatialBootError` handling (see `apps/spatial-vite-min/src/main.tsx` and `main-eager.tsx`).
- SSR / Remix-style apps often hand-roll `useEffect` + boot state in client components (see `apps/spatial-remix-min/app/components/LazySpatialDemo.tsx`).

**Goals**

- Provide **optional** declarative APIs that reduce boilerplate.
- **Preserve** existing `bootSpatial()` semantics and OpenSpec boot timing (before vs after first render / hydrate).
- Stay compatible with `useSpatialReady()` and per-facade fallback behavior.

---

## 2. Design principles

| Principle | Description |
| --------- | ----------- |
| **Imperative API remains canonical** | `bootSpatial()` is the single activation path; components and hooks only wrap invocation and status |
| **Web-first by default** | Default does not block the child tree; facades continue fallback → real progressive enhancement |
| **Do not mis-sell lazy CSR performance** | Docs must state that minimal fallback flash on pure CSR still favors entry-level `await bootSpatial()` |
| **Hook = logic, component = default UX** | Same split as common React patterns (`useX` + `<X>`) |
| **Option A: explicit `gate` and `fallback`** | Default `gate={false}`; `fallback` is only meaningful when `gate={true}` |

---

## 3. API overview

### 3.1 Unchanged: `bootSpatial()`

```ts
await bootSpatial() // Callable outside React; idempotent; resolves immediately on plain web
```

**Recommended pattern (lazy + pure CSR — still the docs default):**

```ts
await bootSpatial()
createRoot(el).render(<App />)
```

### 3.2 New: `useBootSpatial()` (logic layer)

**Responsibility:** Call `bootSpatial()` after mount (by default), expose boot progress. **Does not** gate the child tree.

**Return shape (illustrative):**

```ts
type BootStatus = 'idle' | 'booting' | 'ready' | 'failed'

{
  status: BootStatus
  error: WebSpatialBootError | null
  boot: () => Promise<void> // optional manual retry
}
```

**When to use**

- Remix / Next routes that display boot status in the UI (as in `LazySpatialDemo`).
- Custom gate or error UI (`if (status !== 'ready') return <Skeleton />`).
- Composition with routing or other hooks without a wrapper component.

### 3.3 New: `<SpatialBoot>` (declarative sugar)

**Responsibility:** Uses `useBootSpatial()` internally; optionally gates `children` via props.

**Props (Option A)**

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `children` | `ReactNode` | — | Business subtree |
| `gate` | `boolean` | `false` | When `true`, do not mount `children` until boot completes |
| `fallback` | `ReactNode` | — | **Only when `gate={true}`** — shown until boot completes |
| `onReady` | `() => void` | — | Called when boot succeeds |
| `onError` | `(err: WebSpatialBootError) => void` | — | Called on `WebSpatialBootError` (may align with `onSpatialLoadError` usage) |

**Behavior matrix**

| `gate` | `fallback` | Before boot completes | After boot completes |
| ------ | ------------ | --------------------- | -------------------- |
| `false` (default) | any (ignore or dev warn) | **Mount** `children` immediately; facades show normative fallback | Facades swap to real implementations |
| `true` | omitted | Do not mount `children` (blank) | First mount of `children` |
| `true` | provided | Show `fallback` only | First mount of `children` |

**Dev / types note:** If `gate={false}` and `fallback` is passed, prefer a **development warning** or TypeScript discriminated props so `fallback` is only allowed when `gate: true`.

---

## 4. Relationship to existing APIs

```
bootSpatial()           ← normative activation (awaitable outside React)
       ↑
useBootSpatial()        ← app layer: boot invoked?, success / failure
       ↑
SpatialBoot             ← optional: auto boot + optional gate

useSpatialReady()       ← bridge ready? (facades + custom skeletons)
```

- Facades (`Model`, etc.) **do not** depend on `SpatialBoot`; they use the bridge via `useSpatialReady()`.
- With default `gate={false}`, `<SpatialBoot>` matches today’s “children always mounted; boot in `useEffect`” pattern (`LazySpatialDemo`).

---

## 5. Boot timing (product trade-offs)

| Approach | Typical code | UX (lazy + pure CSR) | Best for |
| -------- | ------------ | -------------------- | -------- |
| **Entry pre-await** | `await bootSpatial(); createRoot(...)` | Fewer fallback flashes on first frame | Vite SPA, editable bootstrap |
| **In-tree, no gate** | `<SpatialBoot><App /></SpatialBoot>` or `useBootSpatial()` | Fallback first, then swap | Remix lazy routes, SSR client subtrees |
| **In-tree, gate** | `<SpatialBoot gate fallback={...}>` | Loading shell, then full subtree | Intentionally delay business UI until boot |
| **Eager entry** | `@webspatial/react-sdk/eager` | `bootSpatial` is effectively a no-op; `SpatialBoot` optional for uniform syntax | Spatial-only apps |

**SSR + hydrate:** The spec requires the hydration pass to render facade fallbacks matching the server. Neither entry pre-await nor `<SpatialBoot>` removes that fallback-to-real swap on the SSR path. `<SpatialBoot>` must **not** be marketed as eliminating SSR fallback flash.

---

## 6. Recommended public documentation copy

> - **Lazy + editable entry:** `await bootSpatial()` then `createRoot().render()` (recommended).
> - **Lazy + in-tree boot:** Use `<SpatialBoot>` or `useBootSpatial()`; default does not block children.
> - **Full-screen loading until boot:** `<SpatialBoot gate fallback={...}>`.
> - **Eager:** Use `@webspatial/react-sdk/eager`; `<SpatialBoot>` is optional for syntax consistency.

---

## 7. Examples (for review)

### 7.1 Vite eager — simpler entry (eager; behavior nearly unchanged)

```tsx
createRoot(el).render(
  <StrictMode>
    <SpatialBoot>
      <SpatialApp mode="eager-boot" Model={Model} />
    </SpatialBoot>
  </StrictMode>,
)
```

### 7.2 Vite lazy — keep pre-await (unchanged recommendation)

```tsx
await bootSpatial()
createRoot(el).render(<SpatialApp mode="lazy" Model={Model} />)
```

### 7.3 Remix lazy — replace hand-written effect

```tsx
function LazySpatialDemo() {
  const { status } = useBootSpatial()
  return (
    <>
      <p>boot: {status}</p>
      <Model ... />
    </>
  )
}

// Or only auto-boot, no status UI:
<SpatialBoot>
  <LazySpatialContent />
</SpatialBoot>
```

### 7.4 Explicit gate

```tsx
<SpatialBoot gate fallback={<p>Loading spatial…</p>}>
  <HeavySpatialScene />
</SpatialBoot>
```

---

## 8. Non-goals (this change)

- Do not replace `bootSpatial()` or introduce a second activation path.
- Do not claim `<SpatialBoot>` is equivalent to entry pre-await on lazy CSR (unless a future Suspense / `use(bootPromise)` design is scoped separately).
- Do not change the per-facade default fallback table or add a per-facade `fallback` prop.
- Do not require `<SpatialBoot>` on the eager entry.

---

## 9. Open questions for product

| # | Topic | Question |
| - | ----- | -------- |
| 1 | Ship scope | Ship both `useBootSpatial` (required) and `SpatialBoot` (sugar), or hook-only in v1? |
| 2 | `fallback` without `gate` | Dev warning only, or TypeScript forbids `fallback` unless `gate: true`? |
| 3 | Boot failure | Always mount children after failure (facade fallback), matching `main.tsx` catch-and-render? |
| 4 | Naming | Are `SpatialBoot` / `useBootSpatial` final, or align naming further with `bootSpatial`? |
| 5 | Docs placement | Dedicated doc page vs section in migration guide / README only? |
| 6 | P0 alignment | How does this relate to **P0-4 / P0-5** in [`react-sdk-product-alignment.md`](../react-sdk-product-alignment.md) (boot before UI vs first-frame fallback; failure handling)? |

---

## 10. Success criteria (after implementation)

- [ ] `LazySpatialDemo`-style boilerplate reduced by ≥50% lines when using hook or component
- [ ] Default `gate={false}` matches current “effect + immediate `Model` render” behavior
- [ ] `gate={true}`: no `children` in the DOM until boot resolves
- [ ] Eager subpath: thin wrapper, no extra chunk or material bundle growth
- [ ] Existing `bootSpatial` / SSR / hydration test matrix still passes

---

## 11. Revision history

| Date | Author | Notes |
| ---- | ------ | ----- |
| 2026-05-19 | Engineering draft | Initial product-alignment draft (Option A: explicit `gate`) |
