# 任务 — spatialized-element-motion-api

## Phase 0 — 伞式 spec（文档）

- [x] 创建 change `spatialized-element-motion-api`，包含 proposal、design、能力矩阵
- [x] 添加子 spec：`spatialized-element-motion`、`spatialized-2d-motion`、`spatialized-static3d-motion`、`spatialized-entity-motion`（entity 推迟）
- [x] 在 API.zh.md + motion spec 中标注 `spatial-div-motion-api` 为仅 2D 的已交付范围

## Phase 1 — 统一命名 + 路由（React）

- [x] 导出 `Spatialized*` 类型别名和 `useSpatializedMotion(config)`
- [x] 移除按 kind 的 React hook 别名；公共 API 仅为 `useSpatializedMotion`
- [x] 共享 React 内部模块：`useMotionController`、`createMotionBinding`、`createPlaybackApi`

## Phase 2 — Static3D + Dynamic3D native timelines

- [x] Core：`SpatializedStatic3DElement.animateMotion()` / `SpatializedDynamic3DElement.animateMotion()` 通过统一的 `AnimateSpatializedElementMotion`
- [x] Native：`SpatializedContainerMotionAnimationManager` + 单一 JSB 监听器 `AnimateSpatializedElementMotion`（`targetKind`: static3d | dynamic3d）
- [x] React：Model / Reality `motion` 绑定；`useSpatializedMotion(config)` 绑定时目标解析
- [x] test-server 演示页在 **Spatialized Motion** 下（`model-container`、`reality-container`）

## Phase 3 — Core + React 合并（单一控制器）

- [x] `SpatializedMotionController` — 单一实现，按 kind 的 `MOTION_KIND_POLICIES`
- [x] `motionElementBridge` — 统一 `animateMotion` + `targetKind` 覆盖所有 kind（`animateSpatialDiv` 保留为 2D 别名）
- [x] 瘦子类：`SpatialDivMotionController`、`Static3DMotionController`、`Dynamic3DMotionController`
- [x] `SpatializedMotionHandle` 由统一控制器实现
- [x] OpenSpec design / API.zh / tasks 与合并架构对齐

## Phase 4 — Entity timeline（推迟）

- [ ] Entity transform timeline 通过 `useEntityAnimation` / `AnimateTransform`（不走 `SpatializedMotionController`）
- [ ] 子 spec `spatialized-entity-motion` 保持信息性，直到产品优先级确定

## Phase 5 — Native 合并 + 公共接口清理

- [x] 合并 native Swift Static3D/Dynamic3D managers → `SpatializedContainerMotionAnimationManager` + `SpatializedMotionTransformSink`
- [x] 统一 JSB `AnimateSpatializedElementMotion` + 仅 `targetKind`（移除 `AnimateSpatializedStatic3DElement` / `AnimateSpatializedDynamic3DElement`）
- [x] 将 2D 合入 `AnimateSpatializedElementMotion`（`targetKind: spatialized2d`）；移除 `AnimateSpatialized2DElement` JSB
- [x] 移除废弃的 Core 控制器类别名（`SpatialDivMotionController`、`Static3DMotionController`、`Dynamic3DMotionController`）
- [x] `supports('useSpatializedMotion', [target])` 顶层能力（对应 `useAnimation` element/static3d/dynamic3d 标志）
- [ ] Static3D / Dynamic3D 的 Web RAF（推迟 — 产品要求 3D 容器仅 native）

## Phase 6 — 统一 JSB for 2D + `Spatialized*` 类型重命名

- [x] 规范类型位于 `types/spatializedMotion.ts`、`spatializedVisual.ts`、`spatializedPlayback.ts`、`spatializedMotionBinding.ts`
- [x] 移除 `SpatialDiv*` 类型模块和废弃 JSB 别名
- [x] `parseSpatializedVisualValues`、`validateSpatializedMotionConfig`、`spatializedMotionSegmentValidator`

## Phase 6b — 统一 JSB for 2D（在 Phase 6 提交中完成）

- [x] 扩展 `AnimateSpatializedElementMotion` 增加 `targetKind: spatialized2d`
- [x] 在统一监听器中将 native 2D 路由到 `SpatialDivAnimationManager`
- [x] Core：`executeAnimateSpatializedElementMotion` 覆盖所有 kind；移除 `AnimateSpatialDivJSBCommand`
- [x] 保留 `animateSpatialDiv()` 作为 `Spatialized2DElement` 上的废弃别名（供 `useSpatialDivAnimation` 使用）

## Phase 7 — Spec 合并 + 双语文档

