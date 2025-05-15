
# 配置 JS/TS 编译器

当前位于：[步骤 3：在 Web 构建工具中集成 WebSpatial SDK](step-3-integrate-webspatial-sdk-into-web-build-tools.md)

---

为了能在 UI 框架（比如 React）中使用 [WebSpatial API]()，需要在 Web 项目使用 JS/TS 编译器中集成 WebSpatial 的框架 SDK（目前暂时只有 React SDK），让 SDK 能影响 JSX 转换等涉及 HTML/CSS API 的环节。

> [!IMPORTANT]
> 在面向桌面/移动平台和普通浏览器的构建产物中，SDK 不会生效，不会引入额外代码，不会带来效果和性能上的变化。见下文的「[生成 WebSpatial 专用网站](generate-a-webspatial-specific-website.md)」章节。

## TypeScript

以 React + TypeScript 项目为例，通常统一在 `tsconfig.json` 里集成 WebSpatial 的 React SDK：

```diff
{
  "compilerOptions": {
+   "jsxImportSource": "@webspatial/react-sdk",
```

> [!TIP]
> 如果 `tsconfig.json` 被拆分成面向客户端的 `tsconfig.app.json` 和面向 Node.js 的 `tsconfig.node.json`，两者都需要加上这段配置。

少数技术方案在 tsconfig 之上抽象了一层，需要通过这些方案自身的配置来影响 tsconfig。

比如 `@vitejs/plugin-react-swc`:

```diff
// vite.config.js
import { defineConfig } from "vite";
+import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [
    react({
+     "jsxImportSource": "@webspatial/react-sdk",
    })
  ],
});
```

## JavaScript

以 React + JavaScript 项目为例，JS 编译器通常被集成在 Web 构建工具里，需要通过 Web 构建工具的配置文件来集成 WebSpatial 的 React SDK。

比如 Vite：

```diff
// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
+     "jsxImportSource": "@webspatial/react-sdk",
    })
  ],
});
```

---
下一节：[在 Web 构建工具中集成优化和默认配置](add-optimizations-and-defaults-to-web-build-tools.md)
