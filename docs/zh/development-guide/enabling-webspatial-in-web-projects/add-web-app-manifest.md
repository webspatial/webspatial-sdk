
# 添加 Web App Manifest

上一步：[添加图标文件](add-icon-files.md)

---

## 创建 Web App Manifest 文件

首先，在项目中创建 `public/manifest.webmanifest` 或 `public/manifest.json` 文件。

> [!TIP]
> 这两种文件在 Web 服务器上都需要被视作 JSON 文件，响应的 MIME 类型可以是任意 JSON 类型，比如 application/json，最推荐的是 application/manifest+json

由于 manifest 文件被放在 public 目录的根路径下，因此当网站的服务器启动之后，应该能通过类似 `https://www.myapp.com/manifest.webmanifest` 这样的 URL 访问这个 manifest。
> 类似 `robots.txt`、`favicion.ico` 这类静态文件的用法

Manifest 文件中最少要包含以下属性：

```json5
{
  "name": "My Awesome App",
  "start_url": "/",
  "display": "minimal-ui",
  "icons": [
    {
      "src": "/pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/pwa-1024x1024.png",
      "sizes": "1024x1024",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

> [!IMPORTANT]
> [添加图标文件](add-icon-files.md)章节包含图标的具体要求，也提供了现成可用的示例图标文件。
> 如果只需要生成应用在 visionOS 模拟器里安装和运行，可以完全省略 Manifest 文件，或不用在 Manifest 中包含以上所有属性，对于缺失的部分，[WebSpatial Builder]() 会自动补充（类似 placeholder）。

## Manifest 属性对 WebSpatial 应用的影响

### `start_url`

应用的入口，应用启动时默认加载哪个网址。这个属性既会决定 WebSpatial 应用默认的[「起始场景」（Start Scene）]()，也会**决定 WebSpatial 应用的打包方式**：

如果 `start_url` 是完整网址（包含 http 开头的域名），或通过 [`--base`]() 补充为完整网址，则打包出的应用中，不会包含网站文件（比如主流 Web 项目通过编译构建后生成到 `dist/` 目录里的文件），会在应用运行过程中**从服务器端按需加载**对应的网页 URL 和其他静态 web 文件。

如果 `start_url` 是相对地址，且不通过 [`--base`]() 补充为完整网址（比如 `--base` 的值不含域名），则打包出的应用中，会包含所有网站文件（比如 `dist/` 目录里的所有文件），实现**完全离线化**的应用，应用运行过程中会从包内按需获取对应的 HTML 和其他静态 web 文件。

### `scope`

应用的[网址范围]()。可选属性，默认为 `start_url` 相同路径下所有网页。

这个属性决定了在 WebSpatial 应用的使用过程中，哪些网址会在应用内打开（在当前[场景]()中跳转，或作为新场景打开），其余网址会在浏览器中打开。

### `display`

应用的显示模式。这个属性会决定 WebSpatial 应用的每个场景中原生的[场景菜单]()里，有哪些原生功能。

- **`minimal-ui`** - 如果配置成这种模式，场景菜单中会提供原生的导航功能，包括「后退」、「刷新」等按钮，场景内部的网页可以不用自己提供全面的导航功能（类似传统网站）。
- **`standalone`** - 如果配置成这种模式，场景菜单中不会包含「后退」等原生导航功能，只包含「查看网址」等最基础的原生功能，场景内部的网页需要完全靠自身来提供全面的导航功能（类似原生 App 的设计）。
- **`fullscreen`** - 如果配置成这种模式，默认不会显示场景菜单，相当于手机上的游戏应用的全屏模式（看不到设备电量和时间）
- **`tabbed`** - WebSpatial 应用不支持这种窗口上有标签栏的显示模式，在这种情况下，会自动 fallback 成  minimal-ui 模式
- **`browser`** - PWA 和 WebSpatial 应用都不支持这种显示模式

### `icons`

PWA 应用在安装中会用到的图标。[WebSpatial Builder]() 会通过这个属性查找符合空间计算平台要求的图标文件。

注意，最少要提供：
- 一个 `"purpose": "any"` 的图标（PWA 本身的要求）
- 一个 `"purpose": "maskable"` 的不小于 1024x1024 大小的图标（这是 [visionOS 应用对图标的要求]()）

> [!IMPORTANT]
> 其他没提到的 manifest 属性，在 WebSpatial 应用中暂时无效。

## 在 HTML 中链接 Web App Manifest

接下来，在**所有** HTML 文件（模版）的 `<head>` 里添加 manifest 的 URL：

> [!IMPORTANT]
> 按照 PWA 标准，所有属于这个 PWA 网站的 URL，HTML 中都必须用 `<link>` 标签提供这个 manifest 的 URL。否则无法识别出一个网页属于哪个 Web App。
> WebSpatial 应用也同样遵循这个要求，所有希望在 WebSpatial 应用中使用（而不是在浏览器里打开）的网页，都必须包含 manifest URL。

```html
<link rel="manifest" href="/manifest.webmanifest" />
```

> [!TIP]
> 如果你的 Web 项目隐藏了 HTML 模版文件，不能直接修改 HTML，那么一定会提供其他方式在 HTML 的 `<head>` 部分添加自定义的 `<link>` 标签。
> 以 rsbuild 为例，可以通过 `rsbuild.config.js` 修改它内置的默认 HTML 模版：
>```js
>  plugins: [pluginReact()],
>  html: {
>    tags: [
>      {
>        tag: "link",
>        attrs: { rel: "manifest", href: "/manifest.webmanifest" },
>      },
>    ],
>  },
> ```

## 借助工具自动添加 manifest

如果不想手动创建 manifest 文件和修改 HTML，有很多工具可以自动生成 Web App Manifest，自动注入到所有 HTML 里。

示例：在 Vite 项目中，可以用 VitePWA 插件

> [!NOTE]
> 在以下示例中，为了展示最简化的状态，关闭了 VitePWA 默认会启用的 Service Worker 相关功能，只添加 manifest

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      manifest: {
        name: "My Awesome App",
        start_url: "/",
        scope: "/",
        display: "minimal-ui",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-1024x1024.png",
            sizes: "1024x1024",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      injectRegister: false,
      devOptions: {
        enabled: true,
      },
    }),
  ],
});
```

---

下一步：[测试 PWA 可安装性](test-pwa-installability.md)
