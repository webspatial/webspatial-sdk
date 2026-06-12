# SpatializedMotionController 设计审查 TODO

## 说明

- `[x]` 表示该项决策已经确认，或该项工作已经完成
- `[ ]` 表示该项工作尚未完成，或该项问题尚未拍板
- 评审判断口径：同时参考 React SDK 目标 API 和 Core 导出 surface，但以 React SDK 目标 API 为优先

## 已确认决策

### 1. 删除 `nativeControlling`

- [x] 决策已确认
- [x] 删除 `NativePlaybackBackend.nativeControlling`
- [x] 清理依赖该私有字段的测试写法
- [x] 将相关测试改为断言可观察行为，而不是直接改私有状态

### 2. 删除 `nativeSessionAnimating`

- [x] 决策已确认
- [x] 从控制器实现中删除 `nativeSessionAnimating`
- [x] 从 `SpatializedMotionHandle` 接口中删除 `nativeSessionAnimating`
- [x] 从 `noRuntime` 对齐实现中删除对应字段

### 3. 删除 `MotionKindPolicy.capabilityToken`

- [x] 决策已确认
- [x] 从 `MotionKindPolicy` 中删除 `capabilityToken`
- [x] 清理相关类型定义和初始化数据

### 4. 能力映射逻辑统一到一个地方

- [x] 决策已确认
- [x] 将默认 `kind -> capability` 映射保留在 `core` 一处
- [x] 移除 React 侧默认能力映射的重复逻辑
- [x] 确保正常生产路径走 `core` 默认 resolver

### 5. 旧 `definition` 命名已收敛为 `config`

- [x] 决策已确认
- [x] 将公开 getter 从 `definition` 收敛为 `config`
- [x] 将更新方法从 `updateDefinition` 收敛为 `updateConfig`
- [x] 同步更新调用点与测试命名

### 6. 命名统一向 `config` 收敛

- [x] 决策已确认
- [x] 将 `definition` 相关命名统一到 `config`
- [x] 将 `updateDefinition` 收敛为 `updateConfig`
- [x] 同步更新调用点与测试命名

### 7. `CapabilityResolver` 命名后续顺手优化

- [x] 决策已确认
- [x] 当前不把命名问题作为主处理项
- [x] 将其归入后续可选的低优先级可读性整理，不阻塞本轮实施

### 8. 保留 `supportsMotionKind`

- [x] 决策已确认
- [x] 当前保留 `supportsMotionKind`
- [x] 保持其作为注入 seam 的定位，不将其表述为 React SDK 面向用户的推荐 API
- [x] 明确测试注入与业务配置的边界，正常生产路径继续走 `core` 默认 resolver

### 9. 移除 `element.motion(config)`

- [x] 决策已确认
- [x] 从 `SpatializedElement` 抽象契约中移除 `motion(...)`
- [x] 从 `Spatialized2DElement` 中移除 `motion(...)`
- [x] 从 `SpatializedStatic3DElement` 中移除 `motion(...)`
- [x] 从 `SpatializedDynamic3DElement` 中移除 `motion(...)`
- [x] 从 openspec 设计文档中移除 `element.motion(config)` 相关表述
- [x] 检查提案和任务文档中是否还有对应描述需要同步清理

### 10. 保留 `forceNativePlayback`

- [x] 决策已确认
- [x] 当前保留 `forceNativePlayback`
- [x] 后续仅在确有必要时再重新评估其公开暴露方式
- [x] 避免将其表述为 React SDK 面向用户的推荐 API

### 11. `kindOrOptions` 改成单一 options 对象

- [x] 决策已确认
- [x] 将控制器构造函数收敛为单一 options 对象形态
- [x] 保持 `kind` 不进入 options，而在运行时绑定阶段设置
- [x] 清理 `kindOrOptions` 分支解析逻辑
- [x] 同步更新调用点与测试

### 12. 收紧 React SDK 根入口的 motion reexport

- [x] 决策已确认
- [x] 从 `packages/react/src/index.ts` 删除 `SpatializedMotionController` 的根入口 reexport
- [x] 从 `packages/react/src/index.ts` 删除 `SpatializedMotionHandle` 的根入口 type reexport
- [x] 明确该收口仅针对 React SDK 根入口，不影响 core 实现与内部使用
- [x] 同步更新公开入口相关文档描述，避免继续将其表述为 React SDK 根入口公开导出

### 13. 收紧 React motion 子入口的导出

- [x] 决策已确认
- [x] 从 `packages/react/src/spatialized-container/motion/index.ts` 删除 `SpatializedMotionController` 导出
- [x] 从 `packages/react/src/spatialized-container/motion/index.ts` 删除 `SpatializedMotionHandle` 导出
- [x] 明确该收口仅针对 React motion 子入口导出，不影响 core 实现与 React 内部使用
- [x] 同步收敛根入口与公开文档描述

### 14. `SpatializedMotionControllerOptions` 继续保持单一 options 容器

- [x] 决策已确认
- [x] 继续将控制器相关字段保留在一个 options 对象中
- [x] 在单一 options 方案下，通过命名和导出面表达字段边界
- [x] 避免进一步拆成多组 options 结构

### 15. `kind` 的时序约束

- [x] 决策已确认
- [x] 允许 controller 在构造阶段没有 `kind`
- [x] 保证 backend 真正执行 playback 前，`kind` 已由绑定流程设置完成并可读取
- [x] 在设计与实现中明确这是一条必须满足的约束

### 16. `attachElement(...)` 的复合职责本轮先不改

- [x] 决策已确认
- [x] 当前保留 `attachElement(...)` 现有复合职责
- [x] 本轮不调整其绑定后可能自动触发的行为
- [x] 后续如需收敛职责，再单独处理绑定与触发逻辑的拆分

### 17. `autoStart` 与 `pendingPlay` 语义本轮维持现状

- [x] 决策已确认
- [x] 当前继续保留 `autoStart` 与 `pendingPlay` 共存
- [x] 继续维持当前绑定后触发语义
- [x] 后续如需调整，再单独收敛这两个信号的关系

### 18. 命名统一后保留 `config` getter

- [x] 决策已确认
- [x] 在命名统一到 `config` 后，继续保留公开只读 getter
- [x] 保持该结论与前面的命名收敛决策一致
- [x] 后续实现时同步完成 getter 与 updater 的命名统一

## 待确认事项

## 备注

- 当前文档用于跟踪 `SpatializedMotionController` 相关设计审查决策和实施进度。
- 本文档不代表代码已经完成修改，勾选状态需要随实施过程持续更新。