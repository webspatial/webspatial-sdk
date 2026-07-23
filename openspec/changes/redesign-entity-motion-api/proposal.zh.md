## 这是什么

`useEntityAnimation` 是一个 React Hook,用来给场景里的 3D 物体(Entity)做动画,让它平滑地移动、旋转或缩放。

`useEntityAnimation` 提供三大核心能力:

1. **关键帧动画(`timeline`)**:既能做“从 A 到 B”的简单动画,也能写 `0% → 50% → 100%` 这样的多段动画。
2. **动画结果回写(`entityProps`)**:Hook 会把动画的最终姿态交回给你,让物体在动画结束后稳稳停在终点。
3. **绑定方式(`animation`)**:通过组件的 `animation` 属性把动画绑定到物体上。

> **几个基础名词**(下文会反复用到):
> - **Entity**:场景里的一个 3D 物体,比如一个盒子 `<BoxEntity>`。
> - **transform**:物体的空间姿态,由三部分组成——位置 `position`(单位:米)、旋转 `rotation`(单位:度)、缩放 `scale`(倍数,1 表示原始大小)。
> - **`Vec3`**:一个三维向量,形如 `{ x, y, z }`,用来表示上面每一部分的三个轴。
> - **分量**:指 `position` / `rotation` / `scale` 这三者之一。

---

## 我想做 X,该用什么(场景速查)

| 我想做的事 | 用什么 |
|---|---|
| 让物体从一个姿态移动/旋转/缩放到另一个姿态 | config 里写顶层 `from` / `to`(最简写法),或 `timeline.from` / `timeline.to` |
| 做多段关键帧动画(如 0% → 50% → 100%) | config 里写 `timeline` |
| 让动画结束后物体停在终点、不弹回起点 | 把 `{...entityProps}` 展开到组件上 |
| 动画结束后,用代码把物体挪到新姿态 | 调用 `api.set({ ... })` |
| 只动画位置并保留其它分量 | 配置中只写 `position`;原生层从基准姿态补全 `rotation`、`scale`,播放期间接管完整变换,并通过 `entityProps` 回传完整的已提交变换 |
| 读取动画交回的最终姿态 | 读 `entityProps`(没有 `api.get`) |
| 控制播放(开始/暂停/停止/重置) | `api.play()` / `pause()` / `stop()` / `reset()` / `finish()` |
| 判断运行环境是否支持动画 | `supports('useEntityAnimation')` |

> **只支持 transform**:当前版本只能动画 `position` / `rotation` / `scale`,**不支持** `opacity`(透明度)、材质、颜色等。写了不支持的目标会直接报错,不会被悄悄忽略。

---

## 快速上手:一个完整例子

```tsx
import { useEntityAnimation } from '...'

function MyBox() {
  // 让盒子在 0.8 秒内向上移动 0.25 米,并放大到 1.1 倍
  const [animation, api, entityProps] = useEntityAnimation({
    timeline: {
      from: { position: { x: 0, y: 0, z: 0.8 }, scale: { x: 1, y: 1, z: 1 } },
      to:   { position: { y: 0.25 },            scale: { x: 1.1, y: 1.1, z: 1.1 } },
    },
    duration: 0.8,
    autoStart: true,
    onComplete: () => console.log('动画结束'),
  })

  return (
    <Reality>
      <SceneGraph>
        {/* entityProps 放在最后,保证动画结束后停在终点 */}
        <BoxEntity {...entityProps} animation={animation} />
      </SceneGraph>
    </Reality>
  )
}
```

Hook 返回三个值,按顺序解构:

```tsx
const [animation, api, entityProps] = useEntityAnimation(config)
```

| 返回值 | 作用 |
|---|---|
| `animation` | 动画绑定对象,传给组件的 `animation` 属性 |
| `api` | 播放控制器,提供 `play / pause / stop / reset / finish` 和 `set` |
| `entityProps` | 动画在关键节点交回的已提交姿态快照;首个已确认状态后包含完整的 `position`、`rotation`、`scale`,应展开到组件上 |

