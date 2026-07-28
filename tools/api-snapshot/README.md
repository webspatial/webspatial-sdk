# WebSpatial public-API snapshot

One command extracts a normalized JSON snapshot of the SDK's full documented
surface. CI regenerates it on each PR, diffs against the committed baseline
(`api-baseline.json`), and posts a table of what changed — so a reviewer sees
the developer-facing impact of every PR, docs can't silently drift from what
shipped, and the API can't disagree with itself across packages.

## Commands

```sh
# Prerequisite: built declaration files
pnpm --filter @webspatial/core-sdk build && pnpm --filter @webspatial/react-sdk build

# Regenerate the committed baseline after an intentional API change
pnpm run api:snapshot

# What CI runs: diff current sources against the baseline; exits 1 on drift
pnpm run api:snapshot:check
```

The CI job (`.github/workflows/api-snapshot.yml`) fails on any drift, so an
intentional API change must include a regenerated `api-baseline.json` in the
same PR — which is exactly what makes the change reviewable.

## What gets snapshotted

Each surface is a structured read of a file the repo already maintains — no
guesswork:

| Surface                                            | Source of truth                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------ |
| Components, hooks, functions, types                | built `.d.ts` of `@webspatial/react-sdk` entries `.`, `./eager`, `./spatial`, `./jsx-runtime` |
| CSS properties (`--xr-back`, `--xr-depth`, …)      | `packages/react/src/jsx/xr-css-extension.ts` + `jsx-namespace.ts` type declarations |
| CSS initial values                                 | the default stylesheet injected at runtime (`StandardSpatializedContainer.tsx`) |
| `enable-xr`, `xr-animation`, `onSpatial*` events   | `packages/react/src/jsx/jsx-namespace.ts` JSX type augmentation           |
| Manifest / scene options                           | `packages/cli/src/schema.json`, plus the `xr_*` keys the web runtime (`packages/core/src/scene-polyfill.ts`) and the CLI builder actually read |
| Docs coverage                                      | whether each API name is mentioned in `docs/**` and the package READMEs   |

`./experimental` is deliberately excluded: it is the documented escape hatch
for APIs whose names may still change, so it carries no stability contract.

## Cross-source consistency checks

Because most APIs are defined in more than one place, the snapshot
cross-checks the definitions against each other and records every mismatch
under `consistency`:

- every `--xr-*` property declared in the types must have an initial value in
  the injected default stylesheet, and vice versa;
- the `CSSStyleDeclaration` and react `CSSProperties` augmentations must agree;
- the type stubs our own test apps use (`tests/ci-test/types/webspatial.d.ts`,
  `tests/autoTest/types/webspatial.d.ts`) must carry the full SDK declaration
  set;
- the manifest `xr_*` keys in the builder schema, the keys the CLI reads at
  build time, and the keys the web runtime reads must describe the same set.

Known, pre-existing mismatches are recorded in the committed baseline (see the
`consistency` object), so CI stays green until someone either fixes a source
or introduces a *new* mismatch — which fails the check and shows up as an
**Inconsistent** row in the report. Fix the sources, don't baseline new
inconsistencies.

Recorded on day one:

- `packages/cli/src/schema.json` (and the CLI builder) use `xr_main_scene`,
  but the web runtime reads `xr_spatial_scene` (which `docs/manifest-api.md`
  documents). Either these are two intentionally distinct keys — in which case
  the schema should declare both — or they have drifted apart.
- `--xr-depth` and `enableXr` are declared in the SDK types but missing from
  both test-app type stubs.

## Determinism

The snapshot must be byte-identical across machines: no timestamps, no
absolute paths (import paths in type strings are reduced to bare module names
with tsup's content hashes stripped), stable sort order everywhere, and
oversized structural types truncated to a prefix + sha256 digest. If the
check ever flakes without a source change, that is a bug in the extractor —
please report it.

## Scope decisions

- **Cross-package**: the snapshot spans `packages/react` (exports, CSS, JSX),
  `packages/core` (runtime manifest reads, injected stylesheet source), and
  `packages/cli` (manifest schema, build-time reads). The packages share a
  version group, so their API surfaces are checked together.
- **Docs source**: the in-repo `docs/` tree plus package READMEs. If the
  public docs site lives in another repo, its content can be added to the
  corpus later; the `docsCoverage` flags are advisory (they class as
  **Documentation**, not **Breaking**).
- **Ownership**: the PR author regenerates the baseline for intentional
  changes. An API newly flagged as undocumented is a prompt to add docs in the
  same PR — but the check only fails on unacknowledged drift, not on missing
  docs alone.
