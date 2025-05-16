# Managing Multiple Scenes

Fundamental concepts:
- [Scenes and Spatial Layouts](../../core-concepts/scenes-and-spatial-layouts.md)

---

> Because the [WebSpatial SDK]() currently only provides a React SDK, all code examples in this document use React.
>
> APIs referenced in this section:
> - `xr_main_scene`
>   - `default_size`
> - `start_url`
> - `scope`
> - `<a>`
> - `window.open`
> - `initScene()`, `window.xrCurrentSceneDefaults`
>   - `defautSize`
> - `windowProxy.close()`

A WebSpatial app always starts from an [entry scene](), which loads the first [web page]() of the current run. Starting from this page, you can open additional pages in new scenes, so the app is composed of multiple [scenes]().

## Managing the Entry Scene

As the starting point of the entire WebSpatial app, the entry scene is created and initialized entirely by native code (for example, the [WebSpatial App Shell]()). **Web code only runs after this entry scene already exists.**

Therefore, the scene type and its initialization settings can be managed only in the [Web App Manifest].

The WebSpatial SDK adds a new manifest property, `xr_main_scene`, that lets you specify [initialization settings]() for the entry scene.

Based on the [Quick-Start sample]():

```json5
  "xr_main_scene": {
    "default_size": {
      "width": 500,
      "height": 1000
    }
  }
```

In this demo, the entry scene originally used the size shown in the left image (landscape layout). After adding the configuration above to the Web App Manifest, the entry scene switches to the portrait layout shown in the right image.

![image]()
![image]()

> [!NOTE]
> In the current WebSpatial SDK:
> - `xr_main_scene` only supports the `default_size` setting. More options will be added later.
> - Only [window scenes]() are supported for now. Other scene types such as [volume scenes]() are not yet supported, so there are no manifest properties for an initial scene type.

The URL loaded in the entry scene is the first URL opened and run within the WebSpatial app.
By default, it is determined by the [start URL (`start_url`)]() in the manifest.

The combination of the manifest’s [`scope`]() and [`start_url`]() clearly defines which URLs belong to this WebSpatial app.

The [WebSpatial App Shell]() automatically registers these URLs with the system so that they open in the corresponding WebSpatial app instead of a browser.

If the app is launched from one of these URLs, the entry scene loads that specific URL instead of the `start_url`.

## Creating a New Scene

All later scenes in a WebSpatial app are created by web code.
In the entry scene, and in every subsequent scene, you can create new scenes with web code.

The method is exactly the same as opening a link in a new window on a standard website:

- `<a href={newSceneUrl} target="_blank">`
- `<a href={newSceneUrl} target="newSceneName">`
- `window.open(newSceneUrl);`
- `window.open(newSceneUrl, "newSceneName");`

Two important notes:

- The link URL (for example, `newSceneUrl` above) **must** match the manifest’s [`scope`](), meaning it is part of the current WebSpatial app. Otherwise, the URL opens in the browser rather than creating a new scene in the app.
- If you supply a window name (for example, `newSceneName` above) and a same-named scene already exists and is still open, no new scene is created. Instead, that scene navigates to the new URL (equivalent to changing location one existing scene).

> [!IMPORTANT]
> **Best practice:** Once a window name has been used, continue using that name only in the same parent window. Do not reuse the name from another window. Otherwise, according to web standards, the original parent may fail to reach the same-named window or may unexpectedly become the parent of that window.

Based on the [Quick-Start sample]():

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

Clicking the link or the button opens new scenes.
Every scene shows the content of `/second-page`, because that URL is opened in each new scene. Clicking the link multiple times produces multiple scenes. Clicking the button multiple times produces a single scene, because the `window.open` call gives it the window name `"secondScene"`.

![image]()

Because scenes are [centrally managed]() by the operating system in spatial apps, developers cannot arbitrarily control them. Instead, scenes must be initialized with desired **initial values** at creation time; the OS decides whether to honor them. After creation, these properties **cannot be changed by code** and are determined only by the OS and the user.

