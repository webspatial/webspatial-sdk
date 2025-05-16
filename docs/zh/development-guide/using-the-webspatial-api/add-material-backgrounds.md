
# 添加材质背景

基础概念：
- [场景和空间布局](../../core-concepts/scenes-and-spatial-layouts.md)
- [空间化元素和 3D 容器元素](../../core-concepts/spatialized-elements-and-3d-container-elements.md)

---

> 由于 [WebSpatial SDK]() 暂时只提供了 React SDK，所以本文档都以 React 代码为例。
>
> 本节中涉及的 API：
> - `--xr-background-material`
> - `border-radius`、`display`、`visibility`、`opacity`
> - `--xr-z-index`

在 [WebSpatial SDK]() 的支持下，应用的每个[场景]()中，有两类主体可以基于应用周围的空间环境，动态渲染自己的背景。

## 半透明或全透明的窗口场景

第一类是整个[窗口场景]()和网页本身，可以通过给 `<html>` 标签添加样式，把整个窗口设置成有半透明材质背景和圆角边框，或让整个窗口变成全透明无边框。

基于[「快速开始」示例]()的例子： 有半透明材质背景和圆角边框的窗口场景

```css
html.is-spatial {
  background-color: transparent;
  --xr-background-material: translucent;
  border-radius: 10%;
```

![](../../../assets/guide/2-1.png)

- 如果想添加半透明材质背景，一般默认使用 `translucent` 这个值，如果被嵌套在其他半透明材质背景的内容中，想要做区分，可以用[其他材质选项]()
- 可以用 border-radius 控制窗口边框的圆角程度
- 这段样式也可以写成 inline style，比如 `<html style="--xr-background-material: translucent;">`
- 还可以通过 `document.documentElement.style` 来动态设置
- `--xr-background-material` 的默认值是 `none`，如果在窗口的样式中，不提供这个属性，或主动把它配置为 `none`，窗口都会是传统浏览器窗口中默认的网页背景色（不透明）
> 注意 `none` 的语义是不做任何自定义设置，不一定等同于「无材质背景」。

[Techshop demo]() 中的示例：全透明无边框的窗口场景

```css
html.is-spatial {
  background-color: transparent;
  --xr-background-material: transparent;
```

![](../../../assets/guide/2-2.png)

## 半透明的 HTML 元素

第二类是任何[空间化 HTML 元素]()。

不像网页窗口有默认的背景色（不透明），所有 HTML 元素原本就默认是透明背景的（比如可以透过这个元素看到父元素的背景）。

所以 HTML 元素在空间化之后，**默认就是全透明材质背景的**，相当于 `--xr-background-material: transparent`。

对于空间化 HTML 元素来说，`--xr-background-material: none`（语义是不做任何自定义设置，不是「无材质」）等同于 `--xr-background-material: transparent`。

但只有在这个空间化 HTML 元素被「[抬升]()」到 3D 空间中，才能看到这种全透明材质的效果。

基于[「快速开始」示例]()的例子：

```diff
  .link-card {
-   --xr-background-material: translucent;
    border-radius: 20px;
    position: relative;
    --xr-back: 50;
    top: 20px;
```
把 `.link-card` 元素的背景材质属性移除掉，可以看到它本来就是全透明的。

![](../../../assets/guide/2-3.png)

无论空间化 HTML 元素是否「抬升」，都可以用 `--xr-background-material: translucent` 或更多材质选项，设置成半透明材质背景。

基于[「快速开始」示例]()的例子：

```diff
  .link-card {
+   --xr-background-material: translucent;
```

![](../../../assets/guide/2-4.png)

## 更多材质选项

`--xr-background-material` 的值，除了 `none`（无自定义设置）、`transparent`（全透明） 和 `translucent`（默认的半透明材质），还有：

- `regular` - 跟 `translucent` 搭配使用，让两块紧邻的内容在视觉上有区分度，比如作为 sidebar 的背景
- `thick` - 适合嵌套在其他材质背景内部
- `thin` - 适合用于可交互元素和被中选区域

![](../../../assets/concepts/4-4.png)
![](../../../assets/concepts/4-3.png)

[Techshop demo]() 中的示例：

```jsx {highlight=20-23}
        <div enable-xr className="list-meun w-full md:w-64 shrink-0">
          <div
            enable-xr
            className="list-meun-bg bg-white rounded-lg shadow-md p-4"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Categories
            </h2>
            <ul className="space-y-2">
             {categories.map(
                (category, index) =>
                  category !== "All" && (
                    <li key={index}>
                      <button
                        enable-xr
                        style={
                          import.meta.env.XR_ENV === "avp"
                            ? selectedCategory === category
                              ? {
                                  "--xr-background-material": "thin",
                                }
                              : {
                                  "--xr-background-material": "thick",
                                }
                            : {}
                        }
```

侧栏菜单本身是半透明材质背景，菜单中的选项在选中和未选中状态下，分别使用了 `thin` 或 `thick` 的半透明材质，跟菜单本身形成区分。

![](../../../assets/guide/2-5.png)

## 内容可见性和透明度

使用了半透明材质背景的空间化 HTML 元素，仍然可以用 CSS 里的 `display`、`visibility` 属性，决定整个元素的可见性。还可以用 CSS 里的 `opacity` 属性，设置整个内容的透明度（包含材质背景和前景内容）。

## 图层顺序

如果空间化 HTML 元素没有「[抬升]()」，就仍然是**父元素所属平面的组成部分**，这个平面可以是整个窗口场景的平面，也可以是被「抬升」的父元素形成的新平面。

位于**同一个平面**上的多个 HTML 元素，如果彼此之间有重叠关系，默认通过 DOM 结构中的顺序来决定谁覆盖谁（图层顺序），比如兄弟节点之间，靠后的节点会覆盖前面的节点。

如果是同一个「[Stacking Context]()」元素（比如带有 `position`、`transform` 属性的元素）内的多个 HTML 元素，还可以通过 `z-index` 来改变它们之间的图层顺序。

在目前 WebSpatial SDK 的实现里，空间化 HTML 元素暂时有一个局限：

如果发生重叠，空间化 HTML 元素一定会覆盖在非空间化的 HTML 元素之上。
因此如果要让一个 HTML 元素覆盖在一个空间化的 HTML 元素之上，只能对前者也启用空间化。

这也意味着，对于同一个平面上的空间化 HTML 元素，只存在它们彼此之间的图层顺序，不存在它们跟同一平面上其他非空间化 HTML 元素之间的图层顺序（因为它们一定都会覆盖在这些非空间化元素之上），无法使用现有的 `z-index` API。

因此 WebSpatial SDK 给空间化 HTML 元素增加了一个过渡性的新 API——`--xr-z-index` （这个属性的值是整数）。

同一个空间化 HTML 元素内的多个空间化 HTML 元素，可以通过 `--xr-z-index` 改变它们彼此之间的图层顺序。

- 这个作为作为父节点的空间化 HTML 元素相当于「Stacking Context」元素
- 这些彼此之间存在图层顺序的空间化元素，跟作为父节点的空间化元素之间的嵌套架构中，不能还存在其他空间化元素（作为父节点）

注意 `--xr-z-index` 只影响**同一平面内**元素之间的图层顺序，不改变它们的 Z 轴位置，跟[抬升 2D 元素]()的 API 是完全不同的。

---

下一节：[抬升 2D 元素](elevate-2d-elements.md)
