
# 抬升 2D 元素

基础概念：
- [空间化元素和 3D 容器元素](../../core-concepts/spatialized-elements-and-3d-container-elements.md)

---

> 由于 [WebSpatial SDK]() 暂时只提供了 React SDK，所以本文档都以 React 代码为例。
>
> 本节中涉及的 API：
> - `position: absolute`、`position: fixed`、`position: relative`
>   - `--xr-back`
> - `transform`
>   - `translateZ()`、`translate3d()`
>   - `rotateX()`、`rotateY()`、`rotate3d()`
>   - `scaleZ()`、`scale3d()`
> - `enable-xr-monitor`

[启用了空间化]()的 HTML 元素， 在[窗口场景]()中仍然默认位于网页平面上，也位于原来的 HTML/CSS 布局流中，基于[原有的 CSS 属性和布局关系]()得到的 X、Y 轴上的位置、尺寸都保持不变。

在此基础上，空间化 HTML 元素可以通过 [WebSpatial API]() 在网页平面前面的 Z 轴方向上做移动、变形和布局，让自己能被「抬升」到网页平面前面的 3D 空间中，让网页内容作为整体变得有「深度」。

有多种 API 可以实现这种「抬升」，可以根据它们对布局流的影响分成三类：

## 脱离布局流的 API

这一类 API 会让 HTML 元素完全脱离普通布局流，不再占据原来的位置。

### `position: absolute`

在绝对定位的情况下，元素直接相对于父级中距离自己最近的 [containing block]() （有 `position` 属性且值不为 `static`，或有 `transform` 属性，就是 containing block 元素。如果没有这种父元素，会相对于整个窗口）来定位。

![image]()
![image]()

在这种模式下，现有 CSS 标准中有四种属性可以让元素在 X 轴和 Y 轴的 4 个方向上「移动」（定位）：

- `top`：沿着 Y 轴向下「移动」（定位）
- `bottom`：沿着 Y 轴向上「移动」（定位）
- `left`：沿着 X 轴向右「移动」（定位）
- `right`：沿着 X 轴向左「移动」（定位）

![image]()

WebSpatial API 在上述现有 Web 标准 API 的基础上，增加了一个新的 CSS 属性，让空间化元素可以在 Z 轴上「移动」（定位）：

- `--xr-back`：沿着 Z 轴向前「移动」（定位）

这个属性的值目前只能是**无单位的整数**，对应原生的物理空间单位距离（pt，1360pt 相当于 1 米）。

在 WebSpatial SDK 当前的实现里，这个属性会相对于父级中**距离最近的其他空间化元素**来定位，如果没有这样的父元素，会相对于**原始网页平面**来定位。
可以这样理解：
- 如果一个空间化元素，内部嵌套了另一个绝对定位的空间化元素（不管它们之间相隔几层，只要没有其他空间化元素就行），那么子元素的 Z 轴初始位置就位于**这个父元素所在的平面**上，这个平面相当于一个「背面」，`--xr-back` 就是从这个背面出发，沿着垂直于这个背面的 Z 轴向前方移动。
- 如果一个绝对定位的空间化元素，父层级中没有其他空间化元素，那么它的 Z 轴初始位置就位于**整个[窗口场景]()的网页平面**上，把这个平面作为 `--xr-back` 的「背面」。

> 在未来潜在的 Web 标准中，`back` 属性也应该跟 `top`/`bottom`/`left`/`right`一样，相对于父层级中距离自己最近的 [containing block]() 所在的平面来定位。
> 为了让现有的 WebSpatial 项目代码具备向前兼容性，最佳实践是：如果一个空间化元素的子元素中，有其他绝对定位的空间化元素，且希望用这个父元素作为子元素绝对定位的 Z 轴初始位置，那么至少要给父元素加上 `position: relative`（如果这个父元素本身不是绝对定位/固定定位），让这个父元素成为 containing block。

基于[「快速开始」示例]()的例子：

```diff {highlight=12-16}
html.is-spatial {
  background-color: transparent;
- --xr-background-material: transparent;
+ --xr-background-material: translucent;

  .count-card {
    --xr-background-material: thick;
    position: relative;

    p {
      --xr-background-material: transparent;
      position: absolute;
      bottom: -10px;
      left: 0;
      right: 0;
      --xr-back: 20;
    }
  }
```

可以看到这个 `<p>` 元素中的文字，在 Y 轴方向上是相对于父元素 `.count-card` 的底部来定位的，因为这个父元素是相对定位的 containing block。
同时在 Z 轴方向上，`<p>` 元素的 `--xr-back` 是相对于父元素 .count-card 所在的平面来定位的，因为这个父元素既是半透明材质背景的空间化元素，也是相对定位的 containing block。

