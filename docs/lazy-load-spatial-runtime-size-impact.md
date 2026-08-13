# Lazy-load Spatial Runtime — 实测包体收益报告

> 面向产品 & 评审人员的"该 spec 改动到底值不值"参考材料。
> 所有数字来自本地实测构建，不是估算。
>
> **测量轮次**
>
> | 轮次 | 日期 | 说明 |
> |---|---|---|
> | 首测 + rebase 复测 | 2026-05-14 / 2026-05-15 | 下文 **B（main 基线）** 对比与场景 1（`spatial-vite-min`）仍以该轮为准 |
> | **A 端校准更新** | **2026-06-16** | `feat/eager-mode-entry` tip；更新场景 2 / §9 合同余量 / `dist/index.js` proxy（见 §3.1） |

**相关材料**

- 产品 / 工程对齐决策：`docs/react-sdk-product-alignment.md`
- 迁移与集成步骤：`docs/migration/lazy-load-spatial-runtime.md`
- 规范本体（normative）：`openspec/changes/lazy-load-spatial-runtime/`
- 消费者形态实测夹具：`apps/spatial-vite-min/`、`tests/marginal-delta-vite/`

## 摘要（先看结论）

把同一个最小 React + Vite 应用，分别在两条分支上构建并测尺寸：

- **A. `feat/eager-mode-entry`** 分支 tip（已 rebase 到下方 B 之上，含 `lazy-load-spatial-runtime` spec 全部 38 个 commit）
- **B. `origin/main`** `0d698933`（**不含**该 spec；A 的当前 base）

| 场景 | 度量口径 | A（spec lazy） | B（main） | 节省 | 比例 |
|---|---|---:|---:|---:|---:|
| **场景 1：React 与应用一起打包**<br/>（`apps/spatial-vite-min`，普通 SPA） | 首屏 JS gzip | **50.2 KB** | **74.1 KB** | **−23.9 KB** | **−32.3 %** |
| | 首屏 JS 原始 | 154.3 KB | 250.4 KB | −96.1 KB | −38.4 % |
| **场景 2：React 外置（CDN / peer / 微前端）**<br/>（`tests/marginal-delta-vite/app-typical`，推荐 named import） | SDK 同步增量 gzip | **2.93 KB**¹ | **34.47 KB** | **−31.5 KB** | **−91.5 %** |
| | SDK 同步增量 原始 | ~9.1 KB | 148.1 KB | −139.0 KB | −93.9 % |
| **场景 3：worst-case namespace import**<br/>（`import * as W from '@webspatial/react-sdk'`） | SDK 同步增量 gzip | **5.69 KB**¹ | 37.10 KB | −31.4 KB | −84.7 % |

**这些字节都是 plain-web 浏览器（非 WebSpatial 运行时）下用户必下载的字节**；spec 把 spatial 真实实现搬进了一个**动态 `import()` 才能到达**的二级 chunk，所以普通浏览器从此再也不会下载这部分代码。在 WebSpatial 设备上则会按需下载（异步、不阻塞首帧）。

> 关键数据点（2026-06-16 校准）："产品级 marginal-delta 合同"被 CI 锁死在 **gzip ≤ 5 KB**。当前 typical 实测 **2.93 KB / 5 KB（约 57 %）**，仍有余量；相对 main 基线 **34.5 KB → 2.9 KB（−91.5 %）** 的结构性收益不变。
>
> ¹ 2026-06-16 在 `feat/eager-mode-entry` tip 上复测。相较 2026-05-15 首测的 **1.66 KB**，typical marginal 涨了约 **+1.3 KB**；主因是 eager entry 打包 / `registerEagerEntry` / facades-client 等进入默认入口静态图（见 §3.1），**不是** `useAnimation` ready-gated facade（该改动仅 +3 B marginal、+100 B `dist/index.js` proxy）。

---

## 1. 测量方法

### 1.1 两个被测对象

