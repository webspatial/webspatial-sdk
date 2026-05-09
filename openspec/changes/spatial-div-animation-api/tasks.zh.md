## Phase 0: POC 验证（opacity 单属性，端到端）

**目标**：用 `opacity` 一个属性跑通完整纵向链路，验证 native `CADisplayLink` 帧驱动架构可行性与 suppression 机制。

**执行策略**：

- **Core SDK + React SDK**：直接写正式实现（API 层无争议，不会返工）
- **Native (visionOS)**：按设计方案先实现一版，等测试页面验证可行性后再扩展到其余属性
- **testServer**：新增测试页面，供手动验证端到端链路

**优先级依据**：两份独立可行性评估（`feasibility-visionOS.md` 与 `feasibility-visionOS-analysis.md`）均确认 suppression 是第一阻塞点，而 CADisplayLink 插值本身技术不确定性低。因此 POC 同时验证这两件事。

### 0.1 React SDK — useAnimation SpatialDiv 分支（正式实现）

- [ ] 0.1.1 实现 `resolveAnimationKind(config)` 互斥判定 + `useSpatialDivAnimation(config, active)` 骨架（双路无条件调用模式）
- [ ] 0.1.2 实现 `SpatialDivAnimationConfig` 校验逻辑（白名单、数值范围、timingFunction、loop 结构、entity/SpatialDiv key 互斥）
- [ ] 0.1.3 实现 `SpatialDivAnimatedProps` 生成与 `animation` prop 绑定（仅 opacity 字段 live，其余字段 stub）
- [ ] 0.1.4 实现 `AnimationApi`（play/pause/cancel/isAnimating/isPaused/playState/finished）— 通过 core-sdk 发命令、监听事件更新状态

### 0.2 Core SDK — Bridge 会话流程（正式实现）

- [ ] 0.2.1 在 `Spatialized2DElement` 中新增 `animateSpatialDiv(command)` 方法，封装 play/pause/resume/cancel 命令发送
- [ ] 0.2.2 定义 `AnimateSpatialized2DElement` JSBridge 命令结构（type + from/to + duration + timingFunction + delay + loop + playbackRate）
- [ ] 0.2.3 注册 `{animationId}_completed` / `{animationId}_canceled` / `{animationId}_failed` 事件监听，回调到 React 层

### 0.3 Native — Suppression 基础设施

- [ ] 0.3.1 在 `PortalInstanceObject`（或对应 Swift 侧）为 `opacity` 引入字段级抑制标记（`_suppressedFields: Set<string>`），alive 会话期间 `updateSpatializedElementProperties()` 跳过被抑制字段
- [ ] 0.3.2 验证抑制期间 React 侧修改 CSS opacity → native 不响应；抑制释放后 → 恢复常规同步

### 0.4 Native — 动画引擎骨架

- [ ] 0.4.1 新建 `SpatialDivAnimationSession.swift`：持有 `CADisplayLink`，实现 `play()` / `pause()` / `resume()` / `cancel()` / `invalidate()` 状态机
- [ ] 0.4.2 新建 `SpatialDivAnimationManager.swift`：以 `animationId` 为 key 管理 sessions，每个 element 至多一个 active session
- [ ] 0.4.3 实现 4 种 `timingFunction` 的 cubic 近似插值函数
- [ ] 0.4.4 实现 `opacity` 帧驱动插值：每帧 `lerp(from.opacity, to.opacity, easedProgress)` → 写入 `SpatializedElement.opacity`

### 0.5 Native — Bridge 命令注册

- [ ] 0.5.1 在 `SpatialScene.setupJSBListeners()` 中注册 `AnimateSpatialized2DElement` 命令，分发到 `SpatialDivAnimationManager`
- [ ] 0.5.2 实现 `{animationId}_completed` / `{animationId}_canceled` 事件回传 JS

### 0.6 testServer — 测试页面

- [ ] 0.6.1 新增 `poc-spatial-div-animation.html` 测试页面：含 SpatialDiv 容器 + Play/Pause/Resume/Cancel 按钮 + 事件日志面板
- [ ] 0.6.2 页面通过 `useAnimation` hook（正式 API）触发 opacity 动画，展示完整 DX 流程
- [ ] 0.6.3 页面包含 suppression 验证：动画期间自动修改 CSS opacity，观察 native 是否忽略

### 0.7 端到端验证（手动，由你跑测试页面）

- [ ] 0.7.1 Play → native opacity 动画可见
- [ ] 0.7.2 动画完成 → `onComplete` 回调触发，finalValues.opacity 正确
- [ ] 0.7.3 Cancel → opacity 瞬间恢复到 from，`onCancel` 回调触发
- [ ] 0.7.4 Pause → opacity 冻结在中间值；Resume → 从暂停点继续
- [ ] 0.7.5 动画期间 suppression 生效（JS 修改 opacity 不影响动画）
- [ ] 0.7.6 动画结束后恢复常规 opacity 同步
- [ ] 0.7.7 90Hz 下 opacity 0→1 动画流畅无明显掉帧

