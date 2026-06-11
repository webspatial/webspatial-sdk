# Design: Radix floating UI in WebSpatial

> 开发者契约以 [`proposal.md`](./proposal.md) 为准。本文档是实现方案，含核心张力分析、候选路径取舍与分阶段计划。**Scenario 3 的最终路径需要你拍板**（见文末「待决策」）。

## 1. 现有架构回顾（实现前必须理解）

### 1.1 双实例模型

一个 `enable-xr` 元素经 `SpatializedContainer` 分流（见 `SpatializedContainer.tsx`）：

| 环境判断 | 渲染产物 | 作用 |
| --- | --- | --- |
| **root**（无 `SpatializedContainerObject`） | `StandardSpatializedContainer`(host) + `PortalSpatializedContainer`(webview) + probe | 页面内 2D 占位 + 抬起的 webview |
| **standard instance**（在页面树，未进 portal） | `StandardSpatializedContainer`(host) + probe | host 即 `ref.current`，2D frame 来源 |
| **portal instance**（已在某 webview 内容树内，`inPortalInstanceEnv`） | **仅** `PortalSpatializedContainer`（自己的 webview + sub-portal placeholder） | 嵌套子 surface |

关键点：**每个 spatial surface 都是一个独立 webview**（`Spatialized2DElement.windowProxy`）。SpatialDiv 的 children 通过 `createPortal(..., windowProxy.document.body)` 渲染进该 webview（`Spatialized2DElementContainer.tsx` 的 `SpatializedContent`）。

### 1.2 2D frame / 定位同步

- `PortalInstanceObject.notify2DFrameChange()` 用 `querySpatialDomBySpatialId` 找到页面侧 placeholder，测 `getBoundingClientRect()`，把 rect/样式同步给 native（`updateSpatializedElementProperties`）。
- `addToParent()` 决定挂载目标：
  - `isFixedPosition` 或无 parent portal → 挂到 **scene root**（`spatialScene.addSpatializedElement`）
  - 有 parent portal → 挂到 **父 Spatialized2DElement**（`parent.addSpatializedElement`，即子 surface）
- 嵌套坐标基准来自 `queryParentSpatialDomBySpatialId`（沿 **DOM 祖先**向上找带 `SpatialID` 的节点）。

## 2. Scenario 3 为什么 naive 写法会坏

Scenario 3 的产品目标不是单纯“再创建一个 surface”，而是解决 Scenario 2 的明显短板：Radix 菜单如果只是 parent SpatialDiv 内的 flat 2D DOM，就会受 parent 面板的 2D viewport / 宽高 / clipping 边界限制。Scenario 3 要让开发者仍在 SpatialDiv 里使用 Radix `DropdownMenu.Content`，但菜单能浮在当前 SpatialDiv 上方/前方，并在超出 parent 面板宽高时仍完整可见。

目标写法（理想/过渡路径）：

```tsx
<div enable-xr>                       {/* parent SpatialDiv → webview A */}
  <DropdownMenu.Root modal={false}>
    <DropdownMenu.Trigger asChild><AvatarButton/></DropdownMenu.Trigger>
    <DropdownMenu.Portal container={A.body}>   {/* 过渡：useSpatialPortalContainer() */}
      <DropdownMenu.Content asChild>
        <div enable-xr>{items}</div>  {/* 内层 → 试图开 webview B */}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
</div>
```

实际发生：

1. Radix 把 `Content`（`asChild` → 内层 `div enable-xr`）portal 到 webview A 的 body，外面包一层 `data-radix-popper-content-wrapper`（`position: fixed`，Radix 写 transform 定位）。**到这一步 trigger 与 popper 都在 A，正确。**
2. 内层 `div enable-xr` 是 `inPortalInstanceEnv` → 走 `PortalSpatializedContainer` → 开 **webview B**，把 `{items}` `createPortal` 进 B。
3. 于是 DOM 被劈开：
   - **webview A**：popper wrapper 里只剩 `renderPlaceholderInSubPortal` 产出的占位元素，而该占位对 `position: fixed` 默认 **不渲染**（`shouldRenderPlaceHolder` 要求非 fixed/absolute 或 `isFloatingOverlay`）→ Radix Slot 拿不到有尺寸的子节点 → **popper 0×0**。
   - **webview B**：真正的 `items`，但它的尺寸/位置 native 无法从 A 的空占位推导。
4. 即使强行渲染占位，它也是空的（内容在 B），**无内在尺寸** → Radix 仍测到 0。
5. `addToParent`：popper wrapper 是 fixed，当前逻辑会判定 fixed → 挂到 **scene root**，而不是父 SpatialDiv。
6. 坐标基准 `queryParentSpatialDomBySpatialId` 沿 DOM 祖先找父 SpatialID，但内层被 portal 到了 A.body 下（祖先是 popper wrapper，不是父 SpatialDiv 内容节点）→ **找不到正确父基准**。
7. 若不进入子 surface / overlay 模式而只保留 Scenario 2 flat DOM，菜单会继续被 parent SpatialDiv 的 2D bounds 裁剪，无法满足“浮出面板”的核心目标。

## 3. 核心张力（必须先达成共识）

> **Z 向抬升一个子 surface ⇒ 需要一个子 webview ⇒ 内容必须搬出父文档。**
> **Radix 完整交互语义（测量/键盘/focus/outside-click）⇒ 内容必须留在父文档。**

