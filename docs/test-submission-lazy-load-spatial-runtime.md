# React SDK SpatialBoot 推荐接入与 Lazy 分发测试计划

## 1. 提测信息

| 项目 | 内容 |
| --- | --- |
| 提测分支 | `feat/eager-mode-entry` |
| PR | https://github.com/webspatial/webspatial-sdk/pull/1233 |
| 变更类型 | React SDK 架构调整，包含 BREAKING CHANGE |
| OpenSpec change | `lazy-load-spatial-runtime` |
| 主要影响包 | `@webspatial/react-sdk`、`@webspatial/core-sdk` |
| 产品推荐接入方式 | `@webspatial/react-sdk` default lazy entry + `<SpatialBoot>` |
| 本轮测试主线 | `<SpatialBoot>` 推荐路径、plain web 体积契约、public API web fallback、Next.js lazy SSR/CSR、eager 老应用冒烟 |

## 2. 背景与目标

本次变更将 React SDK 从旧的双构建模式（`dist/web` / `dist/default`）和
`@webspatial/vite-plugin` alias 模式，切换为新的运行时 lazy-load 架构。

产品侧希望对外推荐 React 应用优先使用 `<SpatialBoot>`：

- 普通 Web 页面使用 `@webspatial/react-sdk` 时，只加载轻量 default entry 和 facade fallback，不加载真实 spatial 实现。
- WebSpatial runtime 页面使用 `<SpatialBoot>` 时，由 SDK 自动调用 `bootSpatial()`，动态加载 `@webspatial/react-sdk/spatial`，成功后再挂载 spatial children。
- 异常情况下 `<SpatialBoot>` 通过 `onError` 交给应用处理错误，children 不挂载；成功路径通过 `onReady` 通知应用。
- 对 spatial-only 老应用，提供 `@webspatial/react-sdk/eager` 作为低迁移成本入口，但 eager 不是本轮主测路径。

本测试计划的目标不是完整复述 OpenSpec，而是验证产品承诺是否成立：

1. 推荐的 `<SpatialBoot>` 接入方式在普通 Web 和 WebSpatial runtime 下可靠。
2. 普通 Web 下 default lazy entry 达成最初的体积收益目标。
3. 每个 public API 在 Web / 未 boot / SSR 下都有可预期 fallback。
4. lazy 模式支持 Next.js SSR/CSR/RSC 常见形态。
5. eager 模式可支撑老 WebSpatial 应用的基本迁移冒烟。

## 3. 测试优先级

| 优先级 | 测试项 | 说明 |
| --- | --- | --- |
| P0 | `<SpatialBoot>` 推荐路径 | 本次对外推荐接入方式，覆盖普通 Web、WebSpatial runtime、`onReady`、`onError` |
| P0 | 普通 Web 体积契约 | 需求改造最初目标，default lazy 典型 gzip marginal delta 必须 `<= 5 KB` |
| P0 | Public API web fallback | default entry 对外承诺所有 public API 在 Web / 未 boot / SSR 下可降级 |
| P1 | Next.js lazy SSR/CSR/RSC | 覆盖 App Router / hydration / RSC client boundary 等主要框架风险 |
| P2 | Eager 老应用冒烟 | 只验证老 WebSpatial 应用切 eager 后主流程可跑，不做全量 SSR 覆盖 |
| P2 | 迁移负向用例 | 旧 subpath、混入口、内部导出移除等 BREAKING CHANGE |
| P3 | 更广 bundler / 边缘环境 | Rspack、Remix-style、React 18/19、多浏览器等 release 前扩展回归 |

## 4. 最小可执行测试包

为了控制执行成本，本轮建议先完成以下最小测试包。扩展项见后续章节。

