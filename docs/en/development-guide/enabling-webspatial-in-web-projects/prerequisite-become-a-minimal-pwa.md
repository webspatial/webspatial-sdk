# Prerequisite: Become a Minimal PWA

Previous step:
- Use an existing Web project: [Web Projects That Support WebSpatial](../web-projects-that-support-webspatial/README.md)
- Create a brand-new WebSpatial project: [Creating New Web Projects](../web-projects-that-support-webspatial/creating-new-web-projects.md)

---

To give a WebSpatial app native spatial-app capabilities and a proper user experience (for example, having **its own independent window** instead of running only inside a browser), the project must become an **application**, not just “a collection of pages.” You need to add **app-level details** such as the app name, icons, and a [starting screen](#).

> Traditional websites are a loose set of pages and do not include this information, containing only page-level details like the page title and favicon.

Some WebSpatial apps also need to ship through an app store, reaching users on the platform the same way native apps do.

> [!TIP]
> For today’s **Hybrid-based** WebSpatial apps, listing in an app store is often essential for user acquisition.

While becoming an application, the project must remain a **standard website** that can still run in the browser. This keeps existing Web strengths: true cross-platform reach, shareable URLs, and on-demand usage without installation.

The **[PWA technology](#)** defined in Web standards meets these requirements. It adds app-level information to a site and makes it installable. WebSpatial builds on many existing mainstream Web APIs, including the PWA standard.

Therefore, before introducing the WebSpatial API, make sure your site is already a valid PWA.

> [!IMPORTANT]
> If you only need to create an app **that installs and runs in the visionOS simulator**, you do not have to convert the site to a PWA first. **WebSpatial Builder** will automatically supply placeholder values like the app name and icon.
> However, to generate an installable package, **install it on a real Vision Pro device**, or **distribute via App Store Connect** with a real name, icon, and other baseline app details, you must first turn the site into a PWA.

If your site is not yet a PWA, you only need to create the **simplest possible PWA**—as long as the site includes a **Web App Manifest** and can be installed as a PWA, it satisfies WebSpatial’s requirements.

Follow these steps:

1. [Add icon files](add-icon-files.md)
2. [Add a Web App Manifest](add-web-app-manifest.md)
3. [Test PWA installability](test-pwa-installability.md)