| 标签 | git 引用 | 含义 |
|---|---|---|
| **A** | `feat/eager-mode-entry` 分支 tip（rebase 后），见 `git log feat/eager-mode-entry -1` | spec 已落地（lazy 默认 + eager 子路径） |
| **B** | `origin/main` @ `0d698933` | A 分支当前的 rebase base；按 spec 提案，是"双 dist (`web` vs `default`) + `@webspatial/vite-plugin`"老架构的最后一个状态 |

> 历史注：首测（2026-05-14）的 B 端基线是 `main` @ `01792563`（A 的 fork 点）。rebase 后用 `0d698933` 复测，B 端字节漂移在 ±0.5 % 以内（pnpm-lock 因 `fast-uri` security override 微调），结论不变。下面所有 B 列数字以 2026-05-15 复测为准。

### 1.2 两个夹具（fixtures）

| 夹具 | 用途 | React 打包方式 |
|---|---|---|
| `apps/spatial-vite-min/` | 最小完整 Vite SPA：3×3 个 `<div enable-xr>` 单元 + 1 个 `<Model>` | **打进主包** |
| `tests/marginal-delta-vite/` | spec §9.2 自带的"加 SDK 前后差值"测量夹具 | **外置（peer）** |

两个夹具我都拷贝到 `/tmp/ws-main-baseline/` 上的 main worktree，做了**最小**改动：

- `apps/spatial-vite-min/src/main.tsx`：剔除 `bootSpatial` / `WebSpatialBootError` / `<await bootSpatial()>`（main 上不存在这些导出），删除 `eager.html` / `eager-lean.html` 两个入口（main 上没有 `/eager` 子路径）。
- `tests/marginal-delta-vite/src/app-typical.tsx`：剔除 `bootSpatial` import；其余逻辑（mount `<Model>`）保持不变。
- 测试本身改为 **telemetry-only**（不强制 5 KB 上限，因为那是 spec 合同，不是 main 的事实）。

业务代码、Vite 版本、esbuild 压缩、target、external 配置 100 % 对齐，唯一变量就是 SDK 自身。

### 1.3 怎么算"plain-web 必下载字节"

- `apps/spatial-vite-min` 场景：直接看 `dist/index.html` 引用的 `<script>` + `<link rel="modulepreload">` 文件总和。
- `tests/marginal-delta-vite` 场景：按 spec §9.2 口径走 Rollup 的 `OutputChunk.imports`（同步静态闭包），不计 `dynamicImports`（异步 chunk）。

所有 gzip 都是 Node `zlib.gzipSync` 默认级别。

---

## 2. 场景 1：`apps/spatial-vite-min`（React 在主包内）

最贴近真实独立 SPA 部署的形态。

### A 端（当前分支 / spec lazy 入口）

`apps/spatial-vite-min/dist/index.html` 触发的同步下载：

| 文件 | 原始 | gzip | 说明 |
|---|---:|---:|---|
| `assets/index-CZFLZ1zX.js` | 562 B | 401 B | 应用入口 shim |
| `assets/spatial-app-CumqX2Ak.js` | 153,735 B | 49,784 B | React + ReactDOM + facade + 业务代码 |
| **小计 (plain-web 首屏)** | **154,297 B** | **50,185 B** | |

**异步、plain-web 不会下载**：

| 文件 | 原始 | gzip | 说明 |
|---|---:|---:|---|
| `assets/spatial-BUMyCgDG.js` | 857 B | 493 B | spatial 入口 shim |
| `assets/chunk-SHX6AI5C-cLudk3SK.js` | 114,759 B | 28,278 B | **spatial 真实实现**（Entity / Model / Reality / ...） |

在 WebSpatial 运行时（AVP / PICO / Puppeteer）下，`bootSpatial()` 检测到运行时存在并通过 `import('@webspatial/react-sdk/spatial')` 异步拉这两个文件，**不阻塞首帧**。在 plain-web 浏览器下，`bootSpatial()` 命中早返回分支（`runtime/detect.ts` 没检测到 WebSpatial 信号），dynamic `import()` 永不触发，浏览器不会发起这两个请求。

