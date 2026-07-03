## 为什么

**问题**

仓库里原本存在多个 ESLint 入口，且 pre-commit 没有统一执行 ESLint 自动修复。`apps/test-server` 使用 ESLint 8 的 `.eslintrc.cjs`，`tests/ci-test` 使用 ESLint 9 flat config，`packages/cli` 有 lint 脚本但缺少完整的本地 ESLint 配置和依赖。根目录的 `lint-staged` 只做格式化和仓库守卫检查，因此未使用 import 和可自动修复的 lint 问题仍可能进入提交。

**方案**

将 ESLint 治理收敛到 workspace 根目录：使用 ESLint 9 flat config，子包只保留薄 lint 入口，并在根级 lint 和 pre-commit 流程中接入 `eslint-plugin-unused-imports`。本变更覆盖应纳入统一治理的仓库区域：

- `apps/test-server`
- `tests/ci-test`
- `packages/cli/src`
- `packages/core`
- `packages/react`

**为什么现在做**

这是工程化治理工作，不应该混入功能 PR。用 OpenSpec 补写该变更，可以让评审明确范围、风险控制、验证结果和后续清理项。

## 改动内容

- 新增根级 ESLint flat config，作为唯一 ESLint 配置入口。
- 删除 `apps/test-server` 和 `tests/ci-test` 中分裂的 ESLint 配置。
- 将 ESLint 相关依赖集中到根 `package.json`。
- 接入 `eslint-plugin-unused-imports`，启用未使用 import 的自动移除。
- 保留子包 lint 脚本，但统一走 workspace root 的 ESLint 安装和配置。
- 扩展根 `lint-staged`，让纳入治理目录里的 staged JavaScript / TypeScript 文件先执行 `eslint --fix`，再执行 `prettier --write`。
- 保留已有文件大小检查、字符检查、Swift 格式化和 Prettier 流程。

## 范围

**纳入范围：**

- `apps/test-server`
- `tests/ci-test`
- `packages/cli/src`
- `packages/core`
- `packages/react`
- 根 `package.json`
- 根 `pnpm-lock.yaml`
- 根 `lint-staged` 和 `simple-git-hooks` 集成

**本次不纳入：**

- `packages/visionOS`
- `tests/autoTest`
- `tests/*-compat` 兼容性 fixtures
- Next、Vite、Remix、Rspack 等最小应用 fixtures

这些不纳入目录当前要么没有接入 ESLint，要么依赖框架特定 lint 行为，要么需要先清理历史问题后再安全纳入 pre-commit enforcement。`packages/core` 和 `packages/react` 已纳入本需求范围。

## 影响

- **仓库工作流：** pre-commit 会在已验证目录中自动修复未使用 import。
- **开发命令：** 当本变更所有任务完成后，根目录 `pnpm lint` 应检查全部已纳入治理的目录。
- **子包脚本：** `web-content`、`ci-test`、`@webspatial/builder` 仍保留可用的 lint 脚本。
- **兼容性：** 不改变 SDK 运行时行为和公开 API。
- **已知遗留 warning：** `apps/test-server` 中的历史 React Hooks / React Refresh warning，以及 `packages/cli` 中旧的 `@typescript-eslint/camelcase` disable 注释，暂时保留为 warning，不阻塞本次迁移。

## 验证

实施后已执行的验证：

- `pnpm install --ignore-scripts`
- 通过 Node 加载 ESLint config
- 对 `apps/test-server`、`tests/ci-test`、`packages/cli` 执行 ESLint `--print-config`
- `pnpm --filter web-content lint`
- `pnpm --filter ci-test lint`
- `pnpm --filter @webspatial/builder lint`
- `pnpm lint`
- `pnpm exec lint-staged --debug`
- 对编辑过的配置文件执行 `pnpm exec prettier --check`
- 检查编辑过的文本文件末尾换行
