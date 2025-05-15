
# 步骤 1：安装 WebSpatial SDK

上一步：[前置任务：成为（最简单的）PWA](prerequisite-become-a-minimal-pwa.md)

---

> [!TIP]
> 如果是[新创建的 Web 项目]，建议按照「添加 pnpm」里的步骤，把项目改成基于 pnpm，方便尝试下面的依赖安装（速度更快）

## 安装运行时环节的核心依赖

```shell
pnpm add @webspatial/react-sdk @webspatial/core-sdk @google/model-viewer three
```

### `@webspatial/react-sdk`

[WebSpatial SDK]() 中的 React SDK，让 [WebSpatial API]() 在 React 中开箱即用。

### `@webspatial/core-sdk`

React SDK、以及后续用于支持其他 Web 框架的 SDK，都是用 Core SDK 来实现的。Core SDK 是一套框架无关的、更底层的纯 JS API，在内部借助[非标准的 JS Bridge API 让 WebSpatial App Shell 用原生方式实现 2D HTML 内容的空间化和渲染 3D 内容]()。

> [!NOTE]
> `@google/model-viewer` 和 `three` 是 SDK 内部需要的依赖，由于包体较大、很多 Web 项目自身可能也要使用、后续 SDK 可能移除对它们的依赖，因此目前作为 SDK 的 peerDependencies，需要在 Web 项目中单独安装。

## 安装编译环节的核心依赖

```shell
pnpm add -D @webspatial/builder
```

### `@webspatial/builder`

WebSpatial 应用打包工具，把当前的 Web 网站变成 [Packaged WebSpatial App]()，是目前在 visionOS 上开发调试和分发 WebSpatial 应用必须的开发工具。

具体 API 见[步骤 2：添加 WebSpatial 应用打包构建工具](step-2-add-build-tool-for-packaged-webspatial-apps.md)。

### 安装编译环节可选的核心依赖

这种选装的依赖，是为了让 Web 项目选择自己需要支持的空间计算平台，避免引入不需要的平台依赖。

> [!NOTE]
> 以下依赖，在现阶段是必装的，因为 visionOS 是 WebSpatial 暂时唯一支持的空间计算平台

```shell
pnpm add -D @webspatial/platform-visionos
```

### `@webspatial/platform-visionos`

包含生成 visionOS 应用、提供空间化能力所需的 [WebSpatial App Shell]()。

#### 安装 Xcode 和 visionOS 模拟器

为了构建打包 visionOS 应用，在模拟器里调试，你还需要安装相应的全局依赖——Xcode 和 visionOS 模拟器。安装步骤：

> 前提：使用 Mac 电脑
1. 打开 Mac App Store，搜索「Xcode」，下载安装
2. 首次启动 Xcode，同意许可协议，输入管理员密码安装额外组件
3. 点击顶部菜单中的 「Xcode」 > 「Settings...」，打开设置面板。选择「Components」标签页，在「Platform Support」栏，找到 visionOS 和 visionOS Simulator，下载安装

## 安装编译环节的非核心依赖

这些依赖是针对第三方生态的支持，简化使用、加入一些[必要的性能优化和默认配置]()。

如果是 React + Vite 项目：

```shell
pnpm add -D @webspatial/vite-plugin
```

### `@webspatial/vite-plugin`

WebSpatial 的 Vite 插件，在由 Vite 提供 Web Builder 和 Web Server 的 Web 项目中加入一些必要的性能优化和默认配置。

如果是 React + Next.js 项目：

```shell
pnpm add -D @webspatial/next-plugin
```

### `@webspatial/next-plugin`

> [!WARNING]
> 测试中，文档待补充

如果是 React + rsbuild 项目：

```shell
pnpm add -D @webspatial/rsbuild-plugin
```

### `@webspatial/rsbuild-plugin`

> [!WARNING]
> 测试中，文档待补充

如果是 React + rspack 项目：

```shell
pnpm add -D @webspatial/rspack-plugin
```

### `@webspatial/rspack-plugin`

> [!WARNING]
> 测试中，文档待补充

如果是 React + webpack 项目：

> [!WARNING]
> 测试中，文档待补充

---

下一步： [步骤 2：添加 WebSpatial 应用打包构建工具](step-2-add-build-tool-for-packaged-webspatial-apps.md)
