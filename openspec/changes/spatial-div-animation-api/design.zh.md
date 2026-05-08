## 背景

`SpatialDiv` 当前的同步路径与实体不同。React 侧通过 `PortalInstanceObject` 读取 DOM 的 `computedStyle`、`getBoundingClientRect()` 和 `DOMMatrix`，再分别走两条链路：

- `UpdateSpatialized2DElementProperties`：同步 `width`、`height`、`depth`、`opacity`、`backOffset` 等属性
- `UpdateSpatializedElementTransform`：同步完整的 transform matrix

这意味着如果直接沿用"普通 props 改变即立刻同步 native"的模型，动画播放会与常规 DOM 同步产生竞争。与此同时，产品需求已将 `SpatialDiv` 动画的第一版范围限制为 `back`、`transform.translate.x/y/z`、`opacity`、`depth`、`width`、`height`，并明确要求高层 API 设计遵循 `entity transform animation` 提案。因此，本设计要解决的核心不是"如何支持任意 CSS 动画"，而是"如何在现有 SpatialDiv 同步架构上，以最小可实现范围提供一致的动画 API"。

## 目标 / 非目标

**目标：**

- 沿用 `useAnimation(config)` + `animation` prop + `AnimationApi` 的 API 家族，保证与实体动画提案的使用方式一致。
- 将 `SpatialDiv` 动画严格限制在白名单属性范围内，避免引入任意 CSS 字符串解析和插值。
- 让播放由 native 侧驱动，避免逐帧 JS 更新 DOM 或 JSBridge。
- 明确动画期间 `SpatialDiv` 常规 DOM 同步的抑制规则，避免普通更新覆盖动画中间态。
- 为 `SpatialDiv` 动画提供独立的 runtime capability key，使其可以与实体动画独立演进、独立上线。

**非目标：**

- 支持任意 CSS 属性动画，或接受完整 CSS style 对象作为 `to` / `from`。
- 支持 `SpatialDiv` 的旋转、缩放、skew、矩阵级 transform 插值，或任意 CSS transform 字符串插值。
- 让 `width` / `height` 动画自动回写 DOM 布局或触发浏览器 reflow。
- 在本次提案中统一实体动画和 `SpatialDiv` 动画的 capability key 体系。
- 在单个 hook 内支持多段 keyframe、异步脚本编排或跨多个 `SpatialDiv` 的时间轴编排。

## API 接口

公开契约以 `useAnimation` hook 为中心。以下类型定义了约定的形状；行为语义在 spec 中详细规定。

### Hook 签名

```typescript
function useAnimation(config: SpatialDivAnimationConfig): [SpatialDivAnimatedProps, AnimationApi]
```

### SpatialDivAnimatedValues

```typescript
interface SpatialDivAnimatedValues {
  back?: number
  transform?: { translate?: { x?: number; y?: number; z?: number } }
  opacity?: number
  depth?: number
  width?: number
  height?: number
}
```

### SpatialDivAnimationConfig

```typescript
interface SpatialDivAnimationConfig {
  /**
   * 目标动画值（必填）。
   * 仅接受白名单字段：back、transform.translate.x/y/z、opacity、depth、width、height。
   */
  to: SpatialDivAnimatedValues

  /** 起始动画值。省略时按 play() 执行时刻从当前状态快照。 */
  from?: SpatialDivAnimatedValues

  /** 动画时长，单位秒。默认值：0.3 */
  duration?: number

  /**
   * 缓动曲线。默认值：'easeInOut'
   * 仅接受以下四个值；其他字符串在校验时直接抛错。
   */
  timingFunction?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'

  /** 播放前延迟，单位秒。默认值：0 */
  delay?: number

  /** 元素绑定后是否自动开始播放。默认值：true */
  autoStart?: boolean

  /**
   * 循环行为。
   * - true：重置到 `from` 后重复播放（无限 reset 循环）
   * - { reverse: true }：每一轮在 from 与 to 之间反向（无限 reverse 循环）
   * - undefined / false：播放一次
   */
  loop?: boolean | { reverse?: boolean }

  /** 会话建立成功后调用；首态可以是 delaying、running 或因 queued pause 导致的 paused。 */
  onStart?: () => void

  /** 非循环动画自然完成时调用。接收 native 终态值。 */
  onComplete?: (finalValues: SpatialDivAnimatedValues) => void

  /** 通过 api.stop() 停止播放时调用。接收 stop 点值。 */
  onStop?: (currentValues: SpatialDivAnimatedValues) => void

  /**
   * bridge 或 native 操作发生异步错误时调用。
   * 若未提供，SDK MUST 通过 console.error 输出错误。
   */
  onError?: (error: AnimationError) => void
}
```

