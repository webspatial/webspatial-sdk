# redesign-entity-motion-api Design Review

> 本文件由 `design-review` 与 `review-48` 两份评审合并而成(review-48 已删除),并对重复问题去重。评审对象为 `design.zh.md`,以 openspec 提案(`proposal.zh.md` + `specs/*/spec.zh.md`)为唯一权威数据源。

## 范围与方法

检查 design 是否:(1)与 proposal / spec 的行为契约一致(不产生分叉语义);(2)内部自洽(数据流、类型、编译规则之间无矛盾);(3)足够指导实现与测试(关键决策已定死,不停留在“既有机制”层面)。design 已声明“不重复公共 API 契约、不重复行为需求”,因此本 review 只追究其实现架构决策是否闭环,以及是否与权威源冲突。

## 结论

主线一致且自洽:native 唯一权威、`entityProps` 作为 mirror、`api.set` patch-only、RealityKit backend、复用现有 JSB command。

本 review 早期基于两个旧前提(segment 编译模型、whole-transform ownership)提出的 High 项,已随 design 的两处重大改造而消解:

- **编译模型 segment → per-channel**:改用 `EntityChannelAnimationPlan`,每个 channel 各带自己的 keyframes 与 per-keyframe timing,单独编译成 RealityKit animation 并经 `AnimationGroup` 并行播放。
- **ownership whole-transform → 分量级(per-component)**:config 中出现的 transform 分量归动画,完全未出现的分量在动画期间仍由 React props 驱动。

原本列为未解决的五个 Medium 项(M-1 错误分类、M-2 事件判型、M-3 initial confirmed state、M-4 类型命名、M-5 rotation 插值)已于 2026-07-08 落盘解决(见下)。追加复核新增的 M-6(React 旧 base props 重同步路径冲突)也已解决:采纳“直接删除旧 entity-transform-animation 遗留(含 JS 侧 suppression 机制)”的方案,删除后冲突结构上不可能发生;同一决策一并关闭 L-2(旧 JSB 清理的“删除 vs 停用”二义,定为直接删除)。追加复核的 L-1(loop 更新时机)采方案 A、L-4(类图 OOP 边界)采方案 A 已解决;L-3(`tracks` 公开感)采方案 B(不改,仅记录)。所有 High / Medium / Low 项均已处置。

## 复核状态汇总(截至 2026-07-08)

- **已解决 / 已过时(12)**:H-1 per-channel timing、H-2 entityProps 完整性、H-3 分量级 ownership、M-1 错误分类(采方案 A)、M-2 事件判型(采方案 A)、M-3 initial confirmed state(采方案 B)、M-4 类型拆名(采方案 A)、M-5 rotation 插值(已补说明)、M-6 旧 base props 重同步路径(采删除方案)、L-1 loop 更新时机(采方案 A)、L-2 旧 JSB 清理(采直接删除)、L-4 类图/OOP 边界(采方案 A)。
- **不修复 / 仅记录(1)**:L-3 tracks 公开感(采方案 B,非一致性错误,保持现状)。
- **未解决(0)**。

## Findings

### H-1(已解决):per-channel timing function 与旧 segment schema 自相矛盾

> **状态:已解决 · 采纳 per-channel 方案。**

**原问题**:旧编译规则承认同一时间段内不同 channel 可能需要不同 timing function(例如 `position.x` 用 `linear`、`rotation.y` 用 `easeInOut`),但旧 `EntityTransformSegment` 的 schema 每段只能携带**单个** segment 级 `timingFunction`,无法承载 per-channel 差异。这是 design 内部的结构性矛盾。

**现状**:design 已用 `EntityChannelAnimationPlan` 取代 segment 方案——每个 channel 各带自己的 keyframes 与 per-keyframe timing,单独编译成 RealityKit animation,再经 `AnimationGroup` 并行播放并绑定到 translation / orientation / scale sub-target。旧 `EntityTransformSegment` schema 已删除,矛盾不再存在。

### H-2(已解决):`entityProps` confirmed 后是完整 pose 还是稀疏 outlet

> **状态:已过时 · ownership 模型已改,原分叉前提不再成立。**

**原问题**:旧 whole-transform 语义下 native 每次回传完整 pose,与 spec 的“稀疏 outlet”措辞冲突,读者无法确定 config 只写 `position` 时 `entityProps` 是否仍含 `rotation` / `scale`,直接影响 `<BoxEntity {...entityProps} />` 的推荐写法。