- [x] 将 Plan A（`spatial-div-animation-api`）和 Plan B（`spatial-div-motion-api`）合并到统一伞式下
- [x] 归档 `spatial-div-animation-api/` 和 `spatial-div-motion-api/` 到 `openspec/changes/archive/`
- [x] 创建 `specs/legacy-session-animation/` 子 spec（EN + ZH）作为 Plan A 兼容层
- [x] 将可行性文档移到 `references/`
- [x] 重写 `proposal.md` 和 `proposal.zh.md`，包含完整历史叙事（Plan A → Plan B → 统一）
- [x] 重写 `design.md` 和 `design.zh.md`，包含全面的统一设计（含旧版兼容部分）
- [x] 将详细 2D 动画 spec 内容整合到 `specs/spatialized-2d-motion/spec.md` 和 `.zh.md`
- [x] 为所有子 spec 添加 `.zh.md` 版本（`spatialized-element-motion`、`spatialized-static3d-motion`、`spatialized-dynamic3d-motion`）
- [x] 添加 `CAPABILITY_MATRIX.zh.md`
- [x] 移除 `COMPARISON.md`（合并后不再需要）
- [x] 更新 `tasks.md` 并创建 `tasks.zh.md`

## Phase 8 — 绑定时目标解析（API 重塑）

- [x] 从 `SpatializedMotionConfig` 公共类型中移除 `kind`（config 不再携带目标）
- [x] `useSpatializedMotion` 返回值从对象 `{ style, api, motion, controller }` 改为元组 `[animation, api, style]`
- [x] 在 `animation` binding 中实现延迟目标槽位（挂载前目标未知）
- [x] `<div enable-xr motion={animation}>` → 解析目标为 `spatialized2d`，激活 Web RAF + native 策略
- [x] `<Model motion={animation}>` → 解析目标为 `static3d`，激活仅 native 策略
- [x] `<Reality motion={animation}>` → 解析目标为 `dynamic3d`，激活仅 native 策略
- [x] `style` 对仅 native 目标（static3d / dynamic3d）返回 `{}`；对 2D 返回活跃 CSSProperties
- [x] 绑定前 `api.play()` 将命令排队；目标解析后播放开始
- [x] 单绑定约束：同一 `animation` 绑定到多个组件时警告/抛错
- [x] 移除 `useSpatializedMotion.simple()` 公共接口；统一 hook 直接接受 `from/to` 或 `tracks`
- [x] 移除 `useSpatializedMotion.ts` 内部的 `switch (config.kind)` 路由
- [x] 更新所有 test-server 演示页为新元组 API
- [x] 更新单元测试（`useSpatializedMotion.behavior.test.tsx`、`.native.test.tsx`）
- [x] 更新 `@webspatial/core-sdk` 导出：`SpatializedMotionKind` 从公共接口移除（仅内部使用）

## Phase 9 — Playback API 扩展（stop / reset / finish）

- [x] 类型：`SpatializedPlaybackApi` — 移除 `cancel(keys?)`，新增 `stop()`、`reset()`、`finish()`
- [x] 类型：Config callbacks — 移除 `onCancel`，新增 `onStop`、`onReset`；`finish()` 复用 `onComplete`
- [x] 类型：`SpatializedPlaybackError.command` — `'cancel'` 替换为 `'stop' | 'reset' | 'finish'`
- [x] Controller：`cancel()` 重命名为 `reset()`（逻辑不变：emit from 值 + idle + `onReset`）
- [x] Controller：实现 `stop()` — 冻结在当前采样值 + idle + `onStop`
- [x] Controller：实现 `finish()` — 跳到终态值 + finished + `onComplete`
- [x] Controller：`stop()`/`reset()`/`finish()` 不接受 `keys?` 参数（整体会话操作）
- [x] Native JSB：确认 `finish` 是否需要新命令类型，还是 JS-only 实现（cancel + emit to 值）
- [x] 全量代码：全局 rename `cancel`→`reset`、`onCancel`→`onReset`（Controller + tests + demo pages）
- [x] picoOS native：如需新 JSB 命令则同步
- [x] 单元测试：验证 stop/reset/finish 各自产生正确的 style 值、playState 和回调触发
- [x] 子 spec 更新（spatialized-2d-motion、spatialized-static3d-motion、spatialized-dynamic3d-motion）如引用了 `cancel` 则同步修改

## Phase 9b — Playback API 语义修订追补

- [x] 将语义澄清任务从 Phase 9 挪出，保持 Phase 9 只覆盖原始 stop/reset/finish 扩展范围
- [x] 更新伞式 spec、2D spec、design 与 API 摘要，明确 `idle.reset()` 发出起点值、`idle.finish()` 发出终点值，并保持双语文档一致
- [x] Controller：调整 `stop()`，确保其只终止 active session，不 seek 到起点或终点
- [x] Controller：调整 `reset()`，确保当前 `playState` 为 `idle` 时仍会 emit 起点值
- [x] Controller：调整 `finish()`，确保当前 `playState` 为 `idle` 时仍会 emit 终点值并进入 `finished`
- [x] Controller：对齐 `finished` 标记语义，确保 `stop()` / `reset()` 强制为 `false`，`finish()` 强制为 `true`
- [x] Web 路径：校验 idle 态 `reset()` / `finish()` 仍通过 style outlet 发值
- [x] Native 路径：校验 `stop()` / `reset()` / `finish()` 与 Web 路径语义一致，且不会互相吞指令
- [x] 单元测试：补充 `idle.reset()`、`idle.finish()` 与终止命令独立性的回归覆盖