Current web standards lack an initialization concept for this purpose, so there is no suitable standard API.

> The `window.open` `windowfeatures` argument looks like it sets window size, but those properties can be changed by code at any time. They are not the same as [scene initialization]() properties and are not suitable here.

The WebSpatial SDK therefore provides two new APIs specifically for initializing new scenes:

### `initScene()`

Call this API in the parent page to specify initialization settings for a soon-to-be-created scene.

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

- The new scene **must** have a name (the standard window name).
- You must call this API **before** creating the scene, in **the same page** (the parent).
- Later, you **must** create the scene in the same page **using the same name** for the settings to take effect.
- If initialization settings are provided in advance, the new scene is created immediately with them and does not enter a waiting state.
- After the scene exists, calling this API again with the same name does nothing until the scene is closed. If you later reopen a same-named scene from the same parent, the last settings from this API call are used.

> [!IMPORTANT]
> Following the best practice above, if you provide initialization settings for a name in one page, you should only create scenes with that name in the same page. Creating from another page can miss the settings and cause unexpected behavior.

### `window.xrCurrentSceneDefaults`

This hook lets a page supply initialization settings for **its own** scene.

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

- Use this API only within the page opened in the new scene.
- It is a hook: the page exposes it **before** it is fully ready so the WebSpatial App Shell can retrieve the desired settings.
- If no initialization settings were provided in advance, the new scene first enters a waiting state. It loads the page in the background and, before finishing, tries to read the hook. If the hook returns settings, those are used; otherwise, defaults are used.
- If the hook returns an async function, the waiting state lasts until the function resolves or times out.

> [!TIP]
> One use case: the new page fetches different initialization settings from a server. For example, each article loaded from the server may have a window size suited to its content.

> [!NOTE]
> In the current WebSpatial SDK:
> - Both APIs only support the `defaultSize` setting right now. More options will be added.
> - Only [window scenes]() are supported. Other scene types such as [volume scenes]() are not yet supported, so type-related options are not available.

Based on the [Quick-Start sample]():

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

When you click the link, no window name is supplied, so no initialization settings can be provided in advance. The new scene enters the waiting state, tries to read `window.xrCurrentSceneDefaults`, finds none, and is created with defaults (left window in the image).

When you click the button, `initScene()` supplies settings for the window name `"secondScene"`. The subsequent `window.open` call skips the waiting state and creates the scene directly with those settings (right window in the image).

![image]()

## Managing Multiple Scenes

All scenes after the entry scene are created by web code, and each scene in the app is likewise managed by web code.

After a scene is created, the operating system controls its size and position; code cannot change these. Scene management therefore focuses on closing scenes and passing data.

Closing is the same as closing a window on a standard website.

For any newly created scene, to close itself, simply call `window.close()` from within its page.
The entry scene cannot close itself with `window.close()` and must be closed by the user.
If only one scene is left in the app, it also cannot close itself with `window.close()`; the user must close it.

A scene can close other scenes only if it has a window reference (WindowProxy) to them, per web standards.

For scenes you create, you can capture the WindowProxy when opening the scene and later call `close()` on it.

```js
const newSceneWindowProxy = window.open(newSceneUrl);
const newSceneWindowProxy2 = window.open(newSceneUrl, "newSceneName");
newSceneWindowProxy.close();
newSceneWindowProxy2.close();
```

From a child scene, you can obtain the parent’s WindowProxy via `window.opener`.

```js
opener.close();
```

To send data between scenes, continue to use existing web APIs such as:

- `postMessage` (safe messaging between scenes with a WindowProxy)
- `BroadcastChannel` (broadcast messages among scenes with the same origin)
- `MessageChannel` (create a private two-way channel between two scenes)
- `localStorage` (share data across scenes of the same origin and listen for changes via the `storage` event)
- `SharedWorker` (let multiple same-origin scenes share a background worker and communicate through it)

---

Next section: [Adding 3D Content](add-3d-content.md)
