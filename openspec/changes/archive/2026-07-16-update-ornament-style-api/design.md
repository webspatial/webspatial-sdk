## Context

The existing Ornament React component maps public props directly to core `OrnamentOptions` and portals children into the native-created Ornament webview body. Appearance is currently split between native host options (`width`, `height`, `cornerRadius`, `backgroundMaterial`) and the portal content's inherited page styles.

This follow-up narrows the React public API: Ornament remains an independent window-level component that does not participate in the parent page DOM tree or layout, but it should accept ordinary CSS through a `style` prop that is applied inside the Ornament webview.

## Goals / Non-Goals

**Goals:**

- Add a React `style?: CSSProperties` prop to `<Ornament />`.
- Apply `style` directly to the Ornament child webview `html` element so ordinary CSS affects Ornament content.
- Keep the Ornament child webview document root independent from the parent page `html` inline style and class.
- Derive the native host `backgroundMaterial` from `style['--xr-background-material']`.
- Keep `width`, `height`, and `cornerRadius` as explicit top-level Ornament props.
- Keep core/runtime/native Ornament protocol fields unchanged.
- Update the test-server demo and automated tests to exercise the public API shape.
- Validate the final user-visible behavior in the AVP simulator with a 10-second post-launch screenshot.

**Non-Goals:**

- Do not make Ornament participate in the parent document DOM tree or parent-page layout.
- Do not create a hidden parent-document probe to resolve computed styles.
- Do not parse CSS `width`, `height`, `borderRadius`, percentages, `calc(...)`, or shorthand forms for native host options.
- Do not rename `cornerRadius` to CSS `borderRadius`.
- Do not change native AVP/PicoOS protocol fields or Swift/Kotlin host behavior.

## Decisions

1. **Treat Ornament `style` as child-webview CSS, not parent-page layout**

   `style` will be applied to `windowProxy.document.documentElement` for the Ornament webview. The resulting structure is:

   ```text
   native Ornament webview(width, height, cornerRadius, material)
   └─ html(style)
      └─ body
         └─ React portal children
   ```

   This preserves Ornament's conceptual model: it is a native window-level container with portal content, not a DOM element in the parent page.

   Alternative considered: render a hidden parent-document probe and read computed styles like SpatialDiv. This was rejected because Ornament intentionally has no parent-page DOM host and should not introduce one solely for style resolution.

   Ornament-specific window preparation must not call the SpatialDiv-oriented `setOpenWindowStyle(...)`, because that helper copies the parent page `documentElement.style.cssText` into the child webview. Ornament may still synchronize parent head resources so application CSS rules are available in the child webview, but the child `html` inline style and class must be controlled by Ornament itself.

2. **Keep native host size and corner radius explicit**

   `width`, `height`, and `cornerRadius` stay as top-level React props and continue to flow into core `OrnamentOptions`. This avoids implying support for normal CSS layout semantics such as `auto`, `%`, `calc(...)`, containing blocks, `box-sizing`, `min/max-*`, or CSS border-radius shorthand parsing.

   Alternative considered: move `width`, `height`, and `cornerRadius` into `style`. This was rejected because it would require partial CSS layout emulation for a component that is not in the DOM layout tree.

3. **Move React-facing material styling to `--xr-background-material`**

   The React component will derive the core `backgroundMaterial` option from `style['--xr-background-material']`. The full `style` object is still injected into the child `html` element, including the custom property, so content CSS can observe the same value.

   Core normalization remains the source of truth for invalid material fallback. The React layer should pass the extracted value as an Ornament option and let core normalize it.

4. **Do not change core/runtime protocol**

   Core `OrnamentOptions`, `normalizeOrnamentOptions`, create protocol serialization, and `UpdateOrnament` command fields remain unchanged. The React component is responsible for translating the public `style` API into the existing normalized runtime options.

5. **Style updates must update both DOM and native host state**

   When `style` changes:

   - The child webview `html` inline style must be updated, removing keys that no longer exist.
   - If `style['--xr-background-material']` changes, the existing core Ornament instance must receive an update with the derived `backgroundMaterial`.
   - Existing async create guards must still apply so pending style/material changes are applied before add-to-scene and after creation races.

## Risks / Trade-offs

- **Risk**: Imperatively syncing a React `CSSProperties` object to `documentElement.style` can leave stale styles if removed keys are not tracked.
  - **Mitigation**: keep a ref of previously applied style keys and remove absent keys during each sync.
- **Risk**: Developers may expect CSS `width`, `height`, or `borderRadius` inside `style` to resize the native Ornament host.
  - **Mitigation**: keep docs/demo clear that host geometry uses top-level `width`, `height`, and `cornerRadius`; ordinary `style` affects only webview content.
- **Risk**: Removing the React `backgroundMaterial` prop is a breaking public API change.
  - **Mitigation**: update tests, demo, and migration notes. If release compatibility requires it, a temporary dev warning shim can be added, but the final API should prefer the CSS custom property.
- **Risk**: Applying style to `html` instead of a wrapper means some CSS properties behave differently than a normal React component root.
  - **Mitigation**: document that Ornament style targets the child webview document root and add tests for representative ordinary CSS properties and the material custom property.

## Migration Plan

1. Update React `OrnamentProps` to remove public `backgroundMaterial` and add `style?: CSSProperties`.
2. Update React Ornament implementation to extract material from `style`, sync style to the child `html`, and pass existing core options unchanged.
3. Update the Ornament test-server demo to set `--xr-background-material` through `style`.
4. Update React unit tests and contract tests.
5. Run focused React tests and Ornament autoTest coverage before implementation completion.
6. Launch the implemented Ornament demo in the AVP simulator, wait 10 seconds after the app is running, and capture a screenshot as the manual acceptance artifact.

## Open Questions

- Should one release keep a temporary `backgroundMaterial` compatibility shim with a development warning, or should the React prop be removed immediately because Ornament is still in active development?
