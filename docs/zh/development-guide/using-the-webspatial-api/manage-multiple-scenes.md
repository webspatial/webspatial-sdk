
# 管理多个场景

基础概念：
- [场景和空间布局](../../core-concepts/scenes-and-spatial-layouts.md)

---

> 由于 [WebSpatial SDK]() 暂时只提供了 React SDK，所以本文档都以 React 代码为例。
>
> 本节中涉及的 API：
> - `xr_main_scene`
>   - `default_size`
> - `start_url`
> - `scope`
> - `<a>`
> - `window.open`
> - `initScene()`, `window.xrCurrentSceneDefaults`
>   - `defautSize`
> - `windowProxy.close()`

WebSpatial 应用总是从[起始场景]()开始运行，这个起始场景会加载 WebSpatial 应用这次运行过程中的第一个[网页]()。
从这个网页开始，可以在新场景中打开更多网页，让应用由多个[场景]()组成。

## 管理起始场景

作为整个 WebSpatial 应用的起始点，起始场景是完全由原生代码（比如 [WebSpatial App Shell]()）创建和初始化的，**Web 代码是在有了这个起始场景之后才开始运行**。

因此，起始场景的类型和初始化配置，只能在 [Web App Manifest]() 中管理。

WebSpatial SDK 在 Web App Manifest 中扩展了一个新属性 `xr_main_scene`，可以用这个属性对起始场景做[初始化配置]()。

基于[「快速开始」示例]()的例子：

```json5
  "xr_main_scene": {
    "default_size": {
      "width": 500,
      "height": 1000
    }
  }
```

这个 demo 的起始场景，本来是左图这样的尺寸（横屏界面风格），在 Web App Manifest 中添加以上配置后，起始场景就变成右图这样的竖屏界面风格了。

![image]()
![image]()

> [!NOTE]
> 在 WebSpatial SDK 目前的实现中：
> - `xr_main_scene` 暂时只支持对 `default_size` 做初始化配置，后续会添加更多配置选项。
> - 暂时只支持[窗口场景]()，不支持[体积场景]()等其他场景类型。因此 Manifest 里暂时没有初始场景类型相关的属性

起始场景中加载的 URL，是整个 WebSpatial 应用中加载和运行的第一个 URL。
默认由 Web App Manifest 中的[起始网址（`start_url`）]()决定。

Web App Manifest 中的 [`scope`]() 属性和 [`start_url`]() 属性组合在一起，可以明确哪些 URL 属于这个 WebSpatial 应用。

[WebSpatial App Shell]() 会自动在系统中注册这些 URL，让这些 URL 在对应的 WebSpatial 应用中打开，而不是在浏览器中打开。

如果通过这种方式从特定 URL 启动 WebSpatial 应用，起始场景中加载的就会是这个 URL，而不是 `start_url`。

## 创建新场景

同一个 WebSpatial 应用中后续的更多场景，是由 Web 代码来创建的。
在起始场景和应用中的每个场景中，都可以用 Web 代码来创建新场景。

创建新场景的方式，跟现有标准网站代码中**在新窗口打开链接**的方式，是完全一样的。

以下 HTML 代码和 JS 代码都可以创建新场景：

- `<a href={newSceneUrl} target="_blank">`
- `<a href={newSceneUrl} target="newSceneName">`
- `window.open(newSceneUrl);`
- `window.open(newSceneUrl, "newSceneName");`

但有两个注意事项：

- 链接的网址（比如上面示例中的 `newSceneUrl`） 必须符合 Web App Manifest 中的 [`scope` 规则]()，是当前 WebSpatial 应用的组成部分。否则，这个 URL 会在浏览器中打开，不会在当前 WebSpatial 应用中创建新场景。
- 如果提供了「新窗口名称」（比如上面示例中的 `newSceneName`），但在当前页面中已经创建过同名的场景，且这个场景还存在，没被关掉，这种情况下不会创建新场景，而是在同名场景加载这个网址（相当于在这个场景中发生网址跳转）。

> [!IMPORTANT]
> 最佳实践：一个「窗口名称」只要被使用过了，之后就应该**继续在相同的父窗口中使用这个名称**。不要在这个父窗口之外的其他窗口中使用这个名称，否则，按照 Web 标准，要么会访问不到已存在的同名窗口（不会在已存在的同名窗口中做网址跳转，而是会创建新窗口加载网址），要么能访问到同名窗口，但**会把自己变成这个已存在窗口的父窗口**，让原来的父窗口无法像之前一样使用这个名称，比如会访问不到这个同名窗口。

