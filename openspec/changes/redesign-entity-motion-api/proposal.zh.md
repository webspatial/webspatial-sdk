## 为什么

当前 Entity animation 已经具备基础的 `useEntityAnimation` 能力，但它仍缺少和新 motion 体系一致的部分能力与叙事，例如百分比 `timeline`、推荐的 `xr-animation` 绑定方式，以及用于 React 侧持久化终态的 `entityProps` outlet。

本次变更不是替换现有 `useEntityAnimation`，而是在现有能力基础上做非 breaking 增强。目标是在不改变 Entity props 层级 authoring 的前提下，补齐 timeline、outlet、绑定方式和行为语义，使其更容易与 `useAnimation` 家族对齐。

## 变更内容

- 在现有 `useEntityAnimation` 基础上新增 Entity motion 增强提案。
- 将 `useEntityAnimation` 定义为 Entity adapter：`useAnimation config + Entity props outlet`。
- 保持公开 config 与 Entity props 层级一致，继续使用 `position`、`rotation`、`scale`。
- 推荐通过 `xr-animation` 绑定，同时继续兼容 `animation` 绑定。
- 引入 `entityProps`，作为 React 侧已提交 Entity transform 值的 outlet。
- 将 `from` / `to` 与百分比 `timeline` 作为公开主路径，同时保留 `tracks` 作为内部非公开 API。
- 在适用范围内对齐新的 motion playback、callback 和 capability 语义，同时保留 Entity 自身约束。
- 将 Entity motion 限制为 transform-only 目标；对于 `opacity` 等不支持的目标必须显式失败，不能静默忽略。

### 1. 背景

当前 Entity animation 使用旧的 `useEntityAnimation` API：

```text
const [animation, api] = useEntityAnimation({
  from: {
    position: { x: 0, y: 0, z: 0 },
  },
  to: {
    position: { x: 0.1, y: 0, z: 0 },
  },
})

<BoxEntity animation={animation} />
```

这套设计和新的 `useAnimation` 体系还存在差异：

1. 旧 Entity 通过 `animation` prop 绑定。
2. 新 motion API 推荐通过 `xr-animation` 绑定。
3. 旧 Entity 不支持百分比 `timeline` 和 `tracks`。
4. Entity 没有 CSS `style` outlet，不能直接复用 spatialized element 的 `style` 回写方案。

### 2. 目标

将 `useEntityAnimation` 重定义为 Entity adapter：

```text
useEntityAnimation = useAnimation config + Entity props outlet
```

目标 API：

```text
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
  onStart: () => {
    console.log('Entity animation started')
  },
  onComplete: values => {
    console.log('Entity animation completed', values)
  },
  onStop: values => {
    console.log('Entity animation stopped', values)
  },
  onReset: values => {
    console.log('Entity animation reset', values)
  },
  onError: error => {
    console.error('Entity animation failed', error)
  },
})

return (
  <Reality>
    <SceneGraph>
      <BoxEntity {...entityProps} xr-animation={animation} />
    </SceneGraph>
  </Reality>
)
```

动画过程中，Entity 的 transform 由动画采样值决定，过程中用户无法控制。

动画结束后，Entity 的 transform 始终由其上传入的 props 决定，用户可以通过修改 props 改变其状态。

核心目标：

1. Entity animation config 对齐 `useAnimation`，但层级保持跟 Entity props 一致。
2. Entity 推荐使用 `xr-animation` 绑定，同时继续兼容 `animation`。
3. 第三个返回值 `entityProps` 是 Entity props outlet。
4. `entityProps` 形态为 `{ position, rotation, scale }`。
5. 动画终态通过 `entityProps` 回写到 React 侧。

### 3. 非目标

本需求不支持：

1. Entity opacity animation。
2. Entity material / color animation。
3. Entity component property animation。
4. 多 Entity 共享同一个 animation。
5. 公开 seek / scrub / progress API。
6. 每帧把 native animation values 回写到 React state。
7. 动画过程中 replay 用户写入的 `position / rotation / scale`。
8. 给 Entity 引入 CSS-like `style` prop。

### 4. API 设计

#### 4.1 Hook 签名

```text
function useEntityAnimation(
  config: EntityMotionAuthorConfig
): [
  animation: EntityMotionBinding,
  api: EntityPlaybackApi,
  entityProps: EntityMotionProps,
]
```

`EntityMotionAuthorConfig`、`EntityMotionBinding`、`EntityPlaybackApi` 是共享 `useAnimation` config / binding / playback-api 类型在 Entity 上的约束变体:形态与 playback 语义一致,但 authoring surface 被限制为 Entity transform 字段(`position` / `rotation` / `scale`),不接受 `transform.translate / rotate / scale`,也不接受 `opacity` 等非 transform 目标。

```text
type EntityMotionProps = {
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
}
```

#### 4.2 Config 统一

Entity 的公开 config 保持和 Entity props 一致：

