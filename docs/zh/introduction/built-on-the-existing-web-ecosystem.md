
# 基于现有 Web 开发生态

上一节：[让 Web 也能空间化](make-the-web-spatial-too.md)

---

虽然主流 Web 开发生态在最底层是基于 HTML/CSS 的，但大多数 Web 开发者**不会直接使用 HTML/CSS** 来实现 Web 应用，而是使用 **UI 框架乃至应用框架**，比如目前最主流的 React，开发者会通过 React 的 JSX API 和组件化能力来使用 HTML，通过 TailwindCSS、PostCSS、CSS In JS 等 API 来使用 CSS。

为了能够尽快在真实世界中实践、满足 Web 领域的紧迫需求，WebSpatial 项目提供了一套**面向 Web 框架（比如 React + Vite）的  [WebSpatial SDK]()**，让 Web 开发者可以在 UI 框架的 HTML（JSX）和 CSS  API 中立刻开始使用 WebSpatial API，不用等待浏览器引擎提供这些 API。

在第一版里，WebSpatial **为 [React 项目]()提供了开箱即用的支持（[兼容 Vite 等主流的 Web 构建工具]()）**。

> [!NOTE]
> 后续会尽快增加对更多 UI 框架的支持。WebSpatial 目前也提供**框架无关的、由纯 JS API 组成的 Core SDK**，开发者也可以基于 Core SDK 自行在其他框架里实现 WebSpatial API 或引入个别能力。

可以在 React 的 JSX 中使用 WebSpatial 的 [**HTML API**]() 和 [**DOM API**]()：

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

可以在 React 项目中结合 TailwindCSS、PostCSS、Styled Components 等方案使用 WebSpatial 的 [**CSS API**]()：

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

可以用 Web 标准中**原有的链接元素和窗口相关 DOM API**，结合 WebSpatial 新增的**[场景初始化]() API**，把[空间应用中的场景]()作为网页窗口来管理：

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

可以用 [**PWA 标准中的 Web App Manifest**]() 来控制 WebSpatial 应用的起始场景、是否离线打包、窗口原生 UI、应用图标等**全局设置**：

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

接入 WebSpatial SDK 的 Web 项目，仍然是**符合 Web 标准的跨平台网站**，原有的基于主流 Web 开发生态的开发方式和代码都保持不变，在原有的桌面和移动平台上 UI、交互、性能也都[不受影响]()。新增的 WebSpatial API 能融入原有的 API 和实现方式，既不破坏跨平台兼容性，也不改变原有的开发模式、习惯和思考方式。

---

示例项目：https://github.com/webspatial/sample-techshop

下面这些截屏是这个示例项目在不同平台上的效果，只有最后这张截屏是作为 [Packaged WebSpatial App]() 在 visionOS 上的运行效果，启用了空间化的 UI，其他截屏都是在不支持 [WebSpatial API]() 的浏览器（包括 visionOS 上的 Safari）里直接运行的效果。

| 桌面大屏 | 小窗口 |
|:---:|:---:|
| ![](../../assets//intro/techshop-desktop.png) | ![](../../assets//intro/techshop-small.png) |

| 手机版 | 平板版 |
|:---:|:---:|
| ![](../../assets//intro/techshop-phone.png) | ![](../../assets//intro/techshop-pad.png) |

| visionOS Safari | WebSpatial |
|:---:|:---:|
| ![](../../assets//intro/techshop-safari.png) | ![](../../assets//intro/techshop-spatial.png) |

---

继续阅读下一节：[如果您是 ___ 开发者](if-you-are-a-developer.md)
