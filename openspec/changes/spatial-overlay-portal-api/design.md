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