| 序号 | 测试内容 | 推荐方式 | 成本 | 必要性 |
| --- | --- | --- | --- | --- |
| 1 | default lazy 体积预算 | 跑 `pnpm run test:size-budget` | 低 | P0 |
| 2 | `<SpatialBoot>` 普通 Web 行为 | 普通 Chrome 打开 lazy demo / fixture，观察页面、console、network | 低 | P0 |
| 3 | `<SpatialBoot>` WebSpatial runtime 成功路径 | PICO / AVP / Puppeteer 等 WebSpatial 等价环境 | 中 | P0 |
| 4 | Public API fallback | 跑 React SDK 单测；人工抽验 `Model`、`Reality`、`enable-xr` | 中低 | P0 |
| 5 | Next.js lazy SSR/CSR | 构建并访问 `apps/spatial-next-min` lazy 页面 | 中 | P1 |
| 6 | 老 WebSpatial 应用 eager 冒烟 | 老应用切 `@webspatial/react-sdk/eager` 后启动核心场景 | 中 | P2 |

执行成本较高的多浏览器矩阵、Rspack / Remix-style 全量回归、React 18/19
全量人工验证、eager 完整回归，可以作为 release 前扩展测试，不阻塞最小提测。

## 5. 测试环境

| 环境 | 用途 | 执行建议 |
| --- | --- | --- |
| Plain Chrome / Chromium | 验证普通 Web 下 `<SpatialBoot>`、fallback、体积、network 行为 | P0 必测 |
| WebSpatial runtime（PICO / AVP / Puppeteer harness） | 验证 `<SpatialBoot>` 触发 spatial chunk 并切到真实实现 | P0 必测，设备不可用时用 Puppeteer 等价路径补充 |
| Node SSR | 验证 SSR 输出 fallback，不请求 spatial chunk | P1 |
| Next.js App Router fixture | 验证 lazy SSR/CSR/RSC client boundary | P1 |
| 老 WebSpatial 应用 | 验证 eager 迁移冒烟 | P2 |
| Rspack / Remix-style fixtures | 验证 plugin-free / bundler 兼容 | P3 或 release 前 |
| React 18 / React 19 compat fixtures | 验证 peer range 和兼容性 | P3 或 CI 自动化 |

## 6. P0：`<SpatialBoot>` 推荐路径

### 6.1 普通 Web 环境

| 用例 | 步骤 | 预期 |
| --- | --- | --- |
| 普通 Web 下 `<SpatialBoot>` 可用 | 在普通 Chrome 打开使用 default entry + `<SpatialBoot>` 的页面 | 页面不 crash，children 正常挂载 |
| `onReady` 正常触发 | 给 `<SpatialBoot onReady={cb}>` 添加日志或测试探针 | `onReady` 被触发一次；`onError` 不触发 |
| 不加载 spatial chunk | 观察 Network 或自动化拦截 chunk 请求 | 不请求 `spatial` chunk，不加载真实 spatial implementation |
| 无误报错误 | 观察 console / error reporter | 不出现 `WebSpatialBootError`，不出现“忘记 boot”的 WebSpatial warning |
| fallback 是最终 Web 呈现 | 渲染 `Model`、`Reality`、`enable-xr` 等代表 API | 使用 Web fallback，不依赖 WebSpatial session |

### 6.2 WebSpatial runtime 成功路径

| 用例 | 步骤 | 预期 |
| --- | --- | --- |
| `<SpatialBoot>` 自动 boot | 在 WebSpatial runtime 打开使用 `<SpatialBoot>` 的页面 | `<SpatialBoot>` 调用 `bootSpatial()` 并等待成功 |
| spatial chunk 按需加载 | 观察 Network 或自动化拦截 | 仅在 boot 时请求 `@webspatial/react-sdk/spatial` 对应 chunk |
| children 挂载时机正确 | 在 children 中打点或显示探针 | boot 成功前 children 不挂载；成功后 children 挂载 |
| `onReady` 正常触发 | 给 `<SpatialBoot onReady={cb}>` 添加日志或测试探针 | boot 成功后 `onReady` 被触发一次 |
| 真实 spatial 生效 | 渲染 `Model` / `Reality` / `enable-xr` 场景 | boot 后使用真实 spatial implementation，不长期停留在 fallback |
| StrictMode / 多次 render 不重复加载 | React StrictMode 或多处同时渲染 `<SpatialBoot>` | 同一次 load attempt 共享 promise，不重复请求 spatial chunk |

