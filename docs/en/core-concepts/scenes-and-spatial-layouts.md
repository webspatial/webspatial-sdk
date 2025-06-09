# Scenes and Spatial Layouts

<a id="scenes"></a>
## Scenes

A [spatial app](../core-concepts/shared-space-and-spatial-apps.md#spatial-apps) is composed of **Scenes**.

A Scene is a content container centrally managed by the spatial-computing OS. Every piece of app content must live in one or more of these containers.

| ![](../../assets/concepts/3-1.png) | ![](../../assets/concepts/3-2.png) |
|:---:|:---:|

<a id="scenes-window"></a>
### Window Scene

The most basic **Scene type** is the **Window**.

![](../../assets/concepts/3-3.png)

Unlike a flat window in the desktop operating systems, a Window Scene can host both 2D and **3D content**. All content is positioned **based on the window plane** and can extend into **the 3D space in front of it**.

![](../../assets/concepts/3-4.png)
![](../../assets/concepts/3-5.png)

A Window Scene has a new capability: its background and borders can be fully transparent, making the content **appear to float independently in space**.

![](../../assets/concepts/3-6.png)
![](../../assets/concepts/3-7.png)

<a id="scenes-volume"></a>
### Volume Scene

A spatial app can also use a more 3D scene type called a **Volume Scene** (also referred to as a **volumetric window**, or **volume**).
This scene is a bounded local 3D space (a sort of 3D bounding box) that has volume. It can also hold 3D content and **2D content**.

![](../../assets/concepts/3-8.png)

Although both Window Scenes and Volume Scenes can host 2D and 3D content, the former behaves like a **panel with depth extending forward**, while the latter behaves like a bounded **object** with full volume. The OS treats them differently within the shared space, integrates them with the environment in distinct ways, and exposes different interactions, for example separate drag behaviors and [Spatial Layout](#spatial-layout) modes.

![](../../assets/concepts/3-9.png)
![](../../assets/concepts/3-10.png)

<a id="scenes-in-webspatial"></a>
### Scenes in a WebSpatial App

A WebSpatial app is composed of the same Scene containers.

At the same time, each Scene acts as a container that loads a URL, parses, and runs an HTML page - much like a browser window. **All scene content comes from the webpage loaded inside it.**

Unlike browser windows, Scenes from different WebSpatial apps aren't managed like multiple windows or tabs inside a single browser app. Each WebSpatial app owns one or more Scenes independently, just like a native spatial app.

![](../../assets/concepts/3-11.png)

Another difference: a WebSpatial Scene **has no browser UI such as address bar, bookmarks, or history**. It's more like a PWA window on desktop platforms, but allow the whole Scene to have a fully transparent background, so no window borders is visible, only native UI left around the window area is the essential, minimal elements related to scene management, such as the drag bar and close button at the bottom of visionOS app windows, plus the WebSpatial app's own **Scene Menu**.

> Comparison: the left image shows the non-spatial version; the right image shows the spatial version with a fully transparent background.
> | ![](../../assets/concepts/3-12.png) | ![](../../assets/concepts/3-13.png) |
> |:---:|:---:|

<a id="scene-menu"></a>
## Scene Menu

A Window Scene in a WebSpatial app is equivalent to an independent window created by an [installed PWA](../development-guide/enabling-webspatial-in-web-projects/prerequisite-become-a-minimal-pwa.md).

Because a WebSpatial Scene is [essentially a web page](#scenes-in-webspatial), it inherits the same general requirements and security/privacy considerations as any web page:

- Many webpages do not provide full in-app navigation and therefore rely on **native navigation buttons like "Back" and "Forward."**
- When a webpage errors, users often need to rely on the native "Refresh" button to reset it.
- If the content in the app window comes from a dynamically loaded webpage, users should be able to see the page's URL to check things like certificates and security/privacy info.
- Sometimes users want to copy the current URL for use in a browser or elsewhere.
- …

That's why PWA app windows include some native UI to provide the general features mentioned above.

![](../../assets/concepts/3-14.png)

The PWA standard's [`display` property](../development-guide/enabling-webspatial-in-web-projects/add-web-app-manifest.md#display) in the [Web App Manifest](../development-guide/enabling-webspatial-in-web-projects/add-web-app-manifest.md) lets you control certain parts of this native UI - for example, **whether native navigation buttons appear**.

> The following image shows a desktop PWA in `minimal-ui` mode (native title bar with navigation buttons).
> ![](../../assets/concepts/3-15.png)
>
> The following images show an Android PWA in `minimal-ui` mode (native title bar, navigation buttons inside the menu).
> | ![](../../assets/concepts/3-16.png) | ![](../../assets/concepts/3-17.png) |
> |:---:|:---:|
>
> In `standalone` mode on Android, the PWA has no title bar and no navigation buttons; only the multitasking view shows a native menu.
> | ![](../../assets/concepts/3-18.png) | ![](../../assets/concepts/3-19.png) |
> |:---:|:---:|

WebSpatial is [**built on top of PWA**](../development-guide/enabling-webspatial-in-web-projects/prerequisite-become-a-minimal-pwa.md), every WebSpatial Scene includes a native **Scene Menu**, just like a PWA window.

> [!NOTE]
> The Scene Menu shown in the image isn't the final design. It's a temporary test version. It's collapsed by default, and when expanded, it lets you view and copy the URL, use navigation buttons (depend on the `display` property in the Web App Manifest), etc.

![](../../assets/concepts/3-20.png)

<a id="scene-props"></a>
## Scene Properties

Window Scenes in WebSpatial apps have some Scene properties that are fully controlled by the developer.

The window plane can use a [**semi-transparent** material background](../development-guide/using-the-webspatial-api/add-material-backgrounds.md#for-window-scenes), rendered dynamically against the surrounding environment so it remains legible in any context. You can also round the four corners instead of keeping the default sharp angles.

![](../../assets/concepts/3-21.png)

Alternatively, set the background to a [fully transparent material](../development-guide/using-the-webspatial-api/add-material-backgrounds.md#for-window-scenes) with no border, making the page content appear to float freely.

![](../../assets/concepts/3-22.png)
![](../../assets/concepts/3-23.png)

You can create native UI elements that hover on the window edge and provide global functionality (for example, a global navigation bar).

> [!WARNING]
> The current version of WebSpatial SDK does not support this feature natively. You can simulate it in a fully transparent window scene using regular HTML/CSS.

| ![](../../assets/concepts/3-24.png) | ![](../../assets/concepts/3-25.png) |
|:---:|:---:|

<a id="spatial-layout"></a>
## Spatial Layout

In a 2D app, the **layout** determines the position and size of every UI element.
Layout is a set of **relationships**: elements affect each other. Changing one element's size or position can cascade changes to many others.

But as long as the UI content stays the same, the layout remains stable and essentially **static**.

In a spatial app, layout not only adds **depth** beyond height and width, it also introduces a new **dynamic relationship** - **spatial layout**:

Because users constantly move in the spatial environment (turning their heads, changing eye level by sitting or standing, bending, walking around), the UI must now consider **dynamic relationships between elements and the user**.

How UI elements adapt to those movements and interactions defines the spatial layout.

To simplify implementation, spatial layout is **scene-centric** by default. All content lives inside a scene and changes with that scene, and the scene itself adapts in response to changes in the user and the surrounding environment.

For example, as the distance between scene and user changes, a reading-oriented window scene may keep the same perceived size (smaller when close, larger when far), whereas a volume scene that mimics a real object will appear larger when nearer and smaller when farther.

| ![](../../assets/concepts/3-26.gif) | ![](../../assets/concepts/3-27.gif) |
|:---:|:---:|

<a id="scene-init"></a>
## Scene Initialization

Scenes are content containers uniformly managed by the OS in the [shared space](./shared-space-and-spatial-apps.md). Centralized management is necessary because only the OS has the complete understanding of the user's environment, the dynamic relationships between scenes and the user ([Spatial Layout](#spatial-layout)), and what each app does and how they relate to one another.

Therefore, only the OS should make the **final decisions** about size, position, orientation, and other spatial-layout properties. Developers do not have **full control** over them, and even end-users are limited - they cannot arbitrarily resize a window or place it anywhere. These properties are **consistently constrained** by the
OS.

During scene creation, developers may supply **preferred initial values**, which the OS may accept or adjust.

Once created, these properties **cannot** be changed by app code, they're entirely controlled by the OS and the user's actions.

The classic example is the scene's [`defaultSize`](../development-guide/using-the-webspatial-api/manage-multiple-scenes.md#init-scene).

> Example from the Quick Example:
> | ![](../../assets/concepts/3-28.png) | ![](../../assets/concepts/3-29.png) |
> |:---:|:---:|

<a id="start-scene"></a>
## Start Scene

Every time a WebSpatial app launches, it **starts with a single Scene** called the **Start Scene**, from which the app can open additional Scenes.

Because the Start Scene is the entry point of the WebSpatial app, it is created and initialized entirely by native code ([WebSpatial App Shell](./unique-concepts-in-webspatial.md#webspatial-sdk)). **The web code runs only after this Start Scene exists.**

Consequently, the Start Scene's type and initial configuration can only be set via the [Web App Manifest](../development-guide/enabling-webspatial-in-web-projects/add-web-app-manifest.md).

Additional scenes created later within the same WebSpatial app are [created by web code](../development-guide/using-the-webspatial-api/manage-multiple-scenes.md#new-scene), where their initialization can also be configured in web code.

The URL loaded in the Start Scene is the very first page the WebSpatial app loads and runs. By default, it is defined by [`start_url`](../development-guide/enabling-webspatial-in-web-projects/add-web-app-manifest.md#start-url) in the Web App Manifest. If the WebSpatial app is launched through a specific URL, the Start Scene loads that URL instead.

> In the Quick Example, clicking buttons and links in the Start Scene opens two new Scenes:
> ![](../../assets/concepts/3-30.png)

---

Next section: [Spatialized Elements and 3D Container Elements](spatialized-elements-and-3d-container-elements.md)
