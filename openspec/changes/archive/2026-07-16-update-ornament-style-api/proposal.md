## Why

The React `<Ornament />` API currently exposes `backgroundMaterial` as a component prop, while similar WebSpatial styling uses the `--xr-background-material` CSS custom property. Aligning Ornament material styling with the CSS custom property model makes the React API more consistent without making Ornament participate in the parent DOM layout.

## What Changes

- Add `style?: React.CSSProperties` to the React `<Ornament />` public API.
- Apply `style` to the Ornament webview's child `html` element (`windowProxy.document.documentElement`) so ordinary CSS properties affect rendered Ornament content without adding a parent-document layout host.
- Derive the native Ornament host `backgroundMaterial` option from `style['--xr-background-material']`.
- Keep `width`, `height`, and `cornerRadius` as explicit top-level Ornament props because they configure the native Ornament host rather than parent-page DOM layout.
- **BREAKING (React API)**: replace the public `backgroundMaterial` prop with `style={{ '--xr-background-material': ... }}`. Core/native protocol options remain unchanged.
- Do not introduce a parent-document hidden probe or make Ornament participate in parent DOM layout.

## Capabilities

### New Capabilities

- `ornament-style-api`: React Ornament style API behavior, internal webview style injection, material CSS custom property mapping, and regression coverage.

### Modified Capabilities

_(none; the canonical OpenSpec specs in this repository do not yet include the original Ornament capability, so this follow-up is captured as a narrow new capability.)_

## Impact

- **Packages**:
  - `@webspatial/react-sdk`
  - `apps/test-server`
  - `tests/autoTest`
- **React API**:
  - `<Ornament />` accepts ordinary CSS through `style`.
  - `--xr-background-material` becomes the React-facing material styling entrypoint.
  - `width`, `height`, and `cornerRadius` stay as top-level props.
- **Runtime / native protocol**:
  - No change to `@webspatial/core-sdk` Ornament normalized options.
  - No change to create/update protocol fields consumed by native hosts.
- **Testing**:
  - Update React unit coverage for style injection and material derivation.
  - Update the Ornament test-server demo and contract tests to exercise the public API shape.
  - Validate the implemented demo in the AVP simulator by launching the app, waiting 10 seconds after the app is running, and capturing a screenshot for acceptance.
