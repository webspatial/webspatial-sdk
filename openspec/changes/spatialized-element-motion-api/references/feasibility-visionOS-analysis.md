# SpatialDiv Animation API 在 Native visionOS 上的可行性评估（代码库校验版）

## 结论

`spatial-div-animation-api` 在 native visionOS 上 **有条件可行**。

这不是一个“补一个 hook”级别的改动，而是一次横跨 React SDK、Core SDK、JSBridge 和 visionOS runtime 的能力扩展。但从当前仓库的基础设施看，这项能力并不需要从零设计：Entity 动画已经提供了一套可复用的纵向范式，而 SpatialDiv 现有链路也已经具备稳定的创建、挂载与即时属性同步能力。

因此，这项提案的核心问题不是“能不能做动画”，而是：

1. 如何为 `SpatialDiv` 建立与 Entity 动画对称的会话模型；
2. 如何避免动画播放期间被现有 DOM/样式同步链路覆盖；
3. 如何把 v1 能力严格控制在白名单范围内，避免演化成“支持任意 CSS 动画”的高风险方案。

结论上，我认为该提案在当前 visionOS 架构下成立，但必须接受 v1 的范围约束，并优先解决同步竞争问题。

---

## 现状与提案的一致性

提案对当前实现现状的判断基本准确。

- 设计文档明确指出，`SpatialDiv` 当前依赖两条即时同步链路：
  - `UpdateSpatialized2DElementProperties`
  - `UpdateSpatializedElementTransform`

  这与 `openspec/changes/spatial-div-animation-api/design.zh.md:3` 的描述一致。

- 实际代码中，`PortalInstanceObject` 会在 2D frame 变化和 transform/visibility 变化后，重新读取 DOM 信息并立即把属性和 matrix 推给 native：
  - `packages/react/src/spatialized-container/context/PortalInstanceContext.ts:127`
  - `packages/react/src/spatialized-container/context/PortalInstanceContext.ts:186`
  - `packages/react/src/spatialized-container/context/PortalInstanceContext.ts:256`

- 其中 `updateSpatializedElementProperties()` 同时做两件事：
  - 调用 `spatializedElement.updateProperties(...)`
  - 调用 `spatializedElement.updateTransform(...)`

  这意味着当前 SpatialDiv 的 source of truth 明显偏向 DOM 侧，而不是 native 侧动画会话。

因此，提案把问题聚焦在“白名单字段 + native 播放 + suppression”上，是正确的切入方式。

---

## 为什么说“可行”

### 1. 现有 Entity 动画已经提供了完整范式

仓库中已经有一套完整的 Entity transform 动画链路：

- React Hook 入口：`packages/react/src/reality/hooks/useAnimation.ts:64`
- Core 层 animation bridge：`packages/core/src/reality/entity/SpatialEntity.ts:144`
- 动画类型定义：`packages/core/src/types/animation.ts:168`
- runtime capability key：`packages/core/src/runtime/keys.ts:42`
- capability 版本矩阵：`packages/core/src/runtime/capability-data.ts:53`
- native 命令分发入口：`packages/visionOS/web-spatial/model/SpatialScene.swift:1294`

这条链路已经证明，当前仓库具备以下基础能力：

- React 侧统一动画 API 与控制对象；
- Core 层命令序列化与结果 Promise 建模；
- JSBridge 事件先注册、后发送命令的竞态规避模式；
- native 侧按 `animationId` 管理 session；
- `play / pause / resume / cancel` 这类命令式控制的跨层语义。

对 `SpatialDiv` 来说，这意味着最关键的“纵向协议形状”已经有现成样板，不需要重新发明。

### 2. 现有 SpatialDiv 链路已经具备目标对象与可更新属性

SpatialDiv 侧也不是一片空白。

- `enable-xr` 入口会把普通 HTML 节点替换到 spatialized 容器链路：`packages/react/src/jsx/jsx-shared.ts:15`
- `Spatialized2DElementContainer` 会创建 native 2D surface：`packages/react/src/spatialized-container/Spatialized2DElementContainer.tsx:170`
- `PortalSpatializedContainer` 和 `PortalInstanceObject` 会负责 portal 绑定、frame 检测和 native 更新：
  - `packages/react/src/spatialized-container/PortalSpatializedContainer.tsx:79`
  - `packages/react/src/spatialized-container/context/PortalInstanceContext.ts:31`

Core / native 层也已经有对应对象和命令：

- `Spatialized2DElement.updateProperties(...)`：`packages/core/src/Spatialized2DElement.ts:35`
- `SpatializedElement.updateTransform(...)`：`packages/core/src/SpatializedElement.ts:64`
- `UpdateSpatialized2DElementProperties`：`packages/visionOS/web-spatial/JSBCommand.swift:207`
- `UpdateSpatializedElementTransform`：`packages/visionOS/web-spatial/JSBCommand.swift:309`
- native 侧属性更新实现：`packages/visionOS/web-spatial/model/SpatialScene.swift:706`
- native 侧 transform 更新实现：`packages/visionOS/web-spatial/model/SpatialScene.swift:813`

