## ADDED Requirements

### Requirement: Event id can register multiple receivers
系统 MUST 允许同一个 `SpatialWebEvent` id 注册多个 receiver callback，并且不会覆盖先前已注册的 receiver。

#### Scenario: Second receiver preserves first receiver
- **WHEN** 两个不同 callback 被注册到同一个事件 id
- **THEN** 这两个 callback MUST 都保持在该 id 下处于已注册状态

#### Scenario: Duplicate callback registration is idempotent
- **WHEN** 同一个 callback 引用被多次注册到同一个事件 id
- **THEN** 系统 MUST 只保留这个 callback 引用的一份有效注册

### Requirement: Dispatch fans out to all receivers for the id
系统 MUST 把每次收到的 `SpatialWebEvent` 载荷分发给该 id 当前注册的全部 receiver。

#### Scenario: Payload is delivered to every receiver
- **WHEN** `window.__SpatialWebEvent` 收到一个属于某 id 的事件，且该 id 下注册了多个 receiver
- **THEN** 该 id 下的每个已注册 receiver MUST 都以该事件数据被调用

#### Scenario: One receiver failure does not stop fan-out
- **WHEN** `window.__SpatialWebEvent` 在向某个注册了多个 receiver 的 id 分发事件时，其中一个 receiver 抛出异常
- **THEN** 系统 MUST 继续调用该 id 下其余已注册的 receiver

#### Scenario: Unknown id is ignored
- **WHEN** `window.__SpatialWebEvent` 收到一个没有任何 receiver 注册的 id 对应事件
- **THEN** 系统 MUST 正常完成处理，且不调用任何 receiver

### Requirement: Receiver cleanup supports targeted and full removal
系统 MUST 同时支持移除某个 id 下的指定 receiver，以及移除该 id 下的全部 receiver。

#### Scenario: Targeted removal keeps other receivers
- **WHEN** 从某个仍然存在其他 callback 的 id 上移除了一个指定 callback
- **THEN** 被移除的 callback MUST 不再接收事件
- **AND** 该 id 下剩余的 callback MUST 继续接收事件

#### Scenario: Full removal clears all receivers for id
- **WHEN** 调用 `removeEventReceiver` 时只传入 id 而不传 callback
- **THEN** 该 id 下的全部 receiver MUST 被移除

#### Scenario: Empty receiver set is removed
- **WHEN** 某个 id 的最后一个 receiver 被移除
- **THEN** 内部 receiver 注册表 MUST 不再保留该 id 的条目