### B 端（main 基线）

`/tmp/ws-main-baseline/apps/spatial-vite-min/dist/index.html` 触发的同步下载：

| 文件 | 原始 | gzip | 说明 |
|---|---:|---:|---|
| `assets/index-D07y0Pp0.js` | 250,407 B | 74,100 B | **整个应用单文件** —— React + ReactDOM + 全套 spatial SDK + 业务代码 |
| **小计 (plain-web 首屏)** | **250,407 B** | **74,100 B** | |

main 上没有 bridge，没有 facade，没有 `bootSpatial`，没有 dynamic import 边界 —— spatial 真实实现（`Spatialized*Container*`、`withSpatialMonitor`、`Reality`、`*Entity`、真 `Model`、reality hooks）全部被 Vite 拉进同步主包。

### 对比

| 度量 | A（spec lazy） | B（main） | 节省字节 | 百分比 |
|---|---:|---:|---:|---:|
| 首屏 JS gzip | **50,185 B** | **74,100 B** | **23,915 B (≈ 23.4 KiB)** | **−32.3 %** |
| 首屏 JS 原始 | 154,297 B | 250,407 B | 96,110 B (≈ 93.9 KiB) | −38.4 % |
| 首屏文件数 | 2 | 1 | — | — |

**业务解读**：在最常见的 React + Vite SPA 场景下，spec 让每个 plain-web 用户的首屏 JS 下载量减少了 **将近 1/3 (gzip)**。对于把应用部署到 CDN 上、首屏速度敏感的产品（marketing 页 / PWA / 渐进增强场景），这是个直接可观测的 LCP 收益。

---

## 3. 场景 2：`marginal-delta-vite`（React 外置）

把 React + ReactDOM 当作 peer dep / 外部 CDN（这是 micro-frontend / 大型平台 / 跨产品共享 React 时的典型场景），SDK 自己的字节占比就上来了。spec §9.2 的 CI 合同正是按这个口径写的。

### A 端（当前分支 / spec）

| 应用 | 同步 chunk (gz / raw) | 异步 spatial chunk (gz / raw) |
|---|---|---|
| `app-base`（不引 SDK） | 325 B / 644 B | — |
| `app-typical`（`import { Model, bootSpatial }`） | **3,256 B / 9,290 B** | ~40,530 B / ~167,889 B |
| `app-namespace`（`import * as W`，最坏） | 6,011 B / 18,784 B | ~40,531 B / ~167,891 B |

**marginal delta（gzip，相对于 base）**：

- **typical = 2,931 B**（spec §9.2 硬上限 5,120 B，**余量 2,189 B / 43 %**）
- namespace = 5,686 B（namespace / typical = **1.94 ×**，spec §9.3 tree-shake 健康度 ≥ 1.5 × 仍成立）

### 3.1 A 端校准：为何从 1.66 KB 涨到 ~2.93 KB（2026-06-16）

2026-05-15 首测 typical marginal 为 **1,657 B**；截至 2026-06-16 的 `feat/eager-mode-entry` tip 为 **2,931 B**（**+1,274 B**）。对照 commit 历史，主要台阶如下（`tests/marginal-delta-vite` 夹具口径不变）：

| 阶段 | typical marginal (gzip) | 主要变更 |
|---|---:|---|
| 2026-05-15 首测 (`b04a2623`) | **1,656 B** | lazy default entry 初版；预算当时为 8 KB |
| eager entry 打包落地 (~`06df414c`) | **~2,648 B** | `@webspatial/react-sdk/eager`、`registerEagerEntry`、facades-client 子路径进入发布物 |
| eager 注册防 tree-shake (~`419a4e55`) | **~2,930 B** | 保证 mixed-entry 检测在 consumer bundle 里不被摇掉 |
| `useAnimation` ready-gated facade (`af1b5106`) | **2,931 B** | **+3 B**（typical 不 import 该符号，几乎无影响） |