这两条在当前 native 模型下**互相排斥**。core-sdk 只有「一个 surface 一个 webview」+「surface 之间父子挂载」，**没有**「把已有 webview 内某个 DOM 子矩形抬升成独立 quad」的原语（已核对 `Spatialized2DElement` / `SpatialScene`）。

所有候选方案本质都是在这条张力上做取舍。

## 4. 候选路径

### Path A — 内容进子 webview B + Radix 测量桥接（纯 JS，可立即落地）

- 内层 `enable-xr` 照常开 webview B 显示 `items`（真正抬起来）。
- 在 webview A 的 popper wrapper 下渲染一个**有尺寸的 hidden host**：hidden host 接收 Radix `asChild` props/ref，并渲染同一份 menu children 的隐藏副本；Radix 据此定位 popper。
- rect 流：Radix 定位好的占位 host rect（在 A）→ 同步给 native surface B；attach 到父 SpatialDiv（非 scene root）。
- 这是把现有 `useSpatialFloatingOverlayPortal` spike 的思路**自动化**进嵌套 `enable-xr` 路径。

**满足契约程度**

| 契约项 | 结果 |
| --- | --- |
| 子 SpatialDiv 抬升、挂父、跟随、销毁 | ✅ 可做到 |
| **逃出父 2D bounds 不被裁剪**（澄清后的核心区分点） | ✅ **天然满足**：B 是独立 native surface，不受父 webview A 的 viewport/overflow 裁剪 |
| popper 非 0×0、可测量 | ✅ 依赖 hidden host 正确接收 Radix props/ref/children；真实非零布局仍需 AVP 验证 |
| 点击/tap 选择（`onSelect`） | ✅ React 合成事件穿透 `createPortal`，仍触发 |
| 键盘 / focus / typeahead / focus trap / outside-click | ➖ **明确不在范围**（§已决策 4）：不需要实现，不作验收项 |

> 结论：Path A 的独立子 surface **正是「逃出父边界」最自然的实现**——被裁在父 webview 内的 flat 菜单（Scenario 2）做不到，这是 2/3 的本质区别。键盘/focus 等 Radix 交互语义本期明确不需要，故 Path A 对本期契约无阻塞。

### Path B — native 子区域抬升（契约语义最干净，需 native/core 支持）

- 内层 `enable-xr` **不**开内容型子 webview，`items` 留在 webview A（Radix 完整工作：测量、定位、键盘、focus、outside-click 全对）。
- 「抬升」改为 native 能力：core-sdk 新增「把父 spatial window 内一个 DOM 子矩形，以独立 quad（带自己的 `back`/`depth`）渲染在父面板前方」。
- SDK 侧：内层 `enable-xr` 在 overlay 模式下只上报「region rect + back/depth」给 native，不做 `createPortal` 搬运。

**满足契约程度**：✅ 全部（包括键盘/focus，因为 DOM 没动）。
**代价**：依赖 native 层新原语，跨团队、周期长；core-sdk `JSBCommand` / 平台 adapter 需扩展。

### Path C — A 内渲染（Radix 正确）+ 视觉镜像到 B（不推荐）

把 `items` 渲染在 A（Radix 正确但 host 被隐藏），再把渲染结果克隆/镜像进 B 显示。focus 仍在 A 的隐藏 host，B 上的交互打不到 Radix → 交互断裂，且 DOM 同步复杂。**否决。**

## 5. 推荐：分阶段（Path A 作 MVP，Path B 作目标）

1. **MVP（本 change Phase B）**：落地 **Path A**，把 overlay 自动接入嵌套 `enable-xr`，并在文档/demo 明确标注键盘/focus 的 caveat（首版要求 `modal={false}` + 主要鼠标/手势驱动）。这样开发者契约的**写法**（nested `enable-xr` + Radix）即可成立，行为达到「鼠标可用」级别。
2. **目标（后续 change / 跨 native）**：推动 **Path B** native 子区域抬升，达到契约的完整保证后，把 Path A 的桥接退役，开发者代码**零改动**升级。

> 这样开发者可见的 API 从 day 1 就是契约定义的形态，内部实现可平滑替换。如果你更倾向"要么不做、要做就做契约全保证"，我们应直接走 Path B 并把本 change 的 Phase B 标为 blocked-on-native。

## 6. Path A 的具体 SDK 设计（若采纳 MVP）

### 6.1 overlay 模式的自动识别

**MVP 已选策略：强信号组合（回应担忧 1，避免误伤普通 absolute/fixed 嵌套 spatial）。** 单纯「有定位祖先」过宽，必须叠加更强信号。当前 MVP 使用 render-time floating signals；DOM 祖先链判定作为后续 hardening，不在本 slice 中承诺已完成。

内层 `enable-xr` 需**同时**满足：

1. `inPortalInstanceEnv` 且 `parentPortalInstanceObject` 存在（确实是嵌套子 surface）；**且**
2. 命中 floating library 的强定位信号，例如 `data-side` / `data-align` / `data-radix-*` / `data-floating-ui-*` / `--radix-*` / `--floating-*`。后续可再叠加 DOM 祖先链判定：host 在到达父 SpatialDiv 内容根之前找不到正常的 parent SpatialID，说明它被 portal 搬离了父内容树。

> 即：判据是「嵌套 spatial + floating positioning signal」，而非「任意定位祖先」。普通 `position:absolute` 的嵌套 SpatialDiv 不携带这些 floating signals → **不会**误判为 overlay。DOM 祖先链判定可以进一步收紧，但不是当前 MVP 的必要条件。
>
> 备选（未采用）：纯「最近定位祖先」（过宽，担忧 1 已否决）；纯绑定 Radix data 属性（精度高但库绑定，可作快路径叠加）。

