# Unique Concepts in WebSpatial

## WebSpatial App

Mainstream Web content today is confined to flat pages. In a Shared Space it can only exist as a pure 2D app and [lacks spatial APIs and the ability to use 3D space](#).

Content built with the WebXR API can access 3D space, but because it handles XR interaction itself and relies on low-level graphics APIs (WebGL and later WebGPU) to render independently, the operating system cannot “understand” it. For this reason, WebXR content currently cannot become an app inside a [Shared Space](#).

When a 2D webpage inside the Shared Space launches a WebXR session, that session takes over the entire space. It replaces the Shared Space, cannot coexist with other apps, and cannot even coexist with the webpage’s own 2D window.

A **WebSpatial App** is a type of [Spatial App](#) that works inside a [Shared Space](#). It inherits all mainstream Web APIs (HTML, CSS, and standard Web APIs) and adds the minimal set of new spatial APIs—the **[WebSpatial API](#)**. By combining these new and existing APIs, a WebSpatial App can describe mixed 2D-and-3D content in a way the operating system can understand and [render uniformly](#) inside the Shared Space.

Ideally, a WebSpatial App should combine the strengths of Web and native apps: it can run on demand without installation via a URL, yet it can also be installed, integrate tightly with the OS, and be distributed through an app store.

## WebSpatial API

This set of new spatial APIs is called the **WebSpatial API**.

To stay aligned with mainstream Web development and preserve existing content, the WebSpatial API is **an extension of today’s 2D Web APIs**—it is not an entirely separate stack.

For 2D content, the WebSpatial API does not introduce new UI elements. Instead, it lets existing HTML elements be **[spatialized directly](#)**.

When positioning elements in 3D space, the API reuses the **existing CSS layout features** on the X and Y axes (absolute positioning, CSS transforms, and so on) and only adds new CSS when [working with the Z axis](#).

The WebSpatial API introduces [3D content container elements](#) that HTML never had. These containers behave like `<img>`, `<video>`, or `<canvas>`: they can be laid out with other 2D elements and are positioned in 3D space using the same spatial API.

Through `window.open`, `<a target="_blank">`, and other [existing new-window APIs](#), the WebSpatial API manages an app’s [scene containers](#).

## WebSpatial SDK

Two hurdles prevent browsers from exposing the [WebSpatial API](#) directly. First, the APIs must go through the standards process, which takes time. Second, on visionOS only the system WebView is available, leaving no room to customize the browser engine.

In addition, although HTML and CSS sit at the foundation of Web development, most developers do not write them directly. Instead, they use **UI or application frameworks**—today React is the most popular. Developers author HTML via JSX and style via Tailwind CSS, PostCSS, or CSS-in-JS.

To meet urgent real-world needs without modifying browser engines, the WebSpatial project provides a **WebSpatial SDK designed for Web frameworks such as React + Vite**. This allows developers to start using the WebSpatial API immediately from within their framework’s HTML (JSX) and CSS layers.

After a Web project is built by a tool like Vite, the output is **Web code tailored for spatial-computing platforms**. A **native Spatial App called the WebSpatial App Shell** loads and runs that code in a **Web Runtime (the system WebView)**. A **non-standard JS bridge API** injected into the WebView lets the Web content communicate with the App Shell. The Web Runtime still renders 2D content, while the App Shell uses native capabilities to spatialize that 2D content and render 3D content.

This **hybrid approach** enables a **standards-based Web App (a [PWA](#))** to gain spatial capabilities and user experience comparable to a native Spatial App starting today.

The WebSpatial SDK has two main parts.

* **Runtime layer** – Framework-specific SDKs such as the **[React SDK](#)** expose WebSpatial APIs at runtime. These framework SDKs are built on the lower-level **[Core SDK](#)**, a framework-agnostic JavaScript library.

* **Build layer** – Because a WebSpatial App relies on an App Shell for spatial capabilities, the SDK provides **[WebSpatial Builder](#)**. This tool packages a **Packaged WebSpatial App** for a specific platform—for example, a visionOS app bundle. The bundle contains the platform-specific WebSpatial App Shell, which launches the Web Runtime (system WebView) to load the build output. The resulting app can be installed on the simulator or device and submitted to an app store.

> [!NOTE]
> WebSpatial Builder also supports [offline-packing the Web build output](#) into the native bundle. In that mode the App Shell loads the Web files from local storage instead of from a server. The app loses cross-platform reach and URL sharing but still benefits from the Web development ecosystem and tooling.

If you install the upcoming **WebSpatial Browser** on the target platform, you can skip packaging and app-store submission. The browser already contains the WebSpatial App Shell, so you can open any WebSpatial App URL directly and experience it in spatial form.

![](../../assets/concepts/2-1.png)

---

Next section: [Scenes and Spatial Layouts](scenes-and-spatial-layouts.md)