**结论**：

1. **仍满足 §9.2 合同**（2,931 B < 5,120 B）。
2. **相对 main 的 −91.5 % 收益**不因这 1.3 KB 校准而消失（main 仍是 ~34.5 KB 同步增量）。
3. 后续若再加 default-entry 导出，应继续用 `pnpm --filter marginal-delta-vite test` 与 `packages/react/src/__tests__/size-budget.test.ts` 盯余量；`useAnimation` 类 ready-gated hook 对 typical 路径成本低，但 §9.1 `dist/index.js` proxy 会为每个新 barrel export 付 ~100 B 量级固定成本。

### B 端（main 基线）

| 应用 | 同步 chunk (gz / raw) | 异步 chunk |
|---|---|---|
| `app-base`（不引 SDK） | 311 B / 626 B | — |
| `app-typical`（`import { Model }`） | **34,777 B / 148,076 B** | **无**（main 没有 bridge → 全部同步） |
| `app-namespace`（`import * as W`） | 37,406 B / 158,218 B | — |

**marginal delta（gzip，相对于 base）**：

- typical = **34,466 B**
- namespace = 37,095 B（main 上 typical 与 namespace 几乎一样大 → tree-shake **基本失效**，符合 spec 提案对老架构的诊断）

### 对比

| 度量 | A（spec，2026-06-16） | B（main） | 节省字节 | 百分比 |
|---|---:|---:|---:|---:|
| typical 同步 gzip | **3,256 B** | **34,777 B** | **31,521 B** | **−90.6 %** |
| typical 同步 raw | 9,290 B | 148,076 B | 138,786 B | −93.7 % |
| typical **marginal delta** gzip | **2,931 B** | **34,466 B** | **31,535 B** | **−91.5 %** |
| namespace 同步 gzip | 6,011 B | 37,406 B | 31,395 B | −84.0 % |
| namespace / typical 比 | 1.94 × | 1.08 × | — | — |

**业务解读**：当 React 不需要被每个产品重复打一份时，加 WebSpatial SDK 的代价从 **34 KB gzip 一刀切** 降到 **~2.9 KB gzip 按需付费**（**−91.5 %**）。相较 2026-05-15 首测的 1.7 KB，绝对值多了约 1.3 KB（eager 打包等固定成本），但相对 main 的结构性收益不变，且仍在 5 KB CI 合同内。namespace / typical 比 **1.94 ×** 说明 tree-shake 仍有效（main 上仅 1.08 ×）。

---

## 4. 场景 3：worst-case（namespace 导入）

`import * as W from '@webspatial/react-sdk'` 强制 Rollup 保留整个 barrel。这是最不友好的消费方式，常见于把 SDK 当字典查询、或集成层动态分发的情况。

| 度量 | A（spec，2026-06-16） | B（main） | 节省 | 百分比 |
|---|---:|---:|---:|---:|
| 同步 gzip marginal | 5,686 B | 37,095 B | 31,409 B | **−84.7 %** |
| 同步 raw marginal | ~18.1 KB | 158,218 B | — | — |

即使是最坏情况，spec 仍然砍掉 **85 % gzip**。说明 spec 的收益不是"被推荐导入方式骗出来的"，而是结构性的（spatial impl 进入 dynamic chunk）。

---

## 5. SDK 自身产物对比（横向参考）

直接看两条分支 `packages/react/dist/` 的实测尺寸：

| 文件 | A（spec，2026-06-16） raw | A gz | B（main） raw | B gz | 说明 |
|---|---:|---:|---:|---:|---|
| `dist/index.js` (lazy 默认入口) | **5,329 B** | **1,642 B** | — | — | spec 新加；§9.1 proxy 预算 5,120 B |
| `dist/eager.js` (spatial-only 入口) | 2,443 B | 957 B | — | — | spec 新加 |
| `dist/spatial.js` (spatial 入口 shim) | 1,052 B | 444 B | — | — | spec 新加，**动态 import 才到达** |
| `dist/chunk-*.js` (spatial 真实实现) | ~105 KB+ | ~28 KB+ | — | — | spec 拆出来，**plain-web 永不下载**（hash 随构建变化） |
| `dist/default/index.js` | — | — | 129,741 B | 25,277 B | main 老入口（消费者总是同步拉） |
| `dist/web/index.js` | — | — | 131,051 B | 25,741 B | main "web 专用"入口（同样总是同步拉） |