### 6.2 机制（核心：复用已验证的「双渲染」）

> **关键发现**：root/standard-instance 的 `enable-xr` 本就把 children 渲染两份——隐藏的 standard host（`visibility:hidden`，有真实尺寸，给 Radix 测量）+ webview（可见）。Scenario 1 的 `asChild` 非零尺寸与 `onSelect` 就靠这套。嵌套路径缺的正是「带 children 的 host」。所以 overlay 不需要「测量 B 回灌」，而是**让占位 host 也渲染一份 children**（隐藏），直接复用这套机制。

| 机制 | 改动点 | 说明 |
| --- | --- | --- |
| **带 children 的占位 host**（核心，回应担忧 2） | `SpatializedContainerBase`(portal 分支转发 `ref`) + `PortalSpatializedContainer` + `renderPlaceholderInSubPortal` | overlay 下占位 host **渲染 children（隐藏，自动尺寸）** 并接收 Radix Slot 的 `ref`/`style`/`data-*`/handlers → Radix 测到真实非零尺寸、定位正确。复用 Scenario 1 已跑通的双渲染，**不**做 B→A 尺寸回灌 |
| **overlay attach** | `PortalInstanceObject.addToParent` | overlay 即使 fixed 也挂到 `parentPortalInstanceObject` 的 `Spatialized2DElement`，不挂 scene root（spike 已支持） |
| **rect / 坐标基准同步** | `PortalInstanceObject.updateSpatializedElementProperties` | overlay 下占位 host 的 rect 已是 webview A 视口坐标、B 又是 A 的子 surface → 直接取 raw rect（**不**减父、**不**加 scroll、**不**走 DOM 祖先）；`ResizeObserver`+rAF 合并刷新 |

### 6.3 现有 spike 的去留

- 复用思路、**退役独立 hook**：`useSpatialFloatingSurface`、`useSpatialFloatingOverlayPortal`、`SpatialFloatingOverlayRoot` 不作为对外 API（契约要求无 Scenario-3 专用 hook）。
- 把 manual spike 里的「overlay attach / raw rect 同步 / overlay 生命周期」下沉进 `PortalSpatializedContainer` 的 overlay 分支，由嵌套 `enable-xr` 自动触发；尺寸来源改为 parent 文档里的 hidden host 双渲染，不做子 webview 尺寸回灌。
- `registerSpatialDom`/`overlayHostElement`/`isFloatingOverlay` 等 `PortalInstanceObject` 字段保留复用。

## 7. auto portal container（stretch）可行性

理想路径要省掉 `useSpatialPortalContainer()`，需让 Radix `Portal` 默认指向 webview A.body。但：

- Radix `Portal` 无 `container` 时默认 `globalThis.document.body` = **host 主文档**（React 在 host realm 跑），→ 与 trigger(A) 跨文档 → 0×0。
- Radix 不读我们的 Context，无法纯靠 Provider 注入；除非 ① fork/patch Radix Portal 默认（违反"不 fork"）或 ② 提供薄封装 re-export（如 `@webspatial/react-sdk` 导出包好 container 的 `SpatialDropdownMenu.Portal`）。

> 结论：纯 nested-`enable-xr` 自动路由**做不到无侵入**。stretch 只能以「可选薄封装」形式提供；在那之前过渡路径（`container={useSpatialPortalContainer()}`）是务实选择。这点需在契约里对开发者讲清。

### 7.1 降级模式（plain browser / 无 WebSpatial session）

在普通浏览器或尚未建立 spatial session 时，`enable-xr` 走 `DegradedContainer` 降级为普通 HTML，**不会**创建独立 webview。此前 `DegradedContainer` 未提供 `SpatialWindowContext`，导致 Scenario 2/3 的 `useSpatialPortalContainer()` 返回 `undefined`，Radix 菜单落到 host `document.body` 而 trigger 仍在降级 DOM 子树内，表现为菜单不可见或定位错误。

**对策（scheme C，已落地）**：`DegradedContainer` 提供 host page 的 `SpatialWindowContext`（`window` = 主文档 `window`）。`useSpatialPortalContainer()` 在降级 SpatialDiv 子树内返回 host `document.body`，与 trigger 同文档，无需应用层 fallback。

> 注意：`undefined` 仅表示**完全不在任何 SpatialDiv 子树内**（例如主页面 Scenario 1 仍应显式传 `document.body` 或 `#root`）。

## 8. 数据流（Path A overlay 模式 · 双渲染）

```text
菜单打开 (Radix mounts Content asChild → 内层 enable-xr, overlay 识别成立)
  │
  ├─ 占位 host 在 webview A 渲染一份 children（visibility:hidden, 自动尺寸）
  │     └─ 接收 Radix Slot 的 ref/style/data-*/handlers
  │           └─ Radix 测到真实尺寸 → 定位 popper wrapper(fixed, transform)  [popper 非 0×0]
  │
  ├─ 同一 children 又 createPortal 进 webview B                         [显示：抬起的子 surface]
  │
  └─ rect 同步: 读占位 host getBoundingClientRect()(A 视口坐标=raw)
        └─ native surface B: attach 到父 SpatialDiv, 同步 clientX/Y/width/height/back/depth
              └─ B 超出父面板宽高仍完整可见（独立 surface 不被父裁剪）

tap item(在 B) ──React 合成事件穿透 createPortal──▶ Radix onSelect / 关闭
菜单关闭 / 卸载 → 销毁 webview B + 注销占位
```