---

## 怎么描述动画(config)

公开 config 契约如下:

```ts
type TimingFunction = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'

type EntityMotionProps = {
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
}

type EntityMotionPatch = {
  position?: Partial<Vec3>
  rotation?: Partial<Vec3>
  scale?: Partial<Vec3>
}

type EntityMotionFrame = EntityMotionPatch & {
  timingFunction?: TimingFunction
}

type EntityMotionTimeline = {
  from?: EntityMotionFrame
  to?: EntityMotionFrame
} & Partial<Record<`${number}%`, EntityMotionFrame>>

type SpatializedPlaybackError = {
  code:
    | 'TARGET_NOT_FOUND'
    | 'UNSUPPORTED_TARGET'
    | 'ANIMATION_NOT_FOUND'
    | 'INVALID_TIMELINE'
    | 'COMPILATION_FAILED'
    | 'INVALID_CONTROL_STATE'
    | 'INVALID_SET_VALUES'
  message?: string
}

type EntityMotionConfig = {
  from?: EntityMotionPatch
  to?: EntityMotionPatch
  timeline?: EntityMotionTimeline
  duration?: number
  timingFunction?: TimingFunction
  delay?: number
  playbackRate?: number
  loop?: boolean | { reverse?: boolean }
  autoStart?: boolean
  onStart?: (values: EntityMotionProps) => void
  onComplete?: (values: EntityMotionProps) => void
  onStop?: (values: EntityMotionProps) => void
  onReset?: (values: EntityMotionProps) => void
  onError?: (error: SpatializedPlaybackError) => void
}
```

默认值为 `autoStart: true`、`timingFunction: 'easeInOut'`、`delay: 0`、`playbackRate: 1` 和 `loop: false`。包含 `timeline` 的 config 必须提供 `duration`;只有纯顶层 `from` / `to` 使用 0.3 秒默认值。非法 config 属于 programmer error,并同步抛错。

### 最简写法:顶层 from / to(从一个姿态到另一个)

如果只是“从一个姿态到另一个”,可以直接在 config 顶层写 `from` / `to`,不必嵌套进 `timeline`:

```tsx
const [animation, api, entityProps] = useEntityAnimation({
  from: { position: { x: 0, y: 0, z: 0.8 }, scale: { x: 1, y: 1, z: 1 } },
  to:   { position: { y: 0.25 },            scale: { x: 1.1, y: 1.1, z: 1.1 } },
  // 纯顶层 from/to 且没用百分比时,duration 默认 0.3 秒
  autoStart: true,
})
```

几条规则:

1. **等价于 `timeline.from` / `timeline.to`**:顶层 `from` / `to` 只是它的简写,内部会归一化成同一条时间轴,行为完全一致。
2. **两端都必须写**:顶层这一形态里,`from` 与 `to` 必须同时提供;只写其中一个会直接报错,不会用物体当前姿态去补另一端。
3. **纯顶层 from/to 时 `duration` 默认 0.3 秒**(在没有用百分比关键帧的前提下)。
4. **和 `timeline` 同时出现时,`timeline` 优先**:此时顶层 `from` / `to` 会被忽略,并在开发模式下打印一条警告。

### 方式一:timeline.from / timeline.to(从一个姿态到另一个)

```tsx
const [animation, api, entityProps] = useEntityAnimation({
  timeline: {
    from: {
      position: { x: 0, y: 0, z: 0.8 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    to: {
      position: { y: 0.25 },
      scale: { x: 1.1, y: 1.1, z: 1.1 },
    },
  },
  duration: 0.8,
  autoStart: true,
})
```

`timeline.from` / `timeline.to` 里都可以只写你关心的**字段**,没写的字段保持不变。但**起止两端必须都写**:`timeline.from`(或 `0%` 帧)与 `timeline.to`(或 `100%` 帧)必须同时存在,只写一端会直接报错,不会用物体当前姿态或 baseline 去补另一端。