### AnimationError

```typescript
interface AnimationError {
  /** 遇到错误的会话 id。 */
  animationId: string
  /** 失败的命令。 */
  command: 'play' | 'pause' | 'resume' | 'stop'
  /** 可选的机器可读错误码。 */
  code?: string
  /** 人类可读的失败原因。 */
  reason: string
}
```

### AnimationApi

```typescript
interface AnimationApi {
  /** 启动（或重新启动）动画。 */
  play(): void

  /** 在当前进度暂停动画。 */
  pause(): void

  /** 从暂停点恢复动画。 */
  resume(): void

  /** 停止动画。SpatialDiv 保持在 stop 点。 */
  stop(): void

  /** 动画当前是否处于 queued、delaying 或 running 状态（paused 时为 false）。 */
  readonly isAnimating: boolean

  /** 动画当前是否被暂停。 */
  readonly isPaused: boolean
}
```

### SpatialDivAnimatedProps

作为 tuple 第一个元素返回的不透明对象。直接传给空间化 HTML 节点的 `animation` prop，应用代码不应读取或修改其内容。

所有白名单值使用数值型输入：

- `back`、`depth`、`width`、`height`、`transform.translate.x/y/z`：使用与现有 SpatialDiv 一致的像素语义
- `opacity`：`[0, 1]` 闭区间

## 用法示例

### SpatialDiv 入场动画

Back 偏移和 opacity 配合动画实现卡片从后方淡入的入场效果。`autoStart` 默认为 `true`，元素绑定后自动播放。

```jsx
function FadeInCard() {
  const [animation] = useAnimation({
    from: { back: -50, opacity: 0 },
    to:   { back: 0, opacity: 1 },
    duration: 0.6,
    timingFunction: 'easeOut',
  })

  return (
    <div enable-xr animation={animation} style={{ width: 300, height: 200 }}>
      <h2>Hello Spatial</h2>
    </div>
  )
}
```

### 手动触发 + Stop 同步尺寸

设置 `autoStart: false`，点击按钮后播放。`onStop` 中手动同步 React state 以保持 DOM 与 native 尺寸一致。

```jsx
function ResizePanel() {
  const [size, setSize] = useState({ width: 200, height: 150 })

  const [animation, api] = useAnimation({
    to: { width: 400, height: 300 },
    duration: 1.0,
    autoStart: false,
    onStop: (current) => {
      if (current.width != null && current.height != null) {
        setSize({ width: current.width, height: current.height })
      }
    },
  })

  return (
    <>
      <button onClick={() => api.play()}>Expand</button>
      <button onClick={() => api.stop()}>Stop</button>
      <div
        enable-xr
        animation={animation}
        style={{ width: size.width, height: size.height }}
      >
        <p>Resizable Panel</p>
      </div>
    </>
  )
}
```

### 循环浮动效果

使用 `transform.translate.y` 和 `loop: { reverse: true }` 实现无限上下浮动。点击切换暂停 / 恢复。

