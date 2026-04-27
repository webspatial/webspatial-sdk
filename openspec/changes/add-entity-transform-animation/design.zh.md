## 背景

评审文档把实体 Transform 动画拆分为 API 设计、实现设计与边界行为定义。该能力会同时涉及 React 实体组件、Core SDK 命令链路、运行时能力检测以及 visionOS Native scene 层，因此在编码前先明确技术设计更合适。

当前 SDK 对实体 transform props 的更新是立即生效的，缺少 Native 播放契约、动画生命周期回调，以及 React re-render 与进行中的 Native 动画之间的协调机制。

## 目标 / 非目标

**目标：**

- 围绕 `useAnimation(config)`、实体 `animation` prop 与 `AnimationApi.play/pause/resume/stop` 定义稳定的对外 API。
- 保持动画由 Native 驱动，避免依赖逐帧 JS 更新。
- 在动画控制某个字段时，避免 React props 同步与动画对同一字段发生竞争。
- 通过 `supports('useAnimation')` 文档化运行时能力检测。
- 使该设计在 React、Core 命令流与 Native 完成/停止行为上可测试、可验证。

**非目标：**

- 支持材质、透明度、颜色等非 transform 属性动画。
- 在本次变更中引入弹簧物理或超出既定范围的复杂 easing。
- 在本次变更中解决大角度旋转等限制（仅文档化现状与边界行为）。
- 引入运行时能力的订阅/动态刷新模型。

## 关键决策

1. **对外 API 以 `useAnimation` + 实体 `animation` prop 为入口**
   - 评审方向偏向明确的 `animation` prop，而不是把动画数据 spread 到实体普通 props 上。
   - 命令式入口采用 `AnimationApi.play()` 替代 `start()`，使动词语义与常见媒体控制更一致。
   - 备选方案：直接 spread 返回的 animated props 到实体。否决原因：隐藏字段会混入实体 props，容易发生冲突，语义也不清晰。

2. **React 将配置与渲染态 animation 对象分离**
   - `from`、`to`、回调、时序参数、loop 等配置由 hook 内部存储（state/ref），不直接作为渲染 payload 暴露。
   - 渲染态 `animation` 对象只携带 transform 目标值与实体绑定所需的内部元数据。
   - 备选方案：把完整 config 放到实体 prop。否决原因：渲染与控制耦合、易产生不必要的 re-render。

3. **Core 与 Native 采用统一的动画命令契约**
   - 最新评审设计倾向用一个 Animation command + `type` 来区分 play/pause/resume/stop，而不是四个独立命令。
   - 好处：减少 JSBridge 注册点，控制流更集中，所有操作都围绕 `animationId` 会话展开。
   - 备选方案：每个动作一个命令。否决原因：重复注册与解析，收益有限。

4. **动画在 Native 侧播放，并把终态 transform 回传到 JS**
   - Native 负责动画会话、时序、delay、loop、pause/resume 状态。
   - JS 侧收到 completed/stopped 的 transform，用于触发回调并在 stop 时同步状态。
   - 备选方案：在 JS 侧模拟并逐帧通过 bridge 推送。否决原因：bridge 压力大、抖动风险高、与 RealityKit 驱动的评审方向不一致。

5. **transform 同步采用按字段抑制策略**
   - 当动画控制某个字段时，只抑制该字段的常规同步，避免与动画竞争。
   - 未被动画控制的字段保持现有行为，不受影响。
   - 备选方案：任意字段动画中就冻结全部 transform 同步。否决原因：会无谓阻断与动画无关的更新。

6. **能力检测采用明确的 top-level key**
   - 通过 `supports('useAnimation')` 表达端到端动画能力是否可用。
   - 应用可在缺少 Native bridge/播放能力的环境中做安全分支。
   - 备选方案：不新增 capability key。否决原因：评审明确提到 feature detection 是外部契约的一部分。

## 风险 / 权衡

- **风险：**评审文档与最终实现 API 漂移 -> **缓解：**先用 OpenSpec 固化 `play`、`animation` prop、`loop` 与生命周期回调的契约，再进入代码阶段。
- **风险：**React re-render 仍可能发送竞争的 transform 更新 -> **缓解：**为混合字段（部分动画/部分非动画）增加针对性测试，并在实体 transform 同步边界实现字段级抑制。
- **风险：**Native 在 delay、stop、completed 的事件顺序存在边界情况 -> **缓解：**以 `animationId` 维护单会话记录，并用测试覆盖事件顺序与回调触发。
- **风险：**不同 runtime 支持差异导致行为不一致 -> **缓解：**用 `supports('useAnimation')` gate，并文档化保守返回 false 的策略。
- **风险：**大角度旋转行为可能让开发者困惑 -> **缓解：**明确文档化限制，第一版只覆盖评审范围内的 transform 动画行为。

## 发布与回滚

- 以增量方式在 React 与 Core SDK 增加 API。
- 同一变更中更新 capability table 与公共文档，便于应用按能力分支。
- 在 test-server 示例中验证后再推广到更多 sample。
- 若需要暂停发布，通过 capability key 关闭并避免在 public export 中暴露该能力，直到 Native 支持完善。

## 未决问题

- 在不支持的 runtime 中，`useAnimation` 被直接使用时应当 silent no-op 还是给出 warning。
- 第一版是否需要对无效 loop/transform 配置给出显式错误，还是沿用现有的参数校验习惯。
- 仓库内是否已有可复用的实体抽象点，能承载新增 `animation` prop，避免在多个实体组件中重复改动。