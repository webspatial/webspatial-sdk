## 1. API 与能力契约

- [ ] 1.1 将 `entity-transform-animation` 与 `runtime-capabilities` 的 spec 纳入实现计划，并统一命名到 `supports('useAnimation')`
- [ ] 1.2 定义 `useAnimation`、`AnimationApi`、实体 `animation` prop 与动画结果回传的对外类型（React 与 Core SDK）

## 2. Core SDK 与命令链路

- [ ] 2.1 实现统一的动画命令结构，以及 Core 层 `SpatialEntity.animateTransform(...)` 会话 API
- [ ] 2.2 打通 completed / stopped 事件处理，使 JS 能拿到 Native 终态 transform 以触发回调并同步状态
- [ ] 2.3 扩展 capability keys 与数据表，使 `supports('useAnimation')` 能按 runtime 正确解析

## 3. React SDK 集成

- [ ] 3.1 实现 `useAnimation(config)`，支持 `play`、`pause`、`resume`、`stop`、`isAnimating`、`autoStart`、`delay`、`loop`
- [ ] 3.2 为实体组件新增 `animation` prop，并仅对被动画控制的字段抑制普通 transform 更新，避免竞争
- [ ] 3.3 按规范对不支持的 runtime 做能力 gate，并保持非动画的 transform 路径行为不变

## 4. Native visionOS 播放

- [ ] 4.1 增加 Native scene 侧的动画会话存储、命令处理与播放控制器生命周期管理
- [ ] 4.2 实现 Native play/pause/resume/stop，并发送 completed / stopped 事件与当前 transform payload
- [ ] 4.3 校验 delay 与 loop 的语义与 OpenSpec 契约一致（reset loop 与 reverse loop）

## 5. 验证与文档

- [ ] 5.1 增加聚焦测试：能力检测、React 生命周期、字段级抑制、命令与事件顺序
- [ ] 5.2 更新 `docs/` 中相关文档，以及示例或 test-server 页面以覆盖新的动画 API
- [ ] 5.3 在完成代码变更后补充英文 changeset，覆盖新增的 public API 与 capability surface