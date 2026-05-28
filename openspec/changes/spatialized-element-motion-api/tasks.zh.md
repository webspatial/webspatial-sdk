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

- [ ] Entity transform timeline 通过现有 `useAnimation` / `AnimateTransform`（不走 `SpatializedMotionController`）
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
