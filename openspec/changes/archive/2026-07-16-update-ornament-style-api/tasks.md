## 1. React Ornament API

- [x] 1.1 Update `packages/react/src/ornament/Ornament.tsx` `OrnamentProps` so `width`, `height`, and `cornerRadius` remain top-level props while `style?: React.CSSProperties` is added.
- [x] 1.2 Remove `backgroundMaterial` from the final React-facing public prop shape, or add a temporary compatibility shim with a development warning if release compatibility requires it.
- [x] 1.3 Derive the core Ornament `backgroundMaterial` option from `style['--xr-background-material']` and keep existing core normalization responsible for invalid or missing values.
- [x] 1.4 Ensure async create/update guards still apply pending style-derived material changes before add-to-scene and after create races.

## 2. Child Webview Style Injection

- [x] 2.1 Apply the full React `style` prop to `windowProxy.document.documentElement` for the Ornament child webview.
- [x] 2.2 Track previously applied style keys and remove stale child `html` inline styles when the `style` prop changes.
- [x] 2.3 Preserve existing Ornament child window preparation, base href, viewport, body fill sizing, and parent-head sync behavior.
- [x] 2.4 Do not add any parent-document DOM host, hidden probe, or parent-page layout participation for Ornament style resolution.

## 3. Test-server Demo

- [x] 3.1 Update `apps/test-server/src/pages/ornament-test/index.tsx` so the material control sets `style={{ '--xr-background-material': item.backgroundMaterial }}` on `<Ornament />`.
- [x] 3.2 Keep `width`, `height`, and `cornerRadius` controls wired as top-level Ornament props.
- [x] 3.3 Add at least one ordinary CSS property to the demo Ornament `style` so manual smoke can verify webview `html` style injection.
- [x] 3.4 Keep existing stable selectors for Ornament list, controls, content modes, and lifecycle checks.

## 4. React Unit Tests

- [x] 4.1 Update `packages/react/src/ornament/Ornament.test.tsx` create/update expectations to verify material is derived from `style['--xr-background-material']`.
- [x] 4.2 Add coverage that ordinary `style` properties are applied to the Ornament child webview `html` element.
- [x] 4.3 Add coverage that removed style keys are cleared from the child webview `html` element.
- [x] 4.4 Add coverage that changing material style updates the existing Ornament instance without destroy/recreate.
- [x] 4.5 Add coverage that no parent-document host/probe is created for Ornament style handling.

## 5. Contract Tests And Validation

- [x] 5.1 Update `tests/autoTest/tests/ornamentContract.test.ts` to assert the demo drives material through the style custom property while runtime Ornament options still update.
- [x] 5.2 Confirm core Ornament tests and protocol metadata tests remain valid without core/native changes.
- [x] 5.3 Run focused React Ornament unit tests.
- [x] 5.4 Run relevant style sync tests if Ornament style injection touches shared window style sync helpers.
- [x] 5.5 Run Ornament contract autoTest coverage or document any environment blocker.
- [x] 5.6 Launch the implemented Ornament demo in the AVP simulator, wait 10 seconds after the app is running, and capture a screenshot for acceptance review.
- [x] 5.7 Record the AVP simulator screenshot path and any visible acceptance notes in the implementation handoff.
- Post-review acceptance screenshot: `.tmp/avp-acceptance/ornament-style-api-post-review-20260716-205037.png`; visible result shows the Ornament demo rendered with colored child webview content.