### 方式二:timeline(多段关键帧)

在 `timeline` 里用百分比描述一段动画在不同时间点的姿态,适合更复杂的运动:

```tsx
const [animation, api, entityProps] = useEntityAnimation({
  duration: 1.2,
  timingFunction: 'easeInOut',
  timeline: {
    '0%': {
      position: { x: 0, y: 0, z: 0.8 },
      scale: { x: 1, y: 1, z: 1 },
    },
    '50%': {
      position: { y: 0.25 },
      scale: { x: 1.1, y: 1.1, z: 1.1 },
    },
    '100%': {
      position: { y: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
  },
})
```

### 方式三:timeline 里混合 from / to 与百分比

在同一个 `timeline` 里,`from` 就是 `0%` 帧、`to` 就是 `100%` 帧,所以可以把 `from` / `to` 和中间的百分比 key 混着写。适合"两端用 from/to 直观表达、中间再插几个百分比关键帧"的场景:

```tsx
const [animation, api, entityProps] = useEntityAnimation({
  duration: 1.2,
  timingFunction: 'easeInOut',
  timeline: {
    from: {                              // 等价于 0%
      position: { x: 0, y: 0, z: 0.8 },
      scale: { x: 1, y: 1, z: 1 },
    },
    '50%': {
      position: { y: 0.25 },
      scale: { x: 1.1, y: 1.1, z: 1.1 },
    },
    to: {                                // 等价于 100%
      position: { y: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
  },
})
```

几点说明:

- **起止两端都要有**:起点(`from` 或 `0%`)和终点(`to` 或 `100%`)必须都写,缺任一端会直接报错;这里用 `from` + `to` 表达两端,自然满足。
- `from` 与 `0%`、`to` 与 `100%` 指的是同一帧,**不要在同一个 `timeline` 里同时写 `from` 和 `0%`(或 `to` 和 `100%`)**,否则重复定义同一帧会报错。
- 混合写法下 `duration` 不再默认 0.3 秒(0.3 秒的默认只在纯顶层 `from` / `to` 且未用任何百分比时生效),请显式给出 `duration`。

### 方式四:按全局时间段设置缓动函数

除了在 config 顶层写一个全局 `timingFunction`,你还可以在**单个关键帧**上写 `timingFunction`,让它和该帧的 `position` / `rotation` / `scale` 平级。**逐关键帧的 `timingFunction` 作用于当前全局时间轴节点到下一个全局时间轴节点之间的时间段**,优先级高于顶层的全局 `timingFunction`:

```tsx
const [animation, api, entityProps] = useEntityAnimation({
  duration: 1.2,
  timingFunction: 'linear',        // 全局默认:未单独指定的区间用 linear
  timeline: {
    '0%': {
      position: { x: 0, y: 0, z: 0.8 },
      timingFunction: 'easeIn',    // 作用于 0% → 50% 的全局时间段
    },
    '50%': {
      position: { y: 0.25 },
      timingFunction: 'easeOut',   // 作用于 50% → 100% 的全局时间段
    },
    '100%': {
      position: { y: 0 },          // 末帧没有下一段,无需写 timingFunction
    },
  },
})
```

几点说明:

- **平级于姿态字段**:`timingFunction` 写在某一帧内,和该帧的 `position` / `rotation` / `scale` 并列,描述从该全局时间轴节点到下一个全局时间轴节点的缓动。
- **可选值**:`'linear'` / `'easeIn'` / `'easeOut'` / `'easeInOut'`(驼峰写法,没有 `'ease-in'` 这种带连字符的形式)。
- **优先级**:某个全局时间段的缓动函数取「起始帧上的 `timingFunction`」,没有则回退到顶层全局 `timingFunction`,再没有则用默认值。
- **末帧无需写**:最后一个全局时间轴节点没有下一个时间段,写在末帧上的 `timingFunction` 不会生效。

### 可写的字段范围

config 里只能写以下这些字段(和 Entity 自身的属性层级保持一致):