### Go/No-Go 判据

| 条件 | 通过 → | 不通过 → |
|---|---|---|
| 0.7.1–0.7.6 全部通过 | 扩展到其余白名单属性 | 分析失败原因，调整 native 架构 |
| 90Hz 下系统性卡顿 | — | 评估降帧到 60fps 或切换 `TimelineView` 方案 |
| `@Observable` 每帧写入导致 SwiftUI 大面积重绘 | — | 评估批量写入优化或 `objectWillChange` 节流 |
| Suppression 释放后闪回无法避免 | — | 评估延迟释放策略或强制 state 同步 |

---

## 1. 公开 API 与能力契约

- [ ] 1.1 定义 `SpatialDiv` 版本的 `useAnimation` 配置类型（`SpatialDivAnimationConfig`、`SpatialDivAnimatedValues`）、返回类型（`SpatialDivAnimatedProps`、`AnimationApi`）与 `AnimationError` 形状，覆盖 `back`、`transform.translate.x/y/z`、`opacity`、`depth`、`width`、`height`，明确 `duration` 默认值为 `0.3`，`playbackRate` 默认值为 `1`，`opacity` 校验范围为 `[0, 1]` 闭区间
- [ ] 1.2 在 `useAnimation` hook 入口实现"双路无条件调用 + active 短路"分派模式：顶层 `resolveAnimationKind(config)` 判定 kind，`useEntityAnimation(config, active)` 与 `useSpatialDivAnimation(config, active)` 无条件并列调用（满足 Rules of Hooks），非激活侧 effect 短路返回 noop API
  - **依赖** 1.1（需要 SpatialDiv 配置类型定义）
- [ ] 1.3 为空间化 HTML 节点补充 `animation` prop 的对外类型，并约束其仅在 `enable-xr` 链路上生效；在绑定阶段增加 `__kind` 校验（entity animation 绑到 SpatialDiv 或反之时抛错）
  - **依赖** 1.2（需要 `__kind` 标记机制就绪）
- [ ] 1.4 扩展 runtime capability 数据与文档，新增 `supports('useSpatialDivAnimation')` 的公开契约
- [ ] 1.5 实现 `SpatialDiv` 动画配置校验，覆盖白名单限制、数值范围（含 `opacity` 闭区间 `[0, 1]`、`width/height >= 0`）、`timingFunction` 与 `loop` 结构、entity/SpatialDiv key 互斥
  - **依赖** 1.1（需要类型定义）

## 2. Core SDK 与 Bridge 会话流程

- [ ] 2.1 在 `@webspatial/core-sdk` 中为 `Spatialized2DElement` 增加 `animateSpatialDiv(command)` 方法，play 返回 `AnimateSpatialDivResult`，其余返回 `void`
  - **依赖** 1.1（需要命令和结果类型定义）
- [ ] 2.2 设计并接入 `AnimateSpatialized2DElement` 的 JSBridge 命令结构，以及 `_completed`（payload: `SpatialDivAnimatedValues`）、`_canceled`（payload: `SpatialDivAnimatedValues`）、`_failed`（payload: `AnimationError`）事件命名和 payload；确保 listener 在 play 命令发送前注册
  - **依赖** 2.1（需要命令入口就绪）
- [ ] 2.3 打通 `play`、`pause`、`resume`、`cancel` 的命令串行化（按调用顺序发送至 bridge）、会话 id 全局唯一、异步失败上报（通过 `_failed` 事件）；实现终态事件互斥保证（`_completed` 与 `_canceled` 对同一 `animationId` 互斥）
  - **依赖** 2.2（需要 bridge 命令和事件就绪）
- [ ] 2.4 实现 `from` 缺省时的当前值快照逻辑：所有字段从 native 侧 `Spatialized2DElement` 当前状态读取（非 DOM），快照仅覆盖 `to` 中声明的字段，`delay` 不改变快照时机；覆盖 queued、delay 和 stop 点结果返回
  - **依赖** 2.1（需要 `animateSpatialDiv` 入口）
- [ ] 2.5 实现 `finished` / `canceled` Promise 在元素卸载时的行为：MUST NOT resolve，MUST NOT 调用生命周期回调
  - **依赖** 2.3（需要会话管理就绪）

## 3. React SpatialDiv 集成

- [ ] 3.1 在 React 层实现 `SpatialDiv` 版本的 `useAnimation(config)` 内部绑定与 `AnimationApi` 行为，包括 `isAnimating` / `isPaused` 五态状态机（idle / queued / delaying / running / paused）
  - **依赖** 1.2（需要 hook 分叉逻辑）、2.1（需要 core 命令入口）