## Phase 9c — useSpatializedMotion 的 canonical tracks 执行路径收敛

- [x] 更新 `proposal.md` 和 `proposal.zh.md`，明确 `useSpatializedMotion` 的所有 authoring 形状（`from/to`、`timeline`、`tracks`）都会编译为 canonical `tracks`
- [x] 更新 `design.md` 和 `design.zh.md`，明确统一 motion 路径执行 canonical `tracks`，并移除 `useSpatializedMotion` 会降级到 native segment 的描述
- [x] 更新 `specs/spatialized-2d-motion/spec.md` 和 `.zh.md`，移除 native segment fallback / optimization 表述，并要求 native `useSpatializedMotion` 走 canonical tracks 路径
- [x] 更新 `specs/legacy-session-animation/spec.md` 和 `.zh.md`，明确旧版 native segment 路径已经删除，仅作为历史参考保留
- [x] 更新 `specs/spatialized-element-motion/spec.md` 和 `.zh.md`，补充 native `useSpatializedMotion` 持续执行 canonical tracks 模型
- [x] Controller bridge native manager 跟进：移除 `useSpatializedMotion` 执行路径中的 segment downgrade，并删除剩余的 legacy native segment fallback
- [x] Tests 跟进：覆盖 `from/to` 和 `tracks` 两种 authoring 形状最终进入同一 canonical tracks native 路径；百分比 key 的 `timeline` 覆盖仍保留在 Phase 10
- [x] 2D native suppression 仅跟随 active native playback，并在 terminal / unbind 时清除

## Phase 10 — Timeline 百分比关键帧配置 + timingFunction 统一

- [x] 类型：`SpatializedMotionKeyframeValues` — `SpatializedVisualValues & { timingFunction?: TimingFunction }`
- [x] 类型：`SpatializedMotionTimelineConfig` — 含 `timeline: Record<string, SpatializedMotionKeyframeValues>` 的配置形状
- [x] 类型：`SpatializedMotionKeyframe.timingFunction?` — 每帧可选字段
- [x] 类型：`SpatializedMotionTrack` — 将 `easing` 重命名为 `timingFunction`
- [x] 类型：`SpatializedMotionConfig.timingFunction?` — 全局 config 级字段
- [x] 类型：`SpatializedMotionTimeline`（wire 格式）— track 的 `easing` 改为 `timingFunction`
- [x] Core：`desugarTimelineConfig()` — 解析 `timeline` 百分比 key 为 tracks
- [x] Core：配置判别器 — 检测 timeline vs tracks vs from/to，相应路由
- [x] Core：`evaluateMotionTimeline` — 实现三级 `timingFunction` 级联（keyframe > track > config > 'linear'）
- [x] Core：校验 — 拒绝少于 2 个百分比 key、非法 key、与 tracks/from-to 的互斥
- [x] Native wire：决定向后兼容策略（保持 wire `easing` + JS 层映射，或重命名）
- [x] 代码库：将源代码 + 测试中所有 `easing` 引用重命名为 `timingFunction`
- [x] 单元测试：timeline 配置解析、小数百分比、缺失属性、单帧拒绝
- [x] 单元测试：三级 timingFunction 级联
- [x] Demo 页面：新增 timeline 百分比关键帧示例

## Phase 11 — 绑定 prop 重命名（`motion` → `xr-animation`）

- [x] 将所有目标组件的绑定 prop 从 `motion` 重命名为 `xr-animation`：
  - `<div enable-xr motion={animation}>` → `<div enable-xr xr-animation={animation}>`
  - `<Model motion={animation}>` → `<Model xr-animation={animation}>`
  - `<Reality motion={animation}>` → `<Reality xr-animation={animation}>`
- [x] 更新 `SpatializedMotionBinding` 内部 `__propName`，从 `'motion'` 改为 `'xr-animation'`
- [x] 更新 `createMotionBinding` 注册到 `xr-animation` prop key
- [x] 更新所有 React 组件 prop 类型定义（`ModelProps`、`RealityProps`、enable-xr 类型增强）
- [x] 更新 test-server 演示页：所有 `motion=` 替换为 `xr-animation=`
- [x] 更新单元/集成测试
- [x] 更新文档（spec、design、proposal、API.zh.md）— 仅 prop 引用

