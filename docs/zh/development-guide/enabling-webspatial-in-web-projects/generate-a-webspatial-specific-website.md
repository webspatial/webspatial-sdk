
# 生成 WebSpatial 专用网站

当前位于：[步骤 3：在 Web 构建工具中集成 WebSpatial SDK](step-3-integrate-webspatial-sdk-into-web-build-tools.md)

---

在当前 Web 项目的 [TS/JS 编译器]()、[Web 构建工具和 Web Server]() 中集成 [WebSpatial SDK]() 之后，当前项目就能在不影响原网站（面向桌面/移动平台和普通浏览器）的前提下，开始为 [WebSpatial App Shell]() 生成专用的 Web 构建产物——相当于一个专用网站，只在包含 WebSpatial App Shell 的原生空间应用（比如用 [WebSpatial Builder]() 打包生成的 [Packaged WebSpatial App]()）中加载和运行，能跟应用中的原生实现紧密结合，实现由 Web 代码控制、基于 Web 渲染结果的空间化能力。

## 模拟器调试阶段

> 以下示例代码都[基于 Vite]()

### 运行普通 Dev Server

执行 Web 项目自带的 `dev` 脚本，运行 Dev Server 得到的网站，默认是面向桌面/移动平台等非 XR 平台和普通浏览器（包括 XR 平台中的默认浏览器，比如 visionOS 中的 Safari）。

```shell
pnpm dev
```

- 生成的 HTML/CSS/JS 产物中不会包含 WebSpatial SDK 的实现，源代码中所有 [WebSpatial API]() 都会被移除或忽略
- 不适合在 WebSpatial App Shell 中加载和测试（没有空间化的效果）

### 运行专用 Dev Server

想要生成专门面向 visionOS 中 WebSpatial App Shell 的网站，需要在执行 `dev` 脚本时，把 WebSpatial SDK 中自带的环境变量 `$XR_ENV` 设成 avp，运行专用的 Dev Server：

```shell
XR_ENV=avp pnpm dev
```

- 生成的 HTML/CSS/JS 产物中会包含 WebSpatial SDK 的实现
- 为了保证 HTML/CSS 产物能在不支持 [WebSpatial API]() 的常规 Web Runtime（比如系统默认 WebView）中正常运行，HTML/CSS 源代码中的 WebSpatial API 都会被移除或忽略，转换成 JS 产物中的[非标准 JS Bridge API]() 调用
- 为了跟分发阶段保持一致，同时兼顾调试阶段的开发效率，运行这种 Dev Server 后生成的 URL，会默认加上额外的 base 部分——`/webspatial/avp/`
> 比如：如果先运行面向桌面/移动平台的 Dev Server，URL 是 `http://localhost:3000`，然后再运行面向 visionOS 的 Dev Server，URL 默认会是 `http://localhost:3001/webspatial/avp/`，端口自动 +1，同时 base 部分自动加上 `/webspatial/avp/`。
- 如果当前项目自定义了 base，面向 WebSpatial 的 Dev Server 就不会自动添加 `/webspatial/avp/`
> 比如：如果在 `vite.config.js` 里自定义了 base：
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
> 先运行面向桌面/移动平台的 Dev Server，URL 是 `http://localhost:3000/my-project/`，然后再运行面向 visionOS 的 Dev Server，URL 默认会是 `http://localhost:3001/my-project/`，只是端口自动 +1。
- 只适合在 WebSpatial App Shell 中加载和测试，不适合在普通浏览器（比如本地电脑上的 Chrome）里测试（缺少了原生 App Shell，UI 效果会不正常）

### 使用专用 Dev Server

要在 visionOS 模拟器中使用这个专用 Dev Server，需要结合 [`webspatial-builder run` 命令]()（或 [`run:avp` 脚本]()），打包生成一个 visionOS 应用，自动推送到 visionOS 模拟器里安装。

必须把这个专用 Dev Server 生成的 URL 作为 [`run` 命令的 `--base` 参数]()（或 [`run:avp` 脚本使用的环境变量 `$XR_DEV_SERVER`]()），替换 Web App Manifest 中 [`start_url`]() 原本的 base。

> [!TIP]
> 在 `run` 阶段，如果[没有提供 Web App Manifest 或 `start_url`]()，默认会以 `/` 作为应用的起始网址。
> 在这种情况下，使用 `--base` 之后，起始网址跟跟专用 Dev Server 启动时打印出来的网址是完全一样的。

比如，直接运行 `run` 命令：

```shell
npx webspatial-builder run --base=http://localhost:3001/webspatial/avp/
```

或运行 `run:avp` 脚本：

```shell
XR_DEV_SERVER=http://localhost:3001/webspatial/avp/ pnpm run:avp
```

> [!TIP]
> 最佳实践：给这个专用 Dev Server 添加一个 npm script，比如：
> ```json5
> "dev": "vite",
> "dev:avp": "XR_ENV=avp vite",
> ```

应用在 visionOS 模拟器中启动后会自动加载这个专用 Dev Server 的 URL。