### 6.3 异常路径

| 用例 | 步骤 | 预期 |
| --- | --- | --- |
| spatial chunk 加载失败 | 通过 mock / network 拦截让 spatial chunk 加载失败 | `onError` 被触发，错误类型为 `WebSpatialBootError` |
| 失败时 children 不挂载 | 在 children 中添加 mount 探针 | `onError` 后 children 仍不挂载 |
| 失败时 `onReady` 不触发 | 同时监听 `onReady` / `onError` | 只触发 `onError`，不触发 `onReady` |
| 错误可诊断 | 检查错误对象 | error 包含 `cause` 和 attempt 信息，便于上报和定位 |
| 重试行为 | 失败后再次调用 `bootSpatial()` 或业务 retry | 如本轮有实现 retry 入口，重试会发起新 attempt；否则记录为补充测试 |

## 7. P0：普通 Web 体积契约

产品体积契约是本次改造的最初目标，必须作为独立 P0 验收项。

| 用例 | 步骤 | 预期 |
| --- | --- | --- |
| 典型 named import 体积 | 跑 `pnpm run test:size-budget` | `tests/marginal-delta-vite` 典型 gzip marginal delta `<= 5 KB` |
| default entry 不包含 spatial implementation | 检查 size budget / dist scan 测试结果 | default lazy 静态图不拉真实 spatial implementation |
| plain web 不请求 spatial chunk | 普通 Chrome 打开 lazy fixture，观察 Network | 首屏和 `<SpatialBoot>` ready 过程中都不请求 spatial chunk |
| eager 不影响 default 体积 | 构建同时发布 default / eager 后测 default delta | eager 存在不增加 default entry 的体积预算 |
| 明确测试口径 | 检查用例 import 方式 | 体积口径使用推荐 named import，不以 namespace import / full barrel import 作为 P0 判定 |

通过标准：

- 体积预算以 gzip marginal delta `<= 5120 bytes` 为准。
- 体积测试必须基于 published / dist 形态或 consumer-shaped fixture，不能只测 monorepo source alias。
- 如果下游 bundler 不支持 dynamic import code-splitting，功能可用但体积收益丢失，应记录为消费侧能力限制。

## 8. P0：Public API Web Fallback

default lazy 的产品承诺不只依赖 `<SpatialBoot>`，还包括所有 public API 在普通
Web、未 boot、SSR 下有可预期 fallback。本节建议用自动化覆盖 inventory，人工只抽验代表组件。

### 8.1 Component fallback

| API | Web / 未 boot 预期 |
| --- | --- |
| `Model` | 渲染降级 `<model>`，并剥离 spatial-only event props |
| `Reality` | 渲染单个 `aria-hidden="true"` 的 `div` host，保持布局，不挂载 children |
| `Entity` / `BoxEntity` / `SphereEntity` / `ConeEntity` / `CylinderEntity` / `PlaneEntity` / `ModelEntity` / `AttachmentEntity` | 返回 `null`，不挂载 children，不抛错 |
| `Box` / `Sphere` / `Cone` / `Cylinder` / `Plane` | 与对应 `*Entity` fallback 一致 |
| `Material` / `Texture` / `ModelAsset` / `AttachmentAsset` / `UnlitMaterial` | 返回 `null`，不抛错 |
| `SceneGraph` / `World` | 返回 `null`，不挂载 children |

可观察结果：

- 页面不 crash。
- React 不出现 unknown DOM attribute warning。
- 不请求 spatial chunk。
- fallback DOM 与文档 / spec 一致。

### 8.2 Hook fallback

| API | Web / 未 boot / SSR 预期 |
| --- | --- |
| `useSpatialReady()` | 返回 `false`；普通 Web 下不注册 bridge subscriber |
| `useMetrics()` | 返回稳定 placeholder；转换函数身份稳定；按当前规范，调用转换函数时抛 `WebSpatialRuntimeError` |