## Phase 12 — 将当前 `useAnimation` 重命名为 `useEntityAnimation`

- [x] 将当前公共 `useAnimation` 导出重命名为 `useEntityAnimation`
- [x] 从重命名后的 hook 中移除 SpatialDiv key 分流逻辑，确保 `useEntityAnimation` 仅用于 Entity
- [x] 将面向 Entity 的文档和示例改为 `useEntityAnimation`
- [x] 重构 `apps/test-server/src/pages/entity-animation/**`，改为导入 `useEntityAnimation`
- [x] 更新 Entity capability-check 页面及相关 runtime probe 文案，使用重命名后的 hook 名称
- [x] 验证重构后的 Entity `test-server` 页面仍可正常渲染并控制播放

## Phase 13 — 将 `useSpatializedMotion` 重命名为 `useAnimation`

- [x] 将公共 `useSpatializedMotion(config)` 重命名为 `useAnimation(config)`，保持现有目标无关 timeline 语义不变
- [x] 更新 `@webspatial/react-sdk` 导出和仓库内 import，切换到新的空间动画 hook 名称
- [x] 重构 `apps/test-server/src/pages/spatial-div-motion/**`，改为使用新的 `useAnimation` 导入
- [x] 重构 `apps/test-server/src/pages/spatial-element-motion/**`，改为使用新的 `useAnimation` 导入
- [x] 更新空间动画 capability-check 页面及相关 runtime probe 文案，使用重命名后的 hook 名称
- [x] 验证重构后的 spatialized-motion `test-server` 页面仍可正常渲染并控制播放

## Phase 14 — 删除 legacy SpatialDiv session 路径

- [x] Proposal/tasks 跟进：重写伞式 change 叙事，明确 Plan A 仅作为历史背景保留，不再作为兼容路径保留在目标态中
- [x] React 公共接口：移除 legacy `animation` prop 路径及其旧 SpatialDiv session 绑定流程
- [x] React 内部实现：在没有公共调用方后，删除 `useSpatialDivAnimation` 及其他仅服务于 legacy 的 wiring
- [x] Core 公共接口：移除 `animateSpatialDiv()` 及其他仅为 legacy session 路径保留的废弃 2D 别名
- [x] Demo 清理：删除或替换 `apps/test-server/src/pages/spatial-div-animation/**` 中仍依赖 legacy 入口的页面
- [x] Spec 清理：将 `specs/legacy-session-animation/` 改写为纯历史参考，或在最终 scope 不再需要时将其移出 active umbrella

## Phase 15 — visionOS 2D backend 收敛 + capability 契约收口

- [x] visionOS native 路由：将 `spatialized2d` 从 `onAnimateSpatialized2DMotion` / `SpatialDivAnimationManager` 收敛到统一的 `onAnimateSpatializedContainerMotion` / `SpatializedContainerMotionAnimationManager` 路径
- [x] visionOS 清理：在统一路径对 play pause resume stop reset finish 和 unbind cleanup 达到语义对齐后，删除旧 2D native 适配层
- [x] Capability 契约文档：保留 `useAnimation` 顶层 family key，并保留 `entity` 作为 subtoken，因为长期路线仍计划将 entity animation 再整合回 `useAnimation` family
- [x] Capability 使用约束：文档中明确具体运行时检查 MUST 使用 `supports('useAnimation', [subtoken])`；`supports('useAnimation')` 仅保留 family 级语义，MUST NOT 被当作目标可用性判断

## 阶段 — PicoOS 对齐

- [ ] 归档 picoOS Plan A（`spatial-div-animation-api`）到 `_archived/` ✅（2026-06-04 完成）
- [ ] 在 picoOS 仓库创建统一 `spatialized-element-motion-api` 变更 ✅（2026-06-04 完成）
- [ ] picoOS 阶段 1：JSB 协议迁移（`AnimateSpatialized2DElement` → `AnimateSpatializedElementMotion` + `targetKind`）
- [ ] picoOS 阶段 2：Canonical tracks 执行（将单一 from/to lerp 替换为多轨道评估器）
- [ ] picoOS 阶段 3：扩展终止命令（`stop`/`reset`/`finish` 及正确的值发射语义）
- [ ] picoOS 阶段 4：3 级 timingFunction 级联（keyframe > track > config > 'linear'）
- [ ] picoOS 阶段 5：Timeline 百分比关键帧反糖
- [ ] picoOS 阶段 6：遗留清理（JS SDK 迁移确认后移除 `AnimateSpatialized2DElement` 处理器）
- [ ] picoOS 阶段 7：测试（单元 + 集成，目标是与上游 Web RAF 评估器值对齐）
- [ ] 确认 JS SDK 不再发射 `AnimateSpatialized2DElement` → picoOS 可移除双监听适配