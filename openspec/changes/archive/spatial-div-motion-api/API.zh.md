# SpatialDiv Motion API（Plan B）— 产品沟通摘要

> 分支：`proposal/spatial-div-motion-timeline`  
> OpenSpec：`openspec/changes/spatial-div-motion-api/`  
> 对比方案 A（会话式 `animation` API）：见 [COMPARISON.md](./COMPARISON.md)  
> **全平台 umbrella（Static3D / Entity）：** [spatialized-element-motion-api](../spatialized-element-motion-api/API.zh.md) — **本 change 当前仅交付 2D。**

本文档汇总 **当前 spec 已定义、实现中的对外能力**，便于与 product、设计对齐范围与集成方式。技术细节见 `design.md`、`specs/spatial-div-motion/spec.md`。

---

## 0. 实现范围（重要）

| 元素类型 | 本 change 是否交付 |
|----------|-------------------|
| `Spatialized2DElement`（SpatialDiv） | **是** — `useSpatializedMotion({ kind: 'spatialized2d', … })` |
| `SpatializedStatic3DElement`（Model） | 否 → umbrella [已交付](../spatialized-element-motion-api/API.zh.md) |
| `SpatializedDynamic3DElement`（Reality 容器） | 否 → umbrella [已交付](../spatialized-element-motion-api/API.zh.md) |
| Reality 内 `SpatialEntity` | 否 → 继续 `useAnimation`（非 container motion） |

---

## 1. 一句话定位

**`useSpatializedMotion`** 是 **Spatialized2DElement / SpatialDiv** 的 **时间线动画 API**（非全部 SpatializedElement）：用一条 timeline（多轨、可重叠）驱动 **单一 `style` 出口**，在 **普通浏览器** 和 **WebSpatial 原生** 上都能播；与 Plan A 的 `useAnimation` + `animation` prop **并行提案**，供选型对比。

---

## 2. 与 Plan A 的差异（产品视角）

| 维度 | Plan A（会话 API） | Plan B（Motion API，本文） |
|------|-------------------|---------------------------|
| 配置 | 一段 `from` → `to` | 多轨 `tracks`，每轨独立关键帧 |
| 重叠时间线 | 需串联多次 `play` 或多 hook | **原生支持**（如 0–5s 位移 + 3–5s 淡入） |
| 普通 Chrome | `play()` 不播（no-op） | **必须能播**（Web 后端） |
| 集成 | `style` + **`animation` prop** | 仅 **`style`** 承载动画值 |
| 典型 demo | `/spatial-div-animation/*` | `/spatial-div-motion/*` |

**推荐（OpenSpec 默认倾向）：** 需要 Web 一致体验或多轨时间线 → Plan B；仅 visionOS 单段 native POC → 可继续 Plan A。

---

## 3. 对外 API 清单

### 3.1 React 入口（`@webspatial/react-sdk`）

| API | 说明 |
|-----|------|
| `useSpatializedMotion({ kind: 'spatialized2d', … })` | 主 API：多轨 timeline |
| `useSpatializedMotion.simple({ kind: 'spatialized2d', from, to, duration, … })` | 简版：等价于「每字段 0s→duration 两关键帧」 |

**返回值（作者日常使用）：**

| 字段 | 是否必填 | 说明 |
|------|----------|------|
| `style` | 是 | 当前帧动画样式：`opacity`、`transform`（CSS 字符串） |
| `api` | 是 | `play` / `pause` / `cancel` 及状态只读属性 |
| `motion` | 仅 spatial 原生 | **运行时接线**，不是配置；见 §5 |

### 3.2 Core 运行时（`@webspatial/core-sdk`）

| API | 说明 |
|-----|------|
| `SpatializedMotionController` | 单元素 timeline 播放控制器（`kind: 'spatialized2d'`；Web + Native） |
| `element.motion(config)` | 工厂：绑定 `Spatialized2DElement` 并返回 Controller |
| `evaluateMotionTimeline` / `validateSpatialDivMotionConfig` | 纯函数工具（与 native evaluator 对齐） |

`api` 与 Controller 方法对齐：`play()`、`pause(keys?)`、`resume(keys?)`、`cancel()`。  
`pause(['opacity'])` 在 **Web** 上按属性冻结；Native 暂为整段 pause（后续可扩展 `properties` 桥接）。

### 3.3 命令式控制（`api` / Controller）

