## Context

WebSpatial runs in multiple environments. Capabilities differ by runtime and version. Application code needs a single supported contract for capability checks.

Current v1 source is SDK capability table + shell version parsing, with a future direction toward runtime-provided capability manifest.

## Goals / Non-Goals

**Goals:**

- Expose **`WebSpatialRuntime.supports(name, tokens?)`** from **`@webspatial/react-sdk`**.
- Ship a **versioned capability table** in the SDK; **table keys match `supports` strings** (see **`review.md`** §3).
- Make behavior **testable** and **documented** (keys, sub-tokens, `false` semantics).
- Define behavior for **SSR** and **no `window`**: no throw; conservative results (see **`review.md`** §4).

**Non-Goals:**

- Manifest API capability detection (out of scope for this change).
- **`noRuntime.ts`** build stub (separate concern).
- **`getSdkVersion()`** in v1 (JS versions: `package.json` / release notes).
- Full manifest-based capability negotiation (future work).
- **Subscribe / mid-session capability updates** (no reactive hook in v1; see Decisions §4).

## Decisions

1. **Primary external API shape: `supports`**
   - **`supports(name, tokens?)`**: returns **`boolean`**. Unknown `name` or unknown sub-token → **`false`**. Sub-tokens (when present) use **AND** semantics; **`supports(name, [])` ≡ `supports(name)`**.
   - `getRuntime()` remains internal-only with snapshot shape `{ type: 'visionos' | 'picoos' | null, shellVersion: string | null }`.

2. **Capability table**
   - **Per runtime type**, semver-ordered **Shell** rows; query rules in **`review.md`** §4 (fallback to greatest row <= shell, conservative false when unknown/too old/unparseable).

3. **Package placement**
   - Core owns resolution + table; React SDK exposes `WebSpatialRuntime.supports`.

4. **Stable capabilities after runtime is known (v1)**
   - Once the WebSpatial runtime is determined for the page/session, **capability results are treated as fixed** for that lifetime.
   - Apps rely on **synchronous** `supports(...)` only; **no** subscribe API, **no** `useWebSpatialCapabilities` (or equivalent) in v1.

5. **Alternatives considered** (unchanged in spirit)
   - Snapshot-only object without `supports`: poorer DX vs product **`supports('Model')`** mind map.
   - Throw on unsupported: rejected; **`false`** preferred.

## Risks / Trade-offs

- **[Risk] Table lags a new Shell** → **Mitigation**: §4.2 in **`review.md`** (fallback row); new capabilities stay **`false`** until the table ships.
- **[Risk] Shell-version inference is coarse** → **Mitigation**: future runtime-provided capability manifest (see **`review.md`** §6.2).
- **[Risk] Key proliferation** → **Mitigation**: documented v1 lists in **`review.md`**; governance in review.

## Migration Plan

- **Additive**: new exports; no required changes for existing apps.
- **Rollback**: remove or no-op exports; apps can feature-detect `supports` if needed.

## References

- **[`review.md`](./review.md)** — consolidated design review (API lists, resolution rules, fallback conventions).
- **[`capability-matrix.template.md`](./capability-matrix.template.md)** — product/runtime matrix template (collaboration); runtime data lives in `capability-table.ts` when implemented ([`review.md` §6.1](./review.md#review-6-1)).
- **Jump links** (stable anchors in `review.md`):
  - [Contents (TOC)](./review.md#review-contents)
  - [§1 Problem and principles](./review.md#review-1)
  - [§2 Public API](./review.md#review-2)
  - [§3 Capability keys](./review.md#review-3)
  - [§4 Resolution rules](./review.md#review-4)
  - [§5 Fallback conventions](./review.md#review-5)
  - [§5.1 `Model` fallback exception](./review.md#review-5-1)
  - [§3.6 Evolving `Model` sub-tokens](./review.md#review-3-6)
  - [§6 Table maintenance](./review.md#review-6)
  - [§6.1 Where the matrix lives](./review.md#review-6-1)
  - [§6.2 Future runtime capability manifest](./review.md#review-6-2)
  - [§7 Review checklist](./review.md#review-7)
