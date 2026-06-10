# Proposal: Radix floating UI in WebSpatial (Scenarios 1, 2 & 3)

## Why

Radix UI（以及同类 floating UI 库）通过 Portal 把菜单、Popover 等浮层渲染到 trigger 子树之外，并用 DOM 几何（`getBoundingClientRect`、碰撞检测、`side`/`align`）完成定位。

WebSpatial 应用里，开发者会遇到三种常见需求。本 change 的目标是让这三种需求都能**继续用 Radix 原生写法**，只在必要时补充最少的 SDK 约定（主要是 Portal 目标和 `enable-xr`），而不是 fork Radix 或重写定位逻辑。

## 三种场景一览

| | **Scenario 1** | **Scenario 2** | **Scenario 3** |
| --- | --- | --- | --- |
| **触发位置** | 主页面（flat DOM） | 已浮起的 SpatialDiv 内 | 已浮起的 SpatialDiv 内 |
| **菜单呈现** | 新的 spatial surface（相对场景浮起） | 同一 spatial window 内的 flat 2D UI，受 parent 面板宽高限制 | **子 SpatialDiv**（浮在 parent 面板上方/前方，突破 parent 面板宽高限制） |
| **内层 `enable-xr`** | ✅ 需要 | ❌ 不需要 | ✅ 需要（nested） |
| **Radix `Portal container`** | `document.body`（或 `#root`） | `useSpatialPortalContainer()`（过渡） | 理想：省略；过渡：同 Scenario 2 |
| **开发者心智** | 主页面点按钮 → 菜单浮起来 | 面板里点按钮 → 菜单贴在面板里 | 面板里点按钮 → **再浮一个子面板** 显示菜单 |

**Scenario 2 vs 3 的区分（开发者视角）**

- Scenario 2：菜单是 parent SpatialDiv **内部**的普通 2D 浮层，不单独成为 spatial surface；因此会受 parent SpatialDiv 的 2D viewport / 宽高 / clipping 边界限制。
- Scenario 3：菜单从 parent SpatialDiv 里**浮出**，成为 parent SpatialDiv 的 **child SpatialDiv**，在 parent 上方/前方再浮一层（可调 `--xr-back` / `--xr-depth` 等），不被 parent 面板宽高裁剪。

判断方式很简单：**菜单 `Content` 里有没有内层 `div enable-xr`**。

## 开发者心智模型

### Scenario 1

> 我在主页面放一个按钮，点开以后菜单作为一个独立的 spatial surface 浮起来。

### Scenario 2

> 我已经有一个浮起的 SpatialDiv 面板，里面的按钮点开以后，菜单就显示在这个面板里，像普通网页下拉菜单一样；如果菜单超出面板宽高，它仍会受面板边界限制。

### Scenario 3

> 我已经有一个浮起的 SpatialDiv 面板。点面板上的 Avatar 以后，菜单可以**浮出 parent 面板边界**，在面板上方/前方以子 SpatialDiv 的形式完整显示。

Scenario 3 **不引入新的 spatial 原语**。外层 `enable-xr` = parent 面板；内层 `enable-xr` = child 菜单表面。Radix 继续负责 DOM 侧定位和 pointer/tap selection；WebSpatial 负责让 child 菜单表面浮在 parent 面板之外，而不是被 parent 的 2D bounds 裁剪。键盘、focus、typeahead、focus trap、outside-click dismissal 不属于本期 Scenario 3 验收范围。

`useSpatialPortalContainer()` **不是** Scenario 3 的心智模型——它只是 Scenario 2 的技术要求（Radix 默认 portal 到主文档），在 auto portal 落地前，Scenario 3 过渡阶段不得不复用。

## 目标开发者 API

### Scenario 1 — 主页面 floating menu

```tsx
<DropdownMenu.Portal container={document.body}>
  <DropdownMenu.Content side="bottom" align="end" asChild>
    <div
      enable-xr
      style={{
        '--xr-back': 0,
        '--xr-depth': 0,
        '--xr-background-material': 'transparent',
      }}
    >
      <DropdownMenu.Item>Login / Register</DropdownMenu.Item>
    </div>
  </DropdownMenu.Content>
</DropdownMenu.Portal>
```

**约定**

- `Content asChild` + 内层 `div enable-xr`
- Portal 指向主文档（`#root`）
- 不需要 `useSpatialPortalContainer()`

### Scenario 2 — SpatialDiv 内 flat menu

```tsx
function SpatialDivMenu() {
  const container = useSpatialPortalContainer()

  return (
    <DropdownMenu.Portal container={container}>
      <DropdownMenu.Content side="bottom" align="end">
        <DropdownMenu.Item>Login / Register</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  )
}
```

**约定**

- **无**内层 `enable-xr`
- `container={useSpatialPortalContainer()}` —— 当前必需，因为 Radix 默认离开 spatial window
- 菜单在 parent SpatialDiv 的同一 spatial window 里渲染
- 菜单仍受 parent SpatialDiv 的 2D viewport / 宽高 / clipping 边界限制

### Scenario 3 — SpatialDiv 子表面 floating menu（目标 API）

**理想路径** — 只有 nested `enable-xr` + Radix，无额外 hook：

