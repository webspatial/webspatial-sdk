## 1. API 与能力契约

- [x] 1.1 将 `entity-transform-animation` 与 `runtime-capabilities` 的 spec 纳入实现计划，并统一命名到 `supports('useAnimation')`
- [x] 1.2 定义 `useAnimation`、`AnimationApi`、实体 `animation` prop、`AnimationError` 与动画结果回传的对外类型（React 与 Core SDK）
- [x] 1.3 增加非法动画配置的校验规则，并明确不支持 runtime 下的 warning 行为

> NOTE: spec 发生变更：`cancel()` 语义从“停在 stop 点”改为“恢复到 from（省略 from 则恢复到起始快照）”。受影响的实现/测试/文档任务已重新打开以对齐新契约。

## 2. Core SDK 与命令链路

- [x] 2.1 实现统一的动画命令结构，以及 Core 层 `SpatialEntity.animateTransform(...)` 会话 API *(blocked by 1.2)*
- [ ] 2.2 打通 completed / canceled / failed 事件处理，使 JS 能拿到 Native 终态 transform 或错误 payload 以触发回调并同步状态 *(needs realign: canceled payload 语义变更为恢复后的 from)* *(blocked by 2.1)*
- [x] 2.3 扩展 capability keys 与数据表，使 `supports('useAnimation')` 能按 runtime 正确解析

## 3. React SDK 集成

- [ ] 3.1 实现 `useAnimation(config)`，支持 `play`、`pause`、`cancel`、`isAnimating`、`isPaused`、`finished`、`onStart`、`onError`、`autoStart`、`delay`、`loop`，并在 paused 后通过 `play()` 继续当前会话 *(needs realign: cancel 恢复到 from)* *(blocked by 2.1)*
- [x] 3.2 优先在公共实体抽象层接入 `animation` prop，再更新各个叶子实体组件 *(blocked by 3.1)*
- [x] 3.3 仅对被 alive 会话控制的字段抑制普通 transform 更新，避免竞争
- [x] 3.4 按规范对不支持的 runtime 给出 warning，并保持非动画的 transform 路径行为不变
- [x] 3.5 通过 TypeScript 类型定义将 `animation` prop 限制在 `Reality` / `SceneGraph` 下的 Entity 组件上，不扩大到非 Entity 组件的运行时校验

## 4. Native visionOS 播放

- [x] 4.1 增加 Native scene 侧的动画会话存储、命令处理与播放控制器生命周期管理 *(blocked by 2.1)*
- [ ] 4.2 实现 Native play/pause/resume/cancel，并发送 completed / canceled / failed 事件与对应 transform 或错误 payload *(needs realign: cancel 恢复到 from + canceled payload)* *(blocked by 2.2, 4.1)*
- [x] 4.3 校验 delay 与 loop 的语义与 OpenSpec 契约一致（reset loop 与 reverse loop）

## 5. 验证与文档

- [ ] 5.1 增加聚焦测试：
  - [x] 5.1.1 能力检测（`supports('useAnimation')` true/false/sub-token）
  - [ ] 5.1.2 React 播放生命周期（onStart 时机、包含 queued 后 paused 的 start、start/complete/cancel 回调、互斥性、调用次数、cancel 恢复到 from） *(needs realign)*
  - [ ] 5.1.3 字段级抑制（动画字段与非动画字段共存、缓存保留至下一次渲染）
  - [x] 5.1.4 命令与事件顺序（按调用顺序序列化、bridge 投递顺序）
  - [x] 5.1.5 同一动画绑定多个实体（抛错）
  - [ ] 5.1.6 动画 prop 替换（取消旧会话 → 启动新会话，onStop 先于 onStart） *(needs realign: cancel 恢复到 from)*
  - [x] 5.1.7 delay 期间暂停（剩余时间保留，`play()` 继续）
  - [x] 5.1.8 实体绑定前 play（queued 状态、isAnimating、queued 时 cancel/pause、绑定后直接 paused）
  - [ ] 5.1.9 Bridge 失败恢复（会话保留失败前状态、onError 触发或 console.error 兜底、play 失败不再 completed/canceled）
  - [ ] 5.1.10 cancel old 失败时阻止 start new（restart 与 animation prop 替换两条路径）
- [ ] 5.2 更新 `docs/` 中相关文档，以及示例或 test-server 页面以覆盖新的动画 API *(needs realign: cancel 恢复到 from)*
- [x] 5.3 每个涉及 public API 新增或修改的 PR 中附带 changeset entry，而不是最后统一补充