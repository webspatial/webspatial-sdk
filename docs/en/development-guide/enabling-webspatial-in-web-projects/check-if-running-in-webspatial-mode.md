# Check If Running in WebSpatial Mode

Currently located in: [Step&nbsp;3: Integrate WebSpatial SDK into Web Build Tools](step-3-integrate-webspatial-sdk-into-web-build-tools.md)

---

The previous section, **[Generate a WebSpatial-Specific Website](generate-a-webspatial-specific-website.md)**, explained that WebSpatial SDK can automatically build two sets of site assets:

* One set targets desktop/mobile platforms and regular browsers and **does not** include the [WebSpatial SDK](#).
* The other set targets the [WebSpatial App Shell](#) and **does** include the WebSpatial SDK.

Your own application code (both JS and CSS) may also contain logic that is specific to WebSpatial apps, such as:

* Spatial GUI that differs greatly from a normal web UI
* 3D content unique to WebSpatial apps

> Example project: <https://github.com/webspatial/sample-techshop>
> | ![](../../../assets/concepts/3-12.png) | ![](../../../assets/concepts/3-13.png) |
> |:---:|:---:|

This code should **not** run and **must not** be bundled in the build aimed at desktop/mobile browsers.

To achieve this optimization, you need a reliable way—inside both JS and CSS—to know whether the code is running in a WebSpatial app or in a regular website.

## Recommended JS solution

Configure your web build tool so that client-side JS can read the built-in WebSpatial environment variable **`$XR_ENV`**.

> [!TIP]
> In Vite you can access it directly with `import.meta.env.XR_ENV`, no extra config needed.

You can also inject other constants derived from **`$XR_ENV`**.

For example, if you use client-side routing, it is best to inject a **`__XR_ENV_BASE__`** constant:

```diff
// https://vite.dev/config/
export default defineConfig({
+ define: {
+   __XR_ENV_BASE__: process.env.XR_ENV
+     ? JSON.stringify(`/webspatial/${process.env.XR_ENV}`)
+     : undefined,
+ },
  plugins: [
```

> [!NOTE]
> The [WebSpatial Vite plugin](#) automatically injects **`__XR_ENV_BASE__`**, so you can skip the manual config above.

See the usage example in the **[Quick Start](../quick-start/README.md)** guide.

```jsx
<Router basename={__XR_ENV_BASE__}>
```
```jsx
 <button
   onClick={() => {
     window.open(`${__XR_ENV_BASE__}/second-page`, "secondScene");
   }}>
```

## Recommended CSS solution

### A future standardizable approach

> [!WARNING]
> This API is **not** yet supported by WebSpatial SDK.

<details>
<summary>Use a media query in CSS to match the <code>space</code> color scheme:</summary>

On spatial-computing platforms the background environment color is unpredictable and changes with viewpoint and location, so the classic light/dark mode does not apply.

The WebSpatial API introduces a new color scheme called **`space`**, which is recognized only in WebSpatial apps. You can use it to target WebSpatial-specific CSS rules.

```css
@media (prefers-color-scheme: space) {
```
</details>

### A practical solution for now

Configure your web build tool so that **`$XR_ENV`** is injected into HTML.

> Example: Vite

1. Install the **vite-plugin-html** plugin.

```shell
pnpm add -D  vite-plugin-html
```

2. Update `vite.config.js`.

```diff
+import { createHtmlPlugin } from "vite-plugin-html";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
+   createHtmlPlugin({
+     inject: {
+       data: {
+         XR_ENV: process.env.XR_ENV,
+       },
+     },
+   }),
```

3. Modify the HTML template and add a class name that is only present when **`XR_ENV`** indicates spatial mode, for example on `<html>`.

```diff
+<%- XR_ENV === 'avp' ? `
+<html lang="en" class="is-spatial">
+ ` : `
  <html lang="en">
+   ` %>
```

In your CSS, wrap any WebSpatial-specific rules under `html.is-spatial`.

```css
html.is-spatial {
  .my-card {
```

---

Next chapter: [Using the WebSpatial API](../using-the-webspatial-api/README.md)
