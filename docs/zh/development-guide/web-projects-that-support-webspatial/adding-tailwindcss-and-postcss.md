# 添加 TailwindCSS 和 PostCSS

上一步：[创建新的 Web 项目](creating-new-web-projects.md)

---

TailwindCSS 是一个 Utility-first 的 CSS 框架，它提供了大量的原子类来帮助快速构建用户界面。
PostCSS 是一个用 JavaScript 转换 CSS 的工具，允许你使用未来的 CSS 特性。

安装依赖：

```bash
npm install -D tailwindcss postcss autoprefixer
```

运行以下命令生成 TailwindCSS 和 PostCSS 的配置文件：

```shell
npx tailwindcss init -p
```

会创建 `tailwind.config.js` 和 `postcss.config.js` 两个文件。

编辑 `tailwind.config.js` 文件，配置模板路径：

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

最后在 Web 构建工具里添加相关配置，比如如果使用 Vite，需要在 `vite.config.js` 中加入 TailwindCSS 的插件：

```js
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
```

---

下一步：
- [添加 pnpm](adding-pnpm.md)
- [在 Web 项目中启用 WebSpatial](../enabling-webspatial-in-web-projects/README.md)