```text
useEntityAnimation({
  to: {
    position: { x: 0.1, y: 0, z: 0 },
    rotation: { y: 90 },
    scale: { x: 1, y: 1, z: 1 },
  },
})
```

Entity proposal 不使用 `transform.translate / transform.rotate / transform.scale` 作为公开 authoring 形态。

### 5. 支持的 Config

#### 5.1 from / to

```text
const [animation, api, entityProps] = useEntityAnimation({
  from: {
    position: { x: 0, y: 0, z: 0.8 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  },
  to: {
    position: { y: 0.25 },
    scale: { x: 1.1, y: 1.1, z: 1.1 },
  },
  duration: 0.8,
  autoStart: true,
})
```

#### 5.2 timeline

```text
const [animation, api, entityProps] = useEntityAnimation({
  duration: 1.2,
  timeline: {
    '0%': {
      position: { x: 0, y: 0, z: 0.8 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    '100%': {
      position: { x: 0, y: 0.25, z: 0.8 },
      rotation: { x: 0, y: 180, z: 0 },
      scale: { x: 1.1, y: 1.1, z: 1.1 },
    },
  },
})
```

#### 5.3 tracks

`tracks` 保留为内部非公开 API：

```text
const [animation, api, entityProps] = useEntityAnimation({
  duration: 2,
  tracks: [
    {
      property: 'position.y',
      keyframes: [
        { at: 0, value: 0 },
        { at: 1, value: 0.25 },
        { at: 2, value: 0 },
      ],
    },
    {
      property: 'rotation.y',
      keyframes: [
        { at: 0, value: 0 },
        { at: 2, value: 180 },
      ],
    },
  ],
})
```

Entity target 只允许：

```text
'position.x'
'position.y'
'position.z'
'rotation.x'
'rotation.y'
'rotation.z'
'scale.x'
'scale.y'
'scale.z'
```

不允许：

```text
'opacity'
```

如果 config 中出现 `opacity`，必须报错或触发 `onError`，不允许 silent ignore。

### 6. entityProps Outlet

`useEntityAnimation` 的第三个返回值是 Entity props outlet：

```text
type EntityMotionProps = {
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
}
```

它用于把 animation values 回写到 Entity props：

```text
animation values
  -> entityProps
  -> <BoxEntity {...entityProps} />
  -> native Entity transform
```

示例：

```text
const [animation, api, entityProps] = useEntityAnimation({
  to: {
    position: { x: 0.1, y: 0, z: 0 },
    rotation: { y: 90 },
    scale: { x: 1, y: 1, z: 1 },
  },
})

return (
  <BoxEntity
    {...entityProps}
    xr-animation={animation}
  />
)
```

兼容写法仍可使用：

```text
<BoxEntity {...entityProps} animation={animation} />
```

动画完成后：

```text
native Entity 停在终态
entityProps.position 更新为终态 position
entityProps.rotation 更新为终态 rotation
entityProps.scale 更新为终态 scale
```

`entityProps` 不逐帧更新，只在关键 lifecycle 节点更新：

1. `play` start。
2. `complete`。
3. `stop`。
4. `reset`。
5. `finish`。
6. `api.set`(以及它的 updater 形式)。

### 7. api.set

`api.set` 是 `entityProps` 所镜像的、已提交(committed)Entity transform 状态的命令式写入入口。它的目的是让用户在动画结束后接管 transform,而不必自己再维护一份 `useState`:SDK 本来就持有这份 committed 状态(它必须持有,才能通过 `entityProps` 回写终态),因此用户不应被迫再镜像一遍。

#### 7.1 两个数据源与合成器(compositor)

Entity transform 由两个数据源合成:

- Source A:React props / `entityProps`(committed 状态,通过声明式写入或 `api.set` 写入)。
- Source B:`xr-animation` 绑定(逐帧采样的 animation values)。

任一时刻只有一个数据源是权威的,由动画是否活跃决定:

```text
动画活跃(delay / running / paused)   -> Source B 生效
动画非活跃(idle / terminal)          -> Source A 生效
```

这与 CSS 模型一致:动画播放时覆盖 computed style,动画非活跃后 style 重新接管。`api.set` 始终写入 Source A;它何时可见由 compositor 决定,而不是由 `api.set` 本身决定。

#### 7.2 签名

```text
api.set(values: EntityMotionProps): void
api.set(updater: (prev: EntityMotionProps) => EntityMotionProps): void
```

#### 7.3 行为

1. 写入目标:`api.set` 更新 SDK 持有的 committed transform 状态,该状态更新 `entityProps`,再通过 `<BoxEntity {...entityProps} />` 回写到 native Entity。`entityProps` 是该状态的响应式镜像。
2. 稀疏合并(sparse merge):只覆盖传入的字段;未传入的字段保持之前的 committed 值。`api.set({ position: { y: 0.3 } })` 不会影响 `rotation` 或 `scale`。
3. Updater 形式:`prev` 是当前 committed 值(Source A)。读-改-写在 SDK 内部原子完成,这就是基于当前值做偏移的表达方式。不提供裸 `api.get`。
4. 活跃动画期间调用不会抛错,但该写入不会在动画结束后存留。它不打断也不覆盖活动动画;并且与 8.2 节 React prop 写入行为一致——它不会被排队等待 replay:动画到达终态时,终态填充(见 7.4)会把终态值写入 committed 状态,覆盖动画期间写入的任何值。若要接管 transform,应在动画非活跃(idle / terminal)后再调用 `api.set`。
5. 不是 playback 命令:`api.set` 不 seek、不 start、不改变播放进度。

