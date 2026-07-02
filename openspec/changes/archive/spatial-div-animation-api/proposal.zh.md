## 为什么

WebSpatial SDK 目前的 `SpatialDiv` 只能通过 DOM / CSS 的常规更新即时改变 `transform` 和 `opacity`，没有内建的声明式视觉动画能力。常见的空间 UI 场景，如卡片入场、悬浮提示轻微位移、旋转强调、缩放反馈和透明度淡入淡出，都需要业务侧自行逐帧驱动，成本高且容易与现有同步链路冲突。

当前仓库已经有一份 `entity transform animation` 提案，确定了以 `useAnimation(config)` 和 `animation` prop 为核心的 API 方向。现在补充 `SpatialDiv` 版本的提案，可以在保持 API 家族一致的前提下，先锁定属性白名单、运行时能力检测和跨层契约，避免后续实现时与现有 `SpatialDiv` DOM 同步机制互相打架。

## 速览

```jsx
// 最小用法 — 外层 SpatialDiv 容器省略以简化示例
const [animation, api] = useAnimation({
  from: { transform: { translate: { y: 24 }, scale: { x: 0.96, y: 0.96, z: 1 } }, opacity: 0 },
  to:   { transform: { translate: { y: 0 }, scale: { x: 1, y: 1, z: 1 } }, opacity: 1 },
  duration: 0.6,
  timingFunction: 'easeOut',
})

// 传给 enable-xr 的空间化 HTML 节点：
<div enable-xr animation={animation} style={{ width: 300, height: 200 }}>
  <h2>Hello Spatial</h2>
</div>
```

Hook 声明动画内容；播放在 native 侧运行。`api.play()`、`pause()`、`cancel()` 提供命令式控制，`onError` 暴露异步 bridge/native 失败。

## 变更内容

- 新增 `SpatialDiv` 动画能力，沿用 `useAnimation(config)` + `animation` prop 的家族式 API 设计，使 `<div enable-xr animation={animation} />` 成为一等用法。
- 在 `useAnimation` hook 入口通过 `config.to` 的 key 集合自动区分走 entity 路径还是 SpatialDiv 路径，两组 key 互斥；entity 动画的核心逻辑不受修改。
- 将动画属性范围明确限制为只影响视觉呈现、不改变布局或空间尺寸语义的白名单：`transform.translate.x/y/z`、`transform.rotate.x/y/z`、`transform.scale.x/y/z`、`opacity`。
- 约定 `transform` 动画只接受结构化的 `translate`、`rotate`、`scale` 数值分量，分别对齐 CSS `translateX/Y/Z()`、`rotateX/Y/Z()`、`scaleX/Y/Z()`；不接受任意 CSS transform 字符串、`skew` 或矩阵插值。
- 明确不支持会影响布局、空间面板尺寸、深度或空间位置语义的字段动画，包括 `width`、`height`、`back` / `backOffset`、`depth` 等。
- 复用与实体动画一致的播放控制与生命周期语义，包括 `play`、`pause`、`cancel`、`onStart`、`onComplete`、`onCancel`、`onError`、`delay`、`autoStart`、`loop`、`playbackRate`。复用实体动画提案中定义的 `AnimationError` 类型。
- 扩展运行时能力文档，为 `SpatialDiv` 动画新增 sub-token 形式的 capability key `supports('useAnimation', ['element'])`，避免与既有 `supports('useAnimation', ['entity'])` 的实体动画语义耦合。
- 明确 `SpatialDiv` 动画与常规 DOM / computed-style 同步的竞争处理规则，确保动画播放期间被控制字段不会被普通同步覆盖。
- 定义完整的跨层契约（React SDK → Core SDK → JSBridge → Native），包括 `Spatialized2DElement.animateSpatialDiv()` 方法签名、事件 payload 类型、listener 注册时序、`animationId` 唯一性和终态事件互斥。

## 能力

### 新增能力

- `spatial-div-animation`：为 `SpatialDiv` 提供声明式与命令式视觉动画能力，覆盖 `transform.translate.x/y/z`、`transform.rotate.x/y/z`、`transform.scale.x/y/z`、`opacity` 的白名单字段，以及生命周期、错误回调和 React 集成规则。

### 修改的能力

- `runtime-capabilities`：新增并文档化 `supports('useAnimation', ['element'])` 能力 sub-token，用于在运行时判断 `SpatialDiv` 动画是否可用。

## 影响面

- **Packages**：`@webspatial/react-sdk`、`@webspatial/core-sdk`，以及 visionOS native bridge / scene runtime。
- **Public API**：新增 `SpatialDiv` 可用的 `useAnimation` 配置形状（`SpatialDivAnimationConfig`、`SpatialDivAnimatedValues`）、`animation` prop 行为，以及与实体动画一致的播放控制对象。复用实体动画的 `AnimationError` 类型。
- **useAnimation Hook**：hook 入口新增基于 `config.to` key 集合的 if/else 分叉；entity 路径的核心逻辑（config 校验、Vec3→Float4x4、bridge 命令、suppression、callback 调度）完全不变。
- **SpatialDiv Sync Path**：需要修改 `PortalInstanceObject` 一侧的常规属性 / transform 同步逻辑，引入字段级抑制和动画会话绑定。
- **Runtime Capabilities**：需要补充 `supports('useAnimation', ['element'])` 的解析、文档和测试。
- **Documentation**：需要补充 `SpatialDiv` 动画用法、属性白名单、已知限制和 capability 检测说明。
- **Breaking changes**：无。本次变更为纯增量。