```jsx
function FloatingBadge() {
  const [animation, api] = useAnimation({
    from: { transform: { translate: { x: 0, y: 0, z: 0 } } },
    to:   { transform: { translate: { x: 0, y: 20, z: 0 } } },
    duration: 1.5,
    timingFunction: 'easeInOut',
    loop: { reverse: true },
  })

  return (
    <div
      enable-xr
      animation={animation}
      onClick={() => {
        if (api.isPaused) {
          api.resume()
        } else if (api.isAnimating) {
          api.pause()
        } else {
          api.play()
        }
      }}
      style={{ width: 100, height: 100 }}
    >
      <span>Float</span>
    </div>
  )
}
```

## 跨层契约

### React SDK → Core SDK

React 调用 `Spatialized2DElement` 上的一个方法来驱动完整的动画生命周期：

```typescript
interface Spatialized2DElement {
  animateSpatialDiv(command: AnimateSpatialDivCommand): AnimateSpatialDivResult | void
}
```

`animateSpatialDiv()` 当 `command.type` 为 `'play'` 时返回 `AnimateSpatialDivResult`，其他类型（`'pause'` / `'resume'` / `'stop'`）返回 `void`。

```typescript
interface AnimateSpatialDivCommand {
  /**
   * 标识动画会话。每次 `play` 命令 MUST 生成一个新的全局唯一 `animationId`。
   * `pause`、`resume`、`stop` MUST 复用创建该会话的 `play` 命令的 `animationId`。
   */
  animationId: string
  type: 'play' | 'pause' | 'resume' | 'stop'
  /** type 为 'play' 时必填；其他类型忽略。 */
  elementId?: string
  to?: SpatialDivAnimatedValues
  from?: SpatialDivAnimatedValues
  duration?: number
  timingFunction?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
  delay?: number
  loop?: boolean | { reverse?: boolean }
}

interface AnimateSpatialDivResult {
  animationId: string
  /** 非循环动画自然完成时 resolve。无限循环时永不 resolve。 */
  finished: Promise<SpatialDivAnimatedValues>
  /**
   * 动画通过 stop() 停止时 resolve。
   * stop 后，`finished` MUST 保持 pending（不得 reject）。
   */
  stopped: Promise<SpatialDivAnimatedValues>
}
```

如果元素在 alive 会话期间卸载，SDK MUST 停止/取消 native 会话，但 MUST NOT resolve `finished` 或 `stopped`（且 MUST NOT 在卸载后调用生命周期回调）。

`animateSpatialDiv(...)` MAY 仅在命令无法提交（native 接受前）时 reject。一旦命令提交成功，后续的异步失败 MUST 通过 `{animationId}_failed` 事件上报，而不是通过 `finished` / `stopped` promise。

### Core SDK ↔ Native (JSBridge)

**JS → Native 命令：** 单个 `AnimateSpatialized2DElement` 命令，带 `type` 鉴别器，与 `AnimateSpatialDivCommand` 形状匹配。Core SDK 序列化后通过 bridge 发送。

**Native → JS 事件：**

| 事件名 | 触发条件 | Payload |
|---|---|---|
| `{animationId}_completed` | 动画自然完成（所有循环结束） | `SpatialDivAnimatedValues` — native 终态值 |
| `{animationId}_stopped` | 调用 `stop()` | `SpatialDivAnimatedValues` — stop 点值 |
| `{animationId}_failed` | `play` / `pause` / `resume` / `stop` 异步失败 | `AnimationError` — 至少包含 `animationId`、`command`、`reason`，可选 `code` |

`_completed`、`_stopped`、`_failed` 的 listener MUST 在发送 `play` 命令之前注册，以避免终态或失败事件在 listener 就绪前触发的竞态。

`animationId` MUST 在 runtime 进程内全局唯一，确保事件名不会跨元素或跨会话碰撞。

对于给定的 `animationId`：