**现状**:ownership 改为分量级后,`entityProps` 语义收敛为“镜像动画系统已接管的分量”,既不是旧的完整 pose,也不是旧的 touched-fields patch:

- 首个 native confirmed state 前 MAY 为空;
- confirmed 后包含被动画接管的分量,以及 `api.set` 写入后被接管的分量(限定 `position` / `rotation` / `scale`);
- 未被接管的分量 MUST NOT 出现在 `entityProps` 中,避免 spread 时覆盖仍由 React props 实时控制的分量。

spec 与 design 已按此对齐。

### H-3(已解决):whole-transform ownership 只在 Risks、未进 Non-Goals

> **状态:已解决 · 被 per-component 模型取代。**

**原问题**:“只动画 position、rotation 继续由 React 控制”在旧模型下不是 v1 能力,但该限制只出现在 Risks,读者易从“config 只写 position”误推“动画只接管 position”,design review 会反复回到同一问题。

**现状**:现模型本身即分量级 ownership——config 中出现的分量归动画,未出现的分量继续由 React props 驱动,因此“只动画 position、rotation / scale 走 props”现在是被支持的跨分量组合。原“限制只在 Risks”的问题消失。标量子粒度边界已在 Risks 与 Decisions 显式写明:只动画 `position.y` 时 RealityKit translation sub-target 使整个 `position` 分量归动画,`position.x` / `position.z` 在动画期间以播放起点 baseline 冻结,而非由 React props 分别接管。

### M-1(已解决):失败语义缺少可实现的错误分类

> **状态:已解决 · 采纳方案 A。** design 已在 `spatialanimationstatechanged` 段给出封闭的 `SpatializedPlaybackError.code` 分类(`TARGET_NOT_FOUND` / `UNSUPPORTED_TARGET` / `TARGET_DESTROYED` / `SET_REJECTED_DURING_ACTIVE` / `SET_BEFORE_READY`),并写明全部经 `onError` 抵达用户;spec 新增 requirement 要求 `code` 可区分。

**文档位置**:proposal / spec / design 均把 active set 被拒、unbound set、native object 未创建、target 已销毁、target 类型不支持等失败描述为“通过既有 command failure / error event 暴露”;事件 payload 有 `error?: SpatializedPlaybackError`、`action: 'failed'`,但无 code / reason 枚举。

**问题**:design 自己枚举了至少 5 类不同失败,却没有可区分的错误分类,也没写明这些是否进入用户 `onError`。“不是 silent no-op”能说清,但不足以指导实现和写测试断言。

**建议**:在 design 给出 `SpatializedPlaybackError` 的最小 `code` / `reason` 分类(覆盖上述 5 类);明确哪些失败进入 `onError`、哪些只在 command failure 层可见;spec 可只要求“错误可观察”,design 提供最小分类供测试断言。

### M-2(已解决):`spatialanimationstatechanged.values` 缺少 target discriminant

> **状态:已解决 · 采纳方案 A。** design 与 spec 已写死:consumer 通过 `animationId` 反查本地 animation object 的 target 类型来判定 `values` 形态,事件不新增字段;`animationId` 匹配不到存活本地 object 的事件 MUST 丢弃且不更新 `entityProps`。

**文档位置**:design 事件 payload 为 `values?: SpatializedVisualValues | EntityMotionProps`,仅以文字说明“target-specific”;control 只靠 `animationId` 找 animation object。

**问题**:事件 payload 是无 discriminant 的 union,consumer 仅从 payload 自身无法判断 shape。design 暗示可用 `animationId` 反查 target 类型,但未把判型契约写死,也未说明 unknown / stale `animationId` 事件如何处理。

**建议**:二选一并写入 design——(a)通过 `animationId` 查本地 animation object 的 target type,事件不新增字段,并写明 unknown / stale `animationId` 的丢弃策略;(b)或在 `detail` 增加 `targetType: 'spatializedElement' | 'entity'` 作为显式 discriminant。

### M-3(已解决):initial confirmed state 是否在 create/bind 后立即 emit

> **状态:已解决 · 采纳方案 B(不额外 emit)。** design 与 spec 已写明:`create` / `bind` 不会额外 emit 初始 confirmed value,`entityProps` 在首个 lifecycle 提交(一次 play 终态或被接受的 set)前 MAY 为空、不承诺 mount 时可读;读-改-写指引已相应说明需先触发一次 lifecycle 或 set。

