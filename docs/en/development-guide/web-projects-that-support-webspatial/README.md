# Web Projects That Support WebSpatial

WebSpatial currently uses a [Hybrid approach]() that allows mainstream Web projects to immediately leverage the WebSpatial API and gain spatial-computing capabilities on XR platforms. This does not affect how those projects run on existing desktop/mobile platforms or in traditional browsers, nor does it compromise their cross-platform support.

> [!NOTE]
> WebSpatial already supports, or plans to support, the following spatial-computing platforms:
> - ✅ visionOS devices (such as Vision Pro)
> - ⏳ Android XR devices (no commercial hardware yet, planned)
> - ⏳ Meta Quest / Horizon OS devices (APIs missing, planned)
> - ⏳ PICO devices (planned)

## Using an Existing Web Project

Any Web project that meets the following requirements can use the [WebSpatial API]() out of the box:

1. **The current UI is built with React and Web standards, running directly in mainstream browser engines.**
   - By simply [configuring `jsx-runtime`]()—which does **not** affect the site’s [appearance or performance on other platforms]()—you can call WebSpatial’s [HTML API (JSX) and CSS API]() inside React. This works with PostCSS, Tailwind CSS, CSS-in-JS, and other CSS tooling.
   - Non-React projects can gain spatial capabilities via WebSpatial’s [Core SDK]() (documentation coming soon).
   - We plan to offer turnkey integrations for additional Web frameworks on top of the Core SDK—contributions are welcome!

2. **The existing UI implementation generally follows [React guidelines and best practices]().**
   - UI code is declarative, describing UI state rather than imperatively manipulating it; React decides when to update state and when to render.
   - State changes rely on one-way data flow and immutable data (data always flows from parent to child and is not mutated by child components).
   - Side effects are avoided inside React components or are controlled with React APIs to prevent them from running during rendering.
   - If parts of the project bypass React and manipulate the DOM directly, avoid using the React-based WebSpatial API on those sections to prevent conflicts.

3. **The code is built with one of the following mainstream Web build tools.**
   - Vite: just add WebSpatial’s [Vite plugin]().
   - Next.js: just add WebSpatial’s [Next.js plugin]().
   - Rsbuild: just add WebSpatial’s [Rsbuild plugin]().
   - Rspack or Webpack: add a [small amount of configuration]() using the helper functions provided by WebSpatial.

4. **The project’s Web server (including any third-party services) can control HTML output and static Web assets.**
   - The server can serve [HTML meant to load and run only inside a WebSpatial app]() for every site URL. That HTML in turn loads the static Web files in the [WebSpatial App Shell](), such as the JavaScript bundle that contains the WebSpatial SDK.

If you want to add the WebSpatial API to an existing Web project and package the site as a visionOS app with spatial capabilities, you can skip this section and proceed directly to:

- [Enabling WebSpatial in Web Projects](../enabling-webspatial-in-web-projects/README.md)

## Creating a New WebSpatial Project

If you prefer to start a brand-new Web project with WebSpatial support from day one—or build a fresh demo to experiment with the WebSpatial API and experience a WebSpatial app—follow the steps below to generate a standard Web site project that has not yet integrated WebSpatial:

- [Creating New Web Projects](creating-new-web-projects.md)
