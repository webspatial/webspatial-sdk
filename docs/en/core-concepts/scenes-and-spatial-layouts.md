# Scenes and Spatial Layouts

## Scenes

A [spatial app]() is composed of **scenes**.

A scene is a content container centrally managed by the spatial-computing OS in the shared space. Every piece of app content must live in one or more of these containers.

| ![](../../assets/concepts/3-1.png) | ![](../../assets/concepts/3-2.png) |
|:---:|:---:|

### Window Scene

The most basic **scene type** is the **window**.

![](../../assets/concepts/3-3.png)

Unlike a flat desktop window, a window scene can host both 2D and 3D content. All content is positioned relative to the window plane, but it **can extend forward into the 3D space in front of the plane**.

![](../../assets/concepts/3-4.png)
![](../../assets/concepts/3-5.png)

A window scene has a new capability: its background and chrome can be fully transparent, making the content **appear to float independently in space**.

![](../../assets/concepts/3-6.png)
![](../../assets/concepts/3-7.png)

### Volume Scene

A spatial app can also use a more three-dimensional scene type called a **volume scene** (also referred to as a spatial container, volumetric window, or volume).
This scene is a bounded local 3D space (a sort of 3D bounding box) that has volume. It can hold 3D content **and** 2D content.

![](../../assets/concepts/3-8.png)

Although both window scenes and volume scenes can host 2D and 3D content, the former behaves like a **panel with depth extending forward**, while the latter behaves like a bounded **object** with full volume. The OS treats them differently within the shared space, integrates them with the environment in distinct ways, and exposes different interactions, for example separate drag behaviors and [Spatial Layout]() modes.

![](../../assets/concepts/3-9.png)
![](../../assets/concepts/3-10.png)

### Scenes in a WebSpatial App

A WebSpatial app is composed of the same scene containers.

At the same time, each scene acts as a container that loads a URL, parses, and runs an HTML page — much like a browser window. **All scene content comes from the page loaded inside it.**

Unlike browser windows, scenes from different WebSpatial apps do not belong to a single browser application or get managed as multiple tabs. Each WebSpatial app owns one or more scenes independently, just like a native app.

![](../../assets/concepts/3-11.png)

Another difference: a WebSpatial scene **has no browser UI such as address bar, bookmarks, or history**. The whole scene can be given a transparent background, so no window chrome is visible except the **[scene menu]()**.

> Comparison: the left image shows the non-spatial version; the right image shows the spatial version with a fully transparent background.
> | ![](../../assets/concepts/3-12.png) | ![](../../assets/concepts/3-13.png) |
> |:---:|:---:|

## Scene Menu

A scene in a WebSpatial app is equivalent to an independent window created by an [installed PWA]().

Because a WebSpatial scene is essentially a web page, it inherits the same general requirements and security/privacy considerations as any web page:

- Many pages do not provide full in-app navigation and therefore rely on **native back/forward buttons**.
- When a page errors, users often need native back/forward or refresh to recover.
- If the content is loaded dynamically, users need to see the current URL to verify certificates and other security/privacy details.
- Sometimes users want to copy the current URL for use in a browser or elsewhere.
- …

For these reasons, a PWA window includes native UI for safety and URL-related functions:

![](../../assets/concepts/3-14.png)

The PWA standard's [display property]() in the [Web App Manifest]() lets you control certain parts of this native UI — for example, whether **native navigation buttons** appear.

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

Because a WebSpatial app is **built on top of a PWA** (), every scene includes a native **scene menu**, just like a PWA window.

> [!NOTE]
> The current UI is collapsed by default. When expanded it offers URL view/copy, navigation buttons (back, refresh), and other features depending on the `display` property set in the Web App Manifest.

![](../../assets/concepts/3-20.png)

## Scene Properties

A WebSpatial window scene exposes several scene properties that the developer can fully control:

The window plane can use a **semi-transparent** [material background](), rendered dynamically against the surrounding environment so it remains legible in any context. You can also round the four corners instead of keeping the default sharp angles.

![](../../assets/concepts/3-21.png)

Alternatively, set the background to a [fully transparent]() material with no border, making the page content appear to float freely.

![](../../assets/concepts/3-22.png)
![](../../assets/concepts/3-23.png)

You can create native UI elements that hover on the window edge and provide global functionality (for example, a global navigation bar).

> [!TIP]
> The current version of WebSpatial does not support this feature natively. You can simulate it in a fully transparent window scene using regular HTML/CSS.

| ![](../../assets/concepts/3-24.png) | ![](../../assets/concepts/3-25.png) |
|:---:|:---:|

## Spatial Layout

In a 2D app, the **layout** determines the position and size of every UI element.
Layout is a set of relationships: elements affect each other. Changing one element's size or position can cascade changes to many others.
But as long as the UI content stays the same, the layout remains stable and essentially static.

In a spatial app, layout not only adds **depth** beyond height and width, it also introduces a new **dynamic relationship** — **spatial layout**:

Because users constantly move in the environment (turning their heads, changing eye level by sitting or standing, bending, walking around), the UI must now consider **dynamic relationships between elements and the user**.

How UI elements adapt to those movements and interactions defines the spatial layout.

To simplify implementation, spatial layout is **scene-centric** by default. All content lives inside a scene and moves with that scene; the scene then reacts to the user and environment.

For example, as the distance between scene and user changes, a reading-oriented window scene may keep the same perceived size (smaller when close, larger when far), whereas a volume scene that mimics a real object will appear larger when nearer and smaller when farther.

| ![](../../assets/concepts/3-26.gif) | ![](../../assets/concepts/3-27.gif) |
|:---:|:---:|

## Scene Initialization

Scenes are content containers uniformly managed by the OS in the [shared space](). Centralized management is necessary because only the OS has the complete understanding of the user’s environment, the dynamic relationships between scenes and the user ([Spatial Layout]()), and the interactions among different apps.

Therefore, only the OS should make the final decisions about size, position, orientation, and other spatial-layout properties. Developers do not have **full** control over them, and even end-users are limited; they cannot arbitrarily resize a window or place it **anywhere**. OS constraints always apply.

During scene creation, developers may supply **preferred initial values**, which the OS may accept or adjust.

After creation, code **cannot** modify these properties; they change only through OS logic and user actions.

The classic example is the scene’s [initial size (`defaultSize`)]().

> Example from the Quick Start:
> | ![](../../assets/concepts/3-28.png) | ![](../../assets/concepts/3-29.png) |
> |:---:|:---:|

## Start Scene

Every time a WebSpatial app launches, it **starts with a single scene** called the start scene, from which the app can open additional scenes.

Because the start scene is the entry point, it is created and initialized entirely by native code (for example, the [WebSpatial App Shell]()). **The web code runs only after this scene exists.**

Consequently, the start scene’s type and initial configuration can only be set via the [Web App Manifest]().

Additional scenes created later within the same WebSpatial app are [created by web code, where their initialization can also be configured]().

The URL loaded in the start scene is the very first page the WebSpatial app loads and runs.

By default, it is defined by `start_url` in the Web App Manifest.
If the WebSpatial app is launched through a specific URL, the start scene loads that URL instead.

> In the Quick Start, clicking buttons and links in the start scene opens two new scenes:
> ![](../../assets/concepts/3-30.png)

---

Next section: [Spatialized Elements and 3D Container Elements](spatialized-elements-and-3d-container-elements.md)