## 9. 风险 / 开放问题（对齐评审三点）

1. **担忧 1 — 识别误判**：纯定位祖先过宽。**对策**：§6.1 强信号（嵌套 + floating library positioning signal）。普通 absolute/fixed 嵌套 SpatialDiv 因不携带 floating signals 不会误判。DOM 祖先链判定是后续 hardening。需单测覆盖正/负样本。
2. **担忧 2 — asChild → 占位 host 的 ref/props 落点**（**成败关键**）：当前 `SpatializedContainerBase` portal 分支**未转发 `ref`**、`renderPlaceholderInSubPortal` 不渲染 children/不 spread Radix props。**对策**：转发 ref + 渲染 children + spread props，复用 Scenario 1 双渲染。**必须用单测验证**：Radix 写到 child 的 `style`/`data-*`/handler/ref 最终落到占位 host 且尺寸非零。
3. **担忧 3 — AVP tap 链路**：jsdom 验证不了 native hit-test。**对策**：必须 AVP smoke——tap B 内 item 能触发 Radix selection/close + 记 log。
4. **时序**：双渲染下 host 直接有尺寸，B→A 回灌取消，抖动风险大降；仅保留 Radix reposition 时的 rect→B 同步（rAF 合并）。
5. **坐标基准污染**：overlay 的 raw-rect 分支必须只在 `isFloatingOverlay` 下生效，不影响普通嵌套路径。
6. **Path B 依赖 native 排期**：本期不阻塞（Path A 先行）。

## 10. 任务映射

- Path A 采纳 → tasks 5.3–5.7 / 6.x 落地（见 `tasks.md`）。
- Path B 采纳 → 新增 native/core-sdk 子任务，Phase B 标 blocked-on-native。

## 11. 验证

- 单测（可在此环境跑）：overlay 识别正/负样本；**asChild→占位 host 的 ref/props/children 落点**（担忧 2 的结构半边）；attach 到父而非 scene root；overlay raw-rect 坐标基准。真实非零尺寸和 native hit-test 必须靠 AVP smoke。
- demo：Scenario 3 用 nested `enable-xr` + Radix（契约写法）。
- AVP smoke（必须，jsdom 替代不了）：popper 非 0×0；child surface 超出父面板仍完整可见；tap item 能关闭/记 log（担忧 3）；随父移动；关闭销毁。

## 12. 最小垂直切片（slice-first，按评审建议）

> 原则：**先不抽象、不堆测试**，先用最小改动让 Scenario 3 demo 跑通**三件事**，AVP 验证通过后再补抽象与完整测试。

**Slice 验收（缺一不可）**

1. `popper 非 0×0`（占位 host 拿到 children + Radix ref/props，有真实尺寸）。
2. `child surface 超出 parent 仍完整可见`（B 是独立 surface，attach 到父，不被裁剪）。
3. `tap item 能关闭 / 记 log`（B 内点击穿透到 Radix `onSelect`）。

**Slice 最小改动集（尽量集中）**

- `apps/test-server/.../dropdown-menu-spatial/index.tsx`：Scenario 3 改为 nested `enable-xr` + Radix（契约写法），去掉 `useSpatialFloatingOverlayPortal` + `OverlayMenuPanel`。
- `SpatializedContainer.tsx`：portal 分支把 `ref` 转发给 `PortalSpatializedContainer`。
- `PortalSpatializedContainer.tsx`：overlay 识别（强信号）→ 把 `ref` + Radix props + `children` 交给占位 host。
- `renderPlaceholderInSubPortal`：overlay 分支渲染 children（隐藏、自动尺寸）+ 落 ref/props。
- `PortalInstanceContext.ts`：overlay 的 raw-rect 坐标基准（attach 到父已由 spike 支持）。
- 仅为担忧 2 写**一个**聚焦单测（portal 路径下 asChild props/ref 落到占位 host + 非零）。

**Slice 之后再做**：spike hook 退役、`ResizeObserver` reposition 同步抽象、overlay 识别正/负样本完整单测、其余 AVP 项。

> Slice 不依赖 Path B、不动 native。键盘/focus 不在范围。

## 已决策（2026-06-09 对齐）

1. **路径**：MVP 走 **Path A**（鼠标/手势可用，键盘/focus 有 caveat），先把契约写法落地；后续推动 **Path B**（native 子区域抬升）平滑替换，开发者代码零改动。
2. **首版交互边界**：接受 **`modal={false}` + 键盘/focus 暂不保证**；首版以鼠标/手势驱动为准，文档/demo 明确标注 caveat。
3. **overlay 识别**：MVP 用 **强信号组合**（§6.1）——嵌套 spatial **且** 命中 floating library positioning signals。**不**用纯「定位祖先」（过宽，会误伤普通 absolute/fixed 嵌套 SpatialDiv —— 回应担忧 1）。DOM 祖先找不到 parent SpatialID 的判定作为后续 hardening，不作为当前 slice 已完成保证。
4. **键盘 / focus / typeahead / focus trap / outside-click：明确不在范围**（产品决策 2026-06-09）。只需点击/tap 选择由 Radix 处理；这些 Radix 交互语义本期不需要实现、不作验收项，也不为它们做任何额外工作。
5. **「逃出父 2D bounds」是 Scenario 3 的核心区分点**（spec 澄清）：Path A 经独立子 surface 天然满足。**注意**：此条对未来 Path B 是额外约束——native 子区域抬升必须能渲染超出父 webview 边界的区域，否则无法「逃出」。