基于[「快速开始」示例]()的例子：

```jsx {highlight=4-11}
              <div className="card" style={{ marginTop: "0px" }}>
                <h2>Open Second Page</h2>
                <p>
                  <Link to="/second-page" target="_blank">
                    Open Second Page with a Link
                  </Link>
                </p>
                <p>
                  <button
                    onClick={() => {
                      window.open(`${__XR_ENV_BASE__}/second-page`, "secondScene");
                    }}>
                    Open Second Page with a Button
                  </button>
                </p>
              </div>
```

点击链接和按钮，都会出现新的场景。
场景中的内容都是 `/second-page` 页面的内容，因为这些新场景中打开的是相同的 URL。
如果多次点击链接，会生成多个新场景。如果多次点击按钮，只会有一个新场景，因为点击按钮触发的 `window.open` 中指定了窗口名称（`"secondScene"`）。

![image]()

由于场景在空间应用中是由操作系统[统一管理]()的，不能由开发者任意控制，因此空间应用中的场景多了「[初始化]()」的概念，开发者只能在场景创建之初的初始化环节，为场景的一些属性提供自己**期望的起始值**，由操作系统来判断是否采纳。之后这些属性**无法被代码改变**，只能由操作系统和终端用户的行为来共同决定。

现有 Web 标准由于没考虑到空间应用的需求，不存在这种初始化概念，没有合适的 API 能用于这种初始化。

> `window.open` 的 `windowfeatures` 参数，表面上也能设置窗口尺寸，但这个参数里的属性，都能在任何时候被代码改变，跟[场景初始化]()属性不是同一个概念，不适合借用过来做空间应用场景的初始化。

因此 WebSpatial SDK 中提供了两种新 API，专门用于新场景的初始化配置：

第一种 API 是 `initScene()`，用这个 API 可以在父页面中对即将创建的新场景做初始化配置。示例：

```jsx
import { initScene } from '@webspatial/react-sdk'

initScene("newSceneName", defaultConfig => {
  return {
    ...defaultConfig,
    defaultSize:{
      width: 900,
      height: 700
    },
  }
});
window.open(newSceneUrl, "newSceneName")
```

- 要使用这个 API，**必须为新场景提供名称**（现有 Web 标准中的窗口名称）。
- 需要在实际创建新场景之前，在**相同页面（相当于父页面）中调用**这个 API，把名称作为第一个参数。
- 后续**必须在相同页面中**，**用相同的名称**来创建这个新场景，才会让初始化配置生效。
- 如果在创建新场景时，已经提前用这个 API 提供了初始化配置，新场景就会按照这个配置立刻创建，不会加载等待。
- 场景创建之后，在关闭之前，如果在相同父页面中，再次用这个 API 对相同名称提供新的初始化属性，不会对当前这个同名场景造成任何影响。当这个同名场景被关闭后，如果在相同父页面中，再次打开这个场景（用相同名称创建新场景），会使用第二次 API 调用提供的初始化属性。

> [!IMPORTANT]
> 按照前面说的最佳实践，如果在一个页面中，为一个名称提供了场景初始化配置，之后应该只在相同页面中使用这个名称创建场景，不要在其他页面里使用这个名称，否则不但可能访问不到相同的场景初始化配置，还会引起其他意料不到的后果。

第二种 API 是 `window.xrCurrentSceneDefaults`，通过这个 API，页面可以自己影响自己所在场景的初始化属性。示例：

```jsx
window.xrCurrentSceneDefaults = async defaultConfig => {
  const { width, height } = await requestDatabase()
  return {
    ...defaultConfig,
    defaultSize:{
      width,
      height,
    }
  }
};
```

- 这个 API 只能在被新场景打开的页面里使用。
- 这个 API 是一个钩子，需要在页面 ready 之前提供这个钩子，让 WebSpatial App Shell 能通过这个钩子获取到新页面想要的场景初始化属性。
- 如果在创建新场景时，没有提前提供初始化配置，新场景就会先进入等待状态，先在后台加载新场景中的页面，在加载完成、结束等待状态之前，尝试通过这个钩子获取场景初始化属性，如果能获取到，就按这个初始化属性来创建新场景，否则就按默认属性创建新场景
- 如果在等待状态的过程中，通过这个钩子获取到的是异步函数，等待状态就会持续更久，直到异步过程结束或超时。

