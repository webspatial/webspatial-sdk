## Context

WebSpatial runs in multiple environments: native **WebSpatial runtime** (e.g. visionOS-class), **PICO-class**, and **plain web**. Capabilities differ by **runtime type × Shell version** (see **`review.md`**). The SDK differentiates behavior internally (polyfills, scene/session), but **application code** needs a single, supported contract for “what can I use here?”.

**Source of truth for capabilities**: **Shell version** from **`WSAppShell/...`**. The **`WebSpatial/x.y.z`** UA token indicates SDK compatibility with the shell; it does **not** define capability exposure.

## Goals / Non-Goals

**Goals:**

- Expose **`WebSpatialRuntime.supports(name, tokens?)`** and **`WebSpatialRuntime.getRuntime()`** from **`@webspatial/react-sdk`** (implementation may live in `@webspatial/core-sdk`).
- Ship a **versioned capability table** in the SDK; **table keys match `supports` strings** (see **`review.md`** §3).
- Make behavior **testable** and **documented** (keys, sub-tokens, `false` semantics).
- Define behavior for **SSR** and **no `window`**: no throw; conservative results (see **`review.md`** §4).

**Non-Goals:**

- Manifest API capability detection (out of scope for this change).
- **`noRuntime.ts`** build stub (separate concern).
- **`getSdkVersion()`** in v1 (JS versions: `package.json` / release notes).
- Replace every ad-hoc DOM probe; **some** DOM checks (`in` on refs) remain documented alongside **`supports`**.

## Decisions

1. **Primary API shape: `supports` + `getRuntime`**
   - **`supports(name, tokens?)`**: returns **`boolean`**. Unknown `name` or unknown sub-token → **`false`**. Sub-tokens (when present) use **AND** semantics; **`supports(name, [])` ≡ `supports(name)`**.
   - **`getRuntime()`**: returns **`{ type: 'visionOS' | 'picoOS' | 'web', shellVersion: string | null }`** (read-only snapshot).

2. **Capability table**
   - **Per `runtime.type`**, semver-ordered **Shell** rows; query rules in **`review.md`** §4 (including **web** conservative behavior, **fallback to greatest row ≤ shell**, **false** when below table min or unparseable version).

3. **Package placement**
   - Core owns resolution + table; **React SDK** is the **documented entry** for `WebSpatialRuntime` (aligned with product expectation).

4. **Optional hook**
   - **`useWebSpatialCapabilities`** only if subscribe / mid-session updates are required later; v1 may omit.

5. **Alternatives considered** (unchanged in spirit)
   - Snapshot-only object without `supports`: poorer DX vs product **`supports('Model')`** mind map.
   - Throw on unsupported: rejected; **`false`** preferred.

## Risks / Trade-offs

- **[Risk] Table lags a new Shell** → **Mitigation**: §4.2 in **`review.md`** (fallback row); new capabilities stay **`false`** until the table ships.
- **[Risk] Key proliferation** → **Mitigation**: documented v1 lists in **`review.md`**; governance in review.
- **[Risk] React `domProxy` and `in`** → **Mitigation**: implement **`has` trap** for `xrClientDepth` / `xrOffsetBack` (see **`review.md`** §3.5).

## Migration Plan

- **Additive**: new exports; no required changes for existing apps.
- **Rollback**: remove or no-op exports; apps can feature-detect `supports` if needed.

## References

- **[`review.md`](./review.md)** — consolidated design review (API lists, resolution rules, fallback conventions, open product items).
- **[`capability-matrix.template.md`](./capability-matrix.template.md)** — product/runtime matrix template (collaboration); runtime data lives in `capability-table.ts` when implemented ([`review.md` §6.1](./review.md#review-6-1)).
- **Jump links** (stable anchors in `review.md`):
  - [Contents (TOC)](./review.md#review-contents)
  - [§1 Problem and principles](./review.md#review-1)
  - [§2 Public API](./review.md#review-2)
  - [§3 Capability keys](./review.md#review-3)
  - [§4 Resolution rules](./review.md#review-4)
  - [§5 Fallback conventions](./review.md#review-5)
  - [§5.1 Sub-capabilities / fallback ownership](./review.md#review-5-1)
  - [§3.6 Evolving `Model` sub-tokens](./review.md#review-3-6)
  - [§6 Table maintenance](./review.md#review-6)
  - [§6.1 Where the matrix lives](./review.md#review-6-1)
  - [§7 Open items](./review.md#review-7)
  - [§8 Review checklist](./review.md#review-8)

## Open Questions (remaining)

- **Material vs UnlitMaterial** public doc strings (**product**).
- **External naming** (visionOS / PICO / neutral wording) (**product**).
- **Attachment** fallback UX (**product**).
