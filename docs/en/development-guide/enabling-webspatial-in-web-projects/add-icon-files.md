# Add Icon Files

Return to: [Prerequisite: Become a Minimal PWA](prerequisite-become-a-minimal-pwa.md)

---

The first step is to provide app icons. The best practice for a WebSpatial project is to include at least the following icon files:

| Icon Size | Use           | Context                                                    | Transparent Background | Built-in Rounded Corners | How to Provide                |
|-----------|---------------|------------------------------------------------------------|------------------------|--------------------------|-------------------------------|
| 48 × 48   | favicon.ico   | Browser tab bar                                           | Required              | Allowed                 | [HTML `<link>`]()             |
| 180 × 180 | [iOS devices]() | “Add to Home Screen”                                     | Not allowed           | Not allowed             | [HTML `<link>`]()             |
| 192 × 192 | Regular PWA   | Small icon on the home screen                             | Required              | Required                | Web App Manifest              |
| **512 × 512** | Regular PWA   | Larger icon for splash screens, app stores, and similar | Required              | Required                | Web App Manifest              |
| **1024 × 1024** | [visionOS app]() | App icon in Vision Pro                                | **Not allowed**       | **Not allowed**         | WebSpatial + Web App Manifest |

Sample (you can use this directly in the demo):

[webspatial-icon-examples.zip](../../../assets/guide/webspatial-icon-examples.zip)


In addition to the standard PWA requirements, a **Packaged WebSpatial App** has extra icon rules:

Because the minimum icon size for a visionOS app is 1024 × 1024 and the system automatically crops icons into a circle, your site must supply a PWA-standard icon with **a minimum size of 1024 × 1024** and of type **`maskable`** (no transparent background or rounded corners) before it can be published to the visionOS App Store.

> [!TIP]
> Other PWA icons (such as the 512 × 512 and 192 × 192 versions) are typically type `"any"` and may include rounded corners and transparency, because not every platform performs automatic cropping.

At a minimum—so that the app can run independently on both desktop platforms and visionOS—you need to provide two icon versions:
- **512 × 512** (`"any"` type)
- **1024 × 1024** (`"maskable"` type)

In the [Web App Manifest](), these two icons are configured like this:

```json5
  "icons": [
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-1024-maskable.png",
      "sizes": "1024x1024",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
```

---

Next step: [Add a Web App Manifest](add-web-app-manifest.md)