#### 7.4 与 `play` 和终态填充(terminal fill)的关系

- `api.set` 之后再 `play` 的起点:如果 config 声明了 `from`,播放从 `from` 开始;如果未声明 `from`,播放从当前 committed 值(`api.set` 写入的姿态)开始。
- 终态填充:动画到达终态时,填充到其终态 transform 并将该值回写到 `entityProps`(等价于 CSS `fill-mode: forwards`);它不会 snap 回动画前的值。

#### 7.5 读取当前值(不提供裸 api.get)

有意不提供 `api.get`,因为 React 中的命令式 getter 容易读到 stale 值,并诱发读-写竞态。

- 读-改-写:使用 updater 形式 `api.set(prev => ...)`。
- 声明式读取当前值:读 `entityProps`,它是 committed 状态的响应式镜像。

### 8. 与 React props 的冲突语义

#### 8.1 动画 alive 期间

当 animation 处于：

```text
delay / running / paused
```

animation 持有整个 Entity transform ownership。

此时用户通过 React props 写：

```text
<BoxEntity position={position} />
```

不会覆盖正在播放的 animation。

#### 8.2 动画期间的 props update

动画期间用户写入的 `position / rotation / scale`：

1. 不打断动画。
2. 不立即覆盖动画。
3. 不 pending replay。
4. 最终以 animation terminal values 为准。

#### 8.3 动画结束后

动画进入 terminal 状态后：

```text
complete / stop / reset / finish
```

native Entity 已经停在对应 transform，同时 `entityProps` 更新为对应 transform。

推荐写法：

```text
<BoxEntity
  position={basePosition}
  {...entityProps}
  xr-animation={animation}
/>
```

`entityProps` 放在静态 props 后面，避免 stale props 把动画终态拉回旧值。

### 9. Playback API

对齐 `useAnimation`：

```text
api.play()
api.pause()
api.resume()
api.stop()
api.reset()
api.finish()
```

`api.set` 是状态 setter(见第 7 节),不是 playback 命令,因此有意不列入上面的 playback 方法中。

### 10. Callback

支持当前 `useAnimation` 已定义的 callbacks。

Callback 只是通知。`onComplete`、`onStop`、`onReset`、`onStart`、`onError` 只报告某个 lifecycle 事件发生并传入相关 transform 值;它们的返回值被忽略,不得用于驱动终态 transform。要决定 Entity 最终停在哪里,要么在播放前于 config 中声明终态(例如 `to`),要么在播放后通过终态 `entityProps` 值或显式 `api.set` 调用接管。

Callback values 只包含 Entity 支持的 transform：

```text
type EntityMotionCallbackValues = {
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
}
```

### 11. Capability 需求

使用 capability 表示当前 runtime 支持 `useAnimation`：

```text
supports('useAnimation')
```

语义：

```text
当前 runtime 支持 Reality Entity 组件通过 xr-animation 或 animation 绑定 useAnimation animation。
```

该能力通过 `useAnimation` 顶层 key 检测，不需要单独的 subToken。

文档必须明确：

```text
Entity target 当前只支持 transform，不支持 opacity。
```

### 12. 一句话总结

在现有 `useEntityAnimation` 基础上新增百分比 `timeline`、`entityProps` outlet 和推荐的 `xr-animation` 绑定方式，保持 Entity 使用 `position / rotation / scale` authoring，第一阶段仅支持 transform，不支持 opacity。

## 能力

### 新增能力
- `entity-motion`：在现有 `useEntityAnimation` 基础上补充 timeline、Entity props outlet、绑定方式和行为语义要求。

### 修改的能力
- `runtime-capabilities`：更新 motion capability 的文档化要求，使其反映新的 Entity motion 提案及其支持探测契约。

## 影响

- 受影响的 OpenSpec 文档包括已完成的 `add-entity-transform-animation` 变更，以及当前仍在进行中的 `spatialized-element-motion-api` 中对 Entity motion 的引用或推迟说明。
- 受影响的 React SDK 公共接口包括 `useEntityAnimation`、Entity transform props、Entity 绑定 props，以及 runtime capability 文档说明。
- 受影响的实现范围包括 React Entity hooks、Core motion / animation 类型、Entity 绑定逻辑、参数校验、test-server demo 和迁移文档。
- 本提案当前按非 breaking enhancement 记录，重点是新增 `timeline`、`entityProps` outlet、推荐 `xr-animation` 绑定以及统一语义说明。