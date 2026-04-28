## 背景

完整动机见 proposal。简言之：实体 transform 更新目前是瞬时跳变，缺少 native 过渡能力。本设计文档覆盖 transform-only 动画 API、跨层契约及行为规则。

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

## API 外形

对外契约以 `useAnimation` Hook 为核心。以下类型定义了约定的 API 形状；具体行为语义见配套的 spec 文档。

### Hook 签名

```typescript
function useAnimation(config: AnimationConfig): [AnimatedProps, AnimationApi]
```

### AnimationConfig

```typescript
interface AnimationConfig {
  /**
   * 目标 transform 值（必填）。
   * rotation 值为角度制（degrees）的欧拉角。
   * 单轴超过 180° 的旋转可能因最短路径 SLERP 产生非预期结果。
   */
  to: {
    position?: Vec3
    rotation?: Vec3  // 角度制
    scale?: Vec3
  }

  /** 起始 transform 值。省略则从实体当前状态开始。 */
  from?: {
    position?: Vec3
    rotation?: Vec3
    scale?: Vec3
  }

  /** 时长，单位秒。默认 0.3 */
  duration?: number

  /**
   * 缓动曲线。默认 'easeInOut'
   * 仅接受这四个值，其他字符串在校验时抛错。
   */
  timingFunction?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'

  /** 播放前延迟，单位秒。默认 0 */
  delay?: number

  /** 实体挂载后是否自动播放。默认 true */
  autoStart?: boolean

  /**
   * 循环行为。
   * - true：回到 from 重新播放（无限 reset 循环）
   * - { reverse: true }：每轮反向（无限 reverse 循环）
   * - undefined / false：播放一次
   */
  loop?: boolean | { reverse?: boolean }

  /** 播放开始时触发。 */
  onStart?: () => void

  /** 非循环动画自然结束时触发，携带 Native 侧最终 transform。 */
  onComplete?: (finalValues: TransformValues) => void

  /** 通过 api.stop() 停止时触发，携带 stop 点的 transform。 */
  onStop?: (currentValues: TransformValues) => void
}
```

### AnimationApi

```typescript
interface AnimationApi {
  /** 启动（或重新启动）动画。 */
  play(): void

  /** 在当前进度暂停。 */
  pause(): void

  /** 从暂停处恢复。 */
  resume(): void

  /** 停止动画，实体保持在 stop 点。 */
  stop(): void

  /** 当前是否处于 delaying 或 running 状态（paused 时为 false）。 */
  readonly isAnimating: boolean
}
```

### AnimatedProps

Hook 返回元组的第一个元素，不透明对象。直接传给实体的 `animation` prop 即可，应用代码无需读取或修改其内容。

### TransformValues

```typescript
interface TransformValues {
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
}
```

## 用法示例

### 挂载时入场动画

组合 position 与 scale 动画，带延迟。`autoStart` 默认为 `true`，实体挂载后自动播放。

```tsx
function FloatingBox() {
  const [animation] = useAnimation({
    from: { position: { x: 0, y: -1, z: -2 }, scale: { x: 0.1, y: 0.1, z: 0.1 } },
    to:   { position: { x: 0, y: 1, z: -2 },  scale: { x: 1, y: 1, z: 1 } },
    duration: 0.6,
    delay: 1.5,
    timingFunction: 'easeOut',
  })

  return (
    <Reality>
      <SceneGraph>
        <BoxEntity width={0.3} height={0.3} depth={0.3} animation={animation} />
      </SceneGraph>
    </Reality>
  )
}
```

### 手动触发 play()

设置 `autoStart: false`，交互时调用 `api.play()`。

```tsx
function TapToMove() {
  const [animation, api] = useAnimation({
    from: { position: { x: -1, y: 0, z: -2 } },
    to:   { position: { x: 1, y: 0, z: -2 } },
    duration: 0.8,
    autoStart: false,
  })

  return (
    <Reality onSpatialTap={() => api.play()}>
      <SceneGraph>
        <BoxEntity width={0.3} height={0.3} depth={0.3} animation={animation} />
      </SceneGraph>
    </Reality>
  )
}
```

### 持续反向循环 + 暂停 / 恢复

无限往返旋转，点击切换暂停和恢复。

```tsx
function SpinningModel() {
  const [animation, api] = useAnimation({
    from: { rotation: { x: 0, y: 0, z: 0 } },
    to:   { rotation: { x: 0, y: 170, z: 0 } },
    duration: 2.0,
    timingFunction: 'linear',
    loop: { reverse: true },
  })

  return (
    <Reality onSpatialTap={() => api.isAnimating ? api.pause() : api.play()}>
      <SceneGraph>
        <ModelEntity model="robot" scale={{ x: 0.2, y: 0.2, z: 0.2 }} animation={animation} />
      </SceneGraph>
    </Reality>
  )
}
```

### 停止并同步状态

播放期间，animation 接管 `position`，普通 prop 更新被抑制。`stop()` 后控制权回到 `position` prop。`onStop` 将 stop 点的 transform 同步回 React state，避免实体跳变。

```tsx
function StopAndSync() {
  const [pos, setPos] = useState<Vec3>({ x: 0, y: 0, z: -2 })

  const [animation, api] = useAnimation({
    to: { position: { x: 2, y: 2, z: -2 } },
    duration: 3.0,
    autoStart: false,
    onStop: (current) => {
      if (current.position) setPos(current.position)
    },
  })

  return (
    <>
      <button onClick={() => api.play()}>Play</button>
      <button onClick={() => api.stop()}>Stop</button>
      <Reality>
        <SceneGraph>
          <BoxEntity
            width={0.3} height={0.3} depth={0.3}
            position={pos}
            animation={animation}
          />
        </SceneGraph>
      </Reality>
    </>
  )
}
```

