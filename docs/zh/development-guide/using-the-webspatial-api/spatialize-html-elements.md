
# 把 HTML 元素空间化

基础概念：[空间化元素和 3D 容器元素](../../core-concepts/spatialized-elements-and-3d-container-elements.md)

---

> 由于 [WebSpatial SDK]() 暂时只提供了 React SDK，所以本文档都以 React 代码为例。
>
> 本节中涉及的 API：
> - `enable-xr`、`__enableXr__`、`enableXr`
> - `cursor: pointer`

## 启用空间化

基于目前的 WebSpatial SDK，需要用一种临时的特殊标记让 HTML 元素启用空间化，然后才能使用[其他空间化 API]()。

> 未来正式的 W3C 标准中，HTML 元素应该不需要刻意启用空间化，就能使用空间化 API——只要使用了空间化 API，就是[空间化 HTML 元素]()，而不是反过来，先成为空间化 HTML 元素，才能使用空间化 API。
> 但现阶段出于性能等方面的考虑，暂时需要加上这个特殊标记。

这种特殊标记有三种写法：

1. 把特殊标记 `enable-xr` 作为 HTML 属性添加到元素上：

```jsx
<div className="card" enable-xr>
```

2. 在元素的 className 中添加特殊标记 `__enableXr__`：

```jsx
<div className="card __enableXr__">
```

3. 在元素的 inline style 中添加特殊标记 `enableXr: true`：

```jsx
<div className="card" style={{ enableXr: true, marginTop: '10px' }}>
```

同时支持三种写法，是为了兼容 Web 生态中的各种第三方组件库：

组件库为了满足样式定制需求，多数都会允许使用者自定义组件内部 HTML 元素上的属性、`className` 或 `style`。只要有这些接口中的任意一种，就能传入特殊标记，让组件库内部的 HTML 元素被空间化。

示例 1：

```jsx
// third-party component
const Button = ({ children, className, style, ...rest }) => {
  return (
    <button
      className={`default-button ${className || ''}`}
      style={{ backgroundColor: 'blue', color: 'white', ...style }}
      {...rest}
    >
      {children}
    </button>
  );
};

// usage
<Button
  className="custom-btn __enableXr__"
  style={{ fontSize: '14px', enableXr: true }}
  data-testid="submit-btn"
  enable-xr
>
  Submit
</Button>
```

示例 2：

```jsx
// third-party component
const Card = ({
  children,
  headerClassName,
  headerStyle,
  headerProps,
}) => {
  return (
    <div className="card">
      <div
        className={`card-header ${headerClassName || ''}`}
        style={headerStyle}
        {...headerProps}
      >
        Card Title
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
};

// usage
<Card
  headerClassName="custom-header  __enableXr__"
  headerStyle={{ backgroundColor: 'gray', enableXr: true }}
  headerProps={{ 'aria-label': 'Card Title', 'enable-xr': true }}
>
  Card Content
</Card>
```

启用空间化之后，HTML 元素除了保留原有的 API 和能力，还能使用 WebSpatial SDK 实现的[空间化 API]()，下文提到的 CSS API 和 DOM API。

## 跨平台

空间化 HTML 元素只有在 [WebSpatial App Shell]() 里才会启用空间化能力。

在原有的桌面/移动平台或普通浏览器里运行的时候，[构建产物中都不会包含 WebSpatial SDK 的实现]()，WebSpatial API 不会生效，会自动被过滤。这些 HTML 元素也不会增加额外的抽象和封装，仍然是 React DOM 中原始的 HTML 元素。

因此在给 HTML 元素启用空间化的时候是**不用写 if-else** 的，这个 API 是默认支持跨平台的。

## CSS 能力

在空间化的 HTML 元素上使用 WebSpatial API，可以借助各种现有的 CSS 写法，包括：

1. 全局内部 CSS

```diff
import React from 'react';

function App() {
  return (
    <div>
      <style>{`
        h1 {
+         --xr-background-material: translucent;
        }
      `}</style>
      <h1
+       enable-xr
      >Hello World</h1>
```

2. 全局外链 CSS

```diff
import React from 'react';
import './styles.css';

function App() {
  return (
    <div>
      <h1
+       enable-xr
      >Hello World</h1>
```
```diff
h1 {
+ --xr-background-material: translucent;
}
```

3. 内联 CSS

```diff
import React from 'react';

function App() {
  return (
    <div>
      <h1
        style={{
+         '--xr-background-material': 'translucent'
        }}
+       enable-xr
      >Hello World</h1>
```

支持基于动态修改全局样式的 CSS In JS 方案，比如 styled-components。

```diff
const StyledTitle = styled.h1`
+ --xr-background-material: translucent;
`
function App() {
  return (
    <div>
      <StyledTitle
+       enable-xr
      >Hello World</h1>
```

也支持 CSSModule、PostCSS 和其他基于预编译的 CSS 方案。

## DOM 能力