- [ ] 3.2 在 `PortalInstanceObject` / `Spatialized2DElementContainer` 链路接入 `animation` prop 绑定、解绑和单元素复用校验；实现 animation prop 替换（cancel-old → start-new，旧 `onCancel` 先于新 `onStart`）和移除行为
  - **依赖** 3.1（需要 AnimationApi 就绪）、1.3（需要 prop 类型和 `__kind` 校验）
- [ ] 3.3 实现 `back`、`opacity`、`depth`、`width`、`height` 的属性级普通同步抑制与恢复；按字段维护缓存，在会话结束前释放抑制标记，回调后的下一个 React 渲染周期恢复常规同步
  - **依赖** 3.2（需要绑定链路就绪）
- [ ] 3.4 实现 `transform` 动画期间的整体 transform 同步抑制、缓存和会话结束后的恢复
  - **依赖** 3.2（需要绑定链路就绪）
- [ ] 3.5 实现 play 重入（alive 会话存在时 play → cancel old → start new）、cancel-old failure blocks start-new、config 更新不影响 alive 会话、控制命令按调用顺序串行化
  - **依赖** 3.1（需要状态机就绪）、2.3（需要命令串行化就绪）
- [ ] 3.6 对未开启 `enable-xr` 或不支持 runtime 的使用路径给出 warning（每个 hook 实例至多一次），并保持 `play()` 为 no-op；不支持 runtime 时 `isAnimating` 保持 `false`
  - **依赖** 1.4（需要 capability key 就绪）

## 4. Native 播放

- [ ] 4.1 在 visionOS runtime 中增加 `SpatialDiv` 动画会话存储、播放控制器和生命周期管理
  - **依赖** 2.2（需要 bridge 命令结构就绪）
- [ ] 4.2 实现白名单字段的 native 插值与应用，包括 `transform.translate.x/y/z`、`back`、`depth`、`opacity`、`width`、`height`
  - **依赖** 4.1（需要会话管理就绪）
- [ ] 4.3 实现 `delay`、reset loop（含瞬时重置，不重新快照）、reverse loop、pause（含 delay 期间 pause 保留剩余 delay）、play（从暂停恢复）、cancel（恢复到 `from` 或起始快照）的 native 语义，并返回 `_completed` / `_canceled` 终态
  - **依赖** 4.2（需要插值就绪）
- [ ] 4.4 实现 bridge / native 异步失败的 `_failed` 事件与错误 payload 回传；确保 play 失败后不发 `_completed` / `_canceled`，pause/resume/cancel 失败后会话保持失败前状态
  - **依赖** 4.3（需要播放语义就绪）

## 5. 验证与文档

- [ ] 5.1 增加 capability 测试，覆盖 `supports('useSpatialDivAnimation')` 的 true / false / 稳定性，以及与 `supports('useAnimation')` 的独立性
  - **依赖** 1.4
- [ ] 5.2 增加 hook 分叉测试，覆盖 entity key / SpatialDiv key / 混用 key 抛错 / `__kind` 绑定校验
  - **依赖** 1.2、1.3
- [ ] 5.3 增加 React 行为测试，覆盖 autoStart、manual play、queued play（含排队期间 pause/cancel）、delay pause/play、delay pause then cancel、delay 直接 cancel、play 重入（cancel old → start new 顺序保证）、config 更新不影响 alive 会话、控制命令串行化、cancel-old failure blocks start-new、single-binding error、animation prop 替换/移除、warning
  - **依赖** 3.1–3.6
- [ ] 5.4 增加同步竞争测试，覆盖属性级抑制（含缓存和恢复）、transform 整体抑制、抑制释放时机（回调前释放标记）、以及 `width` / `height` 不自动回写 DOM
  - **依赖** 3.3、3.4
- [ ] 5.5 增加 bridge / native 会话测试，覆盖 completed、canceled、failed（含 play 失败和 pause/cancel 失败）、终态事件互斥、loop 和 cancel 恢复语义、listener 注册时序、`animationId` 唯一性、unmount 时 Promise 不 resolve
  - **依赖** 2.3、2.5、4.3、4.4
- [ ] 5.6 增加状态机测试，覆盖 isAnimating / isPaused 在 idle / queued / delaying / running / paused 各状态下的值，以及 stop/completion 后在回调触发前变为 false
  - **依赖** 3.1
- [ ] 5.7 更新 `docs/` 与 `apps/test-server` 示例，演示 `SpatialDiv` 动画 API（入场动画、手动触发 + cancel 同步尺寸、循环浮动）、白名单字段、能力检测与已知限制
  - **依赖** 5.3（需要核心行为验证通过）