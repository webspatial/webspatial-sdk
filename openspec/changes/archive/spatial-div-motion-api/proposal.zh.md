## 背景

并行 OpenSpec 变更 `spatial-div-animation-api` 采用 **会话式** SpatialDiv 动画：`from`/`to`、`duration`/`delay`，以及与普通 `style` 并行的 `animation` prop。该模型适合 visionOS 上的简单入场动画，但存在三个产品缺口：

1. **多轨时间线** — 例如 0–5s 内 `translateX` 0→100，同时 3–5s 内 `opacity` 0→1 — 无法用单会话表达。
2. **双通道控制** — `animation` 与 `style` 同时驱动，易与抑制/回调 flash-back 纠缠。
3. **普通 Web** — `supports('useAnimation', ['element'])` 为 false 时，会话 API 规定 `play()` 为 **no-op**，同一套组件在浏览器中不播放。

本变更提出 **`useSpatializedMotion`**：**以 timeline 为中心**、**单一 `style` 出口**、**双后端**（spatial 能力具备时走 native timeline，否则走 Web JS keyframe）。这是对会话 API 作为长期公开契约的 **替代方案**；**不修改** `openspec/changes/spatial-div-animation-api/`。

**产品沟通：** 对外 API 与集成说明见 [API.zh.md](./API.zh.md)。

## 一览

```jsx
const { style, api } = useSpatializedMotion({ kind: 'spatialized2d', 
  duration: 5,
  tracks: [
    { property: 'transform.translate.x', keyframes: [{ at: 0, value: 0 }, { at: 5, value: 100 }], easing: 'linear' },
    { property: 'opacity', keyframes: [{ at: 3, value: 0 }, { at: 5, value: 1 }], easing: 'easeOut' },
  ],
})

<div enable-xr style={{ width: 300, height: 200, ...style }}>...</div>
```

简单淡入可用 `useSpatializedMotion.simple({ kind: 'spatialized2d', { from, to, duration })`，脱糖为两关键帧 timeline。

## 变更摘要

- 新增规范能力 **`spatial-div-motion`**：timeline 配置、`useSpatializedMotion`、`MotionApi`、Web JS 后端、native timeline bridge（演进现有 `AnimateSpatialized2DElement`）。
- **公开集成**以 **`style` + `api`** 为作者契约；不使用 Plan A 的 `animation` prop。spatial 原生路径另需内部 **`motion` 绑定**（或未来的 `MotionSpatialDiv` 封装），详见 `design.md` § Integration & documentation。
- **双后端**：具备 `supports('useAnimation', ['element'])` 的 spatial 运行时走 native + 抑制；其余环境走 **Web 后端**（RAF 写 `style`），保证 Chrome/Safari 可播。
- 复用会话实现分支的基础设施：抑制、bridge、Manager、SRT 合成等。
- 新增 **`COMPARISON.md`** 对比方案 A（会话）与方案 B（motion）；**`API.zh.md`** 供产品/设计查阅 API 清单。
- test-server 增加 `/spatial-div-motion` 对比路由与多轨验收 demo。

## 能力

### 新增

- `spatial-div-motion`

### 修改

- `runtime-capabilities`：native 后端仍用 `supports('useAnimation', ['element'])`；Web 后端不依赖该能力。

## 影响

见英文 `proposal.md`。推荐结论见 `COMPARISON.md`。