前文介绍过这个 URL 中的 `/webspatial/avp/` 是默认会自动添加的 base 部分，除了起始网址，所有构建产物中所有经过 Web 构建工具处理的 URL（比如静态 Web 文件的 URL），都会自动在 base 部分加上 `webspatial/avp/`。比如：

```html
<link rel="icon" href="/webspatial/avp/favicon.ico" sizes="any"/>
<link rel="apple-touch-icon" href="/webspatial/avp/icons/apple-touch-icon.png"/>
<script type="module" crossorigin src="/webspatial/avp/assets/index-CpANHSXr.js"></script>
<link rel="stylesheet" crossorigin href="/webspatial/avp/assets/index-B4Bp50KL.css">
```

而对于网页链接，需要手动加上 base 部分。

在 JS 代码里可以通过 [`__XR_ENV_BASE__`]() 获取这段 base 的字符串。

```jsx
 <button
   onClick={() => {
     window.open(`${__XR_ENV_BASE__}/second-page`, "secondScene");
   }}>
```

如果像快速示例一样使用了客户端路由，可以通过实现客户端路由的 JS 库，统一提供这个 base 配置。

以 `react-router-dom` 为例，只需要在作为根组件的 `<Router>` 上统一配置 `basename`：

```jsx
  return (
    <Router basename={__XR_ENV_BASE__}>
      <Routes>
```

这种情况下，在 JSX 里最好避免直接使用 `<a>` 元素和调用 `window.open` 这样的底层 API，而是统一用 `react-router-dom` 提供的 `<Link />` 组件，可以省略 `basename`：

```jsx
                  <Link to="/second-page" target="_blank">
                    Open Second Page with a Link
                  </Link>
```

## 真机测试阶段和分发阶段

在这个阶段，不能继续使用本地的 Dev Server，需要把网站部署到服务器端，生成能在他人的真机设备上直接访问的 URL。

> 以下示例代码都[基于 Vite]()

### 多 Web Server 模式

最快捷方便的方法，是继续像基于模拟器的开发调试环节那样，运行两个 Web 服务，绑定不同的域名。

这两个 Web 服务需要分别部署，各自执行不同的构建和部署流程。

其中一个 Web 服务继续提供面向桌面/移动平台和普通浏览器的网站版本。

```shell
pnpm build
pnpm preview
```

- 生成的 HTML/CSS/JS 产物中不会包含 [WebSpatial SDK]() 的实现，源代码中所有 [WebSpatial API]() 都会被移除或忽略
- 不适合在 [WebSpatial App Shell]() 中加载和测试（没有空间化的效果）

另一个 Web 服务提供专门面向 visionOS 中 WebSpatial App Shell 的网站版本。构建和启动时需要把 WebSpatial SDK 中自带的环境变量 `$XR_ENV` 设成 `avp`。

```shell
XR_ENV=avp pnpm build
XR_ENV=avp pnpm preview
```

产物目录（比如 `/dist`）的 `webspatial/avp/` 路径里，是专门面向 visionOS 中 WebSpatial App Shell 的网站产物。

- 生成的 HTML/CSS/JS 产物中会包含 WebSpatial SDK 的实现
- 为了保证 HTML/CSS 产物能在不支持 WebSpatial API 的常规 Web Runtime（比如系统默认 WebView）中正常运行，HTML/CSS 源代码中的 WebSpatial API 都会被移除或忽略，转换成 JS 产物中的[非标准 JS Bridge API]() 调用
- 只适合在 WebSpatial App Shell 中加载和测试，不适合在普通浏览器（比如本地电脑上的 Chrome）里测试（缺少了原生 App Shell，UI 效果会不正常）
- 起始网址，以及构建产物中所有经过 Web Builder 处理的 URL（比如静态 Web 文件的 URL），都会自动在 base 部分加上 `webspatial/avp/`。比如：
```html
<link rel="icon" href="/webspatial/avp/favicon.ico" sizes="any"/>
<link rel="apple-touch-icon" href="/webspatial/avp/icons/apple-touch-icon.png"/>
<script type="module" crossorigin src="/webspatial/avp/assets/index-CpANHSXr.js"></script>
<link rel="stylesheet" crossorigin href="/webspatial/avp/assets/index-B4Bp50KL.css">
```
- 跟使用[专用 Dev Server]() 一样，需要给网页链接手动加上 base 部分，如果使用了客户端路由，可以通过实现客户端路由的 JS 库，统一提供这个 base 配置。

如果想直接用不同域名来区分这两个网站版本，都用 `/` 作为 base，省去 `webspatial/avp/`，可以做以下配置:

- 让构建产物始终生成在 `dist/` 根目录下
- 把 base 设置成不同域名
- 只要当前项目自定义了 base，WebSpatial SDK 就不会自动添加 `/webspatial/avp/`

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

### 单 Web Server 模式

另一种方案，是用同一个 Web 服务，同时提供面向桌面/移动平台和普通浏览器的网站版本，和专门面向 visionOS 中 [WebSpatial App Shell]() 的网站版本，避免额外的部署流程、占用域名和服务器资源等。