### 8.3 Utility fallback

| API | Web / 未 boot / SSR 预期 |
| --- | --- |
| `bootSpatial()` | 普通 Web / SSR 下 resolve，不请求 spatial chunk |
| `isSpatialReady()` | 普通 Web / SSR 下为 `false` |
| `onSpatialLoadError()` | 可注册 / 注销；普通 Web 下不应被触发 |
| `initScene()` | 无 WebSpatial session 时 no-op / graceful fallback |
| `convertCoordinate()` | 未支持或未 boot 时抛 `WebSpatialRuntimeError`，错误信息应指向需要先 `bootSpatial()` |
| `enableDebugTool()` | SSR no-op；普通 Web 下不应因无 session 直接崩溃 |
| `WebSpatialRuntime.supports()` | 不依赖 `bootSpatial()`，普通 Web 下 spatial capability 返回 `false` |
| `version` / type-only exports | 可导入；type-only 名称不应出现在 runtime namespace |

### 8.4 JSX marker fallback

| 用例 | 步骤 | 预期 |
| --- | --- | --- |
| `enable-xr` | 渲染 `<div enable-xr />` | marker 被 strip，不透传非法 DOM 属性；Web 下使用 transparent fallback |
| `enable-xr-monitor` | 渲染 `<div enable-xr-monitor />` | marker 被 strip，不透传非法 DOM 属性 |
| `style.enableXr` | 渲染共享 / frozen style 对象 | `enableXr` 被移除，原始 style 对象不被 mutate |
| `className="__enableXr__"` | 渲染包含 marker token 的 className | marker token 被移除，其他 class 保持 |
| `class="__enableXr__"` | 使用 HTML-style `class` 属性 | 不作为 marker 识别 |
| RSC Client Reference | RSC server bundle 下 marker 路径 | 可以 strip marker；遇到 Client Reference 时不调用 HOC |

## 9. P1：Next.js Lazy SSR / CSR / RSC

Next.js 是 lazy 模式的重点框架覆盖对象，建议优先验证 App Router。

| 用例 | 步骤 | 预期 |
| --- | --- | --- |
| Next lazy build | 构建 `apps/spatial-next-min` | build 通过 |
| Server Component 引入 facade | 在 App Router Server Component 路径中引用 default entry facade | 不出现“hooks in Server Component”构建错误 |
| SSR 输出 fallback | 访问 lazy SSR 页面并检查 HTML / 页面探针 | 服务端输出 fallback，不请求 spatial chunk |
| hydration 无 mismatch | 拦截 console error / warning | 无 React hydration mismatch warning |
| CSR 阶段 `<SpatialBoot>` 接管 | hydration 后在 WebSpatial runtime 触发 boot | spatial chunk 加载后切真实实现 |
| 普通 Web CSR | 普通 Chrome 访问 lazy 页面 | `<SpatialBoot>` 正常 ready，children 挂载，不请求 spatial chunk |
| server-only 限制 | server-only 模块调用 hook 类 API | 应作为错误用法或限制说明，不作为 SDK 支持路径 |

通过标准：

- Next.js App Router build 通过。
- SSR / hydration 日志干净。
- default entry 的 `'use client'` boundary 能被框架识别。
- RSC server 侧不执行 hook-using facade 内部逻辑。

## 10. P2：Eager 老 WebSpatial 应用冒烟

eager 是 spatial-only 应用的迁移路径，本轮不作为主测重点。

| 用例 | 步骤 | 预期 |
| --- | --- | --- |
| 老应用切 eager | 选择一个老 WebSpatial 应用，将 import root 切到 `@webspatial/react-sdk/eager` | 应用构建通过 |
| 核心 spatial 页面启动 | 打开老应用核心 spatial 页面 | 页面正常启动，核心 spatial 内容可见 |
| 核心交互冒烟 | 执行一个代表性交互链路 | 交互无明显回归 |
| 保留 `bootSpatial()` 调用 | 老代码中若仍保留 `await bootSpatial()` | eager 下立即 resolve，不破坏控制流 |
| 不做 eager SSR 保证 | 如果老应用有 SSR | spatial primitives 需要 CSR gate；直接 SSR eager primitive 不作为 SDK 保证 |

