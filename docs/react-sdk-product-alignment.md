# WebSpatial React SDK — Product Alignment Guide

This document lists **decisions product and engineering should align on** for
`@webspatial/react-sdk` after the lazy-load v1 architecture and the optional
**eager** distribution entry. Use it as a workshop agenda, a sign-off checklist,
or the source for public-facing positioning copy.

**Related engineering material**

- Migration and integration details: `docs/migration/lazy-load-spatial-runtime.md`
- **Proposed `SpatialBoot` / `useBootSpatial` APIs (product workshop):** `docs/design/spatial-boot-component.md`
- Measured size-impact report (spec vs main baseline): `docs/lazy-load-spatial-runtime-size-impact.md`
- OpenSpec change (normative requirements): `openspec/changes/lazy-load-spatial-runtime/`
- Consumer-shaped lazy + eager fixtures: `apps/spatial-vite-min/`
- **React Router 7 (Remix-style) SSR:** `apps/spatial-remix-min/`
- Next.js App Router reference: `apps/spatial-next-min/`
- WebSpatial-runtime-heavy internal demos (eager via build alias): `apps/test-server/`

---

## 1. Purpose

- **Product** gets explicit choices for browser vs WebSpatial behavior, docs,
  and support boundaries.
- **Engineering** gets signed scope for parity tests, examples, and which
  guarantees are documented vs best-effort.

---

## 2. P0 — Resolve first (short workshop)

Answer these before broad public messaging or enterprise commitments.

| #    | Topic           | Question for product                                                                                                                                                   |
| ---- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-1 | Primary persona | Is the **default** story **web-first progressive enhancement**, or **spatial-first** apps?                                                                             |
| P0-2 | Two entries     | Are **`@webspatial/react-sdk` (lazy)** and **`@webspatial/react-sdk/eager`** both first-class, or is eager **advanced / internal-only** in customer messaging?         |
| P0-3 | Plain web bar   | On a normal browser, what is **acceptable** (static poster, flat layout) vs **unacceptable** (white screen, uncaught errors) for pages that use spatial primitives?    |
| P0-4 | WebSpatial boot | In WebSpatial runtimes, is **`await bootSpatial()` before first spatial UI** required, or is a **first-frame fallback then upgrade** acceptable?                       |
| P0-5 | Boot failure    | If `bootSpatial()` rejects, should the app **hard-fail**, **silent degrade**, or show **recoverable error UI**?                                                        |
| P0-6 | Parity scope    | Is **facade vs real-impl structural parity** on plain web a **public quality promise**, or an **internal engineering contract** with optional narrowing per component? |

---

## 3. Distribution forms and who validates what

### 3.1 Lazy default entry — `@webspatial/react-sdk`

- Spatial implementation loads **after** `bootSpatial()` resolves in a WebSpatial
  runtime (dynamic path to the spatial chunk).
- On **non-WebSpatial** browsers, `bootSpatial()` returns quickly without loading
  that chunk; facades provide **degraded** UI paths.

**Alignment questions**

1. Who is the **canonical** customer demo for lazy + Vite-style bundling?
   (Recommended: `apps/spatial-vite-min`.)
2. Should **all** integrators call `bootSpatial()` even on plain web (harmless
   early-return), or is it **optional** there?

### 3.2 Eager entry — `@webspatial/react-sdk/eager`

- Spatial implementation is **statically linked**; lazy bridge round-trip is
  not used for app-authored spatial primitives.
- `bootSpatial()` is a **compatibility no-op** (optional dev warning).

**Alignment questions**

1. Is eager **only** for WebSpatial-only shells / devices, or may customers ship
   eager bundles to **arbitrary** browsers (accepting larger bundles and
   real-impl degrade paths executing)?
2. Do public docs **recommend omitting** `bootSpatial()` on eager, or keeping it
   for copy-paste compatibility with lazy apps?

### 3.3 Internal vs consumer-shaped apps

| App                      | Role (suggested framing)                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| `apps/spatial-vite-min`  | **Consumer-shaped** validation: published `exports`, lazy + eager pages, no SDK `src/` alias.    |
| `apps/spatial-next-min`  | **Next.js 15** SSR / RSC reference (`@webspatial/react-sdk`).                                    |
| `apps/spatial-remix-min` | **React Router 7** (Remix-style) + **Vite SSR** reference.                                       |
| `apps/test-server`       | **WebSpatial-runtime-heavy** validation; may alias SDK `src` and eager entry for fast iteration. |

Product should confirm this split matches how **you** talk about “official
demos” externally.

---

## 4. Plain web (no WebSpatial runtime)

### 4.1 Experience

1. **Visual**: For `Model`, spatialized `div`s, `Reality`, etc., what is the
   **intended** plain-web appearance (posters, passthrough DOM, inert 3D tags)?
   **Signed:** `Reality` remains a **single `<div aria-hidden="true">` placeholder**
   that preserves the layout box (see §11).
