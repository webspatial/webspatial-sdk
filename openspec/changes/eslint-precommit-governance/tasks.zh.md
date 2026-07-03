## 1. 盘点与决策记录

- [x] 1.1 分析前读取仓库 agent 指令。
- [x] 1.2 盘点 `.eslintrc*` 和 `eslint.config.*` 文件。
- [x] 1.3 盘点 package `lint` 脚本。
- [x] 1.4 盘点 `lint-staged`、`simple-git-hooks` 和 `husky` 使用情况。
- [x] 1.5 将 package 分类为已有 ESLint 配置、有 lint 脚本但无配置、未接入 ESLint。
- [x] 1.6 决定采用根级 ESLint 9 flat config，而不是继续保留分裂配置体系。

## 2. 根级 ESLint 治理

- [x] 2.1 增加根级 ESLint 依赖。
- [x] 2.2 新增根级 `eslint.config.js`。
- [x] 2.3 将 React Hooks 和 React Refresh 行为收敛到根级 override。
- [x] 2.4 接入 `eslint-plugin-unused-imports`。
- [x] 2.5 在纳入治理目录接入统一配置期间，关闭会导致大面积历史清理的规则。

## 3. Package 迁移

- [x] 3.1 删除 `apps/test-server/.eslintrc.cjs`。
- [x] 3.2 删除 `tests/ci-test/eslint.config.js`。
- [x] 3.3 将 `apps/test-server` lint 脚本改为通过 `pnpm --workspace-root exec` 使用根 ESLint。
- [x] 3.4 将 `tests/ci-test` lint 脚本改为通过 `pnpm --workspace-root exec` 使用根 ESLint。
- [x] 3.5 将 `packages/cli` lint 脚本改为通过 `pnpm --workspace-root exec` 使用根 ESLint。
- [x] 3.6 移除已迁移 package 中重复的本地 ESLint 依赖。

## 4. Pre-commit 集成

- [x] 4.1 保留根 `simple-git-hooks` 作为 pre-commit hook 所有者。
- [x] 4.2 对 `apps/test-server` 中的 staged 文件，在 Prettier 前执行 `eslint --fix`。
- [x] 4.3 对 `tests/ci-test` 中的 staged 文件，在 Prettier 前执行 `eslint --fix`。
- [x] 4.4 对 `packages/cli/src` 中的 staged 文件，在 Prettier 前执行 `eslint --fix`。
- [x] 4.5 保留已有 Prettier、Swift format、文件大小检查和字符检查任务。

## 5. 验证

- [x] 5.1 执行依赖安装并更新 lockfile。
- [x] 5.2 验证根 ESLint config 可加载。
- [x] 5.3 验证已纳入治理目录的 ESLint 配置解析。
- [x] 5.4 执行 `pnpm --filter web-content lint`。
- [x] 5.5 执行 `pnpm --filter ci-test lint`。
- [x] 5.6 执行 `pnpm --filter @webspatial/builder lint`。
- [x] 5.7 执行 `pnpm lint`。
- [x] 5.8 执行 `pnpm exec lint-staged --debug`。
- [x] 5.9 对编辑过的配置文件执行 Prettier check。
- [x] 5.10 检查编辑过的文本文件以换行符结尾。

## 6. `packages/core` 接入

- [ ] 6.1 为 `packages/core` 增加聚焦的根级 ESLint override。
- [ ] 6.2 为 `packages/core` 增加委托给 `pnpm --workspace-root exec eslint` 的 lint 脚本。
- [ ] 6.3 以 report-only 方式对 `packages/core` 运行 ESLint，并对历史问题分类。
- [ ] 6.4 决定 `packages/core` 的首批 enforcement 子集，从 unused imports 和低风险规则开始。
- [ ] 6.5 在选定 enforcement 子集通过后，将 `packages/core` 加入根 `pnpm lint`。
- [ ] 6.6 只有在 staged 文件自动修复行为验证通过后，才为 `packages/core` 增加 `lint-staged` 入口。

## 7. `packages/react` 接入

- [ ] 7.1 为 `packages/react` 的 source、tests、build/config 文件增加根级 ESLint override。
- [ ] 7.2 为 `packages/react` 增加委托给 `pnpm --workspace-root exec eslint` 的 lint 脚本。
- [ ] 7.3 以 report-only 方式对 `packages/react` 运行 ESLint，并对 React Hooks、test、TypeScript 和 unused import 问题分类。
- [ ] 7.4 决定首批 enforcement 是覆盖整个 `packages/react`，还是先覆盖安全子集，例如 `src/**/*.{ts,tsx}`。
- [ ] 7.5 在选定 enforcement 子集通过后，将 `packages/react` 加入根 `pnpm lint`。
- [ ] 7.6 只有在 staged 文件自动修复行为验证通过后，才为 `packages/react` 增加 `lint-staged` 入口。

## 8. 后续事项

- [ ] 8.1 清理 `packages/cli` 中过时的 `@typescript-eslint/camelcase` disable 注释。
- [ ] 8.2 判断 `apps/test-server` 中历史 React Hooks / React Refresh warning 是否应升级为阻塞项。
- [ ] 8.3 将 fixture 应用纳入 pre-commit ESLint fix 前，单独评估其 lint 策略。