```text
position.x / position.y / position.z
rotation.x / rotation.y / rotation.z
scale.x    / scale.y    / scale.z
```

写 `opacity` 等不支持的目标会在 config 校验阶段同步抛错。

---

## 让动画结果停在终点(entityProps)

`entityProps` 是 Hook 返回的第三个值,是动画在关键节点(见下文“更新时机”)**交回给你的最终姿态**——它不是逐帧刷新的实时值。把它展开到组件上,物体就能在动画结束后停在终点:

```tsx
const [animation, api, entityProps] = useEntityAnimation({
  duration: 0.8,
  timeline: {
    from: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { y: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    to: {
      position: { x: 0.1, y: 0, z: 0 },
      rotation: { y: 90 },
      scale: { x: 1, y: 1, z: 1 },
    },
  },
})

return (
  <BoxEntity {...entityProps} animation={animation} />
)
```

**动画完成后**,`entityProps` 会更新为完整的终点姿态(`position`、`rotation`、`scale`),物体保持在该已提交姿态。当前绑定生命周期正常存续期间,这份完整镜像始终持有变换控制权。动画对象创建或同一目标配置替换的姿态交接失败时,绑定清空该镜像并终止当前生命周期。

**更新时机**:`entityProps` 不是每一帧都更新,只在这些关键节点更新:动画开始播放、完成、停止、重置、结束、`api.set` 写入成功,以及创建或交接失败时清空。

> **注意**:在第一次播放、或第一次 `api.set` 成功之前,`entityProps` 可能是空的。不要在组件刚挂载时就假设它已经有值——要先播放一次动画,或成功调用一次 `api.set`,它才会有值。

---

## 动画结束后手动挪动物体(api.set)

动画播完后,如果你想用代码把物体移到新姿态,调用 `api.set`:

```tsx
// 把盒子抬高到 y = 0.3(其它保持不变)
api.set({ position: { y: 0.3 } })
```

几条规则:

1. **只在原生动画对象已经创建且动画不处于播放状态时用**(包括:从未播放、已播完、已停止 / 重置)。动画正在播放(含延迟、暂停)、原生动画对象尚未创建或当前绑定已经因创建 / 交接失败而终止时,调用 `api.set` 会被拒绝——此时它是一次 **noop**(不打断动画、也不会延后补播,物体保持不变,`entityProps` 也不更新),并在控制台打印一条警告(warning),**不会**触发 `onError`。想在动画进行中接管物体,请先停止动画,或等它结束。
2. **只传你想改的字段即可**,其余保持原样。例如 `api.set({ position: { y: 0.3 } })` 不会影响 `rotation` 或 `scale`。
3. **写入成功后 `entityProps` 会更新**为新姿态;如果写入未被接受(比如在动画播放中调用),则是一次 noop——`entityProps` 保持不变,并在控制台打印一条警告,不会触发 `onError`。
4. **想基于当前值来改**?先读 `entityProps` 拿到当前姿态,自己算好新值,再传给 `api.set`。这里没有 `api.get`——因为在 React 里用取值函数容易读到过期的旧值、产生先读后写的冲突。
5. **它不是播放命令**:`api.set` 不会开始播放、也不改变播放进度。

### api.set 之后再播放的起点

- 从 config 声明的起始帧(顶层 `from`、`timeline.from` 或 `0%` 帧)开始播。由于每个动画都必须写起点,不存在"没声明起始帧"的情况——缺起点的 config 在校验阶段就会被拒绝。
- 每次 fresh play 都在开始时读取物体的最新原生姿态。config 明确声明的字段从起始帧开始,config 未声明的字段以该最新姿态为本轮 baseline。因此在非活跃状态成功调用 `api.set` 后,下一次 fresh play 会采用修改后的值补全未声明字段。
- fresh play 包括创建后的首次 `play` / `autoStart`,以及动画完成、结束、停止或重置后再次 `play`。`pause` 后的 `play` 只是从当前进度恢复,不会读取新的 baseline;同一次播放里的循环也持续使用该轮 baseline。

