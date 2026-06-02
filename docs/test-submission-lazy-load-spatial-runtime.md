# React SDK lazy-load + eager 提测文档

## 1. 提测信息

| 项目 | 内容 |
| --- | --- |
| 提测分支 | `feat/eager-mode-entry` |
| PR | https://github.com/webspatial/webspatial-sdk/pull/1233 |
| 变更类型 | React SDK 架构调整，包含 BREAKING CHANGE |
| OpenSpec change | `lazy-load-spatial-runtime` |
| 主要影响包 | `@webspatial/react-sdk`、`@webspatial/core-sdk` |
| 主要验证对象 | React SDK 默认入口 lazy-load、`/eager` 入口、SSR / hydration、consumer fixtures、包体预算 |

## 2. 变更概述

本次变更将 React SDK 从旧的双构建模式（`dist/web` / `dist/default`）和 `@webspatial/vite-plugin` alias 模式，切换为新的运行时 lazy-load 架构。

- 默认入口 `@webspatial/react-sdk` 变为 web-first facade 入口。Plain web 和 SSR 场景只加载轻量 facade，不主动拉取 spatial 实现。
- WebSpatial 运行时需要通过 `bootSpatial()` 或 `<SpatialBoot>` 激活真实 spatial 实现。激活后再动态加载 `@webspatial/react-sdk/spatial` chunk。
- 新增 `@webspatial/react-sdk/eager` 入口，面向只运行在 WebSpatial 环境的 CSR 应用。该入口静态链接 spatial 实现，`bootSpatial()` 是 no-op stub。
- 移除旧子路径 `@webspatial/react-sdk/web` 和 `@webspatial/react-sdk/default`。
- 内部 container / monitor 不再作为公开 API 导出，用户应使用 JSX marker：`enable-xr`、`enable-xr-monitor`。
- `createElement` 标记为 deprecated，推荐迁移到 automatic JSX runtime。

## 3. 测试目标

本轮测试重点不是单个页面 UI 改动，而是确认 SDK 在不同消费形态下的入口选择、运行时激活、SSR 边界和包体约束都符合预期。

核心验收目标：

- Plain web 浏览器下默认入口不会请求 spatial chunk。
- WebSpatial / Puppeteer runtime 下调用 `bootSpatial()` 后会请求 spatial chunk，且只请求一次。
- 未调用 `bootSpatial()` 时，facade 组件渲染文档化 fallback，不应崩溃。
- 调用 `bootSpatial()` 成功后，facade 组件能切换到真实 spatial 实现。
- SSR 输出和客户端 hydration 无 mismatch。
- `@webspatial/react-sdk/eager` 可在 CSR-only spatial 应用中正常构建和运行。
- 默认入口的典型 gzip marginal delta 不超过 5 KB。
- 移除的 public API / legacy subpath 不再可用，迁移路径明确。

## 4. 影响范围

### 4.1 直接影响

- 使用 `@webspatial/react-sdk` 的 React 应用。
- 使用 `@webspatial/react-sdk/web` 或 `@webspatial/react-sdk/default` 的旧应用。
- 依赖 `@webspatial/vite-plugin` 切 SDK alias 的构建链路。
- 使用内部容器导出的业务代码，例如 `Spatialized2DElementContainer`、`SpatialMonitor`。
- SSR 应用：Next.js、React Router / Remix-style SSR。

### 4.2 间接影响

- `apps/test-server` 本地 demo 和自动化页面。
- `apps/spatial-vite-min`、`apps/spatial-next-min`、`apps/spatial-next-eager-min`、`apps/spatial-remix-min`、`apps/spatial-rspack-min` 这些 consumer-shaped fixtures。
- `tests/marginal-delta-vite` 包体预算测试。
- `tests/autoTest` 和 `tests/ci-test` 中依赖 WebSpatial runtime 行为的回归测试。

## 5. 推荐测试环境

| 环境 | 用途 |
| --- | --- |
| Plain Chrome / Chromium | 验证 plain web 不拉 spatial chunk、fallback 渲染、Vite fixture |
| Puppeteer harness | 验证 Puppeteer UA 被识别为空间运行时等价路径 |
| Apple Vision Pro simulator | 验证真实 AVP runtime 下 `bootSpatial()` 和 spatial 交互 |
| Node SSR 环境 | 验证 SSR / hydration 输出无 mismatch |
| Rspack / Vite / Next / React Router fixtures | 验证不同 bundler / framework 消费形态 |

## 6. 建议测试用例

### 6.1 默认入口 lazy-load

| 用例 | 步骤 | 预期 |
| --- | --- | --- |
| Plain web 首屏不加载 spatial chunk | 使用普通 Chrome 打开 `spatial-vite-min` 默认页面，观察 Network | 首屏只加载默认入口相关 chunk，不请求 `spatial` chunk |
| Plain web 调用 `bootSpatial()` | 在非 WebSpatial UA 下调用 `bootSpatial()` | Promise resolve，不请求 spatial chunk，不抛错 |
| WebSpatial runtime 调用 `bootSpatial()` | 在 AVP / Puppeteer runtime 下打开 lazy 页面 | `bootSpatial()` 触发 spatial chunk 请求，成功后 spatial 组件使用真实实现 |
| 重复调用 `bootSpatial()` | 同一页面多次调用或多个组件并发调用 | 共享同一次加载结果，不重复请求 spatial chunk |
| 加载失败后重试 | mock dynamic import 失败后再次调用 `bootSpatial()` | 首次返回 `WebSpatialBootError`，再次调用会发起新 attempt |

