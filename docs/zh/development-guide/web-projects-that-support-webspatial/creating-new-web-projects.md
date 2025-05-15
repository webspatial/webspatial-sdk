# 创建新的 Web 项目

> 也可以使用已存在的 Web 项目：[支持 WebSpatial 的 Web 项目](README.md)

---

## 现代 Web 项目的要素

要从零开始创建一个全新的 WebSpatial 项目，首先要创建一个现代的 Web 项目（暂时只支持 React 项目），具备以下要素：

- 能通过 UI 框架（比如 React）使用 HTML API（比如 JSX 语法）
- 能通过 UI 框架（比如 React）使用 CSS API（包括 [PostCSS、TailwindCSS]()、CSS In JS 等不同方案）
- 通过 npm 或兼容 npm 的包管理工具（比如 [pnpm]()）来管理项目的依赖
- 能编译构建出在桌面/移动浏览器里可直接运行的 HTML 和静态 web 文件（JS、CSS、图片等）
- 能运行 Web Server，生成能在桌面/移动浏览器直接加载访问的 URL

> [!TIP]
> 通常在开发调试环节使用自带编译构建能力的 Dev Server，用 npm script 中的 dev 命令运行。
> 在产品部署环节使用产品级的静态 Web 服务或动态 Web 服务器端，用 build 和 start 命令运行。

## 初始项目模版

以下是一些例子，你可以通过其中任一方式，创建具备这些要素的现代 Web 项目，作为引入 [WebSpatial SDK]() 之前的起始状态。

> 需要先确认 Node.js 已经安装，安装方法见 [Node.js 官网]()

### React + Vite

```shell
npx create-vite --template react
```

### React + Vite + TypeScript

```shell
npx create-vite --template react-ts
```

### React + Next.js
> [!CAUTION]
> 测试中，文档待补充

```shell
npx create-next-app --js
```

### React + Next.js + TypeScript
> [!CAUTION]
> 测试中，文档待补充

```shell
npx create-next-app --ts
```

### React + Rsbuild
> [!CAUTION]
> 测试中，文档待补充

```shell
npx create-rsbuild --template react
```

### React + Rsbuild + TypeScript
> [!CAUTION]
> 测试中，文档待补充

```shell
npx create-rsbuild --template react-ts
```

### React + Rspack
> [!CAUTION]
> 测试中，文档待补充

```shell
npx create-rspack --template react
```

### React + Rspack + TypeScript
> [!CAUTION]
> 测试中，文档待补充

```shell
npx create-rspack --template react-ts
```

## 添加其他常见功能（可选）

- [添加 TailwindCSS + PostCSS](adding-tailwindcss-and-postcss.md)
- [添加 pnpm](adding-pnpm.md)


---

下一步：[在 Web 项目中启用 WebSpatial](../enabling-webspatial-in-web-projects/README.md)
