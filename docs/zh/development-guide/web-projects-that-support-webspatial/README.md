
# 支持 WebSpatial 的 Web 项目

WebSpatial 目前采用 [Hybrid 技术方案]()，让主流 Web 项目能立刻使用 WebSpatial API，在空间计算平台上获得空间化能力。同时不影响这些项目在原有桌面/移动平台和现有浏览器里的使用，不影响原有的跨平台能力。

> [!NOTE]
> WebSpatial 已支持和计划支持的空间计算平台：
> - ✅ visionOS 设备（比如 Vision Pro）
> - ⏳ Android XR 设备（暂无真机设备，计划支持）
> - ⏳ Meta Quest / Horizon OS 设备（缺 API，计划支持）
> - ⏳ PICO（计划支持）

## 使用已存在的 Web 项目

满足以下要求的 Web 项目，目前都能开箱即用的使用 [WebSpatial API]()：

1. **现有 UI 实现是基于 React 和 Web 标准的，直接运行在主流浏览器引擎中**
   - 只需要[配置 jsx-runtime]()（不影响网站[在其他平台上的效果和性能]()），就能在 React 里使用 WebSpatial 中的 [HTML API（JSX）和 CSS API]()（支持包含 PostCSS、TailwindCSS、CSS In JS 在内的各种 CSS 开发方案）。
   - 在非 React 项目中，也可以直接使用 WebSpatial 的 [Core SDK]() 获得空间化能力（文档待补充）。
   - 后续本项目计划基于 Core SDK 为更多 Web 框架提供开箱即用的支持，欢迎参与。

2. **现有 UI 实现在多数情况下遵循 [React 的规范和最佳实践]()**
   - UI 代码是声明式的，描述 UI 状态而非直接用指令操作 UI，由 React 来控制 UI 和决定何时更新状态、何时渲染
   - UI 状态变更是基于单向数据流和不可变数据（数据总是从父组件传向子组件，不会被子组件直接修改）
   - 在 React 组件中会避免副作用，或用 React API 控制副作用（避免副作用在 React 渲染中执行）
   - 如果项目中存在绕过 React 渲染机制、直接使用 DOM API 实现的局部 UI，需要避免在这些 UI 上使用基于 React 的 WebSpatial API ，可能会有冲突

3. **Web 代码的编译构建基于以下主流 Web 构建工具方案**
   - Vite：只需要集成 WebSpatial 的 [Vite 插件]()
   - Next.js：只需要集成 WebSpatial 的 [Next.js 插件]()
   - Rsbuild：只需要集成 WebSpatial 的 [Rsbuild 插件]()
   - Rspack 或 Webpack：只需要基于 WebSpatial 提供的工具函数做[少量配置]()

4. **项目使用的 Web Server（包括第三方 Web 服务）具备主流能力，能控制 HTML 输出和静态 Web 文件**
   - 能为网站中所有 URL 都提供[专门在 WebSpatial 应用内部加载和运行的 HTML]()，这种 HTML 会加载 [WebSpatial App Shell]() 中专用的静态 Web 文件（比如包含 WebSpatial SDK 的 JS 文件）

如果你想在已有的 Web 项目中引入 WebSpatial API，把网站打包成 visionOS 应用获得空间化能力，可以跳过本章节，从以下章节开始：

- [在 Web 项目中启用 WebSpatial](../enabling-webspatial-in-web-projects/README.md)

## 创建全新的 WebSpatial 项目

如果你想开发全新的 Web 项目，从一开始就支持 WebSpatial，或是想创建全新的 demo 项目，用于试用和学习 WebSpatial API、体验 WebSpatial 应用，可以按照以下步骤，获得还未引入 WebSpatial API 的标准 Web 网站项目，作为项目的初始状态。

- [创建新的 Web 项目](creating-new-web-projects.md)