| 方法 / 属性 | 行为（与 Plan A 会话语义对齐） |
|-------------|-------------------------------|
| `play()` | 开始或从暂停恢复；已在播放中则 no-op |
| `pause()` | 暂停 |
| `cancel()` | 取消并回到会话起始值 |
| `isAnimating` | 是否正在播放 |
| `isPaused` | 是否暂停 |
| `finished` | 非循环是否已结束 |
| `playState` | `'idle' \| 'running' \| 'paused' \| 'finished'`（内部 `queued` 在 bind 前会 **映射为 `running`**，表示已请求播放、等待 `motion` 绑定） |

**生命周期回调（写在 config 里）：** `onStart`、`onComplete(values)`、`onCancel(values)`、`onError`（native 异步失败）。

### 3.4 配置：多轨 timeline（`SpatialDivMotionConfig`）

| 字段 | 必填 | 说明 |
|------|------|------|
| `duration` | 是 | 全局时长（秒，> 0） |
| `tracks` | 是 | 非空轨道数组 |
| `delay` | 否 | 延迟（秒） |
| `autoStart` | 否 | 挂载后自动 `play`（默认可视为 true，以实现为准） |
| `loop` | 否 | `boolean` 或 `{ reverse?: boolean }` |
| `playbackRate` | 否 | 播放速率 |

**单轨 `SpatialDivMotionTrack`：**

| 字段 | 说明 |
|------|------|
| `property` | 动画属性路径（见 §4 白名单） |
| `keyframes` | 至少 2 个 `{ at, value }`，`at` 为秒，落在 `[0, duration]` |
| `easing` | 可选：`linear` / `easeIn` / `easeOut` / `easeInOut` |

### 3.5 配置：单段入场（`SpatialDivSegmentConfig`）

| 字段 | 说明 |
|------|------|
| `from` | 起始视觉值（可选） |
| `to` | 结束视觉值（必填） |
| `duration` | 时长（秒） |
| `timingFunction` | 全轨统一缓动 |
| 其余 | 与 timeline 相同的 `delay`、`loop`、`playbackRate`、回调等 |

内部脱糖为「每个变化字段一条轨、两个关键帧 `at: 0` 与 `at: duration`」。

### 3.6 类型包（`@webspatial/core-sdk`）

产品/前端对齐契约时可引用以下类型名：

- `SpatialDivVisualValues` / `SpatialDivVisualTransform`（某一时刻的视觉快照）
- `SpatialDivSegmentConfig`（`from`/`to` 单段，Plan A + `useSpatializedMotion.simple`）
- `SpatialDivMotionConfig` / `SpatialDivMotionTrack` / `SpatialDivMotionKeyframe`
- `SpatialDivMotionProperty`
- `SpatialDivPlaybackApi` / `SpatialDivPlayState`
- `SpatialDivMotionTimeline`（native bridge，一般应用不手写）

---

## 4. 可动画属性（白名单）

**支持：**

- `opacity`
- `transform.translate.x` / `.y` / `.z`
- `transform.rotate.x` / `.y` / `.z`
- `transform.scale.x` / `.y` / `.z`

**不支持（v1 明确排除）：**

- `width`、`height`、`back`、`backOffset`、`depth` 等 layout / 空间尺寸字段
- 任意自定义 CSS transform 字符串（由 SDK 按 translate → rotate → scale 组合）

---

## 5. 集成方式（给设计 / 前端）

### 5.1 推荐写法（所有环境）

```tsx
const { style, api } = useSpatializedMotion({ kind: 'spatialized2d', 
  duration: 5,
  tracks: [/* ... */],
  autoStart: true,
})

<div
  enable-xr
  className="card"
  style={{
    width: 280,
    height: 160,
    background: '#1e3a5f',
    ...style, // 动画值只合并在这里
  }}
>
  ...
</div>
```

在 **Chrome / Safari** 只需 `style` + `api`，无需其它 prop。

### 5.2 Spatial 原生（visionOS 等）

当运行时支持 `supports('useAnimation', ['element'])` 时，需把 hook 返回的 **`motion` 接到同一个 `enable-xr` 节点**：

```tsx
const { style, api, motion } = useSpatializedMotion({ kind: 'spatialized2d',  ... })

<div enable-xr motion={motion} style={{ ...layout, ...style }} />
```

**产品说明要点：**

- **visionOS / WebSpatial 上播放只走 native**，不会用 Web RAF 播同一条 timeline；`motion` 是 native 会话的**必填接线**（漏传则 `play()` 会排队 `queued`，bind 前画面不动）。
- `motion` **不是**第二套样式，也 **不是** Framer Motion 的 `<motion.div>`。
- 它是 SDK 把 hook 和底层 SpatialDiv **绑在一起** 的「插头」，类似 Plan A 的 `animation={animation}`，但动画值仍在 `style` 里。
- 未来可提供 **`MotionSpatialDiv` 组件**，应用侧不再手写 `motion`（spec 已预留，**尚未实现**）。

