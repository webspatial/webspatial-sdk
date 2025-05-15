# The New Generation of Spatial Apps

Previous section: [New Powers for XR Apps](new-powers-for-xr-apps.md)

---

With Apple’s release of the new XR OS, visionOS, and its new spatial-computing architecture ([Unified Rendering app model](https://developer.picoxr.com/news/multi-app-rendering/)), the long-standing bottlenecks of **traditional XR apps** have been fundamentally addressed.

The new generation of XR apps—**spatial apps**—are not cut off from the 2D apps on desktop and mobile platforms. Instead, they extend the advantages of those 2D apps, adding **spatial capabilities** that bring optional enhancements on spatial-computing platforms and free them from flat 2D windows.

![image]()
![image]()
![image]()
![image]()

## Comparing Three App Types

> [!NOTE]
> In the comparisons below, underline means advantage and *italics* mean disadvantage.

### Multitasking

- **Spatial apps**
  - <ins>Can run and use **multiple [apps that include 3D content]()** at the same time.</ins>
  - <ins>Can **switch focus** between apps quickly.</ins>
  - <ins>Can **keep auxiliary apps open** while using a primary app.</ins>

- **Desktop/Mobile apps**
  - Can run and use **multiple apps** at the same time.
  - <ins>Can **switch focus** between apps quickly.</ins>
  - <ins>Can **keep auxiliary apps open** while using a primary app.</ins>

- **Traditional XR apps**
  - *Only one app with 3D content can run at a time.*
  - *Switching requires quitting the current app and launching the next, which is costly.*
  - *Cannot keep auxiliary apps (especially 3D apps) open while using a primary app.*

### Relationship with the OS

- **Spatial apps**
  - <ins>An app can [**own the entire 3D space**]() or only [**a local part of it**]() such as its own [scene container (similar to a bounding box)](), while the OS handles the rest.</ins>
  - <ins>Because the OS supplies most functionality and a unified experience, the app can [**focus on its unique value**](), so design and development costs stay low and binaries are small.</ins>

- **Desktop/Mobile apps**
  - Each app provides **content only within its window**; the OS does the rest.
  - <ins>Because the OS supplies most functionality and a unified experience, the app can **focus on its unique value**, so design and development costs stay low and binaries are small.</ins>

- **Traditional XR apps**
  - The app **takes over** the entire 3D space, rendering **all** visuals and features (excluding the OS’s flat overlays).
  - *The app must satisfy nearly all user needs on its own, so design and development costs are high, binaries are large, and experiences are inconsistent across apps.*

### 3D Capability

- **Spatial apps**
  - <ins>2D and 3D content can [**break out of flat windows**](), appearing anywhere in the 3D space.</ins>
  - To let multiple apps [**share one 3D space (unified rendering)**](), apps cannot implement arbitrary rendering pipelines. They supply content via [OS-managed 2D/3D containers]() and describe it with OS-understood APIs; the OS handles the rendering.

- **Desktop/Mobile apps**
  - *Both 2D and 3D content must stay in a single plane (3D is **projected** onto that plane).*

- **Traditional XR apps**
  - <ins>2D and 3D content can be shown **anywhere** in the app’s **exclusive** 3D space.</ins>

### Interaction Capability

- **Spatial apps**
  - <ins>Leverage environment sensing, head tracking, hand tracking, and eye tracking to deliver [**truly natural interaction**]().</ins>
  - <ins>Need no controllers. Regardless of GUI type (2D or 3D) or distance, they default to the most efficient [gaze-and-pinch](). The OS implements the visuals, keeping costs down and UX consistent.</ins>

- **Desktop/Mobile apps**
  - *Interaction has evolved from mouse and keyboard to touch, gradually approaching **natural interaction** in the physical world.*

- **Traditional XR apps**
  - <ins>Environment sensing, head tracking, XR controllers, or hand gestures allow further progress toward **natural interaction** beyond touch.</ins>
  - For distant 2D GUIs, users must aim a pointer ray with a controller or hand, which feels less natural and is slower than a mouse.

### Development Approach

- **Spatial apps**
  - <ins>Built on [**2D GUI frameworks enhanced with spatial features**]().</ins>
  - <ins>Fit almost every business domain and app type (except a few heavy 3D niches) while extending familiar product/GUI patterns.</ins>
  - <ins>[APIs]() are highly abstract, concrete, and intuitive, so they have a low learning curve.</ins>
  - <ins>They tap into a huge talent pool and a rich open-source ecosystem.</ins>

- **Desktop/Mobile apps**
  - Based on **2D GUI frameworks**.
  - <ins>Fit almost every domain and app type (except some 3D games) with existing product/GUI patterns.</ins>
  - <ins>APIs are abstract, concrete, and intuitive, so learning is easy.</ins>
  - <ins>They enjoy a large developer base and thriving open source.</ins>

- **Traditional XR apps**
  - Based on **3D game engines**.
  - *Beyond games, few product/GUI patterns exist.*
  - *APIs stem from computer graphics, so they are **low level**, less intuitive, and harder to learn.*
  - *The developer base and ecosystem are smaller, skewing toward paid tools with fewer high-quality open-source options.*

### Interaction Implementation

- **Spatial apps**
  - <ins>The **OS provides** [basic GUI events (for 2D)]() and [advanced events (for 3D or 2D)]().</ins>
  - <ins>The OS renders common interaction visuals.</ins>

- **Desktop/Mobile apps**
  - <ins>The **OS provides** basic GUI events.</ins>
  - <ins>The OS renders the mouse cursor.</ins>

- **Traditional XR apps**
  - *The app itself handles 2D or 3D events.*
  - *The app must render controller or hand visuals.*
  - *Building XR interaction is costly, requiring custom code or inconsistent XR toolkits.*

### UI Implementation

- **Spatial apps**
  - <ins>The UI is built from **GUI widget objects (including [3D container widgets]())**.</ins>
  - <ins>The OS and framework **render** those objects each frame; the app does not care about drawing.</ins>
  - <ins>Position and size come from their [**layout relationships**]() and attributes. Developers think in terms of **stacking blocks**, fully in code, without visual editors.</ins>

- **Desktop/Mobile apps**
  - The UI is built from **GUI widget objects**.
  - <ins>The OS and framework **render** those objects each frame; the app does not care about drawing.</ins>
  - <ins>Layout relationships and attributes determine position and size; developers think in **blocks**, code-centric, no visual editor needed.</ins>

- **Traditional XR apps**
  - The UI is built from **graphics objects**.
  - *The app itself renders those objects each frame.*
  - *Position and size come from object coordinates; visual editors are usually required to make results concrete.*

## Problems with Traditional XR Apps

Before visionOS, apps on XR platforms were **completely different** from apps on desktop and mobile:

![Desktop/Mobile apps]()
![Traditional XR apps]()

As shown above, and in the first section’s three major advantages, **traditional XR apps lag in both user experience and development workflow, losing many benefits of desktop/mobile apps**. XR development could not reuse code, tools, or mindsets from mainstream platforms, so it struggled to support diverse business scenarios. Developer numbers stayed low, and both barrier to entry and cost remained high.

---

Continue to the next section: [HTML/CSS and WebXR](html-css-and-webxr.md)
