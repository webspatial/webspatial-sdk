## 1. OpenSpec 与方案对比 当前分支

- [x] 1.1 创建 `spatial-div-motion-api` 变更，包含 `proposal.md`、`proposal.zh.md`、`COMPARISON.md`
- [x] 1.2 编写 `design.md` 与 `specs/spatial-div-motion/spec.md`
- [x] 1.3 从会话实现分支创建 `proposal/spatial-div-motion-timeline` 分支

## 2. 核心类型与 Web 后端 Phase 1

- [x] 2.1 新增 `packages/core/src/types/spatialDivMotion.ts` 时间线类型与属性路径
- [x] 2.2 从 `@webspatial/core-sdk` 导出 motion 类型
- [x] 2.3 在 react package 中实现 `evaluateMotionTimeline`、`valuesToMotionStyle` 与校验
- [x] 2.4 使用 Web RAF 后端实现 `useSpatializedMotion` 与 `useSpatializedMotion.simple`
- [x] 2.5 从 `@webspatial/react-sdk` 导出 `useSpatializedMotion`
- [x] 2.6 单元测试 多轨求值 重叠场景 simple 语法糖

## 3. 测试服务器对比演示

- [x] 3.1 新增 `/spatial-div-motion` 聚合页，对比 Plan A 路由与 Plan B 路由
- [x] 3.2 新增 `/spatial-div-motion/multi-track` 标准 0–5s 与 3–5s 演示
- [x] 3.3 从 `/animate` 页面添加链接

## 4a. 原生 segment 后端 Phase 2a 无 Swift 变更

Spec: [PHASE2-MINIMAL-NATIVE.md](./PHASE2-MINIMAL-NATIVE.md)

- [x] 4a.1 `motionConfigToNativeSegment` 与测试
- [x] 4a.2 从 `useSpatialDivAnimation` 中提取 `nativeSession.ts`
- [x] 4a.3 `useSpatializedMotion` 原生 gate 绑定 suppression 以及原生运行时停止 RAF
- [x] 4a.4 在 `PortalSpatializedContainer` 中绑定 `motion` prop
- [x] 4a.5 接通 `simple-entrance` 并完成手动 AVP 检查

## 4b. 原生 timeline 后端 Phase 2b

Spec: [specs/spatial-div-motion-native-timeline/spec.md](./specs/spatial-div-motion-native-timeline/spec.md)

- [x] 4b.1 在 bridge 上扩展 `AnimateSpatialDivCommand` 与 `SpatialDivMotionTimeline` 核心类型 JSB
- [x] 4b.2 实现 `motionConfigToNativeTimeline`，并在不等价于 segment 时切换 hook 分支
- [x] 4b.3 在 `SpatialDivAnimationSession.swift` 中实现 `TimelineEvaluator` DisplayLink 采样
- [x] 4b.4 复用 4a，为 timeline session 接通 Portal suppression 与 `motion` 绑定
- [x] 4b.5 单元一致性 Web `evaluateMotionTimeline` 与 Swift `SpatialDivTimelineEvaluator` 标准多轨
- [x] 4b.5b 模拟器 e2e `tests/ci-test/src/specs/spatial-div-motion.spec.tsx` 标准 `translate.x` 推进

## 5. 产品决策

- [ ] 5.1 基于 `COMPARISON.md` 与录制 demo 进行设计评审
- [ ] 5.2 决策 采用 motion API 保留 session API 或废弃 session 路径