如果绕过 React 的 API 和渲染机制，直接用 querySelector 这样的 API 找到空间化 HTML 元素对应的 DOM 对象，用 DOM API 对它做修改，[WebSpatial API 会无法正常工作]()。

正确的方式是用 React 自身的 Ref API 获取空间化 HTML 元素的 DOM 对象。比如：

```diff
import React from 'react';

function App() {
  const ref = useRef(null)
  return (
    <div>
      <h1
+       ref={ref}
        className="title"
        style={{
          position: 'relative',
          '--xr-back': '100'
        }}
+       enable-xr
      >Hello World</h1>
```

接下来可以通过 `ref.current.style` 对 `--xr-back` 做读写，也可以用 `ref.current.style.removeProperty` 删除 `--xr-back`。

可以用 `ref.current.className` 对 `className` 做增删查改。

如果元素上原有的 `style` 或 `className` 中包含 WebSpatial API，以上两种基于 DOM API 的操作，都会带来空间化效果的改变。

## 动画能力

WebSpatial SDK 暂时还不支持在 CSS 动画中使用 WebSpatial API，可以用 JS 技术来实现动画效果，比如利用前文提到的 Ref API 和 DOM API，逐帧修改样式中的 WebSpatial 属性。

支持主流的 JS 动画库，目前测试过的第三方库包括：
- Popmotion
- React Spring
- GSAP
- Tween.js
- Anime.js

## 内部交互能力

无论一个 HTML 元素本身是否空间化，它内部子元素的交互，在 visionOS 这样的空间计算平台上，都是基于「[自然交互]()」的。

自然交互的具体行为大部分跟触屏交互保持一致，区别是：在[「间接交互」（眼手交互）]()的情况下，需要额外符合「可交互区域（Interaction Region）」的规则，才能获得「Hover Effect」。

### Hover Effect

在[「选择（导航）」阶段]()，无论[间接交互还是直接交互]()，都跟触屏交互一样，**不会在 HTML 元素上触发 JS 事件、不会触发 CSS 状态变化（比如不会有 Hover 状态）**。

因此 Web 代码无法实现任何交互提示效果。本质上，网页这时根本不知道用户在做什么选择。

> 出于隐私考虑，只有操作系统知道用户的眼睛在注视哪个 HTML 元素、手指在靠近哪个 HTML 元素，网页本身是不知情的。

但是在这个过程中，操作系统（包含浏览器引擎在内）会负责提供**原生的交互提示**：
- 在直接交互中，用户手指的移动就是一种交互提示。
- 在间接交互中，操作系统会在被眼睛注视的 HTML 元素上显示「**Hover Effect**」——这种效果不同于 CSS 中的 Hover 状态，不是 web 自身实现的效果，而是操作系统渲染的原生效果（比如一圈悬浮在 HTML 元素前方的高亮边框）。

只有被视为「**可交互区域（Interaction Region）**」的 HTML 元素，才能被「选择」，才会自动显示「Hover Effect」。

需要满足以下条件之一才能成为可交互区域：
- HTML 中的按钮、链接、菜单元素，以及具备与这些功能等价的 ARIA Role 的元素，都会被自动视为可交互区域
- 输入框和表单元素，会被自动视为可交互区域
- **除此之外，如果想把任意 HTML 元素自定义为可交互区域，只要给这个元素加上 CSS 的 `cursor: pointer` 属性就行**

![image]()

### JS 事件

在「[确认（触发）]()」之后，无论间接交互还是直接交互，都会触发跟触屏交互一样的 JS 事件：

![image]()
![image]()

以间接交互为例，「确认」的完整过程会按顺序触发以下 JS 事件：

1. 捏合瞬间，同时触发「接触」事件（`pointerover`）、「进入」事件（`pointerenter`）、「按下」事件（`pointerdown`）事件。因为只有在手指捏合的瞬间，应用才能获取到这些信息，才能知道眼睛在注视哪里
2. 「触摸开始」事件（`touchstart`，模拟触屏）
3. 如果手指捏合后未松开，手指移动会持续触发以下事件：
   1. 「移动」事件（`pointermove`，手指移动对应了初始交互位置的移动）
   2. 「触摸移动」事件（`touchmove`，模拟触屏）
4. 手指松开的瞬间，同时触发「脱离」事件（`pointerout`）、「离开」事件（`pointerleave`）、「松开」事件（`pointerup`）
5. 「触摸结束」事件（`touchend`，模拟触屏）
6. 为了保持跟桌面网站代码的兼容性，会模拟触发一系列鼠标事件，包括「接触」事件（`mouseover`）、「进入」事件（`mouseenter`）、「移动」事件（`mousemove`）、「按下」事件（`mousedown`）、「松开」事件（`mouseup`）。还会模拟触发 CSS 的 `:hover` 状态（要在跟其他元素交互时才会被解除）
7. 「点击」事件（`click`，最终实际确认的点击行为）

可以基于这些底层基础事件，用 JS 实现拖拽等高级交互手势。

示例：
![image]()

## 自身交互能力

> 待补充

---

下一节：[添加材质背景](add-material-backgrounds.md)
