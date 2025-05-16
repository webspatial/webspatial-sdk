# Generate a WebSpatial-Specific Website

Current location: [Step 3 – Integrate WebSpatial SDK into Web Build Tools](step-3-integrate-webspatial-sdk-into-web-build-tools.md)

---

After integrating the [WebSpatial SDK]() into the project’s [TS/JS compiler]() and [Web build tool & Web server](), the site can—without affecting the original desktop/mobile site—produce a dedicated build for the [WebSpatial App Shell]. This build is essentially a standalone website that loads only inside a native spatial app containing the App Shell (for example, a [Packaged WebSpatial App]() built with [WebSpatial Builder]()). Web code in this context can tightly cooperate with native features to deliver spatial capabilities.

## Simulator debugging phase

> All examples below are [based on Vite]()

### Run the regular Dev Server

Run the project’s `dev` script as usual. The served site targets desktop/mobile browsers (including the default browser on XR platforms, such as Safari on visionOS).

```shell
pnpm dev
```

- The HTML/CSS/JS output **does not** include WebSpatial SDK; all [WebSpatial API]() calls are removed or ignored.
- Unsuitable for loading in the WebSpatial App Shell (no spatial effects).

### Run the dedicated Dev Server

To build specifically for the WebSpatial App Shell on visionOS, set the environment variable `$XR_ENV` to `avp` when running `dev`.

```shell
XR_ENV=avp pnpm dev
```

- The HTML/CSS/JS output **does** include WebSpatial SDK.
- To remain functional in runtimes without [WebSpatial API](), HTML/CSS calls are stripped or ignored and replaced by [non-standard JS Bridge API]() calls inside the JS output.
- The served URL automatically adds the base segment `/webspatial/avp/` and increments the port by 1.
> Example: the desktop/mobile Dev Server runs at `http://localhost:3000`; the visionOS Dev Server runs at `http://localhost:3001/webspatial/avp/`.
- If the project defines a custom base, `/webspatial/avp/` is *not* prepended.
> Example: with `base = '/my-project/'`, URLs become `http://localhost:3000/my-project/` and `http://localhost:3001/my-project/`.
> ```diff
> import { defineConfig } from 'vite'
> import vue from '@vitejs/plugin-react'
> import WebSpatial from "@webspatial/vite-plugin";
>
> export default defineConfig({
>   plugins: [
>     react(),
>     WebSpatial(),
>   ],
> + base: '/my-project/',
> })
> ```
- Only suitable for loading in the WebSpatial App Shell; regular browsers render incorrectly.

### Use the dedicated Dev Server

Combine the Dev Server with [`webspatial-builder run`]() (or the [`run:avp` script]()) to package and install a visionOS app in the simulator.

Pass the Dev Server URL as the [`--base` option]() (or `$XR_DEV_SERVER`) to replace the original [`start_url`]() in the Web App Manifest.

> [!TIP]
> If no manifest or `start_url` is provided during `run`, `/` is used by default. Adding `--base` makes the start URL identical to the Dev Server URL.

For example, just run the `run` command:

```shell
npx webspatial-builder run --base=http://localhost:3001/webspatial/avp/
```

or the `run:avp` script:

```shell
XR_DEV_SERVER=http://localhost:3001/webspatial/avp/ pnpm run:avp
```

> [!TIP]
> Best practice: add an npm script for this dedicated Dev Server. Like:
> ```json5
> "dev": "vite",
> "dev:avp": "XR_ENV=avp vite",
> ```

After launch, the simulator loads the Dev Server URL automatically.

Because `/webspatial/avp/` is injected as the base segment, every Web-build-tool-processed URL (for example static assets) automatically includes `webspatial/avp/`, for example:

```html
<link rel="icon" href="/webspatial/avp/favicon.ico" sizes="any"/>
<link rel="apple-touch-icon" href="/webspatial/avp/icons/apple-touch-icon.png"/>
<script type="module" crossorigin src="/webspatial/avp/assets/index-CpANHSXr.js"></script>
<link rel="stylesheet" crossorigin href="/webspatial/avp/assets/index-B4Bp50KL.css">
```

For in-page links, add the base manually.

In JS the base string is available through [`__XR_ENV_BASE__`]().

```jsx
 <button
   onClick={() => {
     window.open(`${__XR_ENV_BASE__}/second-page`, "secondScene");
   }}>
```

If client-side routing is used (e.g., `react-router-dom`), configure the router’s `basename` once on the root `<Router>`:

```jsx
  return (
    <Router basename={__XR_ENV_BASE__}>
      <Routes>
```

In JSX, prefer `<Link />` over raw `<a>` tags or `window.open`, letting `react-router-dom` handle the base automatically:

```jsx
                  <Link to="/second-page" target="_blank">
                    Open Second Page with a Link
                  </Link>
```

## Real-device testing & distribution phase

At this stage you must deploy the site to a server accessible from real devices.

> All examples below are [based on Vite]()

### Multi-Web-Server mode

The quickest path is to deploy two sites on different domains, mirroring the simulator workflow.

One site serves the desktop/mobile version:

```shell
pnpm build
pnpm preview
```

- WebSpatial SDK is **not** included; [WebSpatial API]() calls are stripped.
- Not suitable for the WebSpatial App Shell.

The second site serves the visionOS-specific version (build with `$XR_ENV=avp`):

```shell
XR_ENV=avp pnpm build
XR_ENV=avp pnpm preview
```