> 以上已写入 §4/§6 与 `tasks.md`。Path B 作为后续 change，本 change 不阻塞于 native。

## 13. Phase C — `SpatialOverlay` 显式 API 与递归支持

### 13.1 为什么 Phase B MVP 不能递归

当前 `renderOverlayPlaceholder` 在 parent webview A 的 hidden host 里**直接双渲染真实 children**：

```text
Parent portal webview A          Child overlay webview B
  hidden measurement host          visible children
    children copy (full tree)  +   children (full tree)
```

对单层 flat `DropdownMenu.Item` 可行。但若 children 内含 `enable-xr` 或 nested overlay，measure tree 仍会走 `SpatializedContainer` → `PortalSpatializedContainer`，导致：

- 重复创建 native surface / webview
- 错误 `PortalInstanceContext` parent 链
- `init()` / `registerSpatialDom` / effects 双份执行

**递归 overlay 的关键不是 attach 或 rect 算法，而是 measurement tree 必须禁止 spatial side effects。**

### 13.2 核心抽象：`OverlayRenderModeContext`

```ts
type OverlayRenderMode = 'measure' | 'visible'
```

`SpatialOverlay` 渲染两条**语义不同**的 tree：

| | Measure tree | Visible tree |
| --- | --- | --- |
| 文档 | 当前 portal webview（parent spatial window） | child overlay webview |
| 职责 | Radix / floating-ui 接 `ref`、`props`、`style`、`data-*`；可测量尺寸 | 真实交互与 spatial behavior |
| `enable-xr` | 降级为普通 DOM layout element | 正常创建 nested SpatialDiv |
| `SpatialOverlay` | `MeasureHost` only；**不走 `SpatialOverlayRoot`**、不创建 surface | 走 `SpatialOverlayRoot`；创建 child surface，attach 到当前 visible parent |

### 13.3 行为规则

1. **`SpatialOverlay`（visible mode）**
   - 创建 child `PortalInstanceObject`
   - attach 到当前 portal parent surface（父 SpatialDiv 或**父 visible overlay surface**）
   - 用 measurement host 的 rect 驱动 native child surface rect
   - visible content 进入 child webview

2. **`SpatialOverlay`（measure mode）**
   - **不**创建 child surface，**不**走 `SpatialOverlayRoot`
   - 只渲染 `SpatialOverlayMeasureHost`（接 Radix `asChild` ref/props）
   - 子树内 nested `SpatialOverlay` 同样在 measure context 下只渲染 `MeasureHost`（可含 children 以测尺寸，但不创建 surface）

3. **`SpatialDiv` / `enable-xr`（measure mode）**
   - 降级为普通 DOM（`MeasureModeContainer`；`SpatialWindowContext` 规则见 §13.12）
   - 不调用 `createSpatializedElement`、不注册 spatial dom、不创建 `PortalInstanceObject`
   - 保留影响 layout 的 `children` / `style` / `className`

4. **Radix 集成**
   - Radix `asChild` 注入的 props **分流**到 measurement host 与 visible root（见 §13.10）；不是整包 props 只落 measurement host
   - visible menu item 的 pointer/tap 发生在 child overlay webview
   - 本期仍只承诺 pointer/tap selection

5. **递归 `SpatialOverlay`（必须支持）**
   - 外层 visible overlay 的 child webview 内再开 `SpatialOverlay`：
     - **visible tree**：nested overlay surface attach 到**外层 visible overlay surface**（不是 scene root，也不是被裁剪的 flat DOM）
     - **measure tree**：nested overlay 仅叠 measurement shell，不在 parent webview A 再开一层 surface
   - 递归深度无 SDK 硬编码上限；受 webview / native surface 资源约束

### 13.4 实现分层（概览）

```text
SpatialOverlay（公开）
  SpatialOverlayRoot → SpatializedContainer(overlayPortalMode)
    PortalSpatializedContainer
      SpatialOverlayMeasureHost   ← measure tree
      createPortal(visible host)  ← visible tree

OverlayRenderModeContext        ← 'measure' | 'visible'
MeasureModeContainer            ← gate WebSpatial only（§13.11 caveat）

PortalInstanceObject            ← reuse Phase B attach / raw rect / visibility
```

细节见 §13.8–§13.13。

### 13.5 API 演进

| 阶段 | 写法 | 识别 |
| --- | --- | --- |
| Phase B（当前） | `div enable-xr` + Radix `asChild` | `isFloatingOverlayContent(props)` |
| 过渡 | `div enable-xr data-webspatial-overlay` | 显式 attr + 可选 Radix signal |
| Phase C（目标） | `<SpatialOverlay>` | 组件 type；**递归保证的基础抽象** |

长期：**不依赖 Radix `data-side` / `data-align` 作递归 overlay 的基础。**

### 13.6 Phase C 验收顺序

1. Radix `DropdownMenu` + `SpatialOverlay`：浮出父面板、不被裁剪、pointer/tap 可点
2. `SpatialOverlay` 内嵌 `div enable-xr`：measure tree 零额外 surface；visible tree 正常 nested SpatialDiv
3. **`SpatialOverlay` 内再开 nested `SpatialOverlay`**：nested surface 挂 visible overlay 上、不被上一层 bounds 裁剪、pointer/tap 可点