**文档位置**:design 数据流只描述 native 状态变化(start / complete / stop / reset / finish / set accepted)时回传 confirmed values;读当前 confirmed 值走 `entityProps`(有意不提供 `api.get`),读-改-写“基于 `entityProps` 计算 patch 再 `api.set`”。

**问题**:写回流只在 lifecycle 节点发生。design 已明确首个 confirmed 之前 `entityProps` 可能为空,但仍未定案 create/bind 成功后是否 sample 当前 `entity.transform` 并 emit 一次 initial confirmed;在 hook 初始 `{}` 到第一个 lifecycle event 之间用户无法读到 native 当前 pose,读-改-写在动画播放前无法闭环。

**建议**:定案 create/bind 成功后是否 emit initial confirmed `EntityMotionProps`;若要求,补进“native confirmed transform → React mirror”数据流;若不要求,则在 design 与 spec 明确 `entityProps` 在首个 lifecycle commit 前 MAY 为空、不承诺可读,并相应约束读-改-写指引(需先触发一次 lifecycle 或 set 才能读到)。

### M-4(已解决):`EntityMotionProps` 同名承载 sparse patch 与 complete confirmed

> **状态:已解决 · 采纳方案 A(拆名)。** proposal / design / spec 已拆为:`EntityMotionPatch`(`api.set` 写入侧稀疏 patch)与 `EntityMotionProps`(`entityProps` / callback 读取侧 confirmed values),两者同为 `{ position?, rotation?, scale? }` 形态但命名区分。

**文档位置**:proposal / design / spec 均用 `EntityMotionProps` 表达 `api.set(values)` 入参、callback values、`entityProps`。

**问题**:同一类型名同时承担两种完整性语义——`api.set` 入参是 sparse patch(可只传 `position.y`),confirmed `entityProps` 是已接管分量(见 H-2)。类型层面无法表达“输入可稀疏、输出按接管分量”的差异。

**建议**:拆名——`EntityMotionPatch`(api.set 入参)vs `EntityMotionProps` / `EntityMotionConfirmedProps`(entityProps / callback confirmed values);若不拆,至少在 design 与 spec 写清同一 shape 在不同上下文下完整性契约不同。

### M-5(已解决):rotation 以 Euler degrees 编写、以 quaternion 插值,语义差异未说明

> **状态:已解决 · 已补说明。** 编译规则 7 已补充:RealityKit 以最短路径四元数 slerp 插值 orientation,keyframe 增量 ≥180° 或跨多轴时路径可能偏离逐轴 Euler 直觉,并建议需要特定路径时显式补充中间关键帧。

**文档位置**:编译规则 7——`rotation.*` 输入 Euler degrees,编译时转 RealityKit 旋转表示,“避免用 Euler 做逐帧插值”;示例 `rotation.y` 0 → 180。

**问题**:design 正确选择 quaternion 插值以避免 Euler 伪影,但未说明由此带来的语义差异:多轴 Euler 组合经四元数插值后视觉路径可能与“每轴独立 lerp”的直觉不同;`rotation.y` 0 → 180 这类 ≥180° 旋转存在最短路径歧义(可能反向)。这会影响用户对动画路径的预期与测试可预测性。

**建议**:在编译规则 7 或 Risks 补充采用的插值语义(如 shortest-path slerp),提示 ≥180° / 多轴组合的路径可能偏离逐轴 Euler 直觉;必要时建议作者拆分关键帧以控制路径。

### M-6(已解决):React 旧 base props 重同步路径与新终态持久化语义冲突

**文档位置**:spec 要求 terminal state 由 `entityProps` 代表权威终态,推荐组合顺序为 static/base props 后 spread `entityProps`;design 也声明 React 不维护可竞争的 committed cache,只镜像 native confirmed state。现有实现里,旧 `useEntityTransform` 会在动画 suppression 释放后清空 suppressed 字段 cache,并在 effect 重跑时把 React-declared base props 重新下发 native。

**问题**:如果实现阶段沿用旧 suppression 释放后的 base props re-sync 机制,动画到达 terminal 后可能先由 `entityProps` 表达终态,随后又被 stale base props 重写回 native,与 spec 的“terminal state wins over stale base props / fill-forwards, no snap-back”冲突。design 当前说明了目标语义,但未明确指出 React 层需要替换旧 `animation.__getSuppressedFields` / release 后 base props 重同步路径,实现者容易误用既有机制。

