# SpatialDiv Motion API（Plan B）— 产品沟通摘要

> 分支：`proposal/spatial-div-motion-timeline`  
> OpenSpec：`openspec/changes/spatial-div-motion-api/`  
> 对比方案 A（会话式 `animation` API）：见 [COMPARISON.md](./COMPARISON.md)

本文档汇总 **当前 spec 已定义、实现中的对外能力**，便于与产品、设计对齐范围与集成方式。技术细节见 `design.md`、`specs/spatial-div-motion/spec.md`。

---

## 1. 一句话定位

**`useSpatialDivMotion`** 是 SpatialDiv 的 **时间线动画 API**：用一条 timeline（多轨、可重叠）驱动 **单一 `style` 出口**，在 **普通浏览器** 和 **WebSpatial 原生** 上都能播；与 Plan A 的 `useAnimation` + `animation` prop **并行提案**，供选型对比。

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
| `useSpatialDivMotion(config)` | 主 API：多轨 timeline |
| `useSpatialDivMotion.simple(config)` | 简版：等价于「每字段 0s→duration 两关键帧」 |

**返回值（作者日常使用）：**

| 字段 | 是否必填 | 说明 |
|------|----------|------|
| `style` | 是 | 当前帧动画样式：`opacity`、`transform`（CSS 字符串） |
| `api` | 是 | `play` / `pause` / `cancel` 及状态只读属性 |
| `motion` | 仅 spatial 原生 | **运行时接线**，不是配置；见 §5 |

### 3.2 命令式控制（`api`）

| 方法 / 属性 | 行为（与 Plan A 会话语义对齐） |
|-------------|-------------------------------|
| `play()` | 开始或从暂停恢复；已在播放中则 no-op |
| `pause()` | 暂停 |
| `cancel()` | 取消并回到会话起始值 |
| `isAnimating` | 是否正在播放 |
| `isPaused` | 是否暂停 |
| `finished` | 非循环是否已结束 |
| `playState` | `'idle' \| 'running' \| 'paused' \| 'finished'` |

**生命周期回调（写在 config 里）：** `onStart`、`onComplete(values)`、`onCancel(values)`、`onError`（native 异步失败）。

### 3.3 配置：多轨 timeline（`SpatialDivMotionConfig`）

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

### 3.4 配置：简单入场（`SpatialDivMotionSimpleConfig`）

| 字段 | 说明 |
|------|------|
| `from` | 起始视觉值（可选） |
| `to` | 结束视觉值（必填） |
| `duration` | 时长（秒） |
| `timingFunction` | 全轨统一缓动 |
| 其余 | 与 timeline 相同的 `delay`、`loop`、`playbackRate`、回调等 |

内部脱糖为「每个变化字段一条轨、两个关键帧 `at: 0` 与 `at: duration`」。

### 3.5 类型包（`@webspatial/core-sdk`）

产品/前端对齐契约时可引用以下类型名：

- `SpatialDivMotionConfig` / `SpatialDivMotionSimpleConfig`
- `SpatialDivMotionTrack` / `SpatialDivMotionKeyframe`
- `SpatialDivMotionProperty`
- `SpatialDivMotionApi` / `SpatialDivMotionPlayState`
- `SpatialDivMotionTimeline`（主要给 native bridge，一般应用不手写）

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
const { style, api } = useSpatialDivMotion({
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
const { style, api, motion } = useSpatialDivMotion({ ... })

<div enable-xr motion={motion} style={{ ...layout, ...style }} />
```

**产品说明要点：**

- `motion` **不是**第二套样式，也 **不是** Framer Motion 的 `<motion.div>`。
- 它是 SDK 把 hook 和底层 SpatialDiv **绑在一起** 的「插头」，类似 Plan A 的 `animation={animation}`，但动画值仍在 `style` 里。
- 未来可提供 **`MotionSpatialDiv` 组件**，应用侧不再手写 `motion`（spec 已预留，**尚未实现**）。

### 5.3 与 React Spring 的关系

test-server 里 Spring 用法是 `useSpring` + `animated(div)`，**没有**单独的 binding prop。

Plan B 在浏览器里体验接近「只维护一份 `style`」；在 spatial 里因 Portal 创建独立 `Spatialized2DElement`，才多了一步 `motion` 接线。详见 `design.md` § Integration & documentation。

---

## 6. 双后端（产品验收关注点）

```text
useSpatialDivMotion
    ├─ 普通 Web / 能力不可用 → Web 后端（RAF 写 style，play 必须有效）
    └─ WebSpatial + useAnimation(element) + 已绑定元素 → Native 后端（bridge timeline）
```

| 环境 | 预期 |
|------|------|
| 桌面 Chrome 打开 test-server | 多轨 demo 自动播放，无需 AVP |
| visionOS WebSpatial | 同配置走 native timeline/segment，视觉应尽量与 Web 一致 |
| 仅写 `style` 不传 `motion`（spatial） | native 可能无法正确绑定，**验收时需按文档接线** |

**验收 demo 路由：**

| 路由 | 场景 |
|------|------|
| `/spatial-div-motion` | Plan A vs B 入口 |
| `/spatial-div-motion/multi-track` | canonical：0–5s 位移 + 3–5s 透明度 |
| `/spatial-div-motion/simple-entrance` | `simple()` 入场 |

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