### 13.7 风险

- measure / visible tree layout 可能不完全一致（尤其 children 依赖 spatial-only side effects 做 sizing）
- **双渲染会导致 measure tree 与 visible tree 各 mount 一份 children，普通 React effects（`useEffect`、subscription、请求、随机 id 等）会执行两次**；`OverlayRenderModeContext` 只能 gate **WebSpatial / native** side effects，不能消除用户组件副作用（见 §13.11）
- B→A 尺寸回灌可消除部分双渲染副作用，但带来首帧 0×0、异步 reposition、抖动 — **不作为 MVP**

### 13.8 入口链路（`SpatialOverlay` 如何进入 overlay pipeline）

> **评审修正**：「独立组件、不走 `enable-xr` jsx 改写」≠「普通 React 组件自动进入 `PortalSpatializedContainer`」。当前架构里 `PortalSpatializedContainer` **只**由 `SpatializedContainerBase` 在 portal-instance 路径上挂载；必须写清入口。

**采用方案：对外独立组件 + 对内薄包装 `SpatializedContainer`（私有 overlay 模式），用户不写 `enable-xr`。**

```text
用户: <DropdownMenu.Content asChild><SpatialOverlay>...</SpatialOverlay></DropdownMenu.Content>
                              │
                              ▼
SpatialOverlay（公开 forwardRef）
  ├─ OverlayRenderMode === 'measure'
  │     → SpatialOverlayMeasureHost（hidden；不接 portal pipeline）
  │
  └─ OverlayRenderMode === 'visible'（默认）且处于 overlay 编排根
        → SpatialOverlayRoot（内部专用，不 export）
              → SpatializedContainer
                    overlayPortalMode: true      // 私有 prop，等价于 enable-xr portal 分支
                    component={SpatialOverlayVisibleHost} // 私有 host，避免公开组件自递归
                    spatializedContent={SpatializedContent}
                    createSpatializedElement={...}
                              │
                              ▼
                    PortalSpatializedContainer（inPortalInstanceEnv）
                      isOverlayMode = overlayPortalMode || isFloatingOverlayContent(compat)
                      ├─ measure branch → MeasureHost in parent spatial-window doc
                      └─ visible branch → createPortal(SpatialOverlay visible host) → child webview
```

要点：

| 问题 | 结论 |
| --- | --- |
| 用户要不要写 `enable-xr`？ | **不要**；`SpatialOverlay` 自己调 `SpatializedContainer` |
| 走不走 jsx `replaceToSpatialPrimitiveType`？ | **不走**；不是 `div` + `enable-xr` 属性 |
| 谁创建 child surface？ | 仍是 `PortalSpatializedContainer` + `PortalInstanceObject`（与 Phase B 相同） |
| `props.component` 识别还有用吗？ | 有，但**不能**用公开 `SpatialOverlay` 作为 visible host；`overlayPortalMode` 是主信号，`isSpatialOverlayComponent` 仅作内部/兼容保护 |

**防自递归规则**：`SpatialOverlay` 公开组件只负责入口编排；`PortalSpatializedContainer` createPortal 出来的 host 必须是私有 `SpatialOverlayVisibleHost`（或 compat 用的普通 `div`），不得再次执行 `SpatialOverlayRoot -> SpatializedContainer(overlayPortalMode)`。否则 visible branch 会在 child webview 内对**同一层** overlay 重复开 surface。

**公开 `SpatialOverlay` 入口判定（实现伪代码）**：

```tsx
function SpatialOverlay(props, ref) {
  const mode = useContext(OverlayRenderModeContext)

  if (mode === 'measure') {
    // measure copy：永不创建 surface / 永不 Root
    return <SpatialOverlayMeasureHost ref={ref} {...props} />
  }

  // visible mode：用户写的 <SpatialOverlay>（含 visible webview 内嵌套 submenu）走 Root
  return <SpatialOverlayRoot ref={ref} {...props} />
}

// 私有组件；仅由 PortalSpatializedContainer createPortal 使用
function SpatialOverlayVisibleHost(props, ref) {
  return <div ref={ref} {...visibleProps} /> // 永不 Root
}
```

| 组件 | `measure` | `visible` |
| --- | --- | --- |
| 公开 `SpatialOverlay`（用户 JSX） | `MeasureHost` | `SpatialOverlayRoot` |
| 私有 `SpatialOverlayVisibleHost`（SDK createPortal） | N/A | 纯 host，**不** Root |
| visible webview 内用户嵌套 `<SpatialOverlay>` | N/A | `SpatialOverlayRoot`（创建下一层 overlay surface） |

**compat 路径不变**：用户继续写 `div enable-xr` + Radix signal → jsx 改写 → `SpatializedContainer` → `PortalSpatializedContainer` + `isFloatingOverlayContent`。

### 13.9 实现模块

```text
spatialized-container/
  SpatialOverlay.tsx              # 公开 API + MeasureHost + 内部 SpatialOverlayRoot
  SpatialOverlayVisibleHost.tsx   # 私有 visible host；不触发 overlay pipeline
  MeasureModeContainer.tsx
  context/OverlayRenderModeContext.ts
  PortalSpatializedContainer.tsx  # 双树编排；读 overlayPortalMode / __spatialOverlay
  overlayDetection.ts             # Phase B compat only
```

### 13.10 Radix props / ref 分流

`splitOverlayProps` 扩展为显式分流（实现时可按 Radix / floating-ui 版本微调）：