这说明要被动画驱动的目标对象、属性载体和 JSBridge 接入点都已经存在。需要新增的是“动画会话语义”，而不是新增一种全新的渲染对象。

---

## 为什么说“有条件”

### 1. 最大阻塞点：当前普通同步会覆盖 native 动画

这是本提案最大的工程风险。

`PortalInstanceObject` 在当前实现里是一个持续把 DOM 状态投影到 native 的同步器：

- `notify2DFrameChange()` 读取 `getComputedStyle(dom)` 与 `getBoundingClientRect()`：`packages/react/src/spatialized-container/context/PortalInstanceContext.ts:127`
- `onSpatialTransformVisibilityChange(...)` 接收 transform/visibility 更新后直接继续同步：`packages/react/src/spatialized-container/context/PortalInstanceContext.ts:117`
- `updateSpatializedElementProperties()` 在准备好时会立刻把 properties 和 transform 全量推给 native：`packages/react/src/spatialized-container/context/PortalInstanceContext.ts:186`

如果 native 端开始播放 `SpatialDiv` 动画，但 React/DOM 侧 observer 还在继续同步：

- `opacity` 会被普通样式同步覆盖；
- `transform` 会被完整 matrix 同步覆盖。

所以，**没有 suppression，就没有稳定的 SpatialDiv native animation**。

这也解释了为什么提案把“opacity 属性级抑制 + transform 整体抑制”列为核心设计决策。

### 2. 当前不存在任何 SpatialDiv animation 的现成实现

仓库中已经有 Entity animation，但没有现成的 SpatialDiv animation 半成品可直接接上。

具体来说，目前不存在：

- `animateSpatialDiv(...)`
- `AnimateSpatialized2DElement`
- `SpatialDivAnimationSession`
- `SpatialDivAnimationManager`
- `SpatialDiv` 专属终态/失败事件协议

因此实现范围会覆盖：

1. React `useAnimation` 路由与 binding；
2. Core 类型和 bridge command；
3. JSBridge/native command 注册；
4. visionOS runtime 的 session 管理与插值；
5. PortalInstanceObject 的 suppression 与恢复逻辑。

这不是不可行，但代表实现成本明显高于一般 API 增量。

### 3. capability 也需要完整补齐

当前 capability 体系里 animation 只有一个 key：`useAnimation`，定义在 `packages/core/src/runtime/keys.ts:42`。

而 capability 矩阵显示 visionOS `1.5.0` 和 `1.6.0` 都还没有放开该能力：`packages/core/src/runtime/capability-data.ts:53`。

这说明即便底层代码写完，如果没有放开 `supports('useAnimation')`，React 层仍然只能 warning/no-op。

因此提案单独引入 capability key 的方向是必要的，不只是文档层面的区分。

---

## 风险分层判断

### 高风险

#### 1. Transform 抑制与恢复时序

当前普通链路一次性下发完整 matrix，而提案 v1 只支持结构化的 `transform.translate.x/y/z`、`transform.rotate.x/y/z`、`transform.scale.x/y/z`。

如果试图在普通同步路径里“只抑制被动画控制的 SRT 分量，保留其他 transform 分量同步”，会引入矩阵分解/重组复杂度，且 React 与 native 双侧都要协作，风险偏高。

提案选择“只要命中 transform，就整体暂停普通 transform sync”，是现实且必要的折中，见 `openspec/changes/spatial-div-animation-api/design.zh.md:390`。

#### 2. Suppression 释放后的视觉闪回

当动画结束时，如果应用层没有在 `onComplete` / `onCancel` 中同步最新 state，普通同步恢复后，React 声明值可能把旧值重新推回 native。

这个风险在设计中已经被明确承认，见 `openspec/changes/spatial-div-animation-api/design.zh.md:428`。

这意味着：

- SDK 侧必须定义清晰的恢复时机；
- 文档侧必须明确“若希望保持动画终态，业务必须手动同步 state”。

### 中风险

#### 3. Transform rotate / scale 的分解与重组

当前普通 transform 来自完整 DOMMatrix，但提案要求动画 API 暴露 CSS-like 的 `translate` / `rotate` / `scale` 分量。

这个设计是合理的，因为它避免接受任意 CSS transform 字符串或矩阵插值；但它也带来一个必然结果：

- native 侧需要从 `AffineTransform3D` 提取 SRT 分量；
- 旋转欧拉角存在顺序和边界 case；
- 动画结束后普通 DOMMatrix 同步恢复时，必须避免视觉突变。

因此提案固定 translate → rotate → scale 的组合顺序，并明确不支持 `matrix`、`skew`、`perspective`，这是控制复杂度的关键。

#### 4. 共用 `useAnimation` 的 key 推断分叉

当前 entity key 和 SpatialDiv key 互斥，因此按 `config.to` 推断路径是可行的，见 `openspec/changes/spatial-div-animation-api/design.zh.md:317`。

风险在于未来如果两边字段发生碰撞，例如 entity 也引入 `opacity`，那么当前推断模型就不再稳定，需要切换到显式 discriminator。