## 11. P2：迁移与负向用例

| 用例 | 步骤 | 预期 |
| --- | --- | --- |
| legacy subpath 移除 | 导入 `@webspatial/react-sdk/web` 或 `@webspatial/react-sdk/default` | module resolution fail |
| default + eager 混用 | 同一 bundle / JS realm 混用两个入口 | 视为错误集成方式；应报错或被检测出来 |
| 内部 container 导出移除 | 从 default entry 导入 `SpatializedContainer`、`Spatialized2DElementContainer`、`SpatializedStatic3DElementContainer`、`SpatialMonitor` | 无公开导出 |
| 不依赖 `@webspatial/vite-plugin` | Vite fixture 不配置该 plugin | 构建成功 |
| `createElement` 兼容 | 旧 classic JSX transform 仍使用 `createElement` | 当前可用但 deprecated，建议迁移 automatic JSX runtime |

## 12. P3：扩展测试

这些测试收益高，但执行成本相对更高，建议放在 release 前、CI、或专项回归中执行。

| 测试项 | 建议方式 | 说明 |
| --- | --- | --- |
| Rspack plugin-free integration | `pnpm run test:rspack-compat` | 验证 Rspack 构建和 chunk splitting |
| Remix-style SSR | `apps/spatial-remix-min` build + 页面访问 | 覆盖 React Router / Remix-style SSR |
| React 18 / React 19 兼容 | `pnpm run test:react-compat` | 自动化优先，人工不展开 |
| 多浏览器 plain web | Chrome + Safari 抽测 | Safari 放 release 前即可 |
| Browser auto test | `pnpm run test:auto` | 依赖 Puppeteer/browser auto test 本地环境 |
| AVP simulator e2e | `pnpm run ciTest` | 依赖 Xcode 和 Apple Vision Pro simulator |
| Turbopack / Module Federation | 专项 spike | v1 明确 out of scope，不作为本轮阻塞 |

## 13. 建议执行命令

从仓库根目录执行：

```bash
pnpm install --frozen-lockfile
pnpm run setup
pnpm --filter @webspatial/react-sdk test
pnpm run test:size-budget
pnpm --filter spatial-next-min build
```

按时间和环境补充执行：

```bash
pnpm run test:fixtures
pnpm run test:react-compat
pnpm run test:auto
pnpm run ciTest
```

说明：

- `pnpm run test:size-budget` 是 P0，验证 default lazy 体积契约。
- `pnpm --filter @webspatial/react-sdk test` 覆盖多数 fallback、boot、SSR/hydration 单测。
- `pnpm --filter spatial-next-min build` 是 Next.js lazy SSR/CSR 最小框架验证。
- `pnpm run test:auto` 依赖 Puppeteer/browser auto test 本地环境。
- `pnpm run ciTest` 依赖 Xcode 和 Apple Vision Pro simulator。
- 如果本地 `pnpm` 不在 PATH，可使用 `/usr/local/bin/pnpm` 或先补齐 PATH。

## 14. 重点回归页面 / fixtures

| 路径 | 回归重点 |
| --- | --- |
| `apps/test-server` | WebSpatial-heavy demo、本地 dev server、`<SpatialBoot>` 推荐接入抽验 |
| `apps/spatial-vite-min` | default lazy、plain web 不拉 spatial chunk、Vite 构建 |
| `apps/spatial-next-min` | Next.js lazy SSR/CSR/RSC 边界 |
| `apps/spatial-next-eager-min` | Next eager CSR-only spatial island |
| `apps/spatial-remix-min` | React Router / Remix-style SSR + lazy default |
| `apps/spatial-rspack-min` | Rspack 构建、plugin-free integration、chunk splitting |
| `tests/marginal-delta-vite` | default lazy 5 KB gzip marginal delta |
| 老 WebSpatial 应用（QA / 业务指定） | eager 迁移冒烟 |

