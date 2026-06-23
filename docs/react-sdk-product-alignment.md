# WebSpatial React SDK — Product Alignment Guide

This document lists **decisions product and engineering should align on** for
`@webspatial/react-sdk` after the lazy-load v1 architecture and the optional
**eager** distribution entry. Use it as a workshop agenda, a sign-off checklist,
or the source for public-facing positioning copy.

**Related engineering material**

- Migration and integration details: `docs/migration/lazy-load-spatial-runtime.md`
- **`SpatialBoot` (shipped; `useBootSpatial` internal only):** `docs/design/spatial-boot-component.md`
- Measured size-impact report (spec vs main baseline): `docs/lazy-load-spatial-runtime-size-impact.md`
- OpenSpec change (normative requirements): `openspec/changes/lazy-load-spatial-runtime/`
- Consumer-shaped lazy + eager fixtures: `apps/spatial-vite-min/`
- **React Router 7 (Remix-style) SSR:** `apps/spatial-remix-min/`
- Next.js App Router reference: `apps/spatial-next-min/`
- WebSpatial-runtime-heavy internal demos (lazy default + `<SpatialBoot>`, monorepo `src` alias): `apps/test-server/`

---

## 1. Purpose

- **Product** gets explicit choices for browser vs WebSpatial behavior, docs,
  and support boundaries.
- **Engineering** gets signed scope for parity tests, examples, and which
  guarantees are documented vs best-effort.

---

## 2. P0 — Decisions (product sign-off)

These were the first workshop items. **Status: decided** (2026-05); use §11 and the subsections below for engineering-facing detail.