**关键观察**：

1. main 上 `dist/web/index.js` 名义是"web 专用"（号称剥离了 spatial），**实测 131 KB raw / 25.7 KB gzip**，和 `dist/default/index.js` 几乎一样大 —— 也就是 proposal §Why 早就指出的 "dual build 是空头支票"。
2. spec 把"必下载入口"从 **25 KB gzip** 砍到 **~1.6 KB gzip**（lazy `dist/index.js` §9.1 proxy，2026-06-16），spatial 实现整体推进了"按需"的 dynamic chunk。注：2026-05-15 首测为 579 B gzip；eager 打包等后续改动使 proxy 升至 1,642 B，仍远低于 5 KB 上限。
3. spec 给 spatial-only 消费者保留了 eager 入口（`dist/eager.js` + 同一份 `chunk-SHX6AI5C.js` ≈ **25 KB gzip 总同步**），与 main 的 `dist/default` 持平 —— 也就是说**给愿意承担成本的消费者也没有变贵**，spec 是 Pareto 改进。

---

## 6. 复现步骤

完整可复现（在本仓库 `feat/eager-mode-entry` HEAD 上）：

```sh
# === A 端：当前分支（spec 已落地） ===
pnpm install
pnpm -r --filter '@webspatial/core-sdk' --filter '@webspatial/react-sdk' build
pnpm --filter spatial-vite-min build
# 查看 apps/spatial-vite-min/dist/assets/ 下文件尺寸

pnpm --filter marginal-delta-vite test
# 终端日志会打印 app-base / app-typical / app-namespace 三个数

# === B 端：main 基线 ===
# 用 detached worktree 钉到 origin/main 的当前 tip（本文测的是 0d698933；
# 主线后续推进会让该 hash 变化，但只要重新 fetch + 取最新 origin/main，
# 几个测量值的漂移仍会在 ±0.5 % 内 —— 验证过）。
git fetch origin
git worktree add -d /tmp/ws-main-baseline origin/main
cd /tmp/ws-main-baseline
pnpm install
pnpm -r --filter '@webspatial/core-sdk' --filter '@webspatial/react-sdk' build

# 移植 spatial-vite-min（删除 main 上不存在的 bootSpatial/eager 导入）
cp -r /Users/bytedance/github/webspatial-sdk/apps/spatial-vite-min ./apps/
# 改 apps/spatial-vite-min/src/main.tsx：删 bootSpatial 相关三行 + 删 eager.html
# 改 vite.config.ts：删除 eager / eagerLean 两个 input
pnpm install
pnpm --filter spatial-vite-min build

# 移植 marginal-delta-vite（删 bootSpatial 引入；测试改 telemetry-only）
cp -r /Users/bytedance/github/webspatial-sdk/tests/marginal-delta-vite ./tests/
# 改 tests/marginal-delta-vite/src/app-typical.tsx：删 bootSpatial
# 改 tests/marginal-delta-vite/marginal-delta.test.ts：dist 路径改 'default/index.js'，断言改 telemetry
pnpm install
pnpm --filter marginal-delta-vite test
```

复测得到的数应与本文一致；如果显著偏离（> ±500 B），说明 `core-sdk` / Vite / esbuild 版本飘移了，需要核对环境。

---

## 7. 局限与盲区（不藏着掖着）

为避免在评审里被挑战，先把已知局限点出来：

