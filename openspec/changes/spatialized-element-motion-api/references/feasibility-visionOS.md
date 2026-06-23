# visionOS 可行性摘要（AnimationObject 目标态）

> **状态：** 本文件已按 `AnimationObject : SpatialObject` 目标态重写。旧版 Entity 对比 / Portal suppression 分析已作废。

## 结论

**可行。** Native 侧已有 `SpatializedElementMotionManager`、`TimelineSampler`、`TransformAdapter` 可复用；重构重点是：

1. 将 session 升格为 `AnimationObject : SpatialObject`（uuid 由 native 生成）
2. JSB 拆分为 `CreateSpatializedElementAnimation` + `ControlSpatializedElementAnimation`
3. 用 `SpatializedElement` animating mask 替代 React Portal suppression
4. 统一 `SpatialAnimationStateChanged` WebMsg 作为状态真相源

## 技术要点

| 项 | 方案 |
|----|------|
| 帧驱动 | 继续 `CADisplayLink` + `SpatializedElementMotionManager` |
| Timeline | create 时锁定 canonical tracks；与 Web `evaluateMotionTimeline` 对齐 |
| 写入 | `TransformAdapter`：`elementTransform` / `modelTransform` |
| 冲突 JSB | Element animating mask 期间忽略 `UpdateSpatializedElementTransform` |
| 销毁 | 通用 `DestroyCommand` |
| Web | 不支持 `useAnimation`；无 Core RAF |

## 风险

| 风险 | 级别 | 缓解 |
|------|------|------|
| 从合一 JSB 迁移到 Create/Control | 中 | 分阶段；先 native 对象模型再切 Core/React |
| 移除 Portal suppression 后 2D 双写 | 中 | native mask 必须先于 React 路径落地 |
| config 变更需 destroy+recreate | 低 | React Proxy 封装；文档明确 |

## 实现顺序

见 [tasks.zh.md](../tasks.zh.md) Phase 1–5。
