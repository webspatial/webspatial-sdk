See **[`review.md`](./review.md#review-contents)** (table of contents) for the full design checklist.

## 1. Spec and types

- [ ] 1.1 Align `specs/runtime-capabilities/spec.md` with **`supports` + `getRuntime`** (keep forward-compat scenarios)
- [ ] 1.2 Define TypeScript types: `WebSpatialRuntime`, `getRuntime()` return type, `supports` name unions / sub-token maps per feature group

## 2. Capability data and resolution (core)

- [ ] 2.1 Implement **`getRuntime()`**: `type` + **`shellVersion`** from UA (reuse / align with existing `Spatial` / platform-adapter parsing)
- [ ] 2.2 Implement **versioned capability table** (per `review.md` §3–§4): semver compare, fallback row, **false** when below min or unparseable
- [ ] 2.3 Implement **`supports(name, tokens?)`**: unknown `name`/token → **false**; **AND** for sub-tokens; **`supports(name, [])` ≡ `supports(name)`**
- [ ] 2.4 SSR / no-window: documented defaults, no throw

## 3. React SDK

- [ ] 3.1 Export **`WebSpatialRuntime`** (`supports`, `getRuntime`) from **`@webspatial/react-sdk`** (re-export or thin wrapper from core)
- [ ] 3.2 **`useDomProxy`**: add **`has` trap** for `xrClientDepth` / `xrOffsetBack` (see **`review.md`** §3.5)

## 4. Tests and docs

- [ ] 4.1 Unit tests: resolution rules (mock UA), `supports` shape, unknown keys/tokens
- [ ] 4.2 Public API doc (keys, sub-tokens, `false` semantics) + link to **`review.md`**
- [ ] 4.3 Optional: test-server debug panel for `getRuntime()` / sample `supports` calls

## 5. Product follow-ups (non-blocking for engineering skeleton)

- [ ] 5.1 **Material vs UnlitMaterial** doc copy
- [ ] 5.2 **Attachment** fallback UX
- [ ] 5.3 External **naming** in docs
