# Make the Web Spatial Too

Previous section: [HTML/CSS and WebXR](html-css-and-webxr.md)

---

<div align="center" style="width: 100%; max-width: 860px;">
  <a href="https://youtu.be/QRWjRoKKuXI?si=RvC66Y7X_eyWoRwv" target="_blank">
    <img src="../../assets/whatif.jpg" style="width: 100%" />
  </a>
</div>

**WebSpatial** is a set of [spatial APIs](../core-concepts/unique-concepts-in-webspatial.md#webspatial-api) built on top of the mainstream Web-development ecosystem and existing 2D Web. It enables the entire HTML/CSS-based Web world - billions of websites and Web apps, tens of millions of Web developers, and millions of open-source libraries - to step into the spatial era, **gaining spatial power on par with native spatial apps (like visionOS apps) while keeping all the advantages the Web already have**.

<a id="position"></a>
### Position HTML Elements on the Z Axis

With WebSpatial, **HTML elements** can be laid out and positioned not only along the X and Y axes via CSS, but also [**along the Z axis in front of the web page**](../development-guide/using-the-webspatial-api/elevate-2d-elements.md):

![image](../../assets/intro/intro-4-2.jpeg)

<a id="transform"></a>
### Transform HTML Elements in True 3D

WebSpatial lets HTML elements [**rotate, scale, and warp along the Z axis in real space**](../development-guide/using-the-webspatial-api/elevate-2d-elements.md).

![image](../../assets/intro/intro-4-3.png)

For example, you can build an actual 3D cube using plain `div` elements:

![image](../../assets/intro/intro-4-4.jpeg)

<a id="material"></a>
### Material-Based Backgrounds

With WebSpatial, HTML elements can have backgrounds that are **[semi-transparent materials](../development-guide/using-the-webspatial-api/add-material-backgrounds.md) rendered in real time from the environment**, so regardless of the environment's color and lighting conditions, content stays legible.

You can also set the background of an element or an entire page window to a [**fully transparent material**](../development-guide/using-the-webspatial-api/add-material-backgrounds.md), making its contents appear to float and disperse in space.

![image](../../assets/intro/intro-4-5.png)

<a id="3d-elements"></a>
### Genuine 3D Elements for HTML

WebSpatial adds **[true 3D elements](../core-concepts/spatialized-elements-and-3d-container-elements.md#3d-elements)** to HTML, allowing 3D content to appear directly in space:

![image](../../assets/intro/intro-4-6.jpeg)

These 3D elements can [**participate in layout alongside 2D elements**](../development-guide/using-the-webspatial-api/add-3d-content.md), forming any mix of Web content and GUI:

![image](../../assets/intro/intro-4-7.jpeg)

<a id="multi-scene"></a>
### Multi-Scene Spatial Apps

A WebSpatial app can comprise multiple **[scenes](../core-concepts/scenes-and-spatial-layouts.md)**, just like a native spatial app. These 2D + 3D (or pure 3D) scenes can be [**managed as standard Web windows**](../development-guide/using-the-webspatial-api/manage-multiple-scenes.md), while also allowing for be [initialized with configurations specific to spatial computing platforms](../core-concepts/scenes-and-spatial-layouts.md#scene-init).

![image](../../assets/intro/intro-4-8.gif)

<a id="3d-engine"></a>
### 3D Containers with 3D Engine APIs (upcoming feature)

Among the 3D elements WebSpatial adds to HTML, there is a container type that lets you **render and control its 3D content via 3D engine APIs**. Web 3D programming is no longer limited to flat canvases or a handful of full-screen 3D games (including WebXR games that take over the whole 3D space). It can now be useful in multitasking scenarios and a far wider range of applications.

---

Continue to the next section: [Built on the Existing Web Ecosystem](built-on-the-existing-web-ecosystem.md)
