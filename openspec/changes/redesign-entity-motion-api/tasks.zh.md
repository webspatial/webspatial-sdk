## 1. 提案对齐

- [ ] 1.1 复核旧的 `add-entity-transform-animation` 文档，明确哪些行为会被新的目标态替代
- [ ] 1.2 复核 `spatialized-element-motion-api` 中对 Entity motion 的引用，统一措辞到“新 Entity 提案是权威目标态”
- [ ] 1.3 确认 `supports('useAnimation', ['entity'])` 是仅保留兼容别名，还是立即从文档契约中移除

## 2. 类型与契约重设计

- [ ] 2.1 先编写失败测试，覆盖新的 `useEntityAnimation` 返回三元组 `[animation, api, entityProps]`
- [ ] 2.2 重设计 Core 和 React 的类型面，支持 transform 型 Entity motion config 与 transform-only callback values
- [ ] 2.3 先编写失败测试，覆盖旧 config 拒绝逻辑以及 `opacity` 等不支持目标的显式失败
- [ ] 2.4 定义新的 Entity motion playback surface，包括 `play`、`pause`、`resume`、`stop`、`reset`、`finish` 和 `set`

## 3. Entity 绑定迁移

- [ ] 3.1 先编写失败测试，证明 Entity motion 通过 `xr-animation` 绑定，且旧 `animation` prop 不再是目标态行为
- [ ] 3.2 更新 Entity props 契约与 binding 生命周期，切换到新的 Entity motion 绑定路径
- [ ] 3.3 保留单绑定不变量，保证同一个 animation object 不能驱动多个 Entity 实例
- [ ] 3.4 在实现和文档中移除或废弃旧的 Entity `animation` prop 路径

## 4. Playback 与 Outlet 语义

- [ ] 4.1 先编写失败测试，覆盖 `entityProps` 在 start、complete、stop、reset、finish 和 `set(values)` 时的更新语义
- [ ] 4.2 实现通过 `entityProps` 持久化已提交 transform，且不做逐帧 React 更新
- [ ] 4.3 先编写失败测试，覆盖动画 alive 期间 transform ownership，确保竞争性的 React transform 写入不会覆盖活动动画
- [ ] 4.4 实现 terminal state 与 `set(values)` 的 ownership 规则，保证 React resync 后仍保留已提交动画值

## 5. Capability 与校验

- [ ] 5.1 先编写失败测试，覆盖使用 `supports('useAnimation')` 检测 Entity motion 的目标态契约
- [ ] 5.2 更新 runtime capability 文档与实现行为，使之匹配新的目标态契约
- [ ] 5.3 先编写失败测试，覆盖不支持的 Entity motion target 和非法 transform authoring 的显式校验失败

## 6. 文档、Demo 与迁移

- [ ] 6.1 更新 Entity motion 文档与示例，统一使用 transform 型 config、`xr-animation` 和 `entityProps`
- [ ] 6.2 更新 `apps/test-server` 中的 Entity animation demo 与 capability 页面到新的目标态 API
- [ ] 6.3 补充迁移说明，覆盖旧 `animation` prop 绑定路径和旧顶层 transform config 的移除

## 7. 验证

- [ ] 7.1 严格按 TDD 顺序执行实现：先写失败测试，再做最小实现使其通过，最后在测试持续通过前提下重构
- [ ] 7.2 运行 Entity motion 与 runtime capabilities 相关的定向单测、集成测试和能力测试
- [ ] 7.3 在新路径验证完成后，做一次提案与实现对照复核，并归档或正式替代旧的 Entity motion proposal