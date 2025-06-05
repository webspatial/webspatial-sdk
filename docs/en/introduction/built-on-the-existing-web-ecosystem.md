# Built on the Existing Web Ecosystem

Previous section: [Make the Web Spatial Too](make-the-web-spatial-too.md)

---

While the mainstream Web ecosystem is ultimately built on HTML/CSS, most Web developers **do not work directly with raw HTML/CSS** when creating applications. Instead, they rely on **UI frameworks or even full-featured application frameworks**. React is currently the most popular choice: developers use HTML through React’s JSX API and component model, and CSS through APIs such as TailwindCSS, PostCSS, or CSS-in-JS.

To address pressing real-world needs without delay, the WebSpatial project provides a **[WebSpatial SDK](#) designed for Web frameworks (for example, React + Vite)**. This lets Web developers immediately start using the WebSpatial API within their framework’s HTML (JSX) and CSS APIs, without waiting for browser engines to ship these capabilities.

In its first release, WebSpatial offers **out-of-the-box support for [React projects](#) (compatible with Vite and other mainstream Web build tools)**.

> [!NOTE]
> Additional UI framework support will be added soon. WebSpatial also offers a **framework-agnostic Core SDK composed solely of pure JS APIs**, so developers can implement the WebSpatial API in other frameworks or import specific features directly from the Core SDK.

You can call WebSpatial’s [**HTML API**](#) and [**DOM API**](#) directly inside React JSX:

```diff
-             <div className="card count-card">
+             <div className="card count-card" enable-xr>
                <button onClick={() => setCount(count => count + 1)}>
                  count is {count}
                </button>
-               <p>
+               <p enable-xr>
                  Edit <code>src/App.tsx</code> and save to test HMR
                </p>
              </div>
```

<!-- TODO：补充 Model 的例子 -->

You can also use WebSpatial’s [**CSS API**](#) in a React project together with TailwindCSS, PostCSS, Styled Components, and similar solutions:

```diff
.count-card {
+   --xr-background-material: thick;
    position: relative;

    p {
+     --xr-background-material: transparent;
      position: absolute;
      bottom: -10px;
      left: 0;
      right: 0;
+     --xr-back: 20;
    }
  }
```

You can use the **existing link element and window-related DOM APIs** defined in Web standards—together with WebSpatial’s new **[Scene Initialization](#) API**—to treat [scenes in a spatial app](#) as browser windows and manage them accordingly.


```diff
                <p>
-                 <Link to="/second-page">
+                 <Link to="/second-page" target="_blank">
                    Open Second Page with a Link
                  </Link>
                </p>
                <p>
                  <button
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
                      window.open(
                        `${__XR_ENV_BASE__}/second-page`,
+                       "secondScene",
                      );
                    }}>
                    Open Second Page with a Button
                  </button>
                </p>
```

You can manage **app-level configurations** such as the WebSpatial app’s start scene, offline packaging, native window UI, and app icons by using the **[Web App Manifest](#) from the PWA standard**.


```json5
// public/manifest.webmanifest
{
  "name": "TechShop - Premium Tech Products",
  "start_url": "/",
  "scope": "/",
  "display": "minimal-ui",
+ "xr_main_scene": {
+   "default_size": {
+     "width": 1700,
+     "height": 1200
+   }
+ },
  "icons": [
    {
      "src": "/icons/icon-1024x1024.png",
      "sizes": "1024x1024",
      "type": "image/png",
      "purpose": "maskable"
```

A Web project that integrates the WebSpatial SDK is still a **cross-platform website that conforms to Web standards**. Your existing development workflow, codebase, and best practices built on the mainstream Web ecosystem stay unchanged, and the UI, interactions, and performance on traditional desktop and mobile platforms remain **unaffected**. The new WebSpatial APIs fit naturally alongside existing APIs and implementation patterns, preserving cross-platform compatibility as well as your established development habits and mental models.

---

Example project: <https://github.com/webspatial/sample-techshop>

The screenshots below show how this sample project looks on different platforms. Only the last screenshot runs as a [Packaged WebSpatial App](#) on visionOS and activates spatial UI. All other screenshots show the project running directly in browsers that do **not** support the [WebSpatial API](#) (including Safari on visionOS).

| Large Screen | Small Window |
|:---:|:---:|
| ![](../../assets//intro/techshop-desktop.png) | ![](../../assets//intro/techshop-small.png) |

| Phone | Tablet |
|:---:|:---:|
| ![](../../assets//intro/techshop-phone.png) | ![](../../assets//intro/techshop-pad.png) |

| visionOS Safari | WebSpatial |
|:---:|:---:|
| ![](../../assets//intro/techshop-safari.png) | ![](../../assets//intro/techshop-spatial.png) |

---

Next section: [If You Are a ___ Developer](if-you-are-a-developer.md)