**建议**:在 design 的 React layer key changes 或 Risks 中补一句实现约束:新 Entity motion 不能沿用旧 suppression 释放后自动重同步 base props 的路径;应由 Source A(static/base props + `entityProps`)与 Source B(`xr-animation`)的分量级仲裁决定最终下发,且 terminal 后必须以 `entityProps` 覆盖 stale base props。对应测试应覆盖动画完成后不会 snap 回 pre-animation/base props。

**决议(2026-07-08 · 采删除方案)**:不采用“软实现约束”,而是**直接删除**旧 entity-transform-animation 遗留,**包括 JS 侧的 suppression 机制**(`animation.__getSuppressedFields` 与 suppression 释放后 base props 重同步路径)。删除后不存在能与 native 竞争的第二条重同步链路,terminal fill-forward 后被 stale base props 重写回去的场景结构上不可能发生,M-6 关闭。已回写 design.md / design.zh.md 的 React layer key changes(新增第 7 条)与 Native #5。

### L-1(已解决):loop 动画下 `entityProps` 的更新时机未定义

**文档位置**:编译规则 10 把 loop 参数交给 RealityKit playback 层;编译规则 11 / spec 规定 `entityProps` 在 complete / finish 等终态更新,且不逐帧。

**问题**:`loop: true` 的动画没有自然的 `complete` 终态。design 未说明 loop 期间 `entityProps` 是否在每个 loop 边界更新,还是直到 stop / finish 才更新。

**建议**:明确 loop 动画的 `entityProps` 更新策略(建议:loop 期间不更新,仅在 stop / finish / set 时提交),并在 spec 补一个 loop 场景。

**决议(2026-07-08 · 采方案 A)**:loop 期间不更新 `entityProps`,只在 `stop` / `finish` / native 接受的 `api.set` 时提交。已回写 design 编译规则 10,并在 spec(中英)新增“循环动画不在 loop 边界提交 `entityProps`”场景。L-1 关闭。

### L-2(已解决):废弃 `AnimateTransformJSBCommand` 的清理边界仅口头描述

**文档位置**:design 写旧 `AnimateTransformJSBCommand` 可停止使用或删除,不构成 breaking change;各层改动 Native #5“删除或停止使用旧 AnimateTransform Entity 专用链路”;tasks 1.1 / 7.3 涉及 `add-entity-transform-animation` 的归档或替代。

**问题**:结论正确(内部协议、非公开承诺),但“停止使用还是删除”二义并存,清理边界与时机未定,易在实现阶段遗留双路径。

**建议**:明确二选一(v1 直接删除 / 先停用后清理),并与 tasks 7.3 的归档动作对齐,避免 Entity 侧长期保留两条 native 执行路径。

**决议(2026-07-08 · 采直接删除)**:与 M-6 同一决策,v1 **直接删除**旧 `AnimateTransform` Entity 专用链路,不保留“停用后清理”的中间态。design 各层改动 Native #5 已改为“直接删除”,并与 tasks 1.1 / 7.3 的归档/替代动作对齐。L-2 关闭。

### L-3(不修复 / 仅记录):proposal 仍可能给读者留下“公开 tracks target”印象

**文档位置**:proposal `5.3 tracks` 写 `tracks` 保留为内部非公开执行形态,同节仍列出 Entity target path allowlist。

**问题**:这不是一致性错误,但 proposal 面向范围与目标态;放太多 internal track path 细节可能让读者误以为 `tracks` 是半公开能力。

**建议**:保留一句“内部 canonical tracks 的 property path 只允许…”即可;更详细的 payload / compiler 示例应主要留在 design。

**决议(2026-07-08 · 采方案 B)**:不改。此项非一致性错误,仅为观感;proposal `5.3 tracks` 已明确 `tracks` 为内部非公开执行形态,保持现状即可,不做精简。L-3 记录关闭。

### L-4(已解决):类图是概念图,未精确表达 OOP adapter/interface 边界

**文档位置**:design 的类图把 `useEntityAnimation`、`useBindMotionTarget` 等 hook 画成 class,并画出 `SpatializedElementMotionAdapter` / `EntityMotionAdapter`,但没有显式标出二者共享的 target adapter 协议或接口边界。