- `play` 成功建立会话后，native MUST 恰好发出一个终态事件（`_completed` 或 `_stopped`），两者 MUST 互斥。
- 若 `play` 异步失败，native MUST 至多发出一次 `_failed`，且 MUST NOT 随后发出 `_completed` 或 `_stopped`。
- 若 `pause`、`resume`、`stop` 异步失败，native MUST 为该失败命令至多发出一次 `_failed`；会话保持失败前状态，后续仍 MAY 发出 `_completed` 或 `_stopped`。

## 决策

1. **复用同一个 `useAnimation` 家族，通过 `config.to` 的 key 集合在 hook 入口自动分叉**

   对外仍使用同名 `useAnimation(config)`，hook 内部通过检查 `config.to` 的 key 来区分走 entity 路径还是 SpatialDiv 路径。两组 key 集合互斥：

   - Entity key 集合：`position`、`rotation`、`scale`
   - SpatialDiv key 集合：`back`、`transform`（v1 仅 `translate` 子字段）、`opacity`、`depth`、`width`、`height`

   规则：

   - 若 `to` 中同时出现两组 key，SDK MUST 直接抛错
   - 若 `to` 全部为 entity key，走 entity 路径（现有 `useEntityAnimation` 逻辑，完全不改）
   - 若 `to` 全部为 SpatialDiv key，走 SpatialDiv 路径（新增 `useSpatialDivAnimation` 内部逻辑）
   - 返回的 `animation` 对象内部携带 `__kind: 'entity' | 'spatialDiv'` 标记（对应用不可见）
   - entity 组件绑定时校验 `__kind === 'entity'`，SpatialDiv 绑定时校验 `__kind === 'spatialDiv'`，不匹配则抛错

   对 entity 动画的影响仅限于：(a) `useAnimation` 入口新增一层 if/else 分支调用原有逻辑；(b) entity 路径创建 animation 对象时多设一个 `__kind` 字段；(c) entity 组件绑定时加一行 kind 校验。entity 的核心逻辑（config 校验、Vec3→Float4x4、bridge 命令、suppression、callback 调度）完全不变。

   **前向兼容说明：** 当前两组 key 没有碰撞。如果未来 entity 侧也引入 `opacity` 或 `transform` 字段，导致两组 key 出现碰撞，MUST 引入显式 discriminator 字段（如 `target: 'entity' | 'spatialDiv'`）来替代 key 推断。现阶段靠 key 互斥即可。

   备选方案 A 是新增 `useSpatialDivAnimation()`，彻底独立。优点是对 entity 零侵入；缺点是 API 家族分裂，同一套播放生命周期在两个 hook 间重复出现。

   备选方案 B 是在 config 上直接加 `target` discriminator。否决原因是增加了使用侧仪式感，且当前 key 不碰撞，不需要额外消歧。

2. **运行时能力检测使用独立 key `supports('spatialDivAnimation')`**

   虽然 `SpatialDiv` 动画也复用 `useAnimation` 这个 hook 名称，但 capability 检测不复用实体提案中的 `supports('useAnimation')`。原因是两者的 native 依赖、可用组件范围和上线节奏可能不同，强行共用一个 top-level key 会把两个能力绑死在一起。

   因此：

   - `supports('useAnimation')` 继续保留给实体 transform 动画提案
   - `supports('spatialDivAnimation')` 专门表示 `SpatialDiv` 白名单属性动画
   - 某个 runtime MAY 仅支持其一

   备选方案是为 `useAnimation` 引入 sub-token，例如 `supports('useAnimation', ['spatial-div'])`。否决原因是当前仓库中实体动画提案已经把 `supports('useAnimation')` 定义成单一 key，新的 sub-token 语义会与该提案产生额外协调成本。