| 落到 **measurement host** | 落到 **visible root**（child webview） |
| --- | --- |
| `ref`（Radix 定位测量） | `className`（可见样式） |
| positioning `style`（`transform`、`position`、`top/right/bottom/left`、Radix 写入的尺寸变量） | 交互 handlers（`onPointerDown`、`onClick`、`onKeyDown` 等） |
| `data-side`、`data-align`、`data-radix-*`（placement） | `aria-*`、`role`、`id`、`data-state`（可见 a11y / 状态） |
| `--radix-*` / `--floating-*` style 变量 | `children`（唯一一份「真实」交互子树） |

规则：

- **measurement host**：`visibility: hidden`、`pointerEvents: none`；承接 Radix 几何测量。
- **visible root**：`visibility: visible`、正常 `pointer-events`；承接用户可见交互与 a11y 属性。
- 若 Radix 某 prop 同时影响测量与交互（少数版本差异），**两份都同步**（allowlist 扩展），以 AVP pointer/tap 为准。

`style` 必须进一步分桶，不能整包只给 measurement host：

| style 类别 | measurement host | visible root | 说明 |
| --- | --- | --- | --- |
| Radix/floating 定位样式：`position`、`transform`、`top/right/bottom/left`、placement CSS vars | ✅ | ❌ 默认不传 | Radix 在 parent spatial-window 内定位；visible webview 内不应再套同一 fixed/transform |
| WebSpatial vars：`--xr-back`、`--xr-depth`、`--xr-background-material`、`--xr-z-index` | ✅ | ✅ | native properties 从 measurement host 读；visible root 也保留变量供子树样式使用 |
| 影响 intrinsic size 的用户样式：`width/height/min/max-*`、`padding`、`border`、`font*` 等 | ✅ | ✅ | measurement 与 visible 尺寸要尽量一致 |
| 纯视觉样式：`background`、`color`、`borderRadius`、`boxShadow` 等 | 可选 ✅ | ✅ | visible 必须保留；measurement 可保留以减少尺寸差异 |

实现建议：拆成 `measurementStyle` / `visibleStyle`，不要在 visible root 上保留 Radix 的 fixed positioning transform；不要在 measurement host 上丢失 `--xr-*`，否则 native `back/depth/zIndex/material` 会读不到。

**inherit 链也要 strip**：`Spatialized2DElementContainer` 的 `getPortalInheritedStyleProps(..., { isFloatingOverlay: true })` 目前只删 `position`/`display`，还会继承 `transform`、`top/left/right/bottom`。Phase C 须扩展 overlay 分支：删除全部 Radix positioning 字段，或 visible host 改走 `visibleStyle` 白名单、不依赖 inherit 定位样式。

本期验收仍只覆盖 pointer/tap；keyboard/focus 不在范围，但 visible root 应保留 handlers 以便后续补测。

### 13.11 Measure tree、React effects 与 escape hatch

**已决策 D3（修订表述）**：measure tree **默认渲染完整 `children`**，以便 Radix 测到真实布局尺寸。

**必须写清的 caveat**：

- measure tree 与 visible tree 是 **两次 React mount** → 用户组件的 `useEffect`、fetch、subscription、随机 key 等 **会执行两次**。
- `OverlayRenderModeContext === 'measure'` **仅保证**：不 `createSpatializedElement`、不 `PortalInstanceObject.init/destroy`、不 `registerSpatialDom`、nested `enable-xr` 走 `MeasureModeContainer`。

**可选 escape hatch（Phase C API）**：

```tsx
<SpatialOverlay measureChildren={<MenuItemsSkeleton />}>
  {fullMenuTree}
</SpatialOverlay>
```

- `measureChildren` 提供时，measure tree 只渲染该轻量子树；visible tree 仍渲染完整 `children`。
- 用于：子树含重副作用、嵌套 Radix Portal、或 open 时才挂载的 submenu——避免 hidden copy 触发多余 Portal / effect。
- **尺寸 caveat**：`measureChildren` skeleton 通常只保证**关闭态** outer 尺寸；submenu 打开后若内容大于 skeleton，Radix 可能需额外 reposition（可接受，demo 文案注明）。

文档与 demo **必须**标注双渲染 effect caveat；不把「只 gate WebSpatial」说成「无副作用」。

### 13.12 `SpatialWindowContext` 在 measure subtree 的规则

> **评审修正**：「MeasureModeContainer 不提供 `SpatialWindowContext`」有歧义——子节点仍可能**继承**外层 provider。

| 上下文 | 规则 |
| --- | --- |
| `DegradedContainer`（无 session） | **注入 host page `window`**，plain browser 用 |
| **measure subtree**（`SpatialOverlayMeasureHost` 内） | **阻断继承**：`SpatialWindowContext.Provider value={null}`（或专用 sentinel；若用 sentinel 需更新 context 类型），使 `useSpatialPortalContainer()` 返回 `undefined` |
| **visible subtree**（child webview `createPortal` 内） | **正常提供** overlay webview 的 `windowProxy`（现有 `SpatializedContent` 行为） |

理由：

- measure copy 不应把 Radix `Portal` 挂到**活的** spatial window（会在 hidden tree 里重复 portal、污染测量）。
- `undefined` 时 Radix 若 fallback 到 host `document.body` 仍可能错——故 **`measureChildren` escape hatch** + 文档要求：**嵌套 overlay 的 Radix Portal 只写在 visible tree 会走的子树里**（配合 D1）。
- measure subtree **不**注入 host-page fallback（与 `DegradedContainer` 不同）。

