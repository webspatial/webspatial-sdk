# Spatialized Elements and 3D Container Elements

[Space apps]() are composed of [scenes](), and the content in a scene is made up of both 2D and 3D content.

For a WebSpatial app, every piece of scene content consists of HTML elements.

## Spatializing 2D Content Elements

2D content refers to existing HTML elements that can be [converted into "spatialized HTML elements"]() to gain spatial capabilities.

After a 2D HTML element is spatialized, its original capabilities remain unchanged by default, such as:

- Existing HTML attributes
- Existing CSS APIs ([exceptions]())
- Existing DOM APIs
- The ability to nest and compose with other HTML elements, whether spatialized or not
- Layout control for position and size on the X- and Y-axes
- ...

A spatialized element mainly gains two new capabilities:

1. **Dynamic backgrounds**
   It can render its background based on the spatial environment around the app—for example, using translucent materials instead of a fixed solid color.

![](../../assets/concepts/4-1.png)

2. **3D elevation**
   It can move, transform, and be laid out along the Z-axis in front of the web-page window, allowing it to be “lifted” into 3D space.

![](../../assets/concepts/4-2.png)

Both capabilities support nesting:

1. If the window or a parent element already has a translucent material background, its child elements can still use different translucent material backgrounds.

![](../../assets/concepts/4-3.png)
![](../../assets/concepts/4-4.png)

2. If the parent element has been lifted and rotated in 3D space, child elements can continue to be lifted and rotated on that basis.

![](../../assets/concepts/4-5.jpeg)
![](../../assets/concepts/4-6.png)

## 3D Content Container Elements

3D content in a scene comes from the new 3D content container elements introduced by the [WebSpatial API]().

In the current [WebSpatial SDK](), these elements are provided as React components that wrap the future, official HTML elements, allowing you to call the future HTML/CSS APIs directly on the component.

A 3D content container is similar to a [volumetric scene](): it is a volumetric “bounding-box–like” local 3D space with clear boundaries. However, it is **not managed by the OS; it is part of the current scene**, laid out with other 2D and 3D elements on the X-, Y-, and Z-axes. Its position and size are determined by its own CSS styles and layout relationships.

A 3D content container element has the same capabilities as a 2D content element:

- General HTML attributes (`style`, `class`, `id`, and so on)
- General CSS APIs ([exceptions]())
- General DOM APIs
- The ability to nest and compose with other HTML elements (including spatialized and non-spatialized 2D elements, and other 3D containers). A 3D content container **can only be a child element**, not a parent element.
- Layout control for position and size on the X- and Y-axes
- ...

It also inherits the spatial capabilities of spatialized HTML elements:

- As a whole, it can move, transform, and be laid out along the Z-axis in front of the web-page window so that it can be lifted into 3D space.

> [!NOTE]
> A 3D content container is a transparent local 3D space. It has **no background** and therefore does not support material background properties.

There are two kinds of 3D content container elements.

- **Static 3D content containers**
  Their 3D content comes from pre-authored [3D model files]().

![](../../assets/concepts/4-7.png)

- **Dynamic 3D content containers**
  Their 3D content is generated in real time by a [3D engine]().

![](../../assets/concepts/4-8.png)

## Interaction with 2D Content

For non-spatialized 2D elements, interaction works the same way as 2D web content in a browser on a spatial-computing platform (for example, Safari on visionOS).

The default interaction mode on visionOS is called **Natural Interaction** and includes:

- **Indirect gestures**
  - **Eye gaze** for “selection (navigation)” and **pinch** for “activation (trigger).”
  - At the moment of the pinch gesture, the finger position corresponds to the gaze point, acting as the starting point. If the user keeps pinching, subsequent finger movement adjusts that point.
- **Direct gestures**
  - Moving a finger without touching an object is “selection (navigation),” while touching the object is “activation (trigger).”
  - As with touchscreens, after the finger touches an object it can move before releasing to fire move events.

![](../../assets/concepts/4-9.png)

The visionOS browser engine already lets 2D web content support Natural Interaction:

1. **Selection (navigation)**
   1. An interactive HTML element (it **must comply with the Interaction Region rules**()) is targeted via eye gaze or by moving a finger close to it.
   2. **No JS events fire and no CSS state changes occur** during this phase, so the web page cannot show interaction cues. Essentially, the page is unaware of the selection.
   3. The OS, including the browser engine, provides **native cues** so users can see what they are selecting.

2. **Activation (trigger)**
   1. At the moment of a pinch (indirect) or tap (direct), JS events fire on the selected element.
   2. If the user keeps pinching or pressing and then moves the finger, JS events continue to fire on the element.

> [!NOTE]
> See the [detailed interaction APIs]() for more information.

## Interaction with 3D Elements and Spatialized Elements

To interact with the specific 3D content inside a 3D container element, or with a spatialized 2D element that has been lifted into 3D space, the existing [low-level JS events]() are not enough. A new set of **high-level 3D gesture APIs** is provided on the React component.

> To be added

---

Next section: [Full-Space and AR Capabilities](full-space-and-ar-capabilities.md)
