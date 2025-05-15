# 快速开始

> 上一章节：[WebSpatial 是什么](../introduction/README.md)

通过一个最简化的示例,快速上手 [WebSpatial SDK]()，包括项目搭建、SDK 安装和配置、开发流程示例、空间化能力预览等。

> [!IMPORTANT]
> 为了保持简短和一目了然、能快速体验实际效果，本文的内容都没做解释说明。
> 为了确保正确运行，请先严格按照每个步骤来操作（很多都是必不可少的）。
> 等完整体验了这个示例之后，可以再结合[开发指南]()（更完整的、面向真实项目的开发指南，包含全面的选项说明和解释）做更多尝试。
> 本文中很多内容也附带了包含具体解释和细节的链接，如果想快速尝试这个示例，可以先不看这些链接。

## 1. 创建一个支持 WebSpatial 的现代 Web 项目

先确定 Node.js 已经安装（安装方法见 [Node.js 官网]()）。

以标准的 React + Vite + TypeScript 项目为例，执行以下命令，创建项目：

```shell
npx create-vite --template react-ts
```

在项目的根目录下，安装依赖：

```shell
npm install
```

## 2. 安装 WebSpatial SDK

```shell
npm install --save @webspatial/react-sdk @webspatial/core-sdk @google/model-viewer three
npm install --save-dev @webspatial/builder @webspatial/platform-visionos @webspatial/vite-plugin vite-plugin-html
```

> [!TIP]
> [具体安装了哪些依赖]()

## 3. 在 Web 构建工具（Vite）中集成 WebSpatial SDK

首先修改 `tsconfig.app.json` 和 `tsconfig.node.json`，都加入以下能[影响 JSX 编译]()的配置：

```diff
{
  "compilerOptions": {
+   "jsxImportSource": "@webspatial/react-sdk",
```

然后修改 `vite.config.ts`：

- 添加 [WebSpatial 的 Vite 插件]()
- 在 HTML 中注入[环境变量 `$XR_ENV`]()

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

运行面向桌面/移动平台等非 XR 平台的 Dev Server（在后续步骤中始终保持运行）：

```shell
npm run dev
```

![image]()

在桌面浏览器（比如 Chrome）里打开终端中显示的 URL，确认效果正常：

![image]()

接下来，新建一个终端窗口（进入项目根目录下），同时运行另一个 Dev Server，生成 [WebSpatial 专用 Web 代码]()，用于 visionOS 平台上的 WebSpatial 应用（在后续步骤中始终保持运行）：

```shell
XR_ENV=avp npm run dev
```

![image]()

## 4. 打包和运行 WebSpatial 应用

在使用 [WebSpatial 的打包构建工具]()之前，需要先安装 Xcode 和 visionOS 模拟器。步骤：

> 前提：使用 Mac 电脑
1. 打开 Mac App Store，搜索「Xcode」，下载安装
2. 首次启动 Xcode，同意许可协议，输入管理员密码安装额外组件
3. 点击顶部菜单中的 「Xcode」 > 「Settings...」，打开设置面板。选择「Components」标签页，在「Platform Support」栏，找到 visionOS 和 visionOS Simulator，下载安装

运行 WebSpatial 应用打包工具的[开发调试命令]()：

```shell
npx webspatial-builder run --base=$XR_DEV_SERVER
```

> [!TIP]
> 把 `$XR_DEV_SERVER` 替换成上一步 `XR_ENV=avp npm run dev` 生成的 URL

visionOS 模拟器会被自动调起，自动安装打包出的 WebSpatial 应用，自动运行应用：

![image]()
![image]()

## 5. 设置起始场景的初始化属性

先创建一个内容不完整的 [Web App Manifest 文件]()（只适用于 `webspatial-builder run` 命令，[在真机运行和分发之前需要补充完整]()）：

```shell
touch public/manifest.webmanifest
```

在 `xr_main_scene` 里设置[起始场景]()的[默认大小]()：

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

重新运行前文介绍的 WebSpatial 应用打包工具（执行 `run` 命令），可以看到应用的起始场景变成手机应用的风格：

> [!WARNING]
> 目前存在 bug，可能导致有时在重新打包和运行后，应用的起始场景是空白，这时只要手动删除模拟器中的应用，退出模拟器，重新打包运行，就会正常。如果还不正常，可以删除当前项目的 node_modules 重装依赖。

![image]()

## 6. 添加新场景