### 5.2.1 Native 播放时 `style` 何时有意义

| 阶段 | `style` 行为 |
|------|----------------|
| **播放中（running）** | Native 驱 entity；Portal 对动画字段 **suppression**，React `style` **不**逐帧追 native（勿用 `style` 做中间帧验收） |
| **暂停（paused）** | Hook 按 timeline **采样当前进度** 写回 `style`（与画面一致，供恢复前 React/DOM 状态对齐） |
| **结束（finished）** | `style` 落到 timeline 终点；释放 suppression 后 DOM 与 native 对齐 |
| **取消（cancel）** | `style` 回到会话起点（t=0） |
| **纯 Web 后端** | 全程由 RAF 驱动 `style` 逐帧更新 |

作者仍只合并一份 `style`；spatial 下额外传 `motion` 完成绑定与 suppression。

### 5.3 与 React Spring 的关系

test-server 里 Spring 用法是 `useSpring` + `animated(div)`，**没有**单独的 binding prop。

Plan B 在浏览器里体验接近「只维护一份 `style`」；在 spatial 里因 Portal 创建独立 `Spatialized2DElement`，才多了一步 `motion` 接线。详见 `design.md` § Integration & documentation。

---

## 6. 双后端（产品验收关注点）

```text
useSpatializedMotion
    ├─ 普通 Web（supports useAnimation element = false）→ 仅 Web RAF 播放
    └─ WebSpatial（supports = true）→ 仅 Native 播放（segment 或 timeline）
         ├─ 已 motion 绑定 → 立即 native play
         └─ 未绑定 → queued，bind 后 native play（不用 Web RAF 兜底）
```

| 环境 | 预期 |
|------|------|
| 桌面 Chrome 打开 test-server | 多轨 demo 自动播放（Web RAF），无需 AVP |
| visionOS WebSpatial | 同配置仅 native timeline/segment；须 `motion={motion}` |
| 仅写 `style` 不传 `motion`（spatial） | **不会动画**（queued），不是 Web 兜底 — 属集成错误 |

**验收 demo 路由：**

| 路由 | 场景 |
|------|------|
| `/spatial-div-motion` | Plan A vs B 入口 |
| `/spatial-div-motion/multi-track` | canonical：0–5s 位移；opacity 0→1 自 3s 起 |
| `/spatial-div-motion/simple-entrance` | `simple()` 入场 |
| `/spatial-div-motion/translate-z` | 单轨 `translate.z` 深度轴 |
| `/spatial-div-motion/rotate` | 多轨 `rotate.y` + `rotate.z` |

---

## 7. 明确不在 v1 范围（避免误解）

- 物理弹簧曲线（`@react-spring/web` 完整模拟）；v1 仅 easing + 关键帧
- Layout / 尺寸动画
- 替换或删除 Plan A `useAnimation` / `animation`（本变更为 **叠加提案**）
- 对外承诺的 `MotionSpatialDiv` 组件（spec MAY，代码未交付）
- Entity 3D 动画（仍走 entity `useAnimation` 路径，与本 spec 无关）

---

## 8. 实现与 spec 完成度（沟通用）

| 项 | 状态 |
|----|------|
| Web 后端 + hook + 类型 | 已实现 |
| test-server 对比页 | 已实现 |
| Native segment + timeline | 已实现 |
| OpenSpec 文档（含 `motion` 绑定说明） | 已写入 |
| Web vs native 自动化 parity / 模拟器 e2e | spec 任务 **4b.5 未完成** |
| 产品定稿（Plan A vs B 长期策略） | spec 任务 **§5 未完成** |

---

## 9. 相关文档索引

| 文档 | 读者 |
|------|------|
| [proposal.zh.md](./proposal.zh.md) | 背景与变更摘要 |
| [COMPARISON.md](./COMPARISON.md) | Plan A / B 对照表 |
| [design.md](./design.md) | 技术设计、双后端、`motion` 文档规范 |
| [specs/spatial-div-motion/spec.md](./specs/spatial-div-motion/spec.md) | 规范性需求 |
| [specs/spatial-div-motion-native-timeline/spec.md](./specs/spatial-div-motion-native-timeline/spec.md) | Native timeline bridge |

---

*文档版本：与 commit 同步维护于 `proposal/spatial-div-motion-timeline` 分支。*
