## Why

`SpatialWebEvent` 之前把每个事件 id 当成单一回调槽位，后注册的回调会覆盖先注册的回调。这个 change 为共享 id 定义扇出分发语义，让多个 SDK 子系统可以同时订阅同一个 native 事件流而不会互相破坏。

## What Changes

- 允许同一个 `SpatialWebEvent` id 同时注册多个 receiver。
- 规定每次收到该 id 的事件载荷时，必须分发给当前注册的全部 receiver。
- 即使某个 receiver 在分发过程中抛出异常，也要继续完成对其他 receiver 的扇出分发。
- 支持移除某一个指定 receiver，而不影响同一 id 下的其他 receiver。
- 保留 `removeEventReceiver(id)` 作为整组清理路径，用于清除该 id 下的全部 receiver。
- 当最后一个 receiver 被移除后，删除对应 id 项，避免内部状态保留空容器。
- 保持现有公开方法名不变，以兼容单 receiver 调用方。

## Capabilities

### New Capabilities
- `spatial-web-event-receivers`: 管理同一个 `SpatialWebEvent` id 下一个或多个 receiver 的注册 分发 与清理语义。

### Modified Capabilities

## Impact

- 影响 `packages/core/src/SpatialWebEvent.ts` 中的事件路由逻辑。
- 影响共享 id 的 SDK 使用方，包括 `SpatializedElement` `SpatialEntity` `SpatialComponent` 和平台适配层回调。
- 影响 `packages/core/src/jsbcommand.coverage.test.ts` `packages/core/src/physicalMetrics.test.ts` 和 `packages/core/src/coverage-boost.test.ts` 中的行为覆盖。