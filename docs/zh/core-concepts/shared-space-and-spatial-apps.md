
# 共享空间和空间应用

## 共享空间

visionOS 带来的空间计算平台架构，提供了一种全新的应用运行环境，称作「**共享空间（Shared Space）**」。

共享空间是一个基于[混合现实（Mixed Reality）]()的 3D 空间，等同于你身边的环境空间。

在同一个这样的 3D 空间中，可以同时有多个应用和谐共存——既能与环境空间和谐共存，应用彼此之间也能和谐共存。

这些**多任务应用（Multitasking Apps）** 不仅包括传统的纯 2D 应用，还包括能利用 3D 空间、包含 3D 内容的「**空间应用（Spatial App）**」。

![image]()
![image]()

## 空间应用

在共享空间中，应用的内容不用局限于 2D 窗口的平面，**可以延伸到平面前方的 3D 空间中**。这些内容的定位和布局除了 X 轴和 Y 轴，还可以真正拥有 Z 轴。

应用的内容不再只能通过 2D 平面窗口容器来组织，还可以放在具备体积、类似3D包围盒的空间容器里。

应用可以由[多个这样的内容容器]()组成，这些内容容器能**被空间计算操作系统[统一管理]()**。

组成内容的 2D UI 元素，很多都可以「[空间化]()」，**进入 3D 空间**，在 3D 空间中定位、布局和变形。

除此之外，还可以在内容中使用 [3D UI 元素]()，实现更灵活、全功能的 3D 内容，这些 3D UI 元素可以**跟 2D UI 元素一起**在 X 轴、Y 轴、Z 轴方面上布局，一起组成更复杂的、**2D 与 3D 混合**的 UI 组件。

这种应用被称作「**空间应用（Spatial App）**」。

空间应用是[新一代的 XR 应用]()，没有跟桌面/移动平台上的 2D 应用割裂，而是**延续了这些 2D 应用的优势**，并在此基础上，能在空间计算平台上获得**可选的、不同程度**的[空间化增强]()。

![image]()
![image]()
![image]()
![image]()
![image]()
![image]()

> [!NOTE]
> 以上示例来自：
> - https://apps.apple.com/us/app/globes/id6480082996
> - https://apps.apple.com/us/app/astronoma/id6502267850
> - https://apps.apple.com/us/app/museas/id6496682427
> - https://apps.apple.com/ca/app/art-universe/id6474541827
> - https://apps.apple.com/us/app/calendar-schedule-day-peek/id6477632294
> - https://apps.apple.com/us/app/numerics-track-your-metrics/id875319874?platform=vision

## 统一渲染

空间应用不像传统 XR 应用那样要负责绘制渲染自己的内容、实现完整的 XR 交互，而是由提供共享空间的操作系统来统一提供渲染服务，负责基础的自然交互（比如[眼手交互]()）。

多个空间应用能**在共享空间中融合到同一个坐标系和光照环境中**，有位置关系、前后遮挡、阴影等效果。

因此，空间应用不能随意实现各自不同的渲染机制、不受约束的独立绘制自己的内容，而是通过 OS 统一管理的 2D/3D 内容容器（称作「[场景（Scene）]()」）来提供内容，用操作系统能理解的 API （[空间化的 2D UI 元素、3D UI 元素]()）来描述内容，**让操作系统能理解和管理这些内容**，实现「**统一渲染（Unified Rendering)**」。

[统一渲染应用模型]()：

![image]()

visionOS 上的统一渲染架构：

![image]()

WWDC 视频中对于统一渲染的说明：

![image]()
![image]()
![image]()

---

下一节：[WebSpatial 特有概念](unique-concepts-in-webspatial.md)
