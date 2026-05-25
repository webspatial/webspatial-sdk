# WebSpatial React SDK — lazy-load + eager 技术评审

> **用途**：飞书评审会前 15 分钟速读 + 异步评论入口；normative 细节与实现 diff 一律以 GitHub 为准，本文不复制 spec 正文。  
> **分支**：`feat/eager-mode-entry` · **OpenSpec change**：`lazy-load-spatial-runtime`  
> **仓库**：https://github.com/webspatial/webspatial-sdk

---

## 0. 评审结论（请评审人在飞书评论区勾选）

| 项 | 说明 |
| --- | --- |
| ☐ | **同意 v1 合入**：lazy default + `/eager` 两条分发形态一并发布 |
| ☐ | **接受 BREAKING**：见 §2.3；业务方按迁移指南升级 |
| ☐ | **接受非目标**：test-server / autoTest / ci-test 深度迁移、跨仓 vite-plugin 弃用公告、部分 parity 补充不挡 v1 |
| ☐ | **有阻塞项**：（写明负责人 + 事项） |

---

## 1. 一句话

用 **runtime lazy-load** 替换「dual-build（`dist/web` vs `dist/default`）+ `@webspatial/vite-plugin` 切 alias」：

- **默认入口** `@webspatial/react-sdk`：plain web **不拉** spatial chunk；WebSpatial 里 **`await bootSpatial()`** 后再用真实实现，否则走文档化 fallback。
- **产品体积契约**：典型 `import { Model, bootSpatial }` 对应用 bundle 的 **gzip 边际增量 ≤ 8KB**（CI 锁死；实测 1.6-2.2KB，见 §2.2）。
- **可选 eager** `@webspatial/react-sdk/eager`：spatial-only、单请求静态链接；`bootSpatial` 为 no-op；**禁止与 default 混 import**；spatial 组件 **CSR-only**。

---

## 2. 五个必须拍板的设计点（评审重点）

### 2.1 默认入口 = web-first + 单一激活路径

- Plain browser / SSR：**不** `import()` spatial；`bootSpatial()` 立即 resolve。
- WebSpatial runtime：**必须**在首屏 spatial UI 前 `await bootSpatial()`，否则 `Model` 等走 fallback（如 `<model>`、`Reality` 占位 div），**不 throw**。
- 与旧架构差异：去掉 vite-plugin；bundler 需支持 ESM + `exports` + dynamic import code-splitting。

### 2.2 8KB 是 lazy default 的产品契约，eager 无单独上限

- 典型 consumer（Vite fixture `app-typical`）当前 CI 口径测得 **~2.2KB** gzip 边际增量（≤ 8KB，headroom 约 5.9KB）。
- 同分支包体收益报告中，React 外置 / peer 场景测得 **1.66KB** gzip 边际增量；两者口径不同，但结论一致：default lazy 远低于 8KB 上限。
- **`dist/index.js`** 侧 proxy ≤ 8KB；**eager** 故意 inline spatial，**不设** 30KB 类上限。

### 2.3 BREAKING（合入前业务需知）

1. 删除 `@webspatial/react-sdk/web`、`/default` 子路径 → 统一 default + 新增 `./eager`。
2. 默认入口 **不再** 打包 spatial 实现；WebSpatial 应用需 **`bootSpatial()`**（或用 eager 根）。
3. 四个 internal container/monitor **不再公开导出** → 用 JSX marker（`enable-xr` / `enable-xr-monitor`）。
4. **`createElement`** 标记 `@deprecated`（v2 移除）；推荐 `react-jsx` 自动 runtime。
5. **`@webspatial/vite-plugin` 不再需要**（跨仓 deprecation 见 tasks §11，非 v1 阻塞）。

### 2.4 第二条分发形态：`/eager`

| 画像 | 推荐入口 |
| --- | --- |
| PWA / 营销页 / 多数 plain web | `@webspatial/react-sdk` + `bootSpatial()` |
| 仅 AVP/Pico、无 plain web 路径 | `@webspatial/react-sdk/eager`（只改 import 根） |

- **SSR**：需要服务端 HTML 里 spatial **façade fallback** → 用 **default**；eager 的 spatial 组件须 **CSR gate**（Next `dynamic(..., { ssr: false })` 等）。
- **禁止** 同一 bundle 混 `react-sdk` 与 `react-sdk/eager`。

### 2.5 v1 明确不做（不挡合并）

| 跟进项 | 状态 |
| --- | --- |
| `apps/test-server` 迁 dist + code-split | 仍 alias **eager 源码**（WebSpatial 回归专用） |
| `autoTest` / `ci-test` 与 npm 消费者完全一致的 dist 断言 | 已 **`bootSpatial()`**，深度用例留作 follow-up |
| Turbopack / Module Federation | out of scope |
| 部分 facade Path1↔Path2 parity | `parity.test.tsx` 里 **`it.todo`**，v1.x 补 spec |
| `web-builder-plugins` vite-plugin 弃用公告 | 跨仓 follow-up，非阻塞 |

---

## 3. 谁该关心什么（30 秒分流）