3. **`animation` prop 仅对 `enable-xr` 产生的 spatialized HTML 节点生效**

   `SpatialDiv` 动画的落点是 `Spatialized2DElement`，因此只有真正走 `Spatialized2DElementContainer` 链路的节点才能播放 native 动画。设计上：

   - `animation` prop 允许出现在支持 `enable-xr` 的 HTML 容器上
   - 若元素未开启 `enable-xr`，SDK MUST warning 且 MUST NOT 启动 native 播放
   - 同一个 `animation` 对象 MUST NOT 绑定到多个元素；第二次绑定时立即抛错

   这样与实体动画保持"一个 animation 对象只对应一个绑定目标"的语义一致，同时避免开发者误以为普通 DOM 节点也能走相同能力。

4. **Core / bridge / native 采用 `AnimateSpatialized2DElement` 会话命令**

   `SpatialDiv` 需要动画的字段跨越 `transform` 和 `properties` 两条现有同步链路，因此不适合简单复用实体侧的 transform-only 命令。设计上新增一个围绕 `Spatialized2DElement` 的统一动画命令。

   备选方案是把 `transform` 动画与属性动画拆成两类命令。否决原因是一个 `SpatialDiv` 动画配置经常同时包含 `transform`、`opacity` 和 `back`，拆开后会显著增加会话对齐和失败恢复复杂度。

5. **`from` 缺省时按播放执行时刻快照，`width` / `height` 为 native 尺寸覆盖**

   当 `from` 省略时，native 侧在收到 `play` 命令时自行快照当前值（与实体动画一致），而不是由 JS 侧预先读取再下发。这避免了额外的 bridge 往返。若元素尚未绑定，`play()` 会进入 queued 状态，快照时刻以元素完成绑定并实际执行播放的时间点为准。`delay` 仅影响视觉动效何时开始，MUST NOT 改变起始快照的采集时机。快照 MUST 仅覆盖 `to` 中声明的字段；`to` 中未出现的字段 MUST NOT 被快照或被动画会话影响。

   各字段的快照来源规则：

   - `back`、`opacity`、`depth`：从 native 侧 `Spatialized2DElement` 的当前状态读取
   - `transform.translate.x/y/z`：从 native 侧 `Spatialized2DElement` 当前 transform 的平移分量读取
   - `width` / `height`：从 native 侧 `Spatialized2DElement` 的当前空间面板尺寸读取（而非 DOM `getBoundingClientRect()`），因为之前的动画 stop 可能已让 native 尺寸与 DOM 布局盒不一致

   `width` / `height` 的行为单独定义为"native 空间尺寸覆盖"，因为当前普通 `SpatialDiv` 尺寸来自 DOM 布局盒，而动画目标是空间面板本身。也就是说：

   - `width` / `height` 动画改变 native 中 `Spatialized2DElement` 的尺寸
   - 它不会自动修改 DOM 元素的 CSS `width` / `height`
   - 若应用希望动画结束后让 DOM 侧状态与 native 终态保持一致，应在 `onComplete` / `onStop` 中手动同步 React state

   备选方案是动画期间同步改写 DOM style。否决原因是这会把动画重新拉回浏览器布局系统，既无法避免 reflow，也无法保证 native 播放与 DOM 状态严格一致。

6. **竞争处理采用"属性级抑制 + transform 整体抑制"**

   对 `back`、`opacity`、`depth`、`width`、`height`，SDK 采用字段级抑制：动画会话控制某个字段时，`PortalInstanceObject.updateSpatializedElementProperties()` MUST 暂停向 native 推送该字段的常规同步，但其他未被动画控制的字段仍保持原路径。

   对 `transform`（v1 仅 `translate` 子字段），第一版采用"整体抑制"而不是细分到平移分量。原因是现有普通同步路径一次性下发完整 `DOMMatrix`，若只抑制平移分量，则需要在 React 和 native 两边都引入矩阵分解与重组逻辑，风险较高。第一版规则因此是：

   - 一旦动画配置包含 `transform`，常规 `updateTransform(matrix)` 同步在 alive 会话期间整体暂停
   - 动画结束后，在下一个 React 渲染周期恢复常规 transform 同步
   - alive 期间收到的最新 DOM transform 仍会被缓存，但不会即时生效

   抑制释放时机：字段级抑制在动画会话结束（自然完成或 stop）时释放。抑制标记在生命周期回调触发之前清除，这样回调之后的下一次 React 渲染周期就会恢复常规同步，使用该渲染周期中的最新 prop 值。缓存在恢复后丢弃。

   这意味着动画期间若应用还在修改 CSS rotate / scale，也会被延后到会话结束后生效。这是有意接受的 v1 权衡。

