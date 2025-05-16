
# WebSpatial 特有概念

## WebSpatial App

当前的主流 Web 是平面的网页，在共享空间中只能作为纯 2D 应用，[不具备空间化 API 和利用 3D 空间的能力]()。

用 WebXR API 实现的 Web 内容，虽然能利用 3D 空间，但由于自己独立负责 XR 交互，并且依赖底层的 3D 图形 API（WebGL，以及未来会支持的 WebGPU）来独立绘制渲染自己的内容，无法被操作系统「理解」，因此目前无法成为[共享空间]()中的应用。

共享空间中的 2D 网页，一旦调起 WebXR 会话，就会接管和独占整个空间，替代原本的共享空间，无法跟其他应用共存，甚至也无法跟自身的 2D 网页窗口共存。

**WebSpatial App** 是一种[空间应用]()，支持[共享空间]()，同时继承主流 Web 原有的 API（比如 HTML/CSS、Web API），在此基础上新增必要的空间化 API（[WebSpatial API]()），结合这些新旧 API，可以像原生空间应用一样描述 2D 和 3D 混合的内容，这些内容能被操作系统理解，在共享空间中[统一渲染]()。

最理想的 WebSpatial 应用应该同时具备 Web 和原生应用的优点，既能继续像 Web 一样免安装的按需运行，用 URL 分享和直达应用中的内容和功能，也能像原生应用一样安装，跟操作系统紧密集成，能上架应用商店。

## WebSpatial API

这些新增的空间化 API，称作「WebSpatial API」。

为了避免跟主流 Web 割裂，继承已有的 Web 内容，WebSpatial 不是全新的、独立存在的 API，而是**从主流 Web 现有的 2D API 里扩展出来**。

在涉及 2D 内容的情况下，WebSpatial API 不创造新的 UI 元素，而是让现有的 HTML 元素[**直接空间化**]()。

在 3D 空间中给元素做定位的时候，WebSpatial API 在 X 轴和 Y 轴上复用[**原有的基于 CSS 的布局 API**]()（比如绝对定位、CSS Transform 等），只在[涉及 Z 轴的时候]()增加新的 CSS API。

WebSpatial API 增加了 HTML 原本没有的 [3D 内容容器元素]()，同时让这种元素的[使用方式跟 `<img>`、`<video>`、`<canvas>` 一样]()，能跟其他 2D 元素一起布局，在 3D 空间中定位时，也使用同样的空间化 API。

WebSpatial API 通过 `window.open`、`<a target="_blank">` 等原有的[新窗口 API]()，来管理空间应用的[场景容器]()。

## WebSpatial SDK

要在浏览器引擎里提供 [WebSpatial API]()，存在两方面的障碍：一方面需要先在 Web 标准社区和委员会里推进这些 API 的标准化工作，周期比较长，另一方面，在 visionOS 这样的平台里只能用系统默认的 WebView，没法定制浏览器引擎。

另一方面，虽然主流 Web 开发生态在最底层是基于 HTML/CSS 的，但大多数 Web 开发者**不会直接使用 HTML/CSS** 来实现 Web 应用，而是使用 **UI 框架乃至应用框架**，比如目前主流的 React，开发者会通过 React 的 JSX API 和组件化能力来使用 HTML，通过 TailwindCSS、PostCSS、CSS In JS 等 API 来使用 CSS。

因此，为了能够尽快在真实世界中实践、满足 Web 领域的紧迫需求，WebSpatial 项目在不修改浏览器引擎的前提下，先提供一套**面向 Web 框架（比如 React + Vite）的  WebSpatial SDK**，让 Web 开发者可以在 UI 框架的 HTML（JSX）和 CSS  API 中立刻开始使用 WebSpatial API。

这样的 Web 项目在通过 Web 构建工具（比如 Vite）做编译构建后，能得到**专门面向空间计算平台的 Web 代码**。
这些代码在**原生实现的 Native Spatial App（称作 WebSpatial App Shell）** 中通过 **Web Runtime（比如系统默认 WebView）** 加载和运行，通过 WebView 中注入的**非标准 JS Bridge API**，和 App Shell 之间互相通信，2D 内容仍然用 Web Runtime 渲染，而 2D 内容的空间化和 3D 内容则**由 App Shell 用原生方法实现**。

这种 **Hybrid 技术方案**让**标准 Web App（[PWA]()）** 从现在开始就可以具备跟原生空间应用一样的空间化能力和用户体验。

WebSpatial SDK 由两大部分组成。

一部分专门负责在 runtime 环节提供 WebSpatial API，为此提供了针对特定主流 Web 框架的 SDK，比如「[**React SDK**]()」 ，这种框架 SDK 是用更底层的「[**Core SDK**]()」（一套框架无关的纯 JS API 库）实现的。

另一部分是在编译环节使用的开发工具：由于需要依赖 WebSpatial App Shell 来提供空间化能力，WebSpatial SDK 提供 [**WebSpatial Builder**]()，可以打包生成面向特定空间计算平台的「**Packaged WebSpatial App**」——一种原生空间应用（比如 visionOS app）安装包，内部包含**针对这个平台的 WebSpatial App Shell**，会调用 Web Runtime（比如系统默认 WebView）来加载和运行前面提到的 Web 构建产物。这个安装包可以在空间计算平台的模拟器或真机设备上安装和独立运行，能上架应用商店。

> [!NOTE]
> WebSpatial Builder 也支持有些 WebSpatial 应用[把  Web 构建产物离线打包]()到原生应用安装包的内部，WebSpatial App Shell 会让 Web Runtime 从本地去加载这些 Web 文件。
> 在这种模式下，WebSpatial 应用没有部署在服务器端的标准网站，不具备跨平台、URL 分享等 Web 能力，只是借助了 Web 的开发者生态和开发方式。

如果提前安装了对应平台上的 **WebSpatial Browser 应用**（开发中），也可以不用打包、安装和上架应用商店，因为这个浏览器中内置了 WebSpatial App Shell，所以可以直接在这个浏览器里访问各个 WebSpatial App 的网址，获得空间化的使用体验。

![](../../assets/concepts/2-1.png)

---

下一节：[场景和空间布局](scenes-and-spatial-layouts.md)
