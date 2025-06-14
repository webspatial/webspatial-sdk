<div align="center">
  <img src="../../assets/logo.png" alt="WebSpatial Logo" width="400"/>

</div>

# Quick Example

> Previous chapter: [What Is WebSpatial](../introduction/README.md)

Use a minimal example to get a quick feel for the actual results and development experience of the [WebSpatial SDK](../core-concepts/unique-concepts-in-webspatial.md#webspatial-sdk), covering project setup, SDK installation and configuration, a sample development workflow, and a preview of spatial features.

> [!IMPORTANT]
> - This is NOT a development guide.
> - To keep this example short and clear to quickly show real results, no explanations are given here.
> - To make sure everything runs properly, please follow each step exactly - many of them are absolutely essential.
> - This document includes detailed links, feel free to skip them for a quick example run.
> - After you have completed the demo, you can dive into [the real development guide](../development-guide/README.md).

> [!TIP]
> You can follow this doc to build the demo from scratch, or just grab the ready-made version from [the repo](https://github.com/webspatial/quick-example). You can also watch this [video](https://youtu.be/ddBBDBq7nhs) for a quick overview of everything in the doc.

<a id="create-project"></a>
## 1. Create a modern Web project that supports WebSpatial

First confirm that Node.js is installed (see the [Node.js official website](https://nodejs.org/en/download)).

Using a standard React + Vite + TypeScript project as an example, run the following commands to create the project:

```shell
npx create-vite --template react-ts
```

> [!TIP]
> See [what kinds of web projects are considered WebSpatial-supported](../development-guide/web-projects-that-support-webspatial/README.md) for details.

In the project root, install the dependencies:

```shell
npm install
```

<a id="install-sdk"></a>
## 2. Install the WebSpatial SDK

```shell
npm install --save @webspatial/react-sdk @webspatial/core-sdk @google/model-viewer three
npm install --save-dev @webspatial/builder @webspatial/platform-visionos @webspatial/vite-plugin vite-plugin-html
```

> [!TIP]
> See [which dependencies are installed](../development-guide/enabling-webspatial-in-web-projects/step-1-install-the-webspatial-sdk.md) for details.

<a id="web-build-tool"></a>
## 3. Integrate the WebSpatial SDK into the Web build tool (Vite)

First modify `tsconfig.app.json` and `tsconfig.node.json`, adding the configuration that [affects JSX compilation](../development-guide/enabling-webspatial-in-web-projects/configure-js-ts-compiler.md).

```diff
{
  "compilerOptions": {
+   "jsxImportSource": "@webspatial/react-sdk",
```

Then modify `vite.config.ts`:

- Add [WebSpatial's Vite plugin](../development-guide/enabling-webspatial-in-web-projects/add-optimizations-and-defaults-to-web-build-tools.md).
- Inject the [environment variable `$XR_ENV`](../development-guide/enabling-webspatial-in-web-projects/check-if-running-in-webspatial-mode.md) into HTML.

```diff
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
+import webSpatial from "@webspatial/vite-plugin";
+import { createHtmlPlugin } from "vite-plugin-html";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
+   webSpatial(),
+   createHtmlPlugin({
+     inject: {
+       data: {
+         XR_ENV: process.env.XR_ENV,
+       },
+     },
+   }),
  ],
});
```

Run [the Dev Server for desktop/mobile and other non-XR platforms](../development-guide/enabling-webspatial-in-web-projects/generate-a-webspatial-specific-website.md#regular-dev-server) (keep it running in the following steps):

```shell
npm run dev
```

![](../../assets/quick/1.png)

Open the URL shown in the terminal in a desktop browser such as Chrome to confirm everything works:

![](../../assets/quick/2.png)

Next, open a new terminal window (in the project root) and run another Dev Server to generate [web code specifically for WebSpatial](../development-guide/enabling-webspatial-in-web-projects/generate-a-webspatial-specific-website.md#dedicated-dev-server), used in the WebSpatial app on visionOS (keep it running in the following steps):

```shell
XR_ENV=avp npm run dev
```

![](../../assets/quick/3.png)

<a id="package-and-run"></a>
## 4. Package and run the WebSpatial app

Before using [the packaging tool for WebSpatial](../development-guide/enabling-webspatial-in-web-projects/step-2-add-build-tool-for-packaged-webspatial-apps.md), install Xcode and the visionOS simulator:

> Prerequisite: a Mac computer
> 1. Open the Mac App Store, search for "Xcode", and install it.
> 2. On first launch, agree to the license and enter the admin password to install additional components.
> 3. Click the top menu "Xcode" > "Settings…". In the "Components" tab, find visionOS and visionOS Simulator under "Platform Support", then install both.

Run the [development command (`run`)](../development-guide/enabling-webspatial-in-web-projects/step-2-add-build-tool-for-packaged-webspatial-apps.md#run) of the packaging tool:

```shell
npx webspatial-builder run --base=$XR_DEV_SERVER
```

> [!IMPORTANT]
> Replace `$XR_DEV_SERVER` with the URL generated by `XR_ENV=avp npm run dev` in the previous step.

The visionOS simulator will automatically launch, installs the [Packaged WebSpatial App](../core-concepts/unique-concepts-in-webspatial.md#webspatial-sdk), and runs it:

![](../../assets/quick/4.png)
![](../../assets/quick/5.png)

<a id="start-scene"></a>
## 5. Set initialization properties for the start scene

Create a incomplete Web App Manifest file (this only works with the `webspatial-builder run` command, you'll need to [complete it before running on a real device or distributing it](../development-guide/enabling-webspatial-in-web-projects/prerequisite-become-a-minimal-pwa.md)).

```shell
touch public/manifest.webmanifest
```

Set the [default size](../core-concepts/scenes-and-spatial-layouts.md#spatial-layout) for the [start scene](../core-concepts/scenes-and-spatial-layouts.md#start-scene) in [`xr_main_scene`](../development-guide/using-the-webspatial-api/manage-multiple-scenes.md#start-scene).

```json5
{
  "xr_main_scene": {
    "default_size": {
      "width": 500,
      "height": 1000
    }
  }
}
```

Run the `run` command of the WebSpatial Builder again. The app's start scene now appears with a mobile app style:

> [!WARNING]
> A current bug may leave the start scene blank after repackaging. If this happens, delete the app in the simulator, quit the simulator, then package and run again.
> If the issue persists, delete `node_modules` in the project and reinstall dependencies.

![](../../assets/quick/6.png)

<a id="new-scene"></a>
## 6. Add a new scene

First add a new page. In this demo we use client-side routing.

Create `src/SecondPage.tsx`.

```jsx
import { useState } from "react";
import "./App.css";

function SecondPage() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <h1>Second Page</h1>
      <div className="card">
        <button onClick={() => setCount(count => count + 1)}>
          count is {count}
        </button>
      </div>
    </div>
  );
}

export default SecondPage;
```

Add the following to `src/App.tsx`.

```jsx
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import SecondPage from "./SecondPage";
```

Install a library that supports client-side routing.

```shell
npm install --save react-router-dom
```

Move all existing JSX in `src/App.tsx` into the designated position in the new JSX:

```diff
  return (
+   <Router basename={__XR_ENV_BASE__}>
+     <Routes>
+       <Route path="/second-page" element={<SecondPage />} />
+       <Route
+         path="/"
+         element={
            /* Move all JSX from the App component in src/App.tsx into here */
+         }
+       />
+     </Routes>
+   </Router>
  );
```

> [!TIP]
> What is [`__XR_ENV_BASE__`](../development-guide/enabling-webspatial-in-web-projects/generate-a-webspatial-specific-website.md#use-dedicated-dev-server)?

The new page `/second-page` has been added:

![](../../assets/quick/7.png)

At the end of the existing content in `src/App.tsx` (below `<p className="read-the-docs">`), add a card containing:

- A link that always opens `/second-page` in a new window.
- A button that opens `/second-page` in a window with [the specified `name`](../development-guide/using-the-webspatial-api/manage-multiple-scenes.md#new-scene).

```diff
              <p className="read-the-docs">
                Click on the Vite and React logos to learn more
              </p>
+             <div className="card" style={{ marginTop: "0px" }}>
+               <h2>Open Second Page</h2>
+               <p>
+                 <Link to="/second-page" target="_blank">
+                   Open Second Page with a Link
+                 </Link>
+               </p>
+               <p>
+                 <button
+                   onClick={() => {
+                     window.open(`${__XR_ENV_BASE__}/second-page`, "secondScene");
+                   }}>
+                   Open Second Page with a Button
+                 </button>
+               </p>
+             </div>
```

Clicking the link or button opens a new [spatial-app scene](../core-concepts/scenes-and-spatial-layouts.md) that displays the content of `/second-page`:

![](../../assets/intro/intro-4-8.gif)

<a id="init-scene"></a>
## 7. Set initialization properties for the new scene

Import the [scene initialization](../core-concepts/scenes-and-spatial-layouts.md#scene-init) API from the WebSpatial SDK in `src/App.tsx`.

```jsx
import { initScene } from "@webspatial/react-sdk";
```

Before the scene named `"secondScene"` opens, initialize it:

```diff
                    onClick={() => {
+                     initScene("secondScene", prevConfig => {
+                       return {
+                         ...prevConfig,
+                         defaultSize: {
+                           width: 500,
+                           height: 500,
+                         },
+                       };
+                     });
                      window.open(`${__XR_ENV_BASE__}/second-page`, "secondScene");
```

Click the button and see that the [default size](../core-concepts/scenes-and-spatial-layouts.md#spatial-layout) of the `secondScene` scene changes:

![](../../assets/quick/9.png)

<a id="material-background"></a>
## 8. Add material backgrounds

Edit the `index.html` file to [add a special classname to the `<html>` element](../development-guide/enabling-webspatial-in-web-projects/check-if-running-in-webspatial-mode.md#css-solution) when this web code is executed as a WebSpatial app ([`XR_ENV` mode](../development-guide/enabling-webspatial-in-web-projects/generate-a-webspatial-specific-website.md)).


```diff
+<%- XR_ENV === 'avp' ? `
+<html lang="en" class="is-spatial">
+  ` : `
   <html lang="en">
+    ` %>
```

At the end of `src/index.css`, add code that sets the scene background in `XR_ENV` mode to a [fully transparent material](../development-guide/using-the-webspatial-api/add-material-backgrounds.md) (using `--xr-background-material` from the WebSpatial API):

```css
html.is-spatial {
  background-color: transparent;
  --xr-background-material: transparent;
}
```

> [!TIP]
> Although style changes take effect automatically via the Dev Server, but since the WebSpatial SDK doesn't yet support HMR for specific logic inside React components, you'll need to manually refresh the page (using the [scene menu](../core-concepts/scenes-and-spatial-layouts.md#scene-menu)) or restart the devServer to apply those changes.

| ![](../../assets/quick/10.png) | ![](../../assets/quick/11.png) |
| :----------------------------: | :----------------------------: |

Modify `src/App.tsx` to make both card elements ["spatialized HTML elements"](../core-concepts/spatialized-elements-and-3d-container-elements.md) by adding [a specific mark](../development-guide/using-the-webspatial-api/spatialize-html-elements.md), and give them different classnames. Spatialize the link inside `link-card` as well.

```diff
              <h1>Vite + React</h1>
-             <div className="card">
+             <div className="card count-card" enable-xr>
```

```diff
-             <div className="card">
+             <div className="card link-card" enable-xr>
                <h2>Open Second Page</h2>
                <p>
-                 <a href="/second-page" target="_blank">
+                 <a href="/second-page" target="_blank" enable-xr>
                    Open Second Page with a Link
                  </a>
```

In the [styles for `XR_ENV` mode](../development-guide/enabling-webspatial-in-web-projects/check-if-running-in-webspatial-mode.md#css-solution) in `src/index.css`, set [different translucent materials](../development-guide/using-the-webspatial-api/add-material-backgrounds.md#translucent-options) for the backgrounds of the two card elements and the link.

```css
html.is-spatial {
  background-color: transparent;
  --xr-background-material: transparent;

  .count-card {
    --xr-background-material: thick;
    position: relative;
  }

  .link-card {
    --xr-background-material: translucent;
    border-radius: 20px;
    position: relative;
    top: 20px;

    a {
      display: block;
      --xr-background-material: thick;
      border-radius: 10px;
    }
  }
}
```

| ![](../../assets/quick/12.png) | ![](../../assets/quick/13.png) |
| :----------------------------: | :----------------------------: |

<a id="elevation"></a>
## 9. 'Elevate' spatialized elements

Mark the description text inside `count-card` as a [spatialized HTML element](../core-concepts/spatialized-elements-and-3d-container-elements.md).

```diff
-               <p>
+               <p enable-xr>
                  Edit <code>src/App.tsx</code> and save to test HMR
                </p>
```

In the [styles for `XR_ENV` mode](../development-guide/enabling-webspatial-in-web-projects/check-if-running-in-webspatial-mode.md#css-solution) in `src/index.css`, change this element to `position: relative` and use the WebSpatial's [Z-axis positioning API (`--xr-back`)](../development-guide/using-the-webspatial-api/elevate-2d-elements.md) to 'elevate' it into 3D space in front of the web page plane. Also apply different levels of 'elevation' to the link elements spatialized earlier.

```diff
  .count-card {
    --xr-background-material: thick;
    position: relative;

+   p {
+     --xr-background-material: transparent;
+     position: absolute;
+     bottom: -10px;
+     left: 0;
+     right: 0;
+     --xr-back: 20;
+   }
  }

  .link-card {
    --xr-background-material: translucent;
    border-radius: 20px;
    position: relative;
+   --xr-back: 50;
    top: 20px;
```

| ![](../../assets/quick/14.png) | ![](../../assets/quick/15.png) |
| :----------------------------: | :----------------------------: |

Another way to 'elevate' is to [use CSS Transform](../development-guide/using-the-webspatial-api/elevate-2d-elements.md#css-transform), which can also [deform and rotate](../introduction/make-the-web-spatial-too.md#transform) in 3D space.

In the [styles for `XR_ENV` mode](../development-guide/enabling-webspatial-in-web-projects/check-if-running-in-webspatial-mode.md#css-solution) in `src/index.css`, move and rotate `link-card` along the Z axis (around the X axis):

```diff
  .link-card {
    --xr-background-material: translucent;
    border-radius: 20px;
    position: relative;
    --xr-back: 50;
    top: 20px;
+   transform-origin: top left;
+   transform: translateZ(30px) rotateX(30deg);
```

| ![](../../assets/quick/16.png) | ![](../../assets/quick/17.png) |
| :----------------------------: | :----------------------------: |

<a id="static-3d"></a>
## 10. Add static 3D content

> To be added

<a id="final-result"></a>
## Final result

The full source code for this demo is in the repository:
<https://github.com/webspatial/quick-example>

You can either follow the steps in this article to build an identical demo project from scratch, or just clone the repo and run it using the README instructions.

---

Next chapter: Learn more about WebSpatial's [Core Concepts](../core-concepts/README.md)
