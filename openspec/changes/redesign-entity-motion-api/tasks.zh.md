## 1. 提案对齐

- [ ] 1.1 复核旧的 `add-entity-transform-animation` 文档，明确哪些行为会被新的目标态替代
- [ ] 1.2 复核 `spatialized-element-motion-api` 中对 Entity motion 的引用，统一措辞到“新 Entity 提案是权威目标态”
- [ ] 1.3 从文档契约和保留 sub-token 中移除 `supports('useAnimation', ['entity'])`，并对齐 `spatialized-element-motion-api` runtime-capabilities，使任何 change 都不再保留 `entity` sub-token

## 2. 类型与契约重设计

- [ ] 2.1 先编写失败测试，覆盖新的 `useEntityAnimation` 返回三元组 `[animation, api, entityProps]`
- [ ] 2.2 重设计 Core 和 React 的类型面，支持以 `position` / `rotation` / `scale` authoring 的 Entity motion config 与 transform-only callback values
- [ ] 2.3 先编写失败测试，覆盖旧 config 拒绝逻辑以及 `opacity` 等不支持目标的显式失败
- [ ] 2.4 定义公开 playback surface(`play`、`pause`、`resume`、`stop`、`reset`、`finish`)以及 `api.set` 状态 setter(接受一个值或 `(prev) => next` updater),并在文档中将 `api.set` 描述为状态 setter 而非 playback 命令

## 3. Entity 绑定迁移

- [ ] 3.1 先编写失败测试，证明 Entity motion 推荐通过 `xr-animation` 绑定，且 `animation` 作为兼容绑定继续可用
- [ ] 3.2 更新 Entity props 契约与 binding 生命周期，切换到新的 Entity motion 绑定路径
- [ ] 3.3 保留单绑定不变量，保证同一个 animation object 不能驱动多个 Entity 实例
- [ ] 3.4 保留 Entity `animation` 兼容绑定，并在文档中把 `xr-animation` 标注为推荐写法

## 4. Playback 与 Outlet 语义

- [ ] 4.1 先编写失败测试，覆盖 `entityProps` 在 start、complete、stop、reset、finish 以及每次 `api.set` 调用(value 与 updater 形式)时的更新语义
- [ ] 4.2 实现通过 `entityProps` 持久化已提交 transform，且不做逐帧 React 更新
- [ ] 4.3 先编写失败测试，覆盖动画 alive 期间 transform ownership，确保竞争性的 React transform 写入不会覆盖活动动画
- [ ] 4.4 实现 committed-state ownership 规则:`api.set` 稀疏合并、updater `prev` = 最近 confirmed 的 `entityProps` 镜像值、活跃动画期间调用 `api.set` 通过 native 确认提交一次 Source A 写入,但不抛错也不覆盖、set 后再 play 的起点在声明 `from` 时为 `from` 否则为当前 committed 值、终态填充将终态 transform 回写到 `entityProps`(fill-forwards,不 snap 回退)
- [ ] 4.5 先编写失败测试,证明 lifecycle callback 只是通知:`onComplete` 的返回值被忽略,不能驱动终态 transform

## 5. Capability 与校验

- [ ] 5.1 先编写失败测试，覆盖使用 `supports('useAnimation')` 检测 Entity motion 的目标态契约
- [ ] 5.2 更新 runtime capability 文档与实现行为，使之匹配新的目标态契约
- [ ] 5.3 先编写失败测试，覆盖不支持的 Entity motion target 和非法 transform authoring 的显式校验失败

## 6. 文档、Demo 与迁移

- [ ] 6.1 更新 Entity motion 文档与示例，统一使用 `position` / `rotation` / `scale` config、`xr-animation`、`entityProps` 和 `api.set`(含其 updater 形式,以及不提供裸 `api.get` 的指引:通过 `api.set` updater 或 `entityProps` 读取)
- [ ] 6.2 更新 `apps/test-server` 中的 Entity animation demo 与 capability 页面到新的目标态 API
- [ ] 6.3 补充迁移说明，覆盖旧顶层 transform config 的移除，并说明 `animation` -> `xr-animation` 的推荐迁移（`animation` 兼容保留）

## 7. 验证

- [ ] 7.1 严格按 TDD 顺序执行实现：先写失败测试，再做最小实现使其通过，最后在测试持续通过前提下重构
- [ ] 7.2 运行 Entity motion 与 runtime capabilities 相关的定向单测、集成测试和能力测试,包括 `api.set` value/updater 行为、活跃动画期间不抛错、set 后再 play 的起点,以及终态填充
- [ ] 7.3 在新路径验证完成后，做一次提案与实现对照复核，并归档或正式替代旧的 Entity motion proposal