先添加一个新页面。在本示例里，我们用客户端路由的方式来添加。

创建 `src/SecondPage.tsx`：

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

在 `src/App.tsx` 里添加：

```jsx
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import SecondPage from "./SecondPage";
```

安装能支持客户端路由的库：

```shell
npm install --save react-router-dom
```

把 `src/App.tsx` 中 App 组件原有的 JSX 内容全部放到下面这个新 JSX 的指定位置里：

```diff
  return (
+   <Router basename={__XR_ENV_BASE__}>
+     <Routes>
+       <Route path="/second-page" element={<SecondPage />} />
+       <Route
+         path="/"
+         element={
            /* 把 src/App.tsx 中 App 组件原有的 JSX 内容全部放到这里 */
+         }
+       />
+     </Routes>
+   </Router>
  );
```

> [!TIP]
> [什么是 `__XR_ENV_BASE__`]()

新增了页面 `/second-page`：

![image]()

在 `src/App.tsx` 中原有内容末尾（`<p className="read-the-docs">` 下面）新增一个 card，其中包含：

- 一个链接，始终在新窗口打开 `/second-page`
- 一个按钮，在指定 `name` 的窗口里打开 `/second-page`

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

点击链接或按钮，出现新的[空间应用场景]()，其中显示 `/second-page` 的内容：

![image]()

## 7. 设置新场景的初始化属性

在 `src/App.tsx` 里引入 WebSpatial SDK 的[场景初始化]() API：

```jsx
import { initScene } from "@webspatial/react-sdk";
```

在 `name` 为 `"secondScene"` 的场景被打开前，先对它做初始化：

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

点击按钮，可以看到 `secondScene` 场景的默认大小改变了：

![image]()

## 8. 添加材质背景

修改 `index.html`，给 `<html>` 添加 `XR_ENV` 模式下特有的 `classname`：

```diff
+<%- XR_ENV === 'avp' ? `
+<html lang="en" class="is-spatial">
+  ` : `
   <html lang="en">
+    ` %>
```

在 `src/index.css` 末尾添加以下代码，把 `XR_ENV` 模式下场景的背景，设置为[全透明材质]()（使用了 WebSpatial API 中的 [--xr-background-material]()）：

```css
html.is-spatial {
  background-color: transparent;
  --xr-background-material: transparent;
}
```

> [!TIP]
> 注意：虽然这里的修改可以通过 DevServer 自动生效，但由于 WebSpatial API 暂时还不支持 React 组件中具体逻辑的 HMR，所以如果有逻辑变动，需要手动刷新页面（通过右下角的场景菜单）或重启 devServer，才能看到改动生效

![image]()
![image]()

修改 `src/App.tsx`，把两个 card 元素[设置为「空间化 HTML 元素」]()，添加 `classname`。

把 link-card 中的链接也设置为「空间化 HTML 元素」。

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

在 `src/index.css` 的 []`XR_ENV` 模式专用样式]()里，把这两个 card 元素的背景设置成不同的[半透明材质]()，把 link-card 中嵌套的链接也设置为[不同的]()半透明材质背景：

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

![image]()
![image]()

## 9. 「抬升」空间化元素

把 `count-card` 中的说明信息设置为「`空间化 HTML 元素`()」：

```diff
-               <p>
+               <p enable-xr>
                  Edit <code>src/App.tsx</code> and save to test HMR
                </p>
```
在 `src/index.css` 的 [`XR_ENV` 模式专用样式]()里，把这个元素改成相对定位，用 WebSpatial API 中新增的 [Z 轴方向定位 API（`--xr-back`）]()，把它「抬升」到网页平面前方的 3D 空间中。

对于前面做过空间化的链接元素，也做不同程度的「抬升」。

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

![image]()
![image]()

另一种「抬升」方法是用 CSS Transform，不仅可以改变 3D 空间中 Z 轴上的定位，还可以[在 3D 空间中变形和旋转]()。

在 `src/index.css` 的 [`XR_ENV` 模式专用样式]()里，对 link-card 做一些 Z 轴方向上的移动和旋转（围绕 X 轴）：

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

![image]()
![image]()

## 10. 添加静态 3D 内容

> 待补充


## 最终效果

本示例的完整代码都在这个代码仓库里：
https://github.com/webspatial/quick-example

可以按照 README 运行起来，在 visionOS 的模拟器或真机设备上查看效果。


---

下一章节：进一步了解 WebSpatial 的[核心概念](../core-concepts/README.md)