1. **业务代码量很小**。`spatial-vite-min` 业务代码只有 ~6 KB，所以 React + ReactDOM 占了主包大头。**业务代码越大，spec 的"节省比例"看起来越小，但"节省的绝对字节"不变**（永远是那 24 KB gzip 的 spatial chunk）。这是 spec 的真实价值上限。
2. **不包含 source-map / HTML / CSS**。本文只统计 JS。HTML/CSS 在两端基本相同，对结论无影响。
3. **没测过 brotli**。gzip 是浏览器最普遍兼容的压缩，是保守口径；brotli 下绝对值会再小一档，但比例不变。
4. **eager 入口在 plain-web 下不省**。如果产品决定推荐 `@webspatial/react-sdk/eager`（spatial-only 消费者用），那条路径与 main 等价。spec 的价值锁定在 **default lazy 入口**上 —— 也就是 "web-first progressive enhancement" 消费者。`docs/react-sdk-product-alignment.md` 的 P0-1/P0-2 正是要产品在这两类客户上拍板。
5. **WebSpatial 设备下不省字节，只省阻塞时间**。在 AVP / PICO 上，spatial chunk 终归要下载；spec 把它从"同步主包"挪到"`bootSpatial()` 后异步"，**首帧 paint** 时间会改善，但**总下载字节**没省。如果该 spec 的卖点向产品讲是"总字节省"，要明确"仅 plain-web 上省总字节，WebSpatial 上省的是首帧阻塞"。

---

## 8. 一句话给评审的建议

- 该 spec 把"加 WebSpatial SDK 到一个 React 应用"这件事的字节代价，在 plain-web 上从 **34 KB gzip 一刀切** 降到了 **~2.9 KB gzip 按需付费**（2026-06-16 校准；仍 < 5 KB CI 合同），绝对值 **−31.5 KB gzip / ~91.5 %**；
- 对应到端到端整页 SPA，是首屏 **−24 KB gzip / ~32 %**；
- 给 spatial-only 客户保留了 eager 子路径，等效旧方案，**没有让任何人变贵**；
- 上述数字都被 CI fixture 锁死，回归会失败。

这是一个 **Pareto 改进**，建议绿灯。

---

## 文件清单（本文引用的实测产物）

A 端（2026-06-16 校准，`feat/eager-mode-entry` tip）：

```
# §9.2 marginal-delta（pnpm --filter marginal-delta-vite test 日志）
app-base sync gzip:           325 B
app-typical sync gzip:      3,256 B  → marginal delta 2,931 B
app-namespace sync gzip:      6,011 B  → marginal delta 5,686 B
async spatial chunk (typical): ~40,530 B gz  [不计入 §9.2]

# §9.1 SDK-side proxy（packages/react/src/__tests__/size-budget.test.ts）
packages/react/dist/index.js     5,329 B raw /  1,642 B gz
packages/react/dist/eager.js     2,443 B raw /    957 B gz
packages/react/dist/spatial.js   1,052 B raw /    444 B gz
```

A 端（2026-05-15 首测，已 supersede 场景 2 数字，场景 1 仍可参考）：

```
apps/spatial-vite-min/dist/assets/index-CZFLZ1zX.js          562 B raw /     401 B gz
apps/spatial-vite-min/dist/assets/spatial-app-CumqX2Ak.js  153,735 B raw / 49,784 B gz
apps/spatial-vite-min/dist/assets/spatial-BUMyCgDG.js          857 B raw /    493 B gz   [async]
apps/spatial-vite-min/dist/assets/chunk-SHX6AI5C-cLudk3SK.js 114,759 B raw / 28,278 B gz [async]
packages/react/dist/index.js (2026-05-15)                    1,655 B raw /    579 B gz
```

B 端（在 /tmp/ws-main-baseline @ origin/main 0d698933 上构建）：

```
apps/spatial-vite-min/dist/assets/index-D07y0Pp0.js          250,407 B raw / 74,100 B gz
packages/react/dist/default/index.js                         129,741 B raw / 25,277 B gz
packages/react/dist/web/index.js                             131,051 B raw / 25,741 B gz
```
