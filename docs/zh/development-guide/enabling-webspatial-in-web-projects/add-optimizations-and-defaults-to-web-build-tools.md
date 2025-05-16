
# 在 Web 构建工具中集成优化和默认配置

当前位于：[步骤 3：在 Web 构建工具中集成 WebSpatial SDK](step-3-integrate-webspatial-sdk-into-web-build-tools.md)

---

除了「[配置 JS/TS 编译器](configure-js-ts-compiler.md)」，集成了 [WebSpatial SDK]() 的 Web 项目还要加入一些必要的性能优化和默认配置（「惯例优先于配置」），这些优化和配置需要基于项目中的 Web 构建工具和 Web Server 来实现。

如果当前项目用的是 Next.js、Vite、rsbuild 这样集成了 Web Builder 和 Web Server、抽象程度较高的主流工程方案，只需要在它们的配置里加入[对应的 WebSpatial 插件]()。这些开箱即用的插件可以免去自行配置的麻烦、减少项目中需要复制粘贴的样板代码。

如果当前项目是直接使用 rspack / webpack 这样更底层的 Web Builder 工具，可以基于本文档中的配置指南，手动集成这些优化和默认配置。

> [!NOTE]
> 具体包含哪些优化和默认配置，在后面的「[生成 WebSpatial 专用网站](generate-a-webspatial-specific-website.md)」和「[检查是否在 WebSpatial 模式下运行](check-if-running-in-webspatial-mode.md)」章节有相关说明。

## React + Vite

直接在 `vite.config.ts` 或 `vite.config.js` 里添加 WebSpatial 的 Vite 插件：

```diff
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
+import webSpatial from "@webspatial/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
+   webSpatial(),
    react({
```

## React + Next.js

> [!WARNING]
> 测试中，文档待补充

## React + Rsbuild

> [!WARNING]
> 测试中，文档待补充

## React + Rspack / Webpack

> [!WARNING]
> 测试中，文档待补充

## 不依赖插件的配置方法

> [!WARNING]
> 测试中，文档待补充

---

下一节：[生成 WebSpatial 专用网站](generate-a-webspatial-specific-website.md)