---

## 动画和你的 props 谁说了算

物体姿态可能同时受到基础属性、`entityProps` 已提交镜像和活动动画影响。系统始终为**完整变换**选择一个控制来源:

| 情况 | 谁说了算 |
|---|---|
| 首个原生已确认状态之前 | 基础 React 属性控制 |
| 动画正在播放(含延迟、暂停) | 动画控制完整变换;配置中的其余分量保持基准姿态 |
| 已有已确认状态且播放空闲 | 完整 `entityProps` 镜像控制;动态写入使用 `api.set` |
| 动画对象创建或姿态交接失败 | 当前绑定生命周期终止,`entityProps` 清空,基础 React 属性控制 |
| 动画解绑 | React 属性控制 |

这和 visionOS / picoOS 原生一致:底层绑定完整变换。动画活跃期间,配置字段执行动画,其余字段保持基准姿态。原生层在生命周期确认节点回传完整的已提交变换,`entityProps` 在当前绑定生命周期正常存续期间持久化该完整值。

由此可得几个常见结论:

- **动画正在播时**,整个 transform 都由动画接管,你此时用 props 或 `api.set` 改任何分量都不会生效;没写进 config 的分量会被冻结在基准值。
- **动画播放期间**,底层绑定完整变换,旋转保持本轮基准值。
- **首个已确认状态之后**,当前绑定生命周期正常存续期间普通变换属性保持为基础输入;播放空闲时的动态修改使用 `api.set`。
- **动画对象创建或姿态交接失败后**,当前绑定终止,普通 React 变换属性恢复控制。重新开始需要显式解绑后再绑定,或创建新的 binding。
- **动画解绑后**,普通 React 变换属性恢复控制。

### 推荐写法

把 `entityProps` 放在其它 props 的**后面**,这样动画结束后物体会正确停在终点,而不是被旧的 props 值覆盖:

```tsx
<BoxEntity
  position={basePosition}
  {...entityProps}
  animation={animation}
/>
```

`entityProps` 获得已确认值后,`basePosition` 变化时它继续持有控制权。修改已提交变换时调用 `api.set`;交还普通 React 属性控制时解除动画绑定。

---

## api 方法总览

`api` 提供以下方法:

```tsx
interface EntityPlaybackApi {
  play(): void
  pause(): void
  stop(): void
  reset(): void
  finish(): void
  set(values: EntityMotionPatch): void
  readonly playState: 'queued' | 'idle' | 'running' | 'paused' | 'finished'
  readonly isAnimating: boolean
  readonly isPaused: boolean
  readonly finished: boolean
}
```

前五个是**播放控制**,操作动画的播放进度;`api.set` 是**设置姿态**,直接改物体的静止姿态,不影响播放进度。两者都是 `api` 上的方法,用途不同:需要控制动画时用前五个,需要在动画结束后手动摆放物体时用 `api.set`。

---

## 动画状态

一个动画在生命周期里会处在下面几种状态。理解这张图,能帮你判断:此刻 `api.set` 能不能用、`entityProps` 会不会更新、物体听谁的。

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> queued: 原生对象创建前收到播放命令
    queued --> idle: 原生层创建回执
    idle --> running: play() / autoStart
    idle --> finished: finish()
    running --> paused: pause()
    paused --> running: play()
    running --> idle: stop() / reset()
    paused --> idle: stop() / reset()
    running --> finished: 播放到终点 / finish()
    paused --> finished: finish()
    finished --> running: play()
    finished --> idle: reset()
