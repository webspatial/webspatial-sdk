---
name: webspatial-release
description: |
  WebSpatial SDK 仓库的版本发布与 Changesets 使用规范。
  当你需要给 @webspatial/* 包发版、准备 stable 发布、做 alpha 预发布、或排查发版失败时使用。
  Release workflow & Changesets guide for WebSpatial SDK.
  Use this when you need to publish @webspatial/*, prepare a stable release, do an alpha pre-release, or troubleshoot release failures.
---

# WebSpatial 版本发布（Changesets）

本仓库是 `pnpm` workspace，多包发布由 `changesets` 统一驱动。

## English quick guide

- **Release branch: `stable`**. Publishing workflow runs on pushes to `stable`.
- **Fixed version group**: core/react/builder/platform packages are versioned together.
- **Commands**: `pnpm changeset`, `pnpm ci:publish`, `pnpm changeset:pre-enter`, `pnpm changeset:pre-exit`.
- **After publish**: CI tags `v<version>` and creates a sync PR from `stable` to `main`.

## 关键约定（务必先读）

- **发布主分支是 `stable`**：Changesets 发布工作流仅在 push 到 `stable` 时触发（`.changeset/config.json` 里的 `baseBranch` 也是 `stable`）。
- **一组包固定同版本**：`@webspatial/core-sdk`、`@webspatial/react-sdk`、`@webspatial/builder`、`@webspatial/platform-visionos`、`@webspatial/platform-androidxrapp` 属于 `fixed` 组，发布时会一起涨版本。
- **主分支 `main` 会被自动同步**：stable 发布成功后，CI 会自动创建 “Merge stable into main” 的同步 PR（见 `.github/workflows/changesets.yml`）。

## 什么时候需要 Changeset

以下情况 **必须** 加 `.changeset/*.md`：

- 修改了任何 `packages/*` 中的可发布内容（对外 API、类型、行为、构建产物）。
- 修复 bug / 新增特性 / 性能优化，且会影响用户。

以下情况 **可以不加**（但要确认不影响发布包）：

- 仅改 demo（`apps/test-server`）、仅改测试（不影响发布包）、仅改 CI。
- 纯内部重构且不改变对外行为（建议仍加 patch，避免漏发）。

## Changeset 如何写（建议模板）

在仓库根目录执行：

```bash
pnpm changeset
```

选择要发布的包与版本类型：

- **patch**：bugfix、小改动、兼容性增强（新增可选字段、修复边界条件）。
- **minor**：向后兼容的新能力（新增 API、默认行为不变但能力增强）。
- **major**：破坏性变更（删除/重命名 API、行为不兼容、强制迁移）。

正文建议包含：

- 变更点一句话（what）
- 影响与原因（why）
- 迁移说明（如有）

## 发布前自检（发版人/合入前都应做）

在仓库根目录：

```bash
pnpm install
pnpm run buildPackages
pnpm test
```

如果你改动涉及 React/事件/类型：

- 确认类型导出路径与 `exports` 没破坏（尤其是 `packages/react/package.json`）。
- 对事件新增字段，优先做“向后兼容”（新增可选字段），并补单测覆盖。

## 正式发布流程（stable 发布）

1. 确保本次要发布的改动都已在 PR 中合入，并且 changeset 已齐全。
2. 将 `main` 的发布内容合入 `stable`（团队按既定流程：merge / cherry-pick / PR）。
3. 当 `stable` 有新的 push：
   - GitHub Actions `Changesets` 工作流会自动运行（`.github/workflows/changesets.yml`）。
   - 它会先尝试创建 “chore: update versions” 的版本 PR；
   - 合并后会执行 `changeset publish`（脚本 `pnpm ci:publish`），并推送 `v<version>` tag；
   - 发布成功后会自动创建 stable → main 的同步 PR。

### 发布结果确认（建议）

- 在 GitHub Release / Tags 中确认出现 `v<version>`。
- 在 npm 上确认 `@webspatial/*` 对应版本已更新。
- 如使用 Preview Release，确认临时包已失效或无误。

## 预发布（alpha）

仓库提供了 alpha 预发布命令：

```bash
pnpm changeset:pre-enter
pnpm changeset:pre-exit
```

建议用法：

- 当需要给少量用户验证变更时，进入 `alpha` 预发布模式，生成 alpha 版本号，验证后退出。
- 注意：预发布仍应遵循 Changeset 规范，避免出现“发了 alpha 但忘记写 changeset”的情况。

## 预览发布（PR/分支的临时包）

仓库有 Preview release 工作流（`.github/workflows/preview-release.yml`），用于在 PR 上产出临时包。

- 触发方式：给 PR 打上标签 `trigger: preview`（或 push 到 `main/stable` 时满足条件）。
- 作用：把 `./packages/*` 发布成临时可安装版本，便于联调验证（通过 `pkg-pr-new`）。

## 常见故障排查

### 1) stable push 后没有触发发布

- 确认目标分支是 `stable`（不是 `main`）。
- 确认 GitHub Actions 工作流是否被禁用。

### 2) 发布没有产出新版本

- 大概率是本次合入没有 changeset，或 changeset 被误删。
- 检查 `.changeset/` 目录是否存在本次变更对应的 md 文件。

### 3) fixed 组版本不一致

- 本仓库配置为 fixed 组，理论上不应不一致。
- 若出现，检查 `.changeset/config.json` 的 `fixed` 配置是否被误改，或是否存在手动改版本号的提交。

### 4) 版本 PR 生成了但 publish 失败

- 先看 CI 日志里 `pnpm run setup` 是否成功（构建失败会导致 publish 失败）。
- 再看 npm 鉴权/权限问题（工作流使用 OIDC，相关问题需要在 CI 侧修复）。