7. **生命周期和错误语义完全对齐实体动画**

   `play`、`pause`、`resume`、`stop`、`isAnimating`、`isPaused`、`onStart`、`onComplete`、`onStop`、`onError` 的含义与实体动画提案保持一致，以减少同一 SDK 内两套动画能力在行为上的差异。

   - `play()` 仍为同步 `void`
   - 异步 bridge / native 失败通过 `onError` 暴露
   - `stop()` 保持 stop 点，不回退到 `from`
   - `loop: true` 表示 reset 循环，`loop: { reverse: true }` 表示 reverse 循环

   备选方案是给 `SpatialDiv` 单独定义 Promise 风格控制 API。否决原因是这会破坏与实体动画之间的 API 一致性。

   **`onComplete` / `onStop` 返回值范围：** 回调中的 `SpatialDivAnimatedValues` 仅包含 `to` 中声明的字段对应的终态或 stop 点值；未被动画控制的字段不会出现在返回值中。这与实体动画的 `TransformValues` 回调行为一致。

8. **stop-old 失败时 MUST 阻止 start-new**

   对于 `play()` 驱动的重入和 animation prop 替换场景，如果停止旧会话的命令异步失败，SDK MUST 通过 `onError` 上报，并保持旧会话的失败前状态。在该失败情况下，SDK MUST NOT 启动新会话，且新会话的 `onStart` MUST NOT 触发。

9. **Config 更新不影响 alive 会话**

   应用在 React re-render 中更新传给 `useAnimation(config)` 的 config 时，当前 alive 会话（delaying / running / paused）MUST NOT 受影响。下一次 `api.play()` MUST 使用最新的 config。

## 风险 / 权衡

- **动画期间整体抑制 transform 会冻结普通 rotate / scale 更新** -> 通过 spec 明确这是第一版限制，并将更细粒度的 transform 组合留给后续版本。
- **`width` / `height` 动画可能让 native 尺寸与 DOM 布局盒暂时不一致** -> 通过 `onComplete` / `onStop` 返回终态，并在文档中明确需要应用自行决定是否同步 React state。
- **独立 capability key 会增加一点心智负担** -> 但它换来了与实体动画独立发布、独立回滚的能力，整体风险更小。
- **`SpatialDiv` 动画会同时触达 React、core、bridge 和 native 多层** -> 用统一会话命令、单一失败事件模型和聚焦测试用例降低跨层行为漂移风险。
- **共用 `useAnimation` 入口引入轻微的 entity 侧改动** -> 仅限入口 if/else 分支、`__kind` 字段和绑定校验，entity 核心逻辑不变。若未来 key 碰撞需引入显式 discriminator。
- **动画结束后若应用未在 `onComplete` / `onStop` 中同步 React state，常规同步恢复时可能将旧值推到 native，造成视觉"闪回"** -> 与实体动画行为一致。通过文档和示例明确告知开发者：如需保持动画终态，MUST 在回调中手动同步 state。
- **v1 假设 React 同步渲染模型** -> 抑制释放与常规同步恢复依赖"回调后的下一个 React 渲染周期"。在 Concurrent Mode / Suspense 下渲染时机可能不确定，属于已知限制。XR 应用目前基本不启用 Concurrent Mode，如未来有需求应在 SDK 同步基础设施层统一解决。