| #    | Topic           | Decision |
| ---- | --------------- | -------- |
| P0-1 | Primary persona | **Web-first progressive enhancement.** Default narrative, docs, and consumer demos center on `@webspatial/react-sdk` (lazy): the app works in plain browsers via documented facade fallbacks and enhances after `bootSpatial()` in WebSpatial runtimes. |
| P0-2 | Two entries     | **`@webspatial/react-sdk` is the customer-facing default.** `@webspatial/react-sdk/eager` is **advanced / internal-only** in customer messaging (WebSpatial-only shells, copy-paste from lazy, or internal R&D). Consumer fixtures may still ship eager pages for pipeline validation. |
| P0-3 | Plain web bar   | **Accept** the per-component default fallbacks in [`packages/react/README.md`](../packages/react/README.md) (and OpenSpec "Component facades") as the plain-web experience. **Reject** white screens, uncaught errors, and layout collapse caused by the SDK. **Expected:** `Entity` / `Material` / `*Asset` render **no DOM** (`null` fallback); integrators who need visible placeholders use `useSpatialReady()` wrappers (see `/capability-wrapper` in `spatial-next-min`). See [§4.1](#41-experience-p0-3--plain-web-quality-bar). |
| P0-4 | WebSpatial boot | **Phase 1 (public): boot then render.** Wrap spatial UI in `<SpatialBoot>` (default behavior: do not mount `children` until `bootSpatial()` succeeds; waiting state renders `null`). Plain web: boot is a no-op microtask. There is no public `gate` / `fallback` prop in v1; apps that need visible loading UI render it outside `<SpatialBoot>`. CSR-only apps may still `await bootSpatial()` before `createRoot` as an advanced optimization. |
| P0-5 | Boot failure    | **Phase 1 (`<SpatialBoot>`):** `onError` runs; **`children` do not mount.** Apps own all failure UX (toast, error page, retry). **Elsewhere** (imperative `bootSpatial()` without `<SpatialBoot>`): facades may still use documented fallbacks when the tree is mounted but `isSpatialReady()` is false. |
| P0-6 | Parity scope    | **Public quality goal, fixed incrementally.** Facade fallback (Path 1) and real-implementation unsupported branches (Path 2) should structurally align per OpenSpec; close gaps **one component at a time** (see `packages/react/src/__tests__/parity.test.tsx` §15.8 `it.todo`). Not an all-or-nothing release gate, but not "tests only" either. |

---

## 3. Distribution forms and who validates what

### 3.1 Lazy default entry — `@webspatial/react-sdk`

- Spatial implementation loads **after** `bootSpatial()` resolves in a WebSpatial
  runtime (dynamic path to the spatial chunk).
- On **non-WebSpatial** browsers, `bootSpatial()` returns quickly without loading
  that chunk; facades provide **degraded** UI paths.

**Signed**

1. **Canonical** lazy + Vite-style customer demo: `apps/spatial-vite-min`.
2. **Recommend** calling `bootSpatial()` once at app startup even on plain web
   (harmless early-return, no spatial chunk fetch). Optional on purely static
   marketing pages that never target WebSpatial is acceptable copy-wise, but
   not the default integration recipe.

### 3.2 Eager entry — `@webspatial/react-sdk/eager`

- Spatial implementation is **statically linked**; lazy bridge round-trip is
  not used for app-authored spatial primitives.
- `bootSpatial()` is a **compatibility no-op** (optional dev warning).

**Signed (P0-2)**

1. **Customer messaging:** eager is for **WebSpatial-only** shells / devices
   (or advanced integrators who accept larger bundles). Not the default path
   for arbitrary-browser PWAs in public docs.
2. **Public docs:** do **not** lead with eager. When documenting migration from
   lazy, mention eager as an advanced alternative; keeping `await bootSpatial()`
   in source for copy-paste compatibility is fine (no-op on eager entry).

### 3.3 Internal vs consumer-shaped apps

| App                      | Role (suggested framing)                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| `apps/spatial-vite-min`  | **Consumer-shaped** validation: published `exports`, lazy + eager pages, no SDK `src/` alias.    |
| `apps/spatial-next-min`  | **Next.js 15** SSR / RSC reference (`@webspatial/react-sdk`).                                    |
| `apps/spatial-remix-min` | **React Router 7** (Remix-style) + **Vite SSR** reference.                                       |
| `apps/test-server`       | **WebSpatial-runtime-heavy** validation; aliases lazy default `src/index.ts` + `<SpatialBoot>`; `@webspatial/react-sdk/eager` optional. |

Product should confirm this split matches how **you** talk about “official
demos” externally.

---

## 4. Plain web (no WebSpatial runtime)

### 4.1 Experience (P0-3 — plain web quality bar)

P0-3 is **not** a request for new SDK fallbacks. It defines what integrators and
end users should consider **acceptable** when spatial primitives render in a
normal browser (Chrome, Safari, Firefox) without a WebSpatial runtime.

**Acceptable (SDK default fallbacks — no app wrapper required)**

| What integrators use | Plain-web behavior |
| -------------------- | ------------------ |
| `Model` | Degraded `<webspatial-model-fallback>` host (spatial event props stripped); layout preserved |
| `Reality` | Single `<div aria-hidden="true">` preserving the layout box; **children do not mount** |
| `enable-xr` / `enable-xr-monitor` hosts | Ordinary `<div>` (marker stripped); no spatial slab |
| `Entity` / `*Entity` / `Material` / `*Asset` | **No DOM** (`null` fallback) — expected, not a bug |
| `SceneGraph` / `World` | **No DOM** (`null` fallback) — expected; under `<Reality>` the child subtree does not mount anyway |
| `useMetrics` | Returns `pointToPhysical` / `physicalToPoint`; invoking either throws `WebSpatialRuntimeError` while the placeholder is active (plain web, SSR, pre-boot, or pinned instances) |

**Plain-web UX tiers (P0-3 component detail):** **Visible** fallbacks are `Model`,
`Reality`, and `enable-xr` / `enable-xr-monitor` hosts. **Structural** fallbacks
(`SceneGraph`, entities, materials, assets) are `null` for API safety; in the
canonical `<Reality>…</Reality>` tree only the `Reality` placeholder is user-visible
because Reality fallback does not mount children. Consumer demo for
`enable-xr-monitor`: `apps/spatial-vite-min` `/xr-monitor.html`.

**Unacceptable (treat as SDK or integration defect)**

- Full-page white screen or uncaught React errors attributable to spatial imports
- Severe layout collapse (e.g. `Reality` / `Model` placeholders not honoring `style` / `className` box)
- Documentation or marketing copy that implies full spatial interaction in plain web

**Integrator responsibility (acceptable, not SDK defaults)**

- "Prettier" marketing UX when defaults are too plain (e.g. custom poster via
  `useSpatialReady()` — see `apps/spatial-next-min` `/capability-wrapper`)
- Visible skeletons while the spatial chunk loads (optional `<SpatialBoot fallback={…}>` or app layout UI)

**Signed**

1. **Visual:** Per the table above; `Reality` stays a layout-preserving `<div>`
   placeholder (§11).
2. **Interaction:** Spatial gestures (`onSpatialTap`, drag, rotate, magnify on
   spatial primitives) are **unsupported** on plain web — only normal DOM
   interaction on fallback hosts applies.
3. **Copy:** Customer-facing docs MUST use wording equivalent to **"Spatial
   features require a WebSpatial-capable runtime"** and MUST NOT imply AVP/PICO
   parity in a normal browser.

### 4.2 `bootSpatial()` on plain web

Engineering note: `bootSpatial()` early-returns when no WebSpatial runtime is
detected; it does **not** load the spatial chunk.

**Signed:** Public integration guides **recommend** calling `bootSpatial()` once
at startup (same call path as WebSpatial builds). Pure static pages that omit it
may still render facade fallbacks but forfeit dev-only "forgot to boot" warnings
in WebSpatial runtimes.

---

## 5. WebSpatial runtime

1. **Boot ordering (P0-4):** **Phase 1** — `<SpatialBoot>`: boot completes before
   `children` mount (see `docs/design/spatial-boot-component.md`, fixtures
   `spatial-vite-min` `/`, `spatial-next-min` `/lazy`, `spatial-remix-min` `/lazy`).
2. **Loading UX:** **Not mandated.** Default is blank while boot; apps may pass
   optional `fallback` on `<SpatialBoot>` or show layout-level loading outside the wrapper.
3. **Dev warnings:** **Signed** — development-only console warnings (e.g. forgot
   `bootSpatial` in a WebSpatial UA) are acceptable.
4. **Failure UX (P0-5):** **Phase 1 `<SpatialBoot>`** — `onError`; **no `children`**.
   Apps implement error/retry UX. Imperative `catch` / `onSpatialLoadError` still apply
   for non-React boot paths.

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

### 6.2 Product scope choice (P0-6)

**Signed: A with incremental delivery** — parity is a **public** SDK quality
goal (facade Path 1 vs real-impl Path 2 when spatial is unavailable or
unsupported). Engineering closes gaps **per component** via §15.8 follow-ups
(`Reality`, `*Entity` family, materials/assets, `SceneGraph` / `World`, etc.);
`Model` parity is already exercised in `parity.test.tsx`.

Do **not** block releases on all `it.todo` items at once; do **not** treat parity
as "tests only" while shipping regressions that diverge from documented
fallback tables.

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

1. ~~Product + EM fill **Section 2 (P0)**~~ — **Done** (see §2, §11).
2. UX + tech writing propagate §2 / §4 into **public docs** and onboarding
   (`packages/react/README.md`, `docs/migration/lazy-load-spatial-runtime.md`,
   `spatial-vite-min`).
3. Engineering maps P0-6 to **OpenSpec / parity tests** — promote one `it.todo` at
   a time from `parity.test.tsx`.
4. Revisit **quarterly** or when adding major primitives / new runtime targets.

---

## 11. Product sign-off (engineering-facing)

Decisions from product sync (record for docs/SDK scope):

| Topic                          | Decision                                                                                                                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0-1** Primary persona       | **Web-first progressive enhancement**; lazy default entry is the public story.                                                                                                                                                     |
| **P0-2** Distribution entries  | **`@webspatial/react-sdk` only** in customer-facing messaging; **eager = advanced / internal-only**.                                                                                                                               |
| **P0-3** Plain web bar         | **Accept** documented facade fallbacks (README table); **reject** white screen / uncaught errors / layout collapse. **`null` entity/material fallbacks on web are expected.** Custom visuals = app wrappers (`useSpatialReady`).      |
| **P0-4** Boot timing           | **Pre-await and fallback-then-upgrade both OK**; document trade-offs (CSR vs SSR/hydration).                                                                                                                                         |
| **P0-5** Boot failure          | **SDK degrades** (facades stay on fallbacks); **apps own UX** via `WebSpatialBootError`, `onSpatialLoadError`, `catch` / `onError`, optional retry. No mandatory SDK error page.                                                    |
| **P0-6** Parity                | **Public quality goal**; align facade vs real-impl **per component** (§15.8 backlog), not single big-bang.                                                                                                                        |
| `@webspatial/react-sdk/server` | **Not shipped in v1.** No server subpath or `detectSpatialRuntime` export for RSC; reintroduce when product needs it. Integrators use **User-Agent + official WebSpatial documentation** for request-time branching. |
| Runtime detection in app code  | **No supported public detection API** for third-party integrators (client or server). `WebSpatialRuntime.supports` and boot gating use **`@webspatial/core-sdk/runtime`** (single implementation). Apps branch on **User-Agent** per official docs for SSR. |
| `SSRProvider` removal          | **Agreed.** No app-level provider for hydration gating; the default entry handles this via the facade's `useSpatialReady` (real hosts mount post-hydration through the facade delegate, so no internal SSR wrapper is needed).                                                                                                       |
| `Reality` plain-web / fallback | **Keep the `<div>` placeholder** (layout-preserving degraded rendering). Do not change the facade/impl contract to `null` or alternate tags without an explicit product + spec revision. Children use **scene-graph** APIs (`Entity`, `*Entity`, materials) — not the top-level `Model` facade. |
| `bootSpatial()` on plain web   | **Recommend** one call at startup in integration docs (harmless no-op without WebSpatial UA).                                                                                                                                      |

---

## Document history

- Introduced for cross-team alignment alongside lazy-load v1 and the eager
  entry. Update this file when P0 answers change materially.
- **§11** added after product sign-off on server/RSC branching, `SSRProvider`,
  and `Reality` fallback. **`./server` subpath removed** (2026-05): UA-only for
  integrators until product reintroduces server helpers.
- **§2 P0 table decided** (2026-05): web-first, eager internal-only, plain-web
  bar (§4.1), dual boot timings, app-owned boot-failure UX, incremental parity.
- **SpatialBoot phase 1** (2026-05): public story = boot then mount; boot failure
  does not mount children; `useBootSpatial` not exported (phase 2 if needed).