在这种情况下，需要连续先后执行两遍 Web 项目自带的 `build` 脚本。

- 第一遍生成原有的面向桌面/移动平台和普通浏览器的 HTML 和静态 web 文件
- 第二遍加上 `XR_ENV` 环境变量，生成专门面向 visionOS 中 WebSpatial App Shell 的 HTML 和静态 web 文件。

> [!IMPORTANT]
> 第二遍 `build` 会被 WebSpatial 插件自动设置为不删除第一遍 build 的产物，只是把第二遍的产物累加在原有的产物里

```shell
pnpm build && XR_ENV=avp pnpm build
```

最佳实践：合并成 npm scripts 中同一个 build 脚本，比如：
```shell
"build": "vite build && XR_ENV=avp vite build",
```

生成产物的位置首先由 Web 构建工具原本的默认值和自定义配置来决定。

比如 Vite 的产物默认都在 `dist/` 目录下，可以通过 `build.outDir` 修改这个路径：

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

生成产物的示例：

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

- 产物目录的根路径下，是面向桌面/移动平台和普通浏览器的网站产物
- 根路径下的 `webspatial/avp/` 目录里，是专门面向 visionOS 中 WebSpatial App Shell 的网站产物
上面产物示例中，`web-dist/webspatial/avp/static/` 里的 `index.js` 和 `web-dist/static/` 里的 `index.js` 被计算出了不同的后缀，这是因为两者的内容不同，前者包含 WebSpatial SDK。
- `webspatial/avp/` 目录的构建产物中，所有经过 Web 构建工具处理的 URL（比如静态 Web 文件的 URL），都会自动在 base 部分加上 `webspatial/avp/`

对于这样的构建产物，有两种使用方式：

1. 需要给 Web Server 配置路由逻辑，让 base 部分为 `/webspatial/avp/` 的 URL 请求都从 `web-dist/webspatial/avp/` 路径下读取 HTML 模版。
   - 如果采用这种方式，注意跟[专用 Dev Server]() 和[多 Web Server]() 模式一样，需要给网页链接手动加上 base 部分，如果使用了客户端路由，可以通过实现客户端路由的 JS 库，统一提供这个 base 配置。
2. 需要在 Web Server 的网页路由逻辑中，判断请求是否来自 visionOS 中的 WebSpatial App Shell（有特殊的 UserAgent），如果是，就读取 `dist/webspatial/avp` 目录下的 HTML 模版，否则读取 `dist/` 目录下的 HTML 模版。
  - 如果采用这种方式，需要在 Web 构建工具的配置中提供自定义 base，这时 WebSpatial SDK 不会自动添加 `/webspatial/avp/`。比如：
```diff
// vite.config.js
export default defineConfig({
+   base: 'https://myproject.com/'，
```

### 场景 1：用 Web 构建工具自带的 Static Web Server

> 以 vite、rsbuild / rspack 为例：

```shell
pnpm preview
```

适合采用[多 Web Server]() 的方案。
如果给这种 Static Web Server 增加自定义的路由逻辑（比如让  base 部分为 /webspatial/avp/ 的 URL 请求都从 dist/webspatial/avp/ 路径下读取 HTML 模版），也可以采用[单 Web Server]() 的方案。

### 场景 2：用 第三方的 Static Web 服务

> 比如 Vercel、Cloudflare Pages、Github Pages

跟「场景 1」相似，适合采用[多 Web Server]() 的方案。

以 Github Pages 为例，专门部署面向 WebSpatial 的网站版本：
```shell
npm install -D gh-pages
gh-pages -d dist/webspatial/avp
```

### 场景 3：用 Web 框架自带的支持 SSR 的 Dynamic Web Server

> 以 Next.js 为例：

```shell
pnpm start
```

在这种情况下，不是每个网页都有单独的 HTML 模版，构建产物中可能完全没有 HTML（比如 Next.js 默认使用内置的 HTML 模版）。无法通过不同 HTML 模版来区分网站的桌面/移动版本和 WebSpatial 版本。

因此适合[多 Web Server]() 的方案。

可以为 WebSpatial 版本专门部署一个不同的 SSR 服务，把静态 web 文件的 URL 根路径配置为 WebSpatial 专用文件的根路径（比如相同 CDN 中的子目录，或专用的 CDN 地址）

以 `next.config.js` 为例：
```js
module.exports = {
  assetPrefix: process.env.NODE_ENV === 'production'
    ? 'https://cdn.example.com/webspatial/avp'
    : '/static/webspatial/avp',
```

### 场景 4：用自建的 Dynamic Web Server

> 比如基于 NestJS 之类的 Node.js 服务器端框架

这种情况下，可以使用[单 Web Server]() 方案中的第二种构建产物使用方法：

在 服务器端的网页路由逻辑中，判断请求是否来自 visionOS 中的 WebSpatial App Shell（有特殊的 UserAgent），如果是，就读取 `dist/webspatial/avp` 目录下的 HTML 模版，否则读取 `dist/` 目录下的 HTML 模版。

---

下一节：[检查是否在 WebSpatial 模式下运行](check-if-running-in-webspatial-mode.md)
