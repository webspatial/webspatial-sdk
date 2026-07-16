## 1. 提案对齐

- [ ] 1.1 复核旧的 `add-entity-transform-animation` 文档，明确哪些行为会被新的目标态替代
- [ ] 1.2 复核 `spatialized-element-motion-api` 中对 Entity motion 的引用，统一措辞到“新 Entity 提案是权威目标态”
- [ ] 1.3 从本提案的文档契约和保留 sub-token 中移除 `supports('useEntityAnimation', ['entity'])`；`spatialized-element-motion-api` 的相关措辞另行协调，不在本提案修改批次中直接改动

## 2. 类型与契约重设计

- [ ] 2.1 先编写失败测试，覆盖新的 `useEntityAnimation` 返回三元组 `[animation, api, entityProps]`
- [ ] 2.2 重设计 Core 和 React 的类型面，支持以 `position` / `rotation` / `scale` authoring 的 Entity motion config 与 transform-only callback values
- [ ] 2.2a 在 config 类型面新增顶层 `from` / `to` 书写形态(与 `timeline.from` / `timeline.to`、百分比 `timeline` 并列),并在类型层/校验层约束每个动画都必须同时具备起始边界(顶层 `from`、`timeline.from` 或 `0%` 帧)与结束边界(顶层 `to`、`timeline.to` 或 `100%` 帧),缺任一端报错(此约束针对边界帧存在性,不限制边界帧内部字段稀疏)
- [ ] 2.3 先编写失败测试，覆盖旧 config 拒绝逻辑以及 `opacity` 等不支持目标的显式失败
- [ ] 2.4 定义公开 playback surface(`play`、`pause`、`stop`、`reset`、`finish`)以及只接受 `EntityMotionProps` patch object 的 `api.set` 状态 setter,并在文档中将 `api.set` 描述为状态 setter 而非 playback 命令

## 3. Entity 绑定迁移

- [ ] 3.1 先编写失败测试，证明 Entity motion 通过 `animation` 属性绑定
- [ ] 3.2 更新 Entity props 契约与 binding 生命周期，切换到新的 Entity motion 绑定路径
- [ ] 3.3 保留单绑定不变量，保证同一个 animation object 不能驱动多个 Entity 实例
- [ ] 3.4 在文档中把 `animation` 作为 Entity motion 的绑定方式
- [ ] 3.5 删除 JS 侧旧 entity-transform-animation 遗留，包括 suppression 机制 `animation.__getSuppressedFields` 与 suppression 释放后 base props 重同步路径，确保不存在能与 native 竞争的第二个 transform 源

## 4. Playback 与 Outlet 语义

- [ ] 4.1 先编写失败测试，覆盖 `entityProps` 在 start、complete、stop、reset、finish 以及 native 接受 `api.set(values)` 后的更新语义
- [ ] 4.2 实现通过 `entityProps` 持久化已提交 transform，且不做逐帧 React 更新
- [ ] 4.3 先编写失败测试,覆盖分量级 ownership:对出现在 config 中的分量,alive 期间竞争性的 React transform 写入不覆盖活动动画;对未出现在 config 中的分量,active 期间 React prop 写入仍正常驱动该分量
- [ ] 4.4 实现 committed-state ownership 规则:`api.set(values)` 只接受 sparse patch object、native 以当前 committed transform 为 baseline 合并 patch、非活跃 playback 后的动态接管使用 `api.set` 而不是竞争性的 React prop 写入、活跃动画期间调用 `api.set` 不暂存不 replay 且不更新 `entityProps`、未绑定或 native object 未创建前调用 `api.set` 无效、set 后再 play 的起点在声明 `from` 时为 `from` 否则为当前 committed 值、终态填充将终态 transform 回写到 `entityProps`(fill-forwards,不 snap 回退)
- [ ] 4.5 先编写失败测试,证明 lifecycle callback 只是通知:`onComplete` 的返回值被忽略,不能驱动终态 transform
- [ ] 4.6 先编写失败测试,覆盖 `normalizeEntityMotionConfig` 对顶层 `from` / `to` 的归一化:与 `timeline.from` / `timeline.to` 折叠成同一套内部轨道(等价性)、`timeline` 与顶层同时出现时 `timeline` 优先且开发模式告警、纯顶层 `from` / `to` 未用百分比时 `duration` 默认 0.3 秒、任一形态缺起始或结束边界时显式报错(顶层只给一端、`timeline` 缺 `from`/`0%` 起点或缺 `to`/`100%` 终点,均不从基准或当前姿态补边界帧),并对照验证边界帧内部**字段**仍可稀疏、缺帧标量仍回落 native baseline;并覆盖 `timeline` 内 `from`=`0%`/`to`=`100%` 的混合写法归一化,以及同帧重复(`from` 与 `0%`、`to` 与 `100%`)的拒绝
- [ ] 4.7 在 Core 实现归一化(等价折叠、`timeline` 优先并告警、默认 0.3 秒 duration、每个动画起止边界必填校验:缺端报错、不补边界帧,字段级稀疏保留),确认原生层零改动(`EntityMotionTimelinePayload` 与创建命令不变)

## 5. Capability 与校验

- [ ] 5.1 先编写失败测试，覆盖使用 `supports('useEntityAnimation')` 检测 Entity motion 的目标态契约
- [ ] 5.2 更新 runtime capability 文档与实现行为，使之匹配新的目标态契约
- [ ] 5.3 先编写失败测试，覆盖不支持的 Entity motion target 和非法 transform authoring 的显式校验失败

## 6. 文档、Demo 与迁移

- [ ] 6.1 更新 Entity motion 文档与示例，统一使用 `position` / `rotation` / `scale` config、`animation`、`entityProps` 和只接受 patch object 的 `api.set`,并说明不提供裸 `api.get`:读取通过 `entityProps`,写入通过 `api.set(values)`;补充顶层 `from` / `to` 最简写法及其规则(与 `timeline.from` / `timeline.to` 等价、`timeline` 优先、纯顶层默认 0.3 秒);并说明每个动画都必须写起止两端(起点 `from`/`0%`、终点 `to`/`100%`,缺端报错,不再从当前姿态隐式起播)
- [ ] 6.2 更新 `apps/test-server` 中的 Entity animation demo 与 capability 页面到新的目标态 API
- [ ] 6.3 补充迁移说明，覆盖旧顶层 transform config 的移除，Entity motion 绑定统一使用 `animation`

## 7. 验证

- [ ] 7.1 严格按 TDD 顺序执行实现：先写失败测试，再做最小实现使其通过，最后在测试持续通过前提下重构
- [ ] 7.2 运行 Entity motion 与 runtime capabilities 相关的定向单测、集成测试和能力测试,包括 `api.set(values)` patch-only 行为、active set 不暂存、未绑定 set 无效、set 后再 play 的起点,以及终态填充;并覆盖顶层 `from` / `to` 的等价性、`timeline` 优先告警、默认 0.3 秒 duration、任一形态缺起止边界的拒绝(含移除"未声明起始帧从当前姿态起播"),以及边界帧内部字段级缺帧仍走 baseline 兜底
- [ ] 7.3 在新路径验证完成后，做一次提案与实现对照复核，并归档或正式替代 `add-entity-transform-animation`
- [ ] 7.4 补一个测试:动画到达终态后 transform 不会 snap 回 pre-animation/base props(为已删除的 suppression 释放后重同步路径兜底回归)