> [!TIP]
> 这种用法的使用场景之一是：新页面可以从服务器端获取不同的初始化配置。
> 比如，新页面的内容是从服务器端获取的不同文章，每篇文章可以有适合自己的不同窗口尺寸。

> [!NOTE]
> 在 WebSpatial SDK 目前的实现中：
> - 以上两种 API 暂时只支持对 defaultSize 做初始化配置，后续会添加更多配置选项。
> - 暂时只支持[窗口场景]()，不支持[体积场景]()等其他场景类型。因此以上两种 API 里暂时没有场景类型相关的选项

基于[「快速开始」示例]()的例子：

```diff
                <h2>Open Second Page</h2>
                <p>
                  <Link
                    to="/second-page"
+                   target="_blank"
                    enable-xr
                  >
                    Open Second Page with a Link
                  </Link>
                </p>
                <p>
                  <button
                    onClick={() => {
+                     initScene("secondScene", prevConfig => {
+                       return {
+                         ...prevConfig,
+                         defaultSize: {
+                           width: 500,
+                           height: 500,
+                         },
+                       };
+                     });
                      window.open(
                        `${__XR_ENV_BASE__}/second-page`,
+                       "secondScene",
                      );
                    }}>
                    Open Second Page with a Button
                  </button>
                </p>
```

如果点击链接，由于没有提供窗口名称，无法提前做初始化配置，新场景会先进入等待状态，尝试在新页面中通过钩子 `window.xrCurrentSceneDefaults` 获取初始化配置，等待状态结束后，由于新页面没有提供这个钩子，因此用默认属性创建这个场景（图中左侧的新窗口）。

如果点击按钮，会先用 `initScene()` 对窗口名称为 `"secondScene"` 的场景提供初始化配置，之后用 `window.open` 创建同名场景的时候，不会有等待状态，会直接按照这个初始化配置创建新场景（图中右侧的新窗口）。

![image]()

## 管理多个场景

初始场景之后的所有新场景，都是由 Web 代码来创建的。同样，同一个 WebSpatial 应用中的每个场景，也是由 Web 代码来管理的。

空间应用的场景在创建之后，完全由操作系统控制，无法通过代码来改变尺寸、位置等属性。
所以对于场景的管理，主要是关闭操作和数据传递。

跟创建新场景的操作方式一样，在 WebSpatial 应用中，关闭操作就是现有标准网站代码中关闭窗口的方式。

对于所有新创建的场景，如果要自己关闭自己，只需要在自己的页面里执行 `window.close()`。
起始场景不能用 `window.close()` 自己关闭自己，只能由用户来手动关闭。
如果整个 WebSpatial 应用中其他场景都被关闭了，最后剩下一个场景，这个场景也无法用 `window.close()` 自己关闭自己，只能由用户来手动关闭。

如果一个场景要关闭其他场景，按照 Web 标准，只能直接关闭那些自己能获取到窗口引用（WindowProxy）的场景。

对于自己创建的场景，可以在创建场景时获取这个场景的 WindowProxy 对象，之后用这个对象来关闭对应场景。

```js
const newSceneWindowProxy = window.open(newSceneUrl);
const newSceneWindowProxy2 = window.open(newSceneUrl, "newSceneName");
newSceneWindowProxy.close();
newSceneWindowProxy2.close();
```

对于创建自己的父场景，可以用 window.opener 获取父场景的 WindowProxy 对象。

```js
opener.close();
```

在场景之间传递消息，同样可以用 Web 标准中已有的 API 来实现。比如：
- `postMessage` - 允许在能获取到 WindowProxy 的不同的场景之间安全传递消息
- `BroadcastChannel` - 能在网页同源的不同场景之间广播消息
- `MessageChannel` - 创建一个双向通信通道，在两个场景之间建立私有通信
- `localStorage` - 可以在网页同源的不同场景之间共享数据，通过 storage 事件监听变化
- `SharedWorker` - 允许多个网页同源的场景共享同一个后台工作线程，从而实现它们之间的通信

---

下一节：[添加 3D 内容](add-3d-content.md)