```

`running` 包含起播前的延迟等待。`queued` 表示播放命令正在等待原生动画对象创建。排队期间三个布尔值保持 `false`。原生层创建回执在绑定对象执行待处理命令前确认 `idle`;后续控制回执和状态事件持续同步公开状态与原生确认值。

动画对象创建或同一目标配置替换的姿态交接失败时,`onError` 报告一次分类错误,公开状态收敛为 `idle`,`entityProps` 清空,当前绑定生命周期终止。该绑定后续的所有 API 调用均输出警告并执行空操作;config 和 callback 更新只刷新绑定保存的最新值。应用通过显式解绑后重新绑定,或创建新的 binding 开启新生命周期。

| `playState` | `isAnimating` | `isPaused` | `finished` |
|---|---|---|---|
| `queued` | `false` | `false` | `false` |
| `idle` | `false` | `false` | `false` |
| `running` | `true` | `false` | `false` |
| `paused` | `false` | `true` | `false` |
| `finished` | `false` | `false` | `true` |

### 每种状态下的行为

| 状态 | 怎么进入 | `api.set` 能用吗 | `entityProps` 会更新吗 | transform 归谁控制 |
|---|---|---|---|---|
| **初始状态** | 首个已确认值产生之前 | 原生动画对象创建后 ✅ 能用 | 首次确认时填充 | 基础 React 属性控制 |
| **播放中**(含延迟、暂停) | `play()` / `autoStart`;`pause()` 后仍属此类 | ❌ 被拒绝(noop + 警告) | 仅在开始播放那一刻更新一次 | 动画接管整个 transform;config 未声明的字段冻结在本轮 fresh-play baseline |
| **已有确认值的播放空闲状态** | `complete`、`stop`、`reset`、`finish`,或成功的 `api.set` | ✅ 能用 | ✅ 包含完整的已提交变换 | `entityProps` 控制;动态写入使用 `api.set` |
| **终止绑定** | 动画对象创建或姿态交接失败 | ❌ 所有 API 均为 noop + 警告 | 清空为 `{}` | 基础 React 属性控制;重新开始需要显式重新绑定 |

> **提示**:循环动画没有自然的“播放到终点”,所以循环期间 `entityProps` 不会在每圈结束时更新,也不会在每圈重新读取 baseline。`stop()`、`reset()` 或 `finish()` 会更新 `entityProps`;动画进入非活跃状态后,成功的 `api.set()` 也会更新 `entityProps`。

---

## 事件回调(callback)

可以在 config 里传入回调,在动画不同阶段收到通知:

```tsx
useEntityAnimation({
  // ...
  onStart:    values => console.log('开始', values),
  onComplete: values => console.log('完成', values),
  onStop:     values => console.log('停止', values),
  onReset:    values => console.log('重置', values),
  onError:    error  => console.error('出错', error),
})
```

回调**只是通知**,它们的返回值会被忽略,不能用来决定物体最终停在哪里。要决定终点,请在播放前于 config 里声明(比如用顶层 `to` 或 `timeline.to`),或在播放后通过 `entityProps` / `api.set` 接管。

回调收到的 `values` 只包含 Entity 支持的字段:

```text
{ position?: Vec3, rotation?: Vec3, scale?: Vec3 }
```

---

## 判断运行环境是否支持

用能力检测判断当前运行环境是否支持动画:

```tsx
supports('useEntityAnimation')
```

含义:当前环境支持 Entity 通过 `animation` 绑定动画。

如果返回 `false`,说明当前环境不支持动画,建议跳过动画、直接用静态 props 把物体渲染到目标姿态:

```tsx
if (supports('useEntityAnimation')) {
  return <BoxEntity {...entityProps} animation={animation} />
}
// 不支持:直接渲染到最终姿态,不做动画
return <BoxEntity position={targetPosition} />
```

**当前版本只支持 transform(`position` / `rotation` / `scale`),不支持 `opacity`。**

---

## 当前版本的限制

当前版本**只能动画 transform**(`position` / `rotation` / `scale`),不支持透明度(`opacity`)、材质、颜色等其它属性。此外,一个动画对象只能绑定到一个物体,不能多个物体共享。

---

## 一句话总结

`useEntityAnimation` 用 `position / rotation / scale` 描述动画,支持顶层 `from` / `to` 简写、百分比 `timeline`、`entityProps` 结果回写和 `animation` 绑定;当前版本只支持 transform,不支持 opacity。