![image]()

### `position: fixed`

在固定定位的情况下，元素直接相对于 [initial containing block]()（相当于整个[窗口场景]()的平面）来定位，不会跟随网页滚动。

跟绝对定位一样，空间化元素同样既可以用现有 CSS 标准中的四种属性[在 X 轴和 Y 轴的 4 个方向上「移动」（定位）]()，也可以用 WebSpatial API 新增的 [`--xr-back` 属性]()，沿着垂直于网页平面的 Z 轴向前方移动。
注意在这种情况下，`--xr-back` 的 Z 轴初始位置**始终位于整个[窗口场景]()的网页平面上**，把这个平面作为「背面」，沿着垂直于这个背面的 Z 轴向前方移动。

[Techshop demo]() 中的示例：

```css {highlight=5-14}
  .navbar {
    @apply mx-auto;
    --xr-background-material: translucent;
    width: 1000px;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    --xr-back: 50;
    border-radius: 50px;
  }

  .list-meun {
    position: fixed;
    top: 200px;
    left: 0;
```

顶栏和侧栏都是固定定位，商品列表保持在网页平面上的布局流中。
因此如果用拖拽条把整个窗口场景的高度调小，商品列表中超出窗口场景的部分会被裁切，网页滚动时，商品列表会跟着滚动，而顶栏和侧栏的位置则保持不变。

![image]()

点击商品卡片中的「View Details」，打开商品详情（新的窗口场景），可以看到另一个例子：

```css {highlight=5-9}
  .product-detail-info {
    --xr-background-material: translucent;
    border-radius: 50px;
    padding: 50px;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    --xr-back: 20;
    margin: auto;
    width: 400px;
}
```

网页滚动时，左侧的商品图片会跟着滚动，而右侧的商品信息栏则固定不动。

![image]()

## 不影响布局流的 API

这一类 API 不会影响原有的布局流，HTML 元素仍然在布局流中占据原来的位置和空间，自身的尺寸也受布局流的影响。

### 只改变位置——`position: relative`

在相对定位的情况下，元素可以相对于自己原来的位置，用现有 CSS 标准中的四种属性[在 X 轴和 Y 轴的 4 个方向上「移动」（定位）]()。

![image]()

也可以用 WebSpatial API 新增的 [`--xr-back` 属性]()，沿着 Z 轴向前方移动。
注意在这种情况下，`--xr-back` 的 Z 轴初始位置始终位于**元素自身原本所在的平面**上，把这个平面作为「背面」，沿着垂直于这个背面的 Z 轴向前方移动。

基于[「快速开始」示例]()的例子：

```diff {highlight=10-11}
html.is-spatial {
  background-color: transparent;
- --xr-background-material: transparent;
+ --xr-background-material: translucent;

  .link-card {
-   --xr-background-material: translucent;
+   --xr-background-material: thin;
    border-radius: 20px;
    position: relative;
    --xr-back: 50;
    top: 20px;
-   transform-origin: top left;
-   transform: translateZ(30px) rotateX(30deg);
```

可以看到 `.link-card` 元素在原有布局流中位于 `.count-card` 的下方。
在相对定位模式下，用 `--xr-back` 相对于网页平面沿着 Z 轴向前方移动了 50 单位，同时在 X/Y 轴方向上保持原有位置不变。

![image]()

基于[「快速开始」示例]()的例子：

```css
  .count-card {
    --xr-background-material: thick;
    position: relative;
    --xr-back: 50;

    p {
      --xr-background-material: transparent;
      position: absolute;
      bottom: -10px;
      left: 0;
      right: 0;
      --xr-back: 20;
    }
  }
```

`.count-card` 元素在相对定位模式下，用 `--xr-back` 相对于网页平面沿着 Z 轴向前方移动了 50 单位，同时在 X/Y 轴方向上保持原有位置不变。
`.count-card` 元素内的 `<p>` 元素在绝对定位模式下，用 `--xr-back` 相对于`.count-card` 元素所在的平面，沿着 Z 轴向前方移动了 20 单位。

![image]()

### 改变位置和形状——CSS Transform

CSS Transform 完全不影响 HTML 元素原本的位置、尺寸和布局关系，只是通过矩阵转换让元素最终渲染出来的图像发生位移和变形。

现有 Web 标准中，CSS Transform 已经可以围绕 X、Y、Z 三个轴做位移和变形，可以有「深度」，但这些深度效果都会被投影和渲染到平面网页上，最终效果不具备真正的深度。

![image]()
![image]()

WebSpatial SDK 直接沿用了现有的 CSS Transform API。
非空间化 HTML 元素通过 CSS Transform 在 Z 轴方向上产生的位移和变形，仍然会投影到平面上。
空间化 HTML 元素通过 CSS Transform 在 Z 轴方向上产生的位移和变形，会真正进入到空间中。

