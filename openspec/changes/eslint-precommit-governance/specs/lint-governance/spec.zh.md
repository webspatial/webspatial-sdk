# Lint 治理(WebSpatial SDK monorepo)

## ADDED Requirements

### Requirement: 统一的根 ESLint 配置管辖治理目录

仓库 SHALL 使用单一的根级 ESLint 9 flat config(`eslint.config.js`)作为治理目录唯一的
ESLint 配置入口,并且 SHALL NOT 在这些目录中保留包级 ESLint 配置文件。

本次变更的治理目录:

- `apps/test-server`
- `tests/ci-test`
- `packages/cli/src`

#### Scenario: 根 flat config 对治理文件生效

- **WHEN** ESLint 为 `apps/test-server`、`tests/ci-test` 或 `packages/cli/src` 下的文件解析配置
- **THEN** 使用根 `eslint.config.js`
- **AND** 没有包级 `.eslintrc*` 或 `eslint.config.*` 文件参与解析

#### Scenario: 旧的拆分配置已移除

- **WHEN** 变更后检查仓库
- **THEN** `apps/test-server/.eslintrc.cjs` 不存在
- **AND** `tests/ci-test/eslint.config.js` 不存在

### Requirement: 包级 lint 脚本委托给 workspace-root 的 ESLint

每个治理包 SHALL 保留 `lint` 脚本,且该脚本 SHALL 通过 `pnpm --workspace-root exec eslint`
使用 workspace-root 安装的 ESLint 执行,避免包级 ESLint 依赖重复。

#### Scenario: 包级 lint 脚本运行根 ESLint

- **WHEN** 开发者运行 `pnpm --filter <治理包> lint`
- **THEN** ESLint 从 workspace root 针对该包的治理路径运行
- **AND** 该包不声明自己的 ESLint 依赖

### Requirement: pre-commit 移除治理暂存文件中的未使用 import

根 `lint-staged` 配置 SHALL 对治理目录中暂存的 JavaScript/TypeScript 文件在
`prettier --write` 之前运行 `eslint --fix`,且强制启用的 ESLint 规则
`unused-imports/no-unused-imports` SHALL 自动移除未使用的 import。现有的文件大小、
字符校验、Swift 格式化与 Prettier 任务 SHALL 保留。

#### Scenario: 暂存文件中的未使用 import 在提交时被修复

- **WHEN** 治理目录下的某个暂存文件包含未使用的 import
- **AND** pre-commit 钩子(`simple-git-hooks` -> `pnpm lint-staged`)运行
- **THEN** `eslint --fix` 在 `prettier --write` 格式化之前移除该未使用 import

#### Scenario: 历史 warning 不阻断提交

- **WHEN** 治理文件包含历史遗留的 React Hooks、React Refresh 或 CLI inline-disable 警告
- **THEN** 这些问题仅以 warning 形式出现
- **AND** lint 步骤以成功状态退出(0 errors)