The files in the `webspatial/avp/` path under the output folder (like `/dist`) are specifically for the WebSpatial App Shell on visionOS.

- WebSpatial SDK **is** included.
- HTML/CSS calls are stripped or ignored and replaced by [non-standard JS Bridge API]() calls.
- Only suitable for the WebSpatial App Shell.
- All builder-processed URLs prepend `webspatial/avp/`.
```html
<link rel="icon" href="/webspatial/avp/favicon.ico" sizes="any"/>
<link rel="apple-touch-icon" href="/webspatial/avp/icons/apple-touch-icon.png"/>
<script type="module" crossorigin src="/webspatial/avp/assets/index-CpANHSXr.js"></script>
<link rel="stylesheet" crossorigin href="/webspatial/avp/assets/index-B4Bp50KL.css">
```
- Add the base manually to page links, or supply it via your routing library.

To simplify URLs, host each version on its own domain and keep `/` as base (disable the automatic `/webspatial/avp/`):

- Always output to the `dist/` root directory.
- Configure different `base` values per domain.
- If the current project defines a custom base, the WebSpatial SDK will not automatically append `/webspatial/avp/`.

```diff
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import WebSpatial from "@webspatial/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
+   base: process.env.NODE_ENV === 'production'
+     && (
+       process.env.XR_ENV !== 'avp'
+         ? 'https://myproject.com/'
+        : 'https://webspatial.myproject.com/'
      ) || ''
    build: {
      outDir: 'dist',
    },
    plugins: [
      WebSpatial({
+       outputDir: "",
      }),
      react(),
```

### Single-Web-Server mode

Alternatively, one Web server can publish both versions to reduce deployment overhead.

Run the project’s `build` script twice:

1. First build: desktop/mobile output.
2. Second build: with `XR_ENV=avp`, visionOS WebSpatial output.

> [!IMPORTANT]
> During the second build, the WebSpatial plugin keeps the first build’s files and appends new files.

```shell
pnpm build && XR_ENV=avp pnpm build
```

**Best practice**: chain both builds in one npm script.
```shell
"build": "vite build && XR_ENV=avp vite build",
```

Output location is set by the build tool’s defaults and custom config.

Vite, for instance, outputs to `dist/` by default (customizable via `build.outDir`):

```diff
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  build: {
+   outDir: 'web-dist',
    emptyOutDir: true,
    assetsDir: 'static',
  },
  plugins: [
```

Example output:

```
web-dist
├── favicon.ico
├── icons
│   ├── icon-1024-maskable.png
│   └── icon-512.png
├── index.html
├── manifest.webmanifest
├── static
│   ├── index-B4Bp50KL.css
│   └── index-xAPzJf4I.js
└── webspatial
    └── avp
        ├── favicon.ico
        ├── icons
        │   ├── icon-1024-maskable.png
        │   └── icon-512.png
        ├── index.html
        ├── manifest.webmanifest
        └── static
            ├── index-B4Bp50KL.css
            └── index-Bk-ZYFXx.js
```

- Root level: desktop/mobile files.
- `webspatial/avp/`: visionOS WebSpatial files (different hashes because the SDK is included).
- Within `webspatial/avp/`, all builder-processed URLs prepend `webspatial/avp/`.

Two serving approaches:

1. Configure the server so requests with base `/webspatial/avp/` read HTML from `dist/webspatial/avp/`.
   - As with the simulator Dev Server, manually add the base to links or supply it via your router.

2. Detect the special User-Agent of the visionOS WebSpatial App Shell. Serve HTML from `dist/webspatial/avp` for those requests; otherwise serve from `dist/`.
   - In this case you must configure a custom `base`; WebSpatial SDK will not auto-prepend `/webspatial/avp/`.
```diff
// vite.config.js
export default defineConfig({
+   base: 'https://myproject.com/'，
```

### Scenario 1: Static Web server bundled with the build tool

> Examples: Vite, rsbuild / rspack

```shell
pnpm preview
```

Best aligned with the [multi-Web-Server]() approach.
With custom routing (mapping `/webspatial/avp/` to `dist/webspatial/avp/`), the [single-Web-Server]() approach also works.

### Scenario 2: Third-party static hosting

> Examples: Vercel, Cloudflare Pages, GitHub Pages

Similar to Scenario 1 and suits the [multi-Web-Server]() approach.

For GitHub Pages, deploy the WebSpatial version separately:

```shell
npm install -D gh-pages
gh-pages -d dist/webspatial/avp
```

### Scenario 3: Dynamic Web server with SSR

> Example: Next.js

```shell
pnpm start
```

Because pages share a single HTML template (or none), differentiating by template is impossible. The [multi-Web-Server]() approach is recommended.

Deploy a dedicated SSR service for WebSpatial and point its static asset base to the WebSpatial-specific assets.

In `next.config.js`, for example:

```js
module.exports = {
  assetPrefix: process.env.NODE_ENV === 'production'
    ? 'https://cdn.example.com/webspatial/avp'
    : '/static/webspatial/avp',
```

### Scenario 4: Self-hosted dynamic Web server

> Example: a Node.js server based on NestJS

Use the second serving option of the [single-Web-Server]() approach: detect the visionOS User-Agent and serve from `dist/webspatial/avp`, otherwise from `dist/`.

---

Next section: [Check if Running in WebSpatial Mode](check-if-running-in-webspatial-mode.md)