### 6.2 Facade fallback 与切换

| 用例 | 步骤 | 预期 |
| --- | --- | --- |
| `Model` fallback | 未 boot 前渲染 `<Model />` | 渲染 `<model>` fallback，过滤 spatial-only event props |
| `Reality` fallback | 未 boot 前渲染 `<Reality />` | 渲染单个 `aria-hidden="true"` 的 `div` host，不渲染 children |
| Entity / material / resource fallback | 未 boot 前渲染 Box / Sphere / Material / Texture 等 | 按 spec fallback 渲染或返回 `null`，不抛错 |
| boot 后切换真实实现 | WebSpatial runtime 下先 fallback，再 `bootSpatial()` 成功 | 下一次 React commit 后 facade 切换到真实实现 |
| 忘记 boot 的 dev warning | WebSpatial runtime dev 环境直接渲染 facade | 仅提示一次 warning；plain web 不提示 |

### 6.3 Hooks

| 用例 | 步骤 | 预期 |
| --- | --- | --- |
| `useSpatialReady()` plain web | Plain web 下调用 hook | 始终返回 `false`，不注册 bridge subscriber |
| `useSpatialReady()` spatial runtime | WebSpatial runtime 下调用 hook 并 boot | boot 前 `false`，boot 成功后变为 `true` |
| `useMetrics()` fallback | 未 boot 前调用 `useMetrics()` | 返回 placeholder：`pointToPhysical(1360) === 1`，`physicalToPoint(1) === 1360` |
| `useMetrics()` 生命周期固定 | 组件未 boot 前首次 mount，之后 boot 成功 | 该组件实例继续使用 placeholder；remount 后才使用真实 hook |

### 6.4 JSX marker

| 用例 | 步骤 | 预期 |
| --- | --- | --- |
| `enable-xr` marker | 渲染 `<div enable-xr />` | marker 被剥离，组件被 spatialized facade 包装 |
| `enable-xr-monitor` marker | 渲染 `<div enable-xr-monitor />` | marker 被剥离，组件被 monitor facade 包装 |
| class marker | 渲染包含 `__enableXr__` 的 `className` | class marker 被识别并剥离，保留其他 class |
| style marker | 渲染 `style={{ enableXr: true }}` | marker 被识别，原始 style 对象不被 mutate |
| `class` 属性不识别 | 使用 HTML 属性拼写 `class` 而非 `className` | 不识别为 marker |

### 6.5 Eager 入口

| 用例 | 步骤 | 预期 |
| --- | --- | --- |
| Eager CSR 构建 | 构建 `apps/spatial-vite-min` eager 页面或 `apps/spatial-next-eager-min` client island | 构建成功，spatial 实现静态进入 eager bundle |
| Eager `bootSpatial()` | 从 `@webspatial/react-sdk/eager` 调用 `bootSpatial()` | 立即 resolve，不做实际加载 |
| Eager 禁止 SSR spatial primitives | 在 SSR 页面直接服务端执行 eager spatial component | 应避免该用法；正确方式是 CSR gate |
| 禁止混用入口 | 同一 bundle 混用 default 与 eager import root | 不支持，应在测试结论中标记为错误集成方式 |

### 6.6 SSR / hydration

| 用例 | 步骤 | 预期 |
| --- | --- | --- |
| `renderToString` | SSR 渲染包含 `Model`、`Reality`、Entity、`useMetrics` 的页面 | 输出 fallback HTML，不请求 spatial chunk，不抛错 |
| Streaming SSR | 使用 `renderToPipeableStream` | 不引入额外 Suspense 边界，不请求 spatial chunk |
| hydrate 后 boot | SSR HTML hydrate 完成后调用 `bootSpatial()` | 无 hydration mismatch warning，boot 后再切换真实实现 |
| hydrate 前 boot | `await bootSpatial()` 后执行 `hydrateRoot()` | 首次 hydrate 仍匹配 SSR fallback，后续 commit 切换真实实现 |
| Next lazy route | 构建并访问 `apps/spatial-next-min` lazy 页面 | SSR 和 CSR 边界符合预期 |
| React Router / Remix lazy route | 构建并访问 `apps/spatial-remix-min` lazy 页面 | SSR 和 CSR 边界符合预期 |

### 6.7 Breaking changes / 迁移验证

| 用例 | 步骤 | 预期 |
| --- | --- | --- |
| legacy subpath | 导入 `@webspatial/react-sdk/web` 或 `/default` | 构建失败或 resolve 失败，符合移除预期 |
| internal container exports | 从默认入口导入 `Spatialized2DElementContainer`、`SpatialMonitor` 等 | 无公开导出 |
| `@webspatial/vite-plugin` | 普通 Vite fixture 不配置该 plugin | 构建成功 |
| `createElement` | 使用旧 classic JSX transform | 当前仍可用但有 deprecated 文档提示；建议迁移 automatic runtime |