实现注意：当前 `SpatialWindowContext` 类型是 `WindowProxy | null`，`useSpatialPortalContainer()` 对 `null` 已返回 `undefined`。优先使用 `value={null}` 阻断继承；只有确实需要区分“无 provider”和“被 measure 阻断”时，才引入 sentinel 并同步更新类型与测试。

### 13.13 `PortalSpatializedContainer` 编排（续）

```ts
const isOverlayMode =
  !!parentPortalInstanceObject &&
  (props.overlayPortalMode === true || // Phase C 主信号
    isFloatingOverlayContent(restProps)) // Phase B compat
// isSpatialOverlayComponent(props.component) 不作为 Phase C 触发条件：
// visible host 是 SpatialOverlayVisibleHost，不是公开 SpatialOverlay。
```

Measure 分支：`OverlayRenderModeContext='measure'` + `SpatialWindowContext` 阻断 + `SpatialOverlayMeasureHost`。

Visible 分支：`OverlayRenderModeContext='visible'` + 现有 `createPortal` 路径 + visible props 分流 + 私有 `SpatialOverlayVisibleHost`。

`PortalInstanceObject` attach / raw rect / visibility：**复用 Phase B**。

#### 递归坐标与 Radix Portal（已决策 D1）

嵌套 `SpatialOverlay` 时，内层 Radix `Portal container` **必须** portal 到**直接父级 visible overlay 的 spatial window**（`useSpatialPortalContainer()` → 外层 overlay child webview 的 `document.body`），**不得** portal 到根 Parent SpatialDiv 的 webview。

```text
Parent SpatialDiv (webview A)
  Outer SpatialOverlay
    measure host → A
    visible      → webview B (attach A)
      Inner Radix Portal container={useSpatialPortalContainer()}  → B.body
        Inner SpatialOverlay
          measure host → B
          visible      → webview C (attach B)
```

这样 inner measure host 与 inner attach parent 在同一 spatial-window 文档，**复用 Phase B raw-rect 逻辑**，无需 cross-webview 坐标变换。

**Stretch（后续）**：薄封装 `SpatialDropdownMenu.Portal` 自动注入正确 container，减少漏配。

#### attach 链

`addToParent` 现有逻辑已满足递归：`isFloatingOverlay` 时挂 `parentPortalInstanceObject.getSpatializedElement()`。内层 overlay 的 parent 自然是外层 visible overlay 的 `PortalInstanceObject`（`PortalInstanceContext` 传递）。

> **一句话**：递归 overlay 的核心不是 `addToParent`，而是 **measure tree 只允许产生 layout，不允许产生 spatial/native side effects**；同时 **不能假装没有普通 React side effects**。

#### nested Radix Portal 与 `measureChildren`

含 nested Radix `Portal` 的 demo / 文档必须满足下面之一：

1. 使用 `measureChildren`，让 measure tree 渲染轻量 skeleton，不渲染会打开 nested `Portal` 的真实子树。
2. 或由用户组件读取 `OverlayRenderModeContext`，在 `measure` 模式下不挂载 nested Radix `Portal`。

不能只依赖 `SpatialWindowContext` 阻断：Radix 在 `container={undefined}` 时可能 fallback 到 host `document.body`，仍会污染 hidden measurement tree。`SpatialWindowContext` 阻断只是防止继承活的 spatial window，不是 nested Portal 的完整隔离方案。

### 13.14 Phase C 已决策（2026-06-10，含评审修订）

| # | 决策 | 选项 |
| --- | --- | --- |
| D1 | 嵌套 Radix Portal 目标 | **父 visible overlay webview**（`useSpatialPortalContainer()`）；stretch 再做自动注入薄封装 |
| D2 | `SpatialOverlay` 入口 | **公开独立组件** + 内部 `SpatialOverlayRoot` 调 `SpatializedContainer(overlayPortalMode)`；用户不写 `enable-xr`，不走 jsx 改写 |
| D3 | measure tree children | **默认完整 children**；可选 `measureChildren` escape hatch；仅 gate WebSpatial side effects |
| D4 | Phase C 启动时机 | **Phase B AVP smoke（§5.9）通过后**再开 Phase C PR |
| D5 | 公开命名 | **`SpatialOverlay`** |
| D6 | measure subtree `SpatialWindowContext` | **阻断继承**（优先 `null`，或专用 sentinel），不注入 host-page fallback |
| D7 | Radix props / style | **分流**到 measurement host 与 visible root；`--xr-*` 双写，visible host 不保留 Radix fixed transform（§13.10） |
| D8 | visible host | **私有 `SpatialOverlayVisibleHost`**，不得用公开 `SpatialOverlay` 自身，避免 visible branch 自递归 |

实施顺序：

1. **C1** — `OverlayRenderModeContext` + `MeasureModeContainer` + measure subtree `SpatialWindowContext` 阻断 + gate（可改善 compat 路径）
2. **C2** — `SpatialOverlay` / `SpatialOverlayRoot` / 私有 `SpatialOverlayVisibleHost` + `splitOverlayProps`/`splitOverlayStyle` 分流 + `PortalSpatializedContainer` 双树
3. **C3** — demo 迁移 + 递归 submenu + effect caveat 文档 + 必含 `measureChildren` 或 measure-mode 条件渲染示例
4. **C4** — AVP 验收 §8.9a/b/c
