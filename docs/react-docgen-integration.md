# React Component Docgen Integration Proposal (WebSpatial)

## Why this exploration

WebSpatial already has:

- a TypeScript-first React SDK package (`packages/react`),
- a monorepo `pnpm` workflow,
- and manually authored docs under `docs/`.

This makes automated component API extraction attractive as a **single source of truth** for props/event signatures while keeping narrative docs handcrafted.

## Current architecture fit assessment

## Is `react-docgen` a good fit?

**Short answer:** yes, with a TypeScript-aware variant and a narrow scope.

For this codebase, the best fit is:

1. Use **`react-docgen-typescript`** (or Storybook’s TS docgen pipeline) as the extractor.
2. Focus extraction on **public React components and exported prop types** from `packages/react/src`.
3. Keep Typedoc for non-component APIs (if used), and use docgen only for React component prop/event tables.

Why this fits WebSpatial specifically:

- Public components are mostly TypeScript + `forwardRef` based and exported from stable entry points. That’s exactly the shape TS docgen handles well. (`Model`, `Reality`, `Entity`, `BoxEntity`, etc.).
- The package already emits declarations and has strict TS config, so parser fidelity can be high with the package tsconfig as input.
- Docs already exist in markdown (`docs/`), so generated JSON/markdown can be consumed with low workflow disruption.

## Fit caveats in this repo

Extraction quality will vary across component patterns used in `packages/react`:

1. **HOC wrapping + `forwardRef` chains**
   - Example: `Model` is `withSSRSupported(forwardRef(ModelBase))`.
   - Some docgen pipelines lose prop metadata/display names through wrappers.

2. **Anonymous `forwardRef` callbacks without explicit display names**
   - Several components use inline `forwardRef((props, ref) => ...)` without `displayName` assignment.
   - This can produce weak component names (e.g., `ForwardRef`) in output.

3. **Factory-generated components**
   - `withSpatialized2DElementContainer` returns cached dynamic components.
   - Generated components are usually not good docgen targets; document the factory API instead.

4. **Heavy intersection/utility prop typing**
   - Types like `Omit<... & ...>` and event-type intersections are valid, but final prop tables can be noisy unless filtered.

5. **Re-export aliases**
   - Aliases like `Box`/`Sphere`/`World` can duplicate output unless deduped at generation time.

## Recommended architecture

Use a **two-layer documentation model**:

1. **Generated API layer (machine-owned)**
   - Source: `packages/react/src/**` public component modules.
   - Output: normalized JSON (primary artifact), optionally markdown tables.
   - Ownership: CI/script-generated.

2. **Narrative docs layer (human-owned)**
   - Source: `docs/*.md` (guides, concepts, examples).
   - Generated prop tables are embedded or referenced, but explanations remain curated.

### Pipeline placement

Add a docs-generation step that runs independently from package build:

- Command example: `pnpm -F @webspatial/react-sdk run docs:components`
- CI job: verify generated artifacts are up to date (fail on diff).
- Optional: publish generated JSON as a docs-site input artifact.

This keeps build artifacts (`dist`) and docs artifacts decoupled, reducing release coupling.

## Wiring into build/docs workflow

Recommended script flow for `packages/react`:

1. Parse components with TS docgen parser using `packages/react/tsconfig.json`.
2. Restrict to explicit public component entry files:
   - `src/Model.tsx`
   - `src/reality/components/*.tsx` (excluding internal base helpers if desired)
   - optionally selected `spatialized-container` components intended for public consumption.
3. Normalize + filter output:
   - remove internal/private props,
   - collapse aliased component names,
   - sort props,
   - preserve JSDoc descriptions/default values.
4. Emit artifacts:
   - `docs/generated/react-components.json` (canonical)
   - `docs/generated/react-components.md` (optional convenience)

## Component/TypeScript patterns that may reduce extraction quality

Patterns to watch in WebSpatial React SDK:

1. `withSSRSupported` wrapper components around public exports.
2. Inline anonymous `forwardRef` functions.
3. Generic factory wrappers returning components.
4. `any`-typed fields in public prop objects (`geometryOptions: any`, etc.)
5. Deep imported/aliased event types (can become verbose in rendered docs).
6. Mixed “public + internal” exports from barrel files.

## Recommended low-friction code conventions (minimal changes)

To improve reliability without brittle conventions:

1. **Assign `displayName` on every public component export**
   - especially `forwardRef` and HOC-wrapped components.

2. **Keep/export explicit public props types next to components**
   - `export type XProps = ...` on public components.

3. **Add JSDoc on public props and event callbacks**
   - prioritize domain-specific props (`enableInput`, `spatialEventOptions`, etc.).

4. **Avoid exposing `any` in public prop types** where practical
   - replacing with concrete interfaces improves docs and IDE help simultaneously.

5. **Document factories as APIs, not their generated instances**
   - treat `withSpatialized2DElementContainer` as the documented unit.

These changes are small, incremental, and align with existing coding style.

## Output formats: what to generate

Use JSON as primary output and derive other forms:

- **Primary:** `react-components.json`
  - ideal for docs-site rendering, linting checks, schema validation.
- **Secondary:** markdown pages/tables per component
  - useful for repo browsing and quick reviews.
- **Optional:** OpenAPI-like schema is possible but usually unnecessary for React props.

## Tradeoffs / limitations

1. **Docgen is structurally accurate, not always semantically complete**
   - behavior nuances still need hand-written docs.
2. **HOC/factory-heavy APIs need naming hygiene**
   - otherwise component identity in output degrades.
3. **Complex type-level abstractions can produce noisy prop signatures**
   - requires post-processing rules.
4. **Generated docs can become brittle if every internal component is included**
   - keep scope to intended public APIs.

## Minimal proof-of-concept plan (1-2 days)

### POC scope

Cover these components only:

- `Model`
- `Reality`
- `Entity`
- `BoxEntity`

### POC steps

1. Add docgen dev dependency in `packages/react`.
2. Add a script (e.g., `scripts/generate-component-docs.ts`) that:
   - loads parser with `packages/react/tsconfig.json`,
   - parses the four files,
   - writes `docs/generated/react-components.poc.json`.
3. Add minimal normalization:
   - enforce stable sort,
   - include component `displayName` fallback,
   - drop duplicate alias entries.
4. Add CI check script:
   - `docs:components:check` fails if regeneration changes committed file.
5. Review output quality with 2-3 maintainers and capture convention tweaks.

### POC acceptance criteria

- All four components are discovered by stable names.
- >90% of public props have readable names + types.
- Event callback props are visible and not collapsed away.
- Regeneration is deterministic (no churn in git diff when code unchanged).

## Suggested rollout after POC

1. Expand to rest of public components in `packages/react/src/reality/components` and top-level exports.
2. Add JSDoc improvements where output is weak.
3. Integrate generated JSON into the docs site build.
4. Keep manual conceptual docs (e.g., behavior and platform caveats) as source-authored markdown.

## Practical recommendation

Proceed with a **TS docgen + JSON artifact + curated docs integration** approach.

This gives WebSpatial a maintainable, low-friction path where:

- component prop/event docs come from source-of-truth types,
- existing markdown docs remain the place for behavior and examples,
- and complexity is contained to a small generation/check script plus a few naming/JSDoc conventions.