## 7. 建议执行命令

从仓库根目录执行：

```bash
pnpm install --frozen-lockfile
pnpm run setup
pnpm --filter @webspatial/react-sdk test
pnpm run test:size-budget
pnpm run test:rspack-compat
pnpm --filter spatial-vite-min build
pnpm --filter spatial-next-min build
pnpm --filter spatial-next-eager-min build
pnpm --filter spatial-remix-min build
```

环境具备时补充执行：

```bash
npm run test:auto
npm run ciTest
```

说明：

- `npm run test:auto` 依赖 Puppeteer/browser auto test 本地环境。
- `npm run ciTest` 依赖 Xcode 和 Apple Vision Pro simulator。
- 如只验证 GitHub Actions 当前失败项，至少需要通过 `pnpm install --frozen-lockfile` 和 `pnpm run setup`。

## 8. 重点回归页面 / fixtures

| 路径 | 回归重点 |
| --- | --- |
| `apps/test-server` | WebSpatial-heavy demo 页面、本地 dev server 回归 |
| `apps/spatial-vite-min` | 默认 lazy 入口、plain web 不拉 spatial chunk、Vite 构建 |
| `apps/spatial-next-min` | Next SSR + lazy default 边界 |
| `apps/spatial-next-eager-min` | Next eager CSR-only spatial island |
| `apps/spatial-remix-min` | React Router / Remix-style SSR + lazy default |
| `apps/spatial-rspack-min` | Rspack 构建、plugin-free integration、chunk splitting |
| `tests/marginal-delta-vite` | 默认入口 5 KB gzip marginal delta |

## 9. 已验证项

当前分支本地已验证：

```bash
pnpm install --frozen-lockfile
pnpm run setup
```

PR 描述中已列出并通过的验证项：

```bash
openspec validate lazy-load-spatial-runtime --strict
pnpm --filter @webspatial/react-sdk test
pnpm run test:size-budget
pnpm run test:rspack-compat
```

未在本地完整执行的环境依赖项：

```bash
npm run test:auto
npm run ciTest
```

## 10. 已知风险与非阻塞跟进

| 风险 / 跟进项 | 说明 | 建议处理 |
| --- | --- | --- |
| 忘记调用 `bootSpatial()` | WebSpatial runtime 下会停留在 facade fallback | 业务接入时优先使用 `<SpatialBoot>` |
| default + eager 混用 | 同一 bundle 混用两个 import root 不支持 | QA 可作为错误集成方式记录，不作为 SDK bug |
| 不支持 code splitting 的 bundler | 功能可工作，但 plain web 包体收益会消失 | 文档中注明 bundler 要求 |
| Eager SSR | eager spatial primitives 是 CSR-only | Next / Remix 中使用 client island 或 dynamic ssr false |
| `apps/test-server` 深度迁移 | 当前仍偏 WebSpatial 回归用途，未完全迁 dist 消费 | 非 v1 阻塞，后续跟进 |
| autoTest / ci-test dist + chunk-fetch 深度断言 | 已有基础 boot 迁移，深度断言未完全补齐 | 非 v1 阻塞，后续补 case |
| Turbopack / Module Federation | 未纳入 v1 tested target | 有业务需求后单独评估 |
| `@webspatial/vite-plugin` 跨仓弃用公告 | SDK 已不再需要该 plugin，但跨仓公告未完成 | 非阻塞，需在 `web-builder-plugins` 跟进 |

## 11. 准入 / 准出建议

### 准入

- PR 分支已同步最新 `main`。
- `pnpm-lock.yaml` 可通过 frozen install。
- React SDK 单测、体积预算、fixture build 在 CI 中可执行。
- 迁移文档已覆盖 breaking changes。

### 准出

- CI 中 `version` / install / build 相关 job 通过。
- `@webspatial/react-sdk` 单测通过。
- `test:size-budget` 通过，默认入口 typical gzip marginal delta ≤ 5 KB。
- 至少一个 plain web fixture 验证不请求 spatial chunk。
- 至少一个 WebSpatial 等价环境验证 `bootSpatial()` 能加载 spatial chunk 并切换真实实现。
- SSR fixture 构建通过，hydration 无 mismatch。
- 对未覆盖的 AVP simulator / browser auto test 环境项，在发布结论中明确标注是否已执行。

## 12. 参考资料

- PR: https://github.com/webspatial/webspatial-sdk/pull/1233
- 技术评审文档：`openspec/changes/lazy-load-spatial-runtime/FEISHU-REVIEW.md`
- 深度 review 指南：`openspec/changes/lazy-load-spatial-runtime/REVIEW.md`
- 迁移指南：`docs/migration/lazy-load-spatial-runtime.md`
- 包体收益报告：`docs/lazy-load-spatial-runtime-size-impact.md`
- 规范：`openspec/changes/lazy-load-spatial-runtime/specs/spatial-lazy-load/spec.md`
- React SDK README：`packages/react/README.md`
