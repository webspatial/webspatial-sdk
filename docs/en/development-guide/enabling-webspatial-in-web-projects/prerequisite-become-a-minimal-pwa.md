# Prerequisite: Become a Minimal PWA

Previous step:
- Use an existing Web project: [Web Projects That Support WebSpatial](../web-projects-that-support-webspatial/README.md)
- Create a brand-new WebSpatial project: [Creating New Web Projects](../web-projects-that-support-webspatial/creating-new-web-projects.md)

---

To give a WebSpatial app the capabilities and experience of a native [spatial app](../../core-concepts/shared-space-and-spatial-apps.md#spatial-apps) - like having its own [standalone window](../../core-concepts/scenes-and-spatial-layouts.md#scene-menu) instead of just running inside a browser - it needs to be more than just a bunch of webpages. **It has to become an actual "app" which means adding app-level info** like the app name, app icon, [which pages it includes](./add-web-app-manifest.md#scope), and [what the start page is](../../core-concepts/scenes-and-spatial-layouts.md#start-scene).

> Traditional websites are a loose set of pages and do not include application-level metadata, containing only page-level info like the page title and favicon (page icon).

Some WebSpatial apps also need to be listed in app stores like native apps, reaching users on the platform the same way native apps do. That also requires adding app-level metadata.

> [!TIP]
> For today's [Hybrid-based](../../core-concepts/unique-concepts-in-webspatial.md#webspatial-sdk) WebSpatial apps, listing in app stores is essential for user acquisition.

While becoming an actual "app", the project must remain a **standard website** that can still run in regular browsers. This keeps [**key Web strengths**](https://developer.picoxr.com/document/web/introduce-power-of-web/): true cross-platform reach, shareable URLs, and on-demand usage without installation.

The **[PWA technology](https://web.dev/explore/progressive-web-apps)** defined in Web standards meets these requirements. It adds app-level info to a website and makes it installable. WebSpatial builds on many existing mainstream Web APIs, including the PWA standard.

Therefore, before introducing the WebSpatial API, make sure your site is already a valid PWA.

If your site is not yet a PWA, you only need to create the **simplest possible PWA** - as long as the site includes a valid [**Web App Manifest**](./add-web-app-manifest.md), it can be installed as a PWA and meet WebSpatial's requirements.

> [!IMPORTANT]
> If you only need to create an app for [**installation and execution in the visionOS simulator**](./step-2-add-build-tool-for-packaged-webspatial-apps.md#run), you do not have to convert the site to a PWA first. [**WebSpatial Builder**](./step-2-add-build-tool-for-packaged-webspatial-apps.md) will automatically supply placeholder values like the app name and icon.
> However, to generate an installable app package, [**install it on a real Vision Pro device**](./step-2-add-build-tool-for-packaged-webspatial-apps.md#build), or [**distribute via App Store Connect**](./step-2-add-build-tool-for-packaged-webspatial-apps.md#publish) with a real name, icon, and other baseline app details, you must first turn the site into a PWA.

Follow these steps:

1. [Add icon files](add-icon-files.md)
2. [Add a Web App Manifest](add-web-app-manifest.md)
3. [Test PWA installability](test-pwa-installability.md)
