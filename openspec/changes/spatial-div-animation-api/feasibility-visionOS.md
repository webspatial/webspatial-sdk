# SpatialDiv Animation API 在 Native visionOS 上的可行性评估

## 一、总体结论：可行，但有显著技术挑战

提案设计质量较高，对核心问题（同步竞争、能力隔离、API 一致性）的考量较为周全。Native 层实现可行，但 **SpatialDiv 与 Entity 动画的底层渲染机制根本不同**，这是最大的技术差异点。

---

## 二、关键可行性分析

### 1. 核心架构差异：SwiftUI 视图动画 vs RealityKit Entity 动画

| 维度 | Entity 动画（已实现） | SpatialDiv 动画（待实现） |
|---|---|---|
| 渲染层 | RealityKit `Entity` | SwiftUI `View`（WKWebView 容器） |
| 动画引擎 | `FromToByAnimation<Transform>` + `AnimationPlaybackController` | **无原生等价物**，需自行构建 |
| 完成检测 | `AnimationEvents.PlaybackCompleted` | **无等价事件**，需手动计时或回调 |
| 暂停/恢复 | `playbackController.pause()/resume()` | **无等价 API**，需自建 |
| 属性插值 | 仅 `Transform`（4x4 矩阵） | 7 个独立标量属性 + 3D 平移 |

**这是最大的可行性风险。** Entity 动画之所以顺畅，是因为 RealityKit 提供了完整的动画基础设施（插值、播放控制、完成事件）。SwiftUI 没有对等的手动动画播放控制 API。

### 2. 各属性 Native 插值可行性

| 属性 | 当前 Native 状态 | 动画方式 | 可行性 | 难度 |
|---|---|---|---|---|
| `opacity` | `SpatializedElement.opacity: Double` | 直接在 `@Observable` 对象上插值 | **高** | 低 |
| `back` (backOffset) | `SpatializedElement.backOffset: Double` | 直接插值，SwiftUI 自动响应 | **高** | 低 |
| `depth` | `SpatializedElement.depth: Double` | 直接插值 | **高** | 低 |
| `width` / `height` | `SpatializedElement.width/height: Double` | 直接插值，`.frame()` 自动响应 | **高** | 中（WKWebView resize 可能有抖动） |
| `transform.translate.x/y/z` | `SpatializedElement.transform: AffineTransform3D` | 需分解→插值→重组 `AffineTransform3D` | **中** | 高 |

**关键发现**：`SpatializedElement` 是 `@Observable` 对象，所有需要动画的属性都已经作为 `var` 存在（`SpatializedElement.swift:16-24`），SwiftUI 视图会自动响应变化。这意味着 **基于定时器的插值方案是可行的**。

### 3. 动画驱动方案选择

**方案 A：Timeline/DisplayLink 定时器驱动（推荐）**

在 native 侧使用 `TimelineView(.animation)` 或 `CADisplayLink` 按帧插值，直接更新 `@Observable` 属性：

```
每帧:
  progress = elapsed / duration (应用 timingFunction)
  element.backOffset = lerp(from.backOffset, to.backOffset, progress)
  element.opacity = lerp(from.opacity, to.opacity, progress)
  ...
```

- 优点：与现有 SwiftUI 渲染管线完全兼容，所有属性统一处理
- 缺点：需要自行实现定时器管理、暂停/恢复、完成检测、循环逻辑
- 参考：Entity 动画使用的 `AnimationPlaybackController` 不适用于 SwiftUI 视图

**方案 B：SwiftUI withAnimation + AnimationBuilder**

```swift
withAnimation(.easeInOut(duration: 0.3)) {
    element.backOffset = toValue
    element.opacity = toValue
}
```

- 优点：最简单，SwiftUI 自动处理插值
- 缺点：**无法精确控制暂停/恢复/cancel**，无法获取中间态值，无法实现 completion callback，**不满足提案需求**

**方案 C：混用 RealityKit Attachments**

将 SpatialDiv 作为 RealityKit Attachment 嵌入，利用 RealityKit 的动画系统。但这会彻底改变渲染架构，不可行。

**结论：必须采用方案 A（定时器驱动）**，与 Entity 动画的 `AnimationPlaybackController` 方案形成两套并行的动画基础设施。

###### 4. 暂停/恢复/Cancel 的实现

Entity 动画直接调用 `playbackController.pause()/resume()/cancel()`。SpatialDiv 动画需要自建：

- **Resume**：恢复 DisplayLink，从暂停点继续
- **Cancel**：停止定时器，**恢复到 `from`（或起始快照）**（与 Entity cancel 语义一致）

这部分逻辑需要新建 `SpatialDivAnimationSession` 和 `SpatialDivAnimationManager`，结构与 `EntityAnimationSession` / `EntityAnimationManager` 对称。

### 5. 完成检测

