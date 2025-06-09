# Built on the Existing Web Ecosystem

Previous section: [Make the Web Spatial Too](make-the-web-spatial-too.md)

---

While the mainstream Web ecosystem is ultimately built on HTML/CSS, most Web developers **do not work directly with raw HTML/CSS** when creating applications. Instead, they rely on **UI frameworks or full-featured application frameworks**. React is currently the most popular choice - developers use HTML through React's JSX API and component-based architecture, and CSS through APIs such as TailwindCSS, PostCSS, or CSS-in-JS.

To quickly put the [WebSpatial API](../core-concepts/unique-concepts-in-webspatial.md#webspatial-api) into practice in the real world and meet the urgent needs of the Web ecosystem, the WebSpatial open-source project provides a **[WebSpatial SDK](../core-concepts/unique-concepts-in-webspatial.md#webspatial-sdk) designed for Web frameworks (for example, React + Vite)**. This lets Web developers immediately start using the WebSpatial API within their framework's HTML (JSX) and CSS APIs, **without waiting for browser engines to ship these capabilities**.

In its first release, WebSpatial SDK offers **out-of-the-box support for [React projects](../development-guide/web-projects-that-support-webspatial/README.md)**.

> [!NOTE]
> We hope to work with the community to add support for more UI frameworks in the future. WebSpatial also offers a **framework-agnostic Core SDK composed solely of pure JS APIs**, so developers can implement the WebSpatial API in other frameworks or import specific spatial features directly from the Core SDK.

You can call WebSpatial's [**HTML API**](../development-guide/using-the-webspatial-api/spatialize-html-elements.md) and [**DOM API**](../development-guide/using-the-webspatial-api/spatialize-html-elements.md#dom) directly inside React JSX:

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

You can also use WebSpatial's [**CSS API**](../development-guide/using-the-webspatial-api/spatialize-html-elements.md#css) in a React project together with TailwindCSS, PostCSS, Styled Components, and similar solutions:

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

You can use the **existing link element and window-related DOM APIs** in Web standards together with WebSpatial's new **[Scene Initialization](../core-concepts/scenes-and-spatial-layouts.md#scene-init) API** - to treat and manage [scenes within spatial apps](../core-concepts/scenes-and-spatial-layouts.md) as regular web page windows.


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

You can manage **app-level configurations** such as the WebSpatial app's [start scene](../core-concepts/scenes-and-spatial-layouts.md#start-scene), offline packaging, [native window UI](../core-concepts/scenes-and-spatial-layouts.md#scene-menu), and app icons by using the **[Web App Manifest](../development-guide/enabling-webspatial-in-web-projects/add-web-app-manifest.md) from the [PWA standard](../development-guide/enabling-webspatial-in-web-projects/prerequisite-become-a-minimal-pwa.md)**.


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

A Web project that integrates the WebSpatial SDK is still a **cross-platform website that conforms to Web standards**. Your existing development workflow, codebase, and best practices built on the mainstream Web ecosystem stay unchanged, and the UI, interactions, and performance on desktop and mobile platforms remain **unaffected**. The new WebSpatial APIs fit naturally alongside existing APIs and implementation methods, preserving cross-platform compatibility as well as your established development habits and mental models.

---

<a name="example-techshop"></a>
## Example - Techshop

Example project: <https://github.com/webspatial/sample-techshop>

The screenshots below show how this sample project looks on different platforms. Only the last screenshot runs as a [Packaged WebSpatial App](../core-concepts/unique-concepts-in-webspatial.md#webspatial-sdk) on visionOS and activates spatialized UI. All other screenshots show the project running directly in regular browsers that do **not** support the [WebSpatial API](../core-concepts/unique-concepts-in-webspatial.md#webspatial-api) (including Safari on visionOS).

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