## 15. 准入 / 准出标准

### 15.1 准入

- PR 分支已同步最新 `main`。
- `pnpm-lock.yaml` 可通过 frozen install。
- React SDK 单测、体积预算、Next fixture 在 CI 或本地可执行。
- 迁移文档已覆盖 breaking changes、`<SpatialBoot>` 推荐路径、eager 选型。
- QA 明确本轮是否具备 WebSpatial runtime / AVP simulator / Puppeteer harness 环境。

### 15.2 准出

- P0 `<SpatialBoot>` 普通 Web 行为通过：children 挂载、`onReady` 触发、无 spatial chunk、无误报错误。
- P0 `<SpatialBoot>` WebSpatial runtime 行为通过：boot 后加载 spatial chunk、children 挂载、真实 spatial 生效。
- P0 `<SpatialBoot>` 错误路径结论明确：`onError` 触发，children 不挂载，`onReady` 不触发。
- P0 `test:size-budget` 通过：default lazy 典型 gzip marginal delta `<= 5 KB`。
- P0 public API web fallback 通过自动化或 inventory 抽验：组件、hook、utility、JSX marker 均有明确结果。
- P1 Next.js lazy build / SSR / hydration 验证通过，未出现 hydration mismatch。
- P2 eager 老应用冒烟通过，或明确标注未执行原因。
- 对未执行的扩展环境（AVP simulator、browser auto test、Rspack、Remix-style、React compat）在测试结论中明确标注。

## 16. 风险与非目标

| 风险 / 非目标 | 说明 | 建议处理 |
| --- | --- | --- |
| 忘记使用 `<SpatialBoot>` / `bootSpatial()` | WebSpatial runtime 下 default facade 会停留在 fallback | 对外文档推荐 `<SpatialBoot>`；WebSpatial dev 环境保留 warning |
| 普通 Web 体积回退 | 如果 default entry 静态引入 spatial implementation，会违背最初目标 | P0 固定跑 `test:size-budget` |
| public API fallback 漏覆盖 | 某个 public API 可能在 Web / SSR 下误触 spatial runtime | 用 public export inventory 做自动化覆盖 |
| Next.js RSC 边界变化 | 框架版本变化可能影响 `'use client'` boundary | P1 覆盖 App Router build 和 hydration |
| default + eager 混用 | 同一 JS realm 混用两个 import root 不支持 | 作为错误集成方式记录，不作为 best-effort 兼容 |
| eager SSR | eager spatial primitives 是 CSR-only | Next / Remix 中使用 client island 或 dynamic `ssr: false` |
| 不支持 code splitting 的 bundler | 功能可工作，但 plain web 包体收益会消失 | 文档中注明 bundler 能力要求 |
| Turbopack / Module Federation | v1 out of scope | 有业务需求后专项评估 |
| `@webspatial/vite-plugin` 跨仓弃用公告 | SDK 已不再需要该 plugin，但跨仓公告需另行跟进 | 非本轮阻塞 |

## 17. 参考资料

- PR: https://github.com/webspatial/webspatial-sdk/pull/1233
- 技术评审文档：`openspec/changes/lazy-load-spatial-runtime/FEISHU-REVIEW.md`
- 深度 review 指南：`openspec/changes/lazy-load-spatial-runtime/REVIEW.md`
- OpenSpec proposal：`openspec/changes/lazy-load-spatial-runtime/proposal.md`
- OpenSpec spec：`openspec/changes/lazy-load-spatial-runtime/specs/spatial-lazy-load/spec.md`
- 迁移指南：`docs/migration/lazy-load-spatial-runtime.md`
- 包体收益报告：`docs/lazy-load-spatial-runtime-size-impact.md`
- `SpatialBoot` 产品对齐稿：`docs/design/spatial-boot-component.md`
- React SDK README：`packages/react/README.md`