## 跨层契约

### React SDK → Core SDK

React 通过 `SpatialEntity` 上的一个方法驱动完整的动画生命周期：

```typescript
interface SpatialEntity {
  animateTransform(command: AnimateTransformCommand): Promise<AnimateTransformResult>
}

interface AnimateTransformCommand {
  animationId: string
  type: 'play' | 'pause' | 'resume' | 'stop'
  /** type 为 'play' 时必填，其他类型忽略。 */
  entityId?: string
  toTransform?: Float4x4
  fromTransform?: Float4x4
  duration?: number
  timingFunction?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
  delay?: number
  loop?: boolean | { reverse?: boolean }
}

interface AnimateTransformResult {
  animationId: string
  /** 动画自然完成时 resolve。 */
  finished: Promise<TransformValues>
  /** 通过 stop() 停止时 resolve。 */
  stopped: Promise<TransformValues>
}
```

### Core SDK ↔ Native（JSBridge）

**JS → Native 命令：**单个 `AnimateTransform` 命令，通过 `type` 字段区分操作，结构与上述 `AnimateTransformCommand` 一致。Core SDK 序列化后通过 bridge 发送。

**Native → JS 事件：**

| 事件名 | 触发时机 | Payload |
|---|---|---|
| `{animationId}_completed` | 动画自然结束（所有循环完成） | `TransformValues` — Native 侧最终 transform |
| `{animationId}_stopped` | 调用 `stop()` | `TransformValues` — stop 点的 transform |

两个事件监听在 `play` 时注册，避免 `stop()` 在监听就绪前被调用导致的竞态。

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
   - **Stop 语义：**调用 `stop()` 时，实体冻结在当前播放中间态（stop 点），而不是回到 `from` 或跳到 `to`。Native 侧读取当时的 `entity.transform`，通过 stopped 事件回传，`onStop` 回调将该值交给 JS 侧以便同步状态。

5. **transform 同步采用按字段抑制策略**
   - 当动画控制某个字段时，只抑制该字段的常规同步，避免与动画竞争。
   - 未被动画控制的字段保持现有行为，不受影响。
   - 备选方案：任意字段动画中就冻结全部 transform 同步。否决原因：会无谓阻断与动画无关的更新。
   - **抑制解除时机：**字段级抑制在动画会话结束时（completion 或 stop）解除。`__animating` flags 在生命周期回调触发前被清除，因此回调之后的下一个 React 渲染周期将恢复对先前被动画控制字段的常规 transform 同步。

6. **能力检测采用明确的 top-level key**
   - 通过 `supports('useAnimation')` 表达端到端动画能力是否可用。
   - 应用可在缺少 Native bridge/播放能力的环境中做安全分支。
   - 备选方案：不新增 capability key。否决原因：评审明确提到 feature detection 是外部契约的一部分。

7. **不支持的 runtime 需要给出 warning**
   - 当 `supports('useAnimation')` 为 `false` 的 runtime 里仍直接使用 `useAnimation` 时，SDK 应给出 warning，而不是完全静默失败。
   - 这样既能保留能力检测契约，又能在接入阶段尽早暴露误用。

8. **非法动画配置视为程序错误**
   - 对非法配置，例如不支持的 loop 结构、缺少动画目标、无意义的时序参数，应直接抛错，而不是忽略。
   - 这样能把问题暴露在调用点附近，避免出现难排查的部分生效或静默失败。

9. **实体接入优先走公共抽象层**
   - 新增 `animation` prop 时，应优先接入公共实体抽象层，再下沉到叶子实体组件。
   - 这样可以减少重复逻辑，并保持不同实体类型的 transform 同步行为一致。

## 风险 / 权衡

- **风险：**评审文档与最终实现 API 漂移 -> **缓解：**先用 OpenSpec 固化 `play`、`animation` prop、`loop` 与生命周期回调的契约，再进入代码阶段。
- **风险：**React re-render 仍可能发送竞争的 transform 更新 -> **缓解：**为混合字段（部分动画/部分非动画）增加针对性测试，并在实体 transform 同步边界实现字段级抑制。
- **风险：**Native 在 delay、stop、completed 的事件顺序存在边界情况 -> **缓解：**以 `animationId` 维护单会话记录，并用测试覆盖事件顺序与回调触发。
- **风险：**不同 runtime 支持差异导致行为不一致 -> **缓解：**用 `supports('useAnimation')` gate，并文档化保守返回 false 的策略。
- **风险：**Bridge 开销在复杂动画编排中可能累积 -> **缓解：**单次 play = 1 次 bridge 调用；播放期间零逐帧 bridge 调用；终态事件最多 1 次回调（completion 或 stop）。每个动画生命周期的 bridge 总流量不超过 2–3 次调用，与时长和帧数无关。
- **风险：**大角度旋转行为可能让开发者困惑 -> **缓解：**明确文档化限制，第一版只覆盖评审范围内的 transform 动画行为。

## 发布与回滚

- 以增量方式在 React 与 Core SDK 增加 API。
- 同一变更中更新 capability table 与公共文档，便于应用按能力分支。
- 在 test-server 示例中验证后再推广到更多 sample。
- 若需要暂停发布，通过 capability key 关闭并避免在 public export 中暴露该能力，直到 Native 支持完善。

## 已确认结论

- 在不支持的 runtime 中，如果未先做能力检测就直接使用 `useAnimation`，SDK 应给出 warning。
- 非法动画配置应直接抛错，而不是静默忽略。
- 实体侧接入优先走公共抽象层，避免在多个组件中重复改动。