X、Y、Z 轴的原点**始终位于元素自身原本所在的平面**上，可以用 `transform-origin` 控制原点在 X 轴和 Y 轴方向上的具体位置，但无法改变原点在 Z 轴方向上的位置（不能离开这个平面）。

空间化元素可以把这个平面作为「背面」，让自身的图像通过 CSS Transform 进入这个背面前方的空间中。

![image]()

`transform: perspective()` 在空间化元素中也会失效，因为不再需要用这个 API 来定义投影方式。

空间化元素支持 CSS Transform 的三种会在 Z 轴上产生效果的转换 API：

- `translateZ()`、`translate3d()`：位移。类似 `--xr-back`，直接从原点所在平面出发，沿着垂直于这个「背面」的 Z 轴向前方移动。注意 `translateZ()` 的单位仍然跟以前一样。
- `rotateX()`、`rotateY()`、`rotate3d()`：旋转。无论围绕 X 轴旋转还是围绕 Y 轴旋转，都会让元素的图像进入原点所在平面前方的空间中
- `scaleZ()`、`scale3d()`：缩放。可以在 Z 轴方向上缩放
> [!WARNING]
> 不支持 `skew`

基于[「快速开始」示例]()的例子：

```diff  {highlight=10-14}
html.is-spatial {
  background-color: transparent;
- --xr-background-material: transparent;
+ --xr-background-material: translucent;

  .link-card {
-   --xr-background-material: translucent;
    --xr-background-material: thin;
    border-radius: 20px;
    position: relative;
    --xr-back: 50;
    top: 20px;
    transform-origin: top left;
    transform: translateZ(30px) rotateX(30deg);
```

`.link-card` 元素是相对定位的，首先相对于自身原本位于的平面，沿着垂直于这个背面的 Z 轴向前方移动了 50 个单位。

然后基于这个位置和形状，按照 Transform 属性做转换，沿着 Z 轴向前方又移动了 30px（px 会被自动转换为物理空间中的 pt 单位），然后以自身的顶部边缘为轴，向外旋转 30 度。

![image]()

[Techshop demo]() 中的示例：

```css
  .list-meun {
    position: fixed;
    top: 200px;
    left: 0;
    transform-origin: top left;
    transform: translateZ(320px) rotateY(80deg);
  }
```

侧栏菜单首先按照固定定位，被放置在应用的最左侧。
然后基于这个位置和形状，按照 Transform 属性做转换，沿着 Z 轴向前方移动了 320px（px 会被自动转换为物理空间中的 pt 单位），然后以自身的左边缘为轴，向内旋转 80 度。

![image]()

## 基于布局流的 API

这一类 API 把父元素中的布局流改成沿着 Z 轴方向从后往前，可以通过布局关系决定多个子元素在空间中的 Z 轴位置。

在 WebSpatial SDK 当前的实现里，暂时还不支持这类 API。

## 布局流的动态变化

本文开头介绍了，HTML 元素[启用了空间化]()之后仍然位于原来的 HTML/CSS 布局流中，基于[原有的 CSS 属性和布局关系]()得到的 X、Y 轴上的位置、尺寸都保持不变。

React 组件的更新可能会导致 CSS 属性和布局关系发生动态变化，改变空间化 HTML 元素在 X/Y 轴上的位置和尺寸，无论元素有没有被「抬升」到空间中。

[WebSpatial SDK]() 能自动监测到空间化元素自身 CSS 样式的改变。

但如果是父层级的布局变化导致空间化元素在 X/Y 轴上的位置和尺寸被改变，WebSpatial SDK 暂时不会自动检测到（出于对性能等因素的考虑）。

因此 WebSpatial SDK 提供了一种临时的特殊标记（`enable-xr-monitor`），让开发者主动给父层级上的元素添加自动检测。

在这种情况下，如果父元素本身的样式发生变化，或父元素内部的布局结构发生变化，WebSpatial SDK 都会自动更新内部空间化元素在 X/Y 轴上的位置和尺寸。

示例：

```diff
function CardList() {
  const [showFirstCard, setShowFirstCard] = useState(true);

  const onClick = () => {
    setShowFirstCard(prevState => !prevState);
  };

  return (
    <div
+     enable-xr-monitor
    >
      {showFirstCard && <div>first card</div>}
      <div
+       enable-xr
      >second card</div>
      <button onClick={onClick}>toggle</button>
    </div>
  );
}
```

「first card」如果消失，作为空间化元素的「second card」在 Y 轴方向上的位置会自动上移。

---

下一节：[管理多个场景](manage-multiple-scenes.md)