| 角色 | 重点看 |
| --- | --- |
| **负责人 / 产品** | 上文 §2 五点 + §2.3 BREAKING 对用户的影响 |
| **SDK / 平台** | bridge / `bootSpatial`、8KB CI、`tsup` 三入口、去掉 plugin |
| **业务 App** | [迁移指南 TL;DR](https://github.com/webspatial/webspatial-sdk/blob/feat/eager-mode-entry/docs/migration/lazy-load-spatial-runtime.md) + eager vs default 选型 |
| **QA / CI** | `pnpm --filter @webspatial/react-sdk test`；fixture：`spatial-vite-min`、`spatial-rspack-min`、`spatial-next-min` `/eager-ssr` |

---

## 4. 建议评审顺序（链 GitHub，会上不念长文）

1. **本页 §2** — 拍板五项  
2. **[REVIEW.md](https://github.com/webspatial/webspatial-sdk/blob/feat/eager-mode-entry/openspec/changes/lazy-load-spatial-runtime/REVIEW.md)** — TL;DR + 13 Requirements 索引表  
3. **实现 PR**（`feat/eager-mode-entry` → `main`）— Summary / Test plan / Out of scope（PR 创建后补链接）  
4. **代码抽样**：`packages/react/src/runtime/` → `facades/` → `index.ts` / `eager.ts` → `tsup.config.ts` → `src/__tests__/`  
5. **有争议再开**：[spec.md](https://github.com/webspatial/webspatial-sdk/blob/feat/eager-mode-entry/openspec/changes/lazy-load-spatial-runtime/specs/spatial-lazy-load/spec.md) 对应 Requirement  

---

## 5. 实现完成度（`tasks.md` 摘要）

- **§1–§10、§13–§16**：核心实现与文档 **已完成**（含 eager、8KB 校准、SSR/hydration、parity .harness）。  
- **§11**：vite-plugin 跨仓跟进 — **未做，非阻塞**。  
- **§12**：test-server / autoTest / ci-test 深度迁移 — **部分**（见 §2.5）；**§12.6 Rspack fixture、§12.9 预算校准已完成**。  
- **§15.8**：部分 parity — **`it.todo`**，CI 可见，不挡 v1。

完整勾选表：[tasks.md](https://github.com/webspatial/webspatial-sdk/blob/feat/eager-mode-entry/openspec/changes/lazy-load-spatial-runtime/tasks.md)

---

## 6. 建议 Test plan（评审后可自测）

```bash
# React SDK 单测 + 体积预算（合入前建议跑一遍）
pnpm --filter @webspatial/react-sdk test
pnpm run test:size-budget

# Consumer-shaped fixtures（可选）
pnpm --filter spatial-vite-min build
pnpm run test:rspack-compat
```

- **E2E**：`npm run ciTest`（需 Vision Pro 模拟器）；`npm run test:auto`（Puppeteer，需本地 setup）。  
- **本地 demo**：`npm run dev`（test-server，eager 源码 alias）。

---

## 7. 已知风险（决策级，细节见 design.md）

1. **无 code-split 的 bundler**：功能正常，但 **失去** 应用侧体积收益（esbuild 需 `splitting: true`）。  
2. **混 import default + eager**：不支持，可能 readiness 行为混乱。  
3. **忘记 `bootSpatial()`**：WebSpatial 内走 fallback + dev 一次 warning；plain web 静默。

---

## 8. GitHub 链接索引（飞书内可做成超链）

| 文档 | 链接 |
| --- | --- |
| 评审深读（GitHub） | [REVIEW.md](https://github.com/webspatial/webspatial-sdk/blob/feat/eager-mode-entry/openspec/changes/lazy-load-spatial-runtime/REVIEW.md) |
| 为什么 / 做什么 | [proposal.md](https://github.com/webspatial/webspatial-sdk/blob/feat/eager-mode-entry/openspec/changes/lazy-load-spatial-runtime/proposal.md) |
| 14 条设计决策 | [design.md](https://github.com/webspatial/webspatial-sdk/blob/feat/eager-mode-entry/openspec/changes/lazy-load-spatial-runtime/design.md) |
| 任务清单 | [tasks.md](https://github.com/webspatial/webspatial-sdk/blob/feat/eager-mode-entry/openspec/changes/lazy-load-spatial-runtime/tasks.md) |
| Normative spec | [spatial-lazy-load/spec.md](https://github.com/webspatial/webspatial-sdk/blob/feat/eager-mode-entry/openspec/changes/lazy-load-spatial-runtime/specs/spatial-lazy-load/spec.md) |
| 迁移指南（业务） | [docs/migration/lazy-load-spatial-runtime.md](https://github.com/webspatial/webspatial-sdk/blob/feat/eager-mode-entry/docs/migration/lazy-load-spatial-runtime.md) |
| 包体收益报告 | [docs/lazy-load-spatial-runtime-size-impact.md](https://github.com/webspatial/webspatial-sdk/blob/feat/eager-mode-entry/docs/lazy-load-spatial-runtime-size-impact.md) |
| React README 双入口 | [packages/react/README.md](https://github.com/webspatial/webspatial-sdk/blob/feat/eager-mode-entry/packages/react/README.md) |

**Fixture 参考**

- Lazy consumer：`apps/spatial-vite-min`  
- Rspack：`apps/spatial-rspack-min`（`pnpm run test:rspack-compat`）  
- Next eager + SSR 边界：`apps/spatial-next-min` → `/eager-ssr`  
- Remix 同类：`apps/spatial-remix-min` → `/eager-ssr`

---

## 9. 飞书粘贴说明

1. 新建飞书文档，标题建议：**「React SDK lazy-load + eager — 技术评审」**。  
2. 将本文 **§1–§7** 粘贴到正文（§8 链接在飞书中用「插入链接」或保留 Markdown 超链）。  
3. §「评审结论」表格改为飞书 **待办/勾选** 组件（或评审纪要里逐条回复 ☐）。  
4. PR 创建后，在 §4 第 3 步补上 **PR URL**；合并前把分支名从 `feat/eager-mode-entry` 改成实际分支即可。  
5. **不要**把 `spec.md` 全文贴进飞书 — 争议点只链 GitHub Scenario。

---

*Generated for internal Feishu review. Source of truth remains OpenSpec + merged `main`.*