这属于前向兼容风险，不影响本次 v1 实现。

### 低到中风险

#### 5. Native 播放控制本身

native 侧当前没有 `SpatialDiv` 的 animation session，但 Entity 动画的模式已经把“该怎么做”示范得非常清楚：

- `SpatialScene` 按命令类型分发：`packages/visionOS/web-spatial/model/SpatialScene.swift:1294`
- `SpatialEntity.animateTransform(...)` 在 JS 侧先注册 `_completed / _canceled / _failed` 再发命令：`packages/core/src/reality/entity/SpatialEntity.ts:153`
- 类型层面已经有标准 command/result 形状：`packages/core/src/types/animation.ts:168`

因此 native 真正的难点不在“能否做会话管理”，而在“需要给 Spatialized2DElement 单独做一套对应能力”。这会花工时，但技术路径是清楚的。

---

## 对提案设计本身的评价

总体上，这份提案的设计方向是正确的，尤其体现在以下几点：

### 1. 白名单收口是必要的

把范围限制在只影响视觉呈现的字段：

- `transform.translate.x/y/z`
- `transform.rotate.x/y/z`
- `transform.scale.x/y/z`
- `opacity`

这是实现级别的正确约束。若一开始支持任意 CSS 属性、任意 `transform` 字符串插值，当前架构会迅速失控。`width`、`height`、`back` / `backOffset`、`depth` 被排除，也避免了布局、空间面板尺寸、深度和空间位置语义竞争。

### 2. 要求 native 播放是正确的

如果仍由 JS 逐帧驱动 DOM 或 bridge，不仅性能差，还会和现有同步链路产生更多竞争。native 侧持有会话、逐帧插值、统一回传终态，才是与当前架构相容的做法。

### 3. capability 需要统一到发布口径

`SpatialDiv` 动画和 entity 动画虽然底层路径不同，但发布后的对外能力口径统一到 `supports('useAnimation')`。`spatialized2d`、`static3d`、`dynamic3d` 仍作为内部目标解析 kind，不再作为 capability sub-token 暴露。

### 4. 竞争处理方案务实

“属性级抑制 + transform 整体抑制”不是最理想的长期架构，但它是当前代码库里风险最低、最接近可落地的 v1 解法。

---

## 推荐的实现顺序

从工程收益与风险控制角度，建议按下面顺序推进：

### 第 1 阶段：先打通协议与 suppression

先做最关键的基础设施，而不是先做复杂插值：

1. 新增 `SpatialDiv` 专属 capability key；
2. 定义 `AnimateSpatialized2DElement` 命令与结果类型；
3. 在 React 侧打通 `useAnimation` 的 SpatialDiv 路由；
4. 在 `PortalInstanceObject` 引入字段级 suppression 和 transform suppression。

没有这一层，后续 native 播放做出来也无法稳定工作。

### 第 2 阶段：先做纯标量字段

优先支持：

- `opacity`

这个字段与当前属性同步结构最接近，能够最快验证：

- command / event 协议是否正确；
- session 管理是否可靠；
- suppression 是否能有效避免普通同步覆盖；
- 生命周期回调和错误处理是否闭环。

### 第 3 阶段：加入 `transform.translate`

在确认 suppression 与会话模型稳定后，再补 `transform.translate.x/y/z`。

由于 v1 采用 transform 整体抑制，这一阶段的关键不是复杂矩阵组合，而是确保：

- 动画期间外部 transform 更新被缓存而不是立即生效；
- 会话结束后能在下一个 React render 周期恢复普通同步。

### 第 4 阶段：最后加入 `transform.rotate` / `transform.scale`

`rotate` / `scale` 是视觉价值高但 transform 分解/组合语义更敏感的一组字段，建议放在最后。

原因不是它们不能做，而是它们最容易暴露：

- CSS `rotateX/Y/Z()` 与 native 欧拉角顺序是否一致；
- 非均匀 scale 与 rotate 组合时是否稳定；
- 动画结束后普通 DOMMatrix 同步恢复时是否出现视觉跳变。

---

## 最终判断

如果问题是：**“这个提案在 native visionOS 上是否值得继续推进？”**

我的答案是：**值得推进。**

如果问题是：**“它是否能在当前架构里低成本实现？”**

我的答案是：**不能低成本，但可以有边界地实现。**

如果问题是：**“提案当前的技术方向是否正确？”**

我的答案是：**基本正确，尤其是 capability 拆分、白名单字段、native 播放、以及 suppression 设计这几个核心决策。**

最终可给出的评估结论为：

> `spatial-div-animation-api` 在 native visionOS 上是“有条件可行”。
>
> 其可行性建立在两个前提之上：
> 1. 接受 v1 只支持白名单字段，不追求任意 CSS 动画；
> 2. 先解决 `PortalInstanceObject` 普通同步对 native 动画的覆盖问题，再实现 native animation session。
>
> 在满足这两个前提时，该提案具备明确的实现路径，且与现有仓库架构兼容。