2. **Interaction**: Are spatial gestures **explicitly unsupported** on plain
   web, or should some actions degrade to **2D-safe** behavior?
3. **Copy**: Do customer-facing docs use consistent language such as
   **“spatial features require a WebSpatial-capable runtime”** to avoid implying
   Chrome parity with device spatial behavior?

### 4.2 `bootSpatial()` on plain web

Engineering note: `bootSpatial()` early-returns when no WebSpatial runtime is
detected; it does **not** load the spatial chunk.

Product should still decide **documentation tone**: “always call once at
startup” vs “optional on marketing sites”.

---

## 5. WebSpatial runtime

1. **Boot ordering**: Must the first paint already be spatial-capable, or is
   staged loading acceptable?
2. **Loading UX**: Is a **global** loading indicator required, or per-widget
   skeletons only?
3. **Dev warnings**: Are console warnings in development (e.g. forgot
   `bootSpatial`) acceptable for integrators?
4. **Failure UX**: Same as P0-5 — align on hard-fail vs degrade vs retry.

---

## 6. Facade parity (facade vs real implementation)

### 6.1 What parity means here

For the **lazy default entry**, facades render **before** the spatial chunk is
ready. On plain web, `useSpatialReady()` is wired to stay **false**, so facades
are the **final** display path for those primitives.

**Parity** means: the facade’s **degraded output** should match the **real**
implementation’s **“spatial not available”** branch closely enough to avoid
surprises when:

- switching environments,
- hydrating,
- or migrating between lazy and eager entries.

### 6.2 Product scope choice

Pick one and record it:

- **A — Full parity culture**: parity is a **public** SDK quality bar; list
  **priority components** (e.g. `Model`, `Reality`) for UX review.
- **B — Narrow parity**: parity is **internal** except for a **minimal** set of
  primitives named in docs; others are “no crash + documented degrade”.
- **C — Parity as tests only**: parity is **engineering regression protection**,
  not a user-facing promise (still document plain-web behavior plainly).

---

## 7. Capability detection and UI policy

`WebSpatialRuntime.supports` (and related signals) expose **capability**, not
layout.

Product should define how apps should behave when a capability is **false**:

- hide the feature,
- disable with explanation,
- or show but no-op on action.

The SDK should not silently choose product policy here.

---

## 8. SSR, RSC, and hydration (if in roadmap)

If the product targets **SSR / prerender**:

1. Is **HTML identity** between server and first client paint required for
   spatial-marked trees?
2. Are **Server Components** in scope for the default entry’s `'use client'`
   boundary, and who owns documentation for Next / RSC integrators?
3. **Signed:** Request-time branching (e.g. “hero for WebSpatial shells vs plain
   web”) uses **User-Agent rules from official WebSpatial docs**, not a
   documented SDK detection export (see §11).

If SSR is **out of scope**, state that explicitly to avoid implied guarantees.

**Signed:** **`SSRProvider` is removed** from the public package — no
application-level Context wrapper; hydration safety is internal to the SDK
(§11).

---

## 9. Support matrix and boundaries

1. **Browsers / WebSpatial versions**: which are **supported**, **best-effort**,
   or **unsupported**?
2. **React versions**: minimum supported major/minor.
3. **Unsupported combinations** (document explicitly), e.g. mixing lazy and
   eager entry imports in one React tree, or misconfigured bundler aliases that
   split `src` vs `dist` surfaces.

---

## 10. Suggested sign-off workflow

1. Product + EM fill **Section 2 (P0)** in a 30–45 minute session.
2. UX + tech writing turn answers into **public docs** and **onboarding**
   examples (`spatial-vite-min`, main README).
3. Engineering maps decisions to **OpenSpec scenarios** (tighten or relax) and
   adjusts **parity test** scope for Section 6.
4. Revisit **quarterly** or when adding major primitives / new runtime targets.

---

## 11. Product sign-off (engineering-facing)

Decisions from product sync (record for docs/SDK scope):

| Topic                          | Decision                                                                                                                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@webspatial/react-sdk/server` | **Not part of the public developer surface.** The subpath may remain in the package for **internal WebSpatial demos, CI, and R&D**; do not document it as a supported integration API in customer-facing materials.                |
| Runtime detection in app code  | **`detectSpatialRuntime` is not a supported public API** for third-party integrators. Developers classify environments using the **User-Agent string** and **official WebSpatial site documentation** — not SDK detection helpers. |
| `SSRProvider` removal          | **Agreed.** No app-level provider for hydration gating; SDK handles this internally (`useSpatialReady`, `withSSRSupported`).                                                                                                       |
| `Reality` plain-web / fallback | **Keep the `<div>` placeholder** (layout-preserving degraded rendering). Do not change the facade/impl contract to `null` or alternate tags without an explicit product + spec revision.                                           |

---

## Document history

- Introduced for cross-team alignment alongside lazy-load v1 and the eager
  entry. Update this file when P0 answers change materially.
- **§11** added after product sign-off on server subpath visibility, public
  detection API, `SSRProvider`, and `Reality` fallback.
