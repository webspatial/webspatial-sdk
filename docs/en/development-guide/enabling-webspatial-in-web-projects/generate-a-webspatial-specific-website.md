# Generate a WebSpatial-Specific Website

Current location: [Step 3 – Integrate WebSpatial SDK into Web Build Tools](step-3-integrate-webspatial-sdk-into-web-build-tools.md)

---

After integrating the [WebSpatial SDK](../../core-concepts/unique-concepts-in-webspatial.md#webspatial-sdk) into the project's [TS/JS compiler](./configure-js-ts-compiler.md) and [Web build tool & Web server](./add-optimizations-and-defaults-to-web-build-tools.md), your web project can produce a dedicated build for the [WebSpatial App Shell](../../core-concepts/unique-concepts-in-webspatial.md#webspatial-sdk), without affecting the original desktop/mobile site.

This build is essentially a standalone website that loads only inside a native spatial app ([Packaged WebSpatial App](../../core-concepts/unique-concepts-in-webspatial.md#webspatial-sdk)) containing the App Shell built with [WebSpatial Builder](./step-2-add-build-tool-for-packaged-webspatial-apps.md). Web code in this context can tightly cooperate with native parts of the app to deliver web-controlled spatial capabilities.

<a id="for-simulator"></a>
## During simulator debugging

> All examples below are [based on Vite](./add-optimizations-and-defaults-to-web-build-tools.md)

<a id="regular-dev-server"></a>
### Run the regular Dev Server

Run the project's `dev` script as usual. The served site targets desktop/mobile platforms and regular browsers (including the default browser on XR platforms, such as Safari on visionOS).

```shell
pnpm dev
```

- The HTML/CSS/JS output does NOT include WebSpatial SDK; all [WebSpatial API](../../core-concepts/unique-concepts-in-webspatial.md#webspatial-api) calls are removed or ignored.
- Unsuitable for loading in the WebSpatial App Shell (no spatial effects).

<a id="dedicated-dev-server"></a>
### Run the dedicated Dev Server

To build specifically for the WebSpatial App Shell on visionOS, set the environment variable [`$XR_ENV`](./check-if-running-in-webspatial-mode.md) from the WebSpatial SDK  to `avp` when running `dev`.

```shell
XR_ENV=avp pnpm dev
```

> [!TIP]
> Best practice: add an npm script for this dedicated Dev Server. Like:
> ```json5
> "dev": "vite",
> "dev:avp": "XR_ENV=avp vite",
> ```

- The HTML/CSS/JS output does include WebSpatial SDK.
- To make sure the HTML/CSS works fine in regular browser engines that don't support the [WebSpatial API](../../core-concepts/unique-concepts-in-webspatial.md#webspatial-api) (like the default system WebView), all WebSpatial API calls in the HTML/CSS source are either removed or ignored and replaced with [non-standard JS Bridge API calls](../../core-concepts/unique-concepts-in-webspatial.md#webspatial-sdk) in the JS output.
- Only suitable for loading in the WebSpatial App Shell; not suitable for regular browsers like Chrome on your computer, since it lacks the WebSpatial App Shell and the web UI won't display correctly.
- The served URL automatically adds the base segment `/webspatial/avp/` to keep things consistent with the distribution phase while still making development efficient during debugging.
  > Example: the regular Dev Server runs at `http://localhost:3000`; the dedicated Dev Server for visionOS runs at `http://localhost:3001/webspatial/avp/`.
- If the project defines a custom base, `/webspatial/avp/` is not prepended.
  > Example:
  > ```diff
  > // vite.config.js
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
  >  URLs for the regular and dedicated Dev Servers become `http://localhost:3000/my-project/` and `http://localhost:3001/my-project/`.

<a id="use-dedicated-dev-server"></a>
### Use the dedicated Dev Server

Combine the dedicated Dev Server with [`webspatial-builder run`](./step-2-add-build-tool-for-packaged-webspatial-apps.md#run) (or the [`run:avp` script](./step-2-add-build-tool-for-packaged-webspatial-apps.md#npm-scripts)) to package and install a visionOS app in the simulator.

> [!TIP]
> Pass the dedicated Dev Server URL as the [`--base` option (or `$XR_DEV_SERVER`) to replace the original `start_url` in the Web App Manifest](./step-2-add-build-tool-for-packaged-webspatial-apps.md#run).

```shell
npx webspatial-builder run --base=http://localhost:3001/webspatial/avp/
```

```shell
XR_DEV_SERVER=http://localhost:3001/webspatial/avp/ pnpm run:avp
```

Once the app starts in the visionOS simulator, it'll automatically load the URL from the dedicated Dev Server.

Because `/webspatial/avp/` is injected as the base segment, every Web-build-tool-processed URL automatically includes `webspatial/avp/`, for example:

```html
<link rel="icon" href="/webspatial/avp/favicon.ico" sizes="any"/>
<link rel="apple-touch-icon" href="/webspatial/avp/icons/apple-touch-icon.png"/>
<script type="module" crossorigin src="/webspatial/avp/assets/index-CpANHSXr.js"></script>
<link rel="stylesheet" crossorigin href="/webspatial/avp/assets/index-B4Bp50KL.css">
```

But when URLs appear within the JS logic, the web build tool won't automatically add that base part, you'll need to add it yourself.

In your JS code, you can use [`__XR_ENV_BASE__`](./check-if-running-in-webspatial-mode.md) to get that base string.

```jsx
 <button
   onClick={() => {
     window.open(`${__XR_ENV_BASE__}/second-page`, "secondScene");
   }}>
```

If you're using client-side routing like in the [Quick Example](../../quick-start#new-scene), you can set the base path centrally in the routing library so it's handled consistently.

Using `react-router-dom` as an example:

```jsx
  return (
    <Router basename={__XR_ENV_BASE__}>
      <Routes>
```

In this case, prefer `<Link />` over raw `<a>` tags or `window.open`, letting `react-router-dom` handle the base automatically:

```jsx
                  <Link to="/second-page" target="_blank">
                    Open Second Page with a Link
                  </Link>
```

<a id="for-real-device"></a>
## During device testing and distribution

At this stage you must deploy the site to a web server accessible from real devices.

> Examples below use [Vite](add-optimizations-and-defaults-to-web-build-tools.md).

<a id="multi-web-server"></a>
### Multi-Web-Server mode

The quickest and easiest way is to deploy two sites on different domains, just like [in the simulator debugging phase](#for-simulator).

One site serves the desktop/mobile version:

```shell
pnpm build
pnpm preview
```

- The HTML/CSS/JS output does NOT include WebSpatial SDK; all [WebSpatial API](../../core-concepts/unique-concepts-in-webspatial.md#webspatial-api) calls are removed or ignored.
- Unsuitable for loading in the WebSpatial App Shell (no spatial effects).

The second site serves the visionOS-specific version.

When building and starting it, you need to set the [`$XR_ENV`](./check-if-running-in-webspatial-mode.md) environment variable from the WebSpatial SDK to `avp`.

```shell
XR_ENV=avp pnpm build
XR_ENV=avp pnpm preview
```

The files in the `webspatial/avp/` path under the output folder (like `/dist`) are specifically for the WebSpatial App Shell on visionOS.

- The HTML/CSS/JS output does include WebSpatial SDK.
- To make sure the HTML/CSS works fine in regular browser engines that don't support the [WebSpatial API](../../core-concepts/unique-concepts-in-webspatial.md#webspatial-api) (like the default system WebView), all WebSpatial API calls in the HTML/CSS source are either removed or ignored and replaced with [non-standard JS Bridge API calls](../../core-concepts/unique-concepts-in-webspatial.md#webspatial-sdk) in the JS output.
- Only suitable for loading in the WebSpatial App Shell; not suitable for regular browsers like Chrome on your computer, since it lacks the WebSpatial App Shell and the web UI won't display correctly.

Under default settings:

- The starting URL, along with all Web-build-tool-processed URL will automatically get `/webspatial/avp/` added to the base. For example:
  ```html
  <link rel="icon" href="/webspatial/avp/favicon.ico" sizes="any"/>
  <link rel="apple-touch-icon" href="/webspatial/avp/icons/apple-touch-icon.png"/>
  <script type="module" crossorigin src="/webspatial/avp/assets/index-CpANHSXr.js"></script>
  <link rel="stylesheet" crossorigin href="/webspatial/avp/assets/index-B4Bp50KL.css">
  ```
- Just like when [using the dedicated Dev Server](#use-dedicated-dev-server), you need to manually add the base part to URLs in the JS logic. If you're using client-side routing, you can set this base path centrally through your routing library.

To use different domains to separate the two versions of the site and just use `/` as the base (skipping `webspatial/avp/`), configure as follows:

- Begin by configuring a custom base in the URL to differentiate the two site versions. With a custom base, WebSpatial SDK skips adding `/webspatial/avp/` automatically.
- Always output to the root directory of `dist/`.

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

<a id="single-web-server"></a>
### Single-Web-Server mode

Another option is to use a single web server to serve both the desktop/mobile version and the version for the WebSpatial App Shell in visionOS. This avoids extra deployment steps, domains, and server resource usage.

In this case, you'll need to run the project's build script twice, one after the other.

1. First build: generates the usual HTML and static files for desktop, mobile, and regular browsers.
2. Second build: with [`XR_ENV=avp`](./check-if-running-in-webspatial-mode.md), generates the HTML and static assets specifically tailored for the WebSpatial App Shell in visionOS.

> [!IMPORTANT]
> During the second build, the WebSpatial plugin keeps the first build's files and appends new files.

```shell
pnpm build && XR_ENV=avp pnpm build
```

> [!TIP]
> Best practice: chain both builds in one npm script.
> ```json5
> "build": "vite build && XR_ENV=avp vite build",
> ```

Output location is set by the web build tool's defaults and custom config. For example, Vite puts build output in the `dist/` by default, you can change that with `build.outDir`.

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
- Within `webspatial/avp/`, all web-build-tool-processed URLs prepend `webspatial/avp/`.

Two serving approaches:

1. Configure the server so all web page requests with `/webspatial/avp/` as the base will read HTML files from the `dist/webspatial/avp/` directory.
   > In this case, just like with the [dedicated Dev Server](#use-dedicated-dev-server) or the [multi-web-server](#multi-web-server) mode, you'll need to manually add the base part to your web links in JS logic. If you're using client-side routing, you can set the base path centrally in the routing library for consistency.
2. Detect the [special User-Agent string of the WebSpatial App Shell](./check-if-running-in-webspatial-mode.md#ua). Serve HTML files from `dist/webspatial/avp` for those web page requests; otherwise serve from `dist/`.
   > In this case you'll need to set a custom base URL in your web build tool's config, then the WebSpatial SDK won't automatically add `/webspatial/avp/`.
   >
   > ```diff
   > // vite.config.js
   > export default defineConfig({
   > +  base: 'https://myproject.com/'，
   > ```

<a id="static-web-server"></a>
### Usage 1: Use built-in Static Web server from your web build tool

E.g. with [Vite or Rsbuild/Rspack](add-optimizations-and-defaults-to-web-build-tools.md):

```shell
pnpm preview
```

Best aligned with the [multi-Web-Server](#multi-web-server) approach.
With custom routing (mapping `/webspatial/avp/` requests to HTML files in `dist/webspatial/avp/` directory), the [single-Web-Server](#single-web-server) approach also works.

<a id="static-web-hosting"></a>
### Usage 2: Use third-party static web hosting

E.g. with Vercel, Cloudflare Pages, or GitHub Pages.

Similar to [Usage 1](#static-web-server) and suits the [multi-Web-Server](#multi-web-server) approach.

For GitHub Pages, deploy the WebSpatial version separately:

```shell
npm install -D gh-pages
gh-pages -d dist/webspatial/avp
```

<a id="ssr-server"></a>
### Usage 3: Use dynamic Web server with SSR

E.g. with Next.js:

```shell
pnpm start
```

Because in this case webpages share a single HTML template (or none), differentiating by template is impossible. The [multi-Web-Server](#multi-web-server) approach is recommended.

Deploy a dedicated SSR server for WebSpatial and set the root path for static web file URLs to point to the directory or CDN address where the WebSpatial-specific files are stored.

In `next.config.js`, for example:

```js
module.exports = {
  assetPrefix: process.env.NODE_ENV === 'production'
    ? 'https://cdn.example.com/webspatial/avp'
    : '/static/webspatial/avp',
```

<a id="dynamic-web-server"></a>
### Usage 4: Use self-hosted dynamic web server

E.g. with a Node.js server based on NestJS framework

Use the second serving option of the [single-Web-Server](#single-web-server) approach: detect the [WebSpatial App Shell's User-Agent string](./check-if-running-in-webspatial-mode.md#ua) and serve HTML files from `dist/webspatial/avp` directory, otherwise from `dist/` directory.

---

Next section: [Check if Running in WebSpatial Mode](check-if-running-in-webspatial-mode.md)