```tsx
function SpatialDivFloatingMenu() {
  return (
    <div enable-xr style={{ '--xr-back': 120, '--xr-depth': 80 }}>
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger asChild>
          <AvatarButton />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content side="bottom" align="end" asChild>
            <div
              enable-xr
              style={{
                '--xr-back': 12,
                '--xr-depth': 40,
                '--xr-background-material': 'thin',
              }}
            >
              <DropdownMenu.Item>Login / Register</DropdownMenu.Item>
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}
```

**过渡路径**（auto portal 未落地前）— 仅多一行 `container`，与 Scenario 2 同源，**不是** Scenario 3 专用 API：

```tsx
const container = useSpatialPortalContainer()

<DropdownMenu.Portal container={container}>
  {/* 同上：Content asChild + 内层 div enable-xr */}
</DropdownMenu.Portal>
```

**约定**

- 外层 `div enable-xr` = parent 面板（已浮起）
- `Content asChild` + 内层 `div enable-xr` = child 菜单 SpatialDiv
- 菜单需要能浮出 parent 面板的 2D bounds；当 Radix 计算出的菜单位置超出 parent 面板宽高时，菜单仍应完整可见
- **不要** `useSpatialFloatingSurface()`、`useSpatialFloatingOverlayPortal()` 等 Scenario-3 专用 hook
- **不要** 用 `createPortal` 手写菜单替代 Radix
- `modal={false}` 推荐（首版 MVP）

## SDK 对开发者的保证（可观测行为）

以下为 **proposal 层面的验收标准**；具体实现方案留待 design 讨论。

### 所有场景共通

- Radix 的 `side` / `align` / `sideOffset` / 碰撞策略 **不被 SDK 重写**
- Scenario 1/2 的 Radix 焦点、键盘导航、outside click、关闭逻辑 **仍由 Radix 拥有**
- Scenario 3 首版只承诺 pointer/tap selection；键盘、focus、typeahead、focus trap、outside-click dismissal **不属于本期要求**
- 不使用 `enable-xr` 时，现有 SpatialDiv / DOM 行为 **不变**（additive API）

### Scenario 1

- 菜单以 spatial surface 浮在场景中
- 主文档内 Radix popper 可正常测量（非 0×0）

### Scenario 2

- 菜单渲染在 parent SpatialDiv 的 spatial window 内
- 菜单 **不** 成为独立 spatial surface
- 菜单可以像普通网页浮层一样被 parent SpatialDiv 的宽高 / overflow 边界限制

### Scenario 3

- 菜单以 **child SpatialDiv** 浮在 parent SpatialDiv 上方/前方
- 菜单 **不受 parent SpatialDiv 的宽高 / overflow 裁剪限制**；即使 Radix 定位结果超出 parent 面板边界，菜单也应完整可见
- child surface **挂接在 parent SpatialDiv 上**，不挂到 scene root
- parent 面板移动时，child 菜单跟随
- 菜单关闭后，child surface 销毁
- Radix trigger、popper wrapper、以及用于测量的 hidden host **仍在同一 parent spatial-window document** 内可测量（不出现 cross-webview 导致 0×0 的空 wrapper）。可见菜单内容可渲染在 child SpatialDiv webview 中。

### Stretch goal

- SpatialDiv 内 Radix `Portal` **自动** portal 到最近 spatial window，理想路径可省略 `useSpatialPortalContainer()`

## What Changes

### Phase A — Scenarios 1 & 2（已实现）

- 文档 + demo 验证 Scenario 1（主页面 `enable-xr`）
- 交付 `useSpatialPortalContainer()` + `SpatialWindowContext`
- test-server demo：Scenario 1 & 2

### Phase B — Scenario 3（同 change，后续 commit）

- 让 **nested `enable-xr` + Radix** 达到上文 Scenario 3 的可观测保证
- demo 增加 Scenario 3 面板，代码形态与「目标开发者 API」一致
- **实现细节未定** — 见 `design.md`（待讨论）

**BREAKING**: none

## Out of Scope

- `SpatialOverlay` 等专用 wrapper 组件
- 重写 Radix / Floating UI 定位、碰撞、焦点管理
- Popover / Tooltip 等（Scenario 3 MVP 先覆盖 `DropdownMenu` demo）
- `spatialTransformMode=layout` 作为主路径

## 待 design 讨论的实现问题

以下问题 **有意不在 proposal 中定论**，供后续 design 评审：

1. nested `enable-xr` 与 Radix same-document 约束如何同时满足？
2. child SpatialDiv 的 native 层与 parent spatial-window DOM 如何分工？
3. `position: fixed` 的 Radix popper 如何挂接到 parent SpatialDiv 而非 scene root？
4. child 菜单如何突破 parent SpatialDiv 的 2D bounds / overflow 裁剪，同时仍保持 parent-child 空间关联？
5. auto portal container 是 Context 注入、Radix 薄封装，还是其他方式？
6. 首版 MVP 对 nesting 深度、modal 模式、动画的约束边界？

## Capabilities

- **New**: `spatial-overlay-portal-api` — 上述三种 Radix floating UI 集成模式
- **Modified**: none

## Delivery

Phase A 与 Phase B 同属本 OpenSpec change，可拆成独立 PR。Phase A 在 tasks 4.x 通过后可先合并；Phase B 不另开 change ID。