**问题**:这不影响主架构理解,但若开发者直接按类图拆实现,会把“React hook / binding / Core animation object / Native adapter”几个不同性质的对象混在同一种 class 语义里。OOP 上真正重要的是 `AnimationObject` 只依赖 target-agnostic create/control/event 协议,Native 侧按 target type 分发到 `SpatializedElementMotionAdapter` 或 `EntityMotionAdapter`;类图目前表达了方向,但不够精确。

**建议**:把类图标注为 conceptual class diagram,或补一个最小 adapter/interface 关系,例如 `MotionTargetAdapter` / `AnimationTargetAdapter` 由 spatialized 与 Entity 两个 adapter 实现。保持轻量即可,不要为了图引入实际代码中不需要的抽象。

**决议(2026-07-08 · 采方案 A)**:在类图中补入最小接口 `MotionTargetAdapter`(`<<interface>>` create / control / emitConfirmedValues),由 `SpatializedElementMotionAdapter` 与 `EntityMotionAdapter` 实现,`TargetResolver` 按 target type 分发到该接口;并在类图下补一句说明,点明这是 conceptual class diagram 且 `AnimationObject` 只依赖 target-agnostic 协议。已回写 design(中英)。L-4 关闭。

## 与 proposal / spec 的一致性核对

| 主题 | proposal / spec | design | 是否一致 |
| --- | --- | --- | --- |
| 返回三元组 `[animation, api, entityProps]` | spec 明确要求 | design 各层改动一致 | 一致 |
| `api.set` patch-only、无 updater、非 playback | proposal 7 / spec 明确 | design api.set 段一致 | 一致 |
| native 唯一权威、非逐帧回写 | spec 明确 | design 设计原则一致 | 一致 |
| 复用 Create/Control JSB,不新增 Entity 平行 JSB | proposal 影响面隐含 | design 明确复用 | 一致 |
| `supports('useAnimation')` 顶层 key,移除 `['entity']` | proposal 11 / tasks 1.3 | design Capability 段一致 | 一致 |
| 不支持目标(opacity)显式失败 | proposal / spec 明确 | design 编译规则 1 一致 | 一致 |
| per-channel timing 编译 | — | design 已采纳 `EntityChannelAnimationPlan` | 一致(H-1 已解决) |
| `entityProps` 完整性(分量级) | spec 已改为“已接管分量” | design 一致 | 一致(H-2 已解决) |
| 分量级 ownership | proposal / spec 已改为 per-component | design 一致 | 一致(H-3 已解决) |
| terminal state 优先于 stale base props | spec 明确要求 | design React layer key changes 第 7 条已明确删除旧同步路径 | 一致(M-6 已解决) |

## 已落盘的决策(2026-07-08)

以下五项 Medium 已按选定方案同步到 proposal / spec / design(中英两版):

1. **M-1 方案 A**:design 给出 `SpatializedPlaybackError.code` 最小分类(5 类),全部进 `onError`;spec 新增“错误可分类” requirement。
2. **M-2 方案 A**:以 `animationId` 反查本地 object 判型,不新增事件字段;unknown / stale 事件丢弃。
3. **M-3 方案 B**:create/bind 不额外 emit initial confirmed;`entityProps` 首个 lifecycle commit 前 MAY 为空。
4. **M-4 方案 A**:拆为 `EntityMotionPatch`(写)与 `EntityMotionProps`(读)。
5. **M-5**:编译规则 7 补 shortest-path slerp 语义说明。

追加复核新增的 M-6 与 L-2 已按“直接删除旧 entity-transform-animation 遗留(含 JS 侧 suppression 机制)”一并解决,已回写 design(React layer key changes 第 7 条、Native #5)。剩余 Low 项(L-1 loop 更新时机、L-3 tracks 公开感、L-4 类图/OOP 表达精度)待后续处理。

## 是否适合进入 design review

可以进入 design review。核心执行路线(RealityKit backend、native 权威、JSB 复用、canonical tracks → per-channel plan)已清楚且自洽,原三个 High 已随 per-channel 编译与分量级 ownership 两处改造关闭,五个 Medium(M-1 – M-5)已于 2026-07-08 落盘并回写 proposal / spec / design。追加复核新增的 M-6 已通过“直接删除旧 entity-transform-animation 遗留(含 JS 侧 suppression 机制)”解决并回写 design,同一决策一并关闭 L-2。L-1(采 A)、L-4(采 A)已回写 design / spec,L-3 采 B(不改,仅记录)。至此 High / Medium / Low 项全部处置完毕,可进入 design review。