Entity 动画通过 `AnimationEvents.PlaybackCompleted` 检测完成。SpatialDiv 需要手动方案：

- **非循环动画**：定时器到达 `duration` 时即完成，发送 `_completed` 事件
- **循环动画**：检测每轮结束，按 reset/reverse 模式处理
- **Delay 期间**：定时器启动后先等待 delay，再开始插值
- **精度**：DisplayLink 提供帧级精度（visionOS 90Hz），足够满足需求

### 6. Transform 分解与重组

提案 v1 仅支持 `transform.translate.x/y/z`，但当前 `SpatializedElement.transform` 存储的是完整 `AffineTransform3D`。动画期间需要：

1. 从当前 `AffineTransform3D` 提取平移分量
2. 对平移分量进行插值
3. 将插值后的平移分量重新组合回 `AffineTransform3D`（保留旋转/缩放不变）

**但提案决策 6 规定**：动画期间 transform 整体抑制，即常规 `updateTransform(matrix)` 同步暂停。这简化了问题——动画期间不会有外部 transform 更新干扰，只需在会话结束时恢复即可。

### 7. Width/Height 动画的特殊风险

- 当前 `width`/`height` 来自 DOM `getBoundingClientRect()`，由 JS 侧通过 `UpdateSpatialized2DElementProperties` 下发
- 动画期间直接修改 `SpatializedElement.width/height`，SwiftUI 的 `.frame(width:height:)` 会响应变化
- **WKWebView resize 抖动**：改变 WebView 容器尺寸时，WKWebView 内部可能产生短暂的重排闪烁
- **内容缩放**：WebView 内容不会自动缩放，只是容器变大/变小，可能出现内容与容器不匹配
- 提案明确"不自动回写 DOM"，这是合理的但需要文档说明

---

## 三、Bridge 层可行性

Bridge 层扩展非常直接：

1. **新命令**：`AnimateSpatialized2DElement` — 形状类似 `AnimateTransform`，在 `JSBCommand.swift` 中新增 struct
2. **新事件**：`{animationId}_completed`、`{animationId}_canceled`、`{animationId}_failed` — 与 Entity 动画事件命名模式一致，在 `WebMsgCommand.swift` 中新增
3. **注册**：在 `SpatialScene.setupJSBListeners()` 中新增命令注册
4. **Handler**：分发到新的 `SpatialDivAnimationManager`

这部分完全复用现有架构，**无可行性风险**。

---

## 四、React/Core SDK 层可行性

- **`useAnimation` 分叉**：提案设计合理，通过 key 集合自动路由，对 entity 路径零侵入
- **属性级抑制**：在 `PortalInstanceObject` 层按字段维护抑制标记，技术上可行
- **Transform 整体抑制**：比属性级更简单，整体暂停 `updateTransform()` 即可
- **`animation` prop 绑定**：扩展现有 JSX runtime 的 prop 处理链路

**无重大可行性风险**，但抑制逻辑的时序（释放时机 vs 回调触发 vs 下次渲染）需要仔细处理。

---

## 五、风险矩阵

| 风险 | 等级 | 影响 | 缓解措施 |
|---|---|---|---|
| SwiftUI 无内置手动动画播放控制 | **高** | 需自建完整的定时器/插值/播放控制基础设施 | 参考 Entity 动画模式，构建对称的 `SpatialDivAnimationManager` |
| WKWebView resize 抖动 | **中** | width/height 动画视觉体验不佳 | 测试验证；必要时考虑 clip + overflow 方案 |
| 定时器精度 vs RealityKit 原生动画 | **低** | 可能不如 Entity 动画流畅 | DisplayLink 帧级精度足够；如有卡顿可降帧 |
| Transform 分解/重组边界 case | **中** | 旋转+平移动画组合时可能出错 | v1 整体抑制 transform 简化了问题；后续版本可细粒度 |
| 抑制释放时序 | **中** | 回调前释放标记的时序如不对，可能闪回 | 需要精确的 React effect 生命周期管理 |
| 两套并行动画基础设施维护成本 | **中** | 长期维护负担 | 共享通用模式（session、事件命名），差异部分隔离 |

---

## 六、实现建议

1. **优先实现 `opacity` + `back` + `depth`**：这三个属性最简单（纯标量插值），可快速验证核心架构
2. **再实现 `transform.translate`**：需处理 `AffineTransform3D` 分解重组
3. **最后实现 `width`/`height`**：风险最高，需验证 WKWebView resize 体验
4. **Native 侧新建文件**：
   - `SpatialDivAnimationManager.swift` — 对称于 `EntityAnimationManager`
   - `SpatialDivAnimationSession.swift` — 对称于 `EntityAnimationSession`
   - 基于 `CADisplayLink` 或 `TimelineView(.animation)` 的帧驱动
5. **复用现有模式**：事件命名、命令结构、会话管理尽量与 Entity 动画保持对称