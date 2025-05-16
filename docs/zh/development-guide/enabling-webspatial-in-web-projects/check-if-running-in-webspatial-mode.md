
# 检查是否在 WebSpatial 模式下运行

当前位于：[步骤 3：在 Web 构建工具中集成 WebSpatial SDK](step-3-integrate-webspatial-sdk-into-web-build-tools.md)

---

上一节「[生成 WebSpatial 专用网站](generate-a-webspatial-specific-website.md)」介绍了，WebSpatial SDK 提供了自动的优化，可以自动让 Web 项目构建出两套网站产物，一套面向桌面/移动平台和普通浏览器，不含 [WebSpatial SDK]()，另一套面向 [WebSpatial App Shell]()，包含 WebSpatial SDK。

Web 开发者自己写的业务逻辑代码（包括 JS 和 CSS），也有可能包含专门针对 WebSpatial 应用的代码，比如：

- 跟普通网页界面差别很大的空间化 GUI
- WebSpatial 应用中特有的 3D 内容

参考示例项目：https://github.com/webspatial/sample-techshop

![image]()
![image]()

这些代码在面向桌面/移动平台和普通浏览器的网站版本中不应该生效，也不应该被包含在构建产物中。

要实现这种优化，需要有办法在 JS 和 CSS 中分辨：当前代码是在 WebSpatial 应用中运行，还是在普通网站中运行。

## 推荐的 JS 解决方案

[配置 Web 构建工具]()，让客户端 JS 能访问 WebSpatial SDK 中自带的环境变量 `$XR_ENV`。

> [!TIP]
> 在 Vite 里，可以直接用 `import.meta.env.XR_ENV` 访问 `$XR_ENV`，免配置。

也可以注入其他基于 `$XR_ENV` 的常量。

比如如果使用了客户端路由，最好注入一个 `__XR_ENV_BASE__` 常量：

```diff
// https://vite.dev/config/
export default defineConfig({
+ define: {
+   __XR_ENV_BASE__: process.env.XR_ENV
+     ? JSON.stringify(`/webspatial/${process.env.XR_ENV}`)
+     : undefined,
+ },
  plugins: [
```

> [!NOTE]
> [WebSpatial 的 Vite 插件]()会自动注入 `__XR_ENV_BASE__` ，以上配置可省略。

[「快速开始」示例]()中的使用案例：

```jsx
<Router basename={__XR_ENV_BASE__}>
```
```jsx
 <button
   onClick={() => {
     window.open(`${__XR_ENV_BASE__}/second-page`, "secondScene");
   }}>
```

## 推荐的 CSS 解决方案

### 适合标准化的方案

> [!WARNING]
> WebSpatial SDK 目前还没有支持这个 API

<details>

<summary>在 CSS 里，用 Media Query 匹配 space 模式的 Color Scheme：</summary>

在空间计算平台中，背景环境的颜色不统一，且随时会随视角和位置而变化，因此传统的白天/黑夜模式，在空间计算平台中是不生效的。

WebSpatial API 新增了一种叫 `space` 的 Color Scheme，只在 WebSpatial 应用中生效，适合用来实现专门针对 WebSpatial 应用的 CSS 代码。

```css
@media (prefers-color-scheme: space) {
```
</details>

### 目前可用的解决方案

配置 Web 构建工具，在 HTML 中注入 `$XR_ENV`。

> 以 Vite 为例

安装 `vite-plugin-html` 插件：

```shell
pnpm add -D  vite-plugin-html
```

修改 `vite.config.js`：

```diff
+import { createHtmlPlugin } from "vite-plugin-html";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
+   createHtmlPlugin({
+     inject: {
+       data: {
+         XR_ENV: process.env.XR_ENV,
+       },
+     },
+   }),
```

修改 HTML 模版，给 `<html>` 添加 `XR_ENV` 模式下特有的 `classname`：

```diff
+<%- XR_ENV === 'avp' ? `
+<html lang="en" class="is-spatial">
+ ` : `
  <html lang="en">
+   ` %>
```

在 CSS 里，把专门针对 WebSpatial 应用的 CSS 代码都写在 `html.is-spatial` 里

```css
html.is-spatial {
  .my-card {
```

---

下一章节：[使用 WebSpatial API](../using-the-webspatial-api/README.md)
