# Add a Web App Manifest

Previous step: [Add Icon Files](add-icon-files.md)

---

## Create the Web App Manifest file

First, create either `public/manifest.webmanifest` or `public/manifest.json` in your project.

> [!TIP]
> Both file types must be served as JSON by your web server. Any JSON MIME type is acceptable, such as `application/json`, but the recommended type is `application/manifest+json`.

Because the manifest is placed at the root of the public directory, the file should be reachable once the site is running under a URL like `https://www.myapp.com/manifest.webmanifest`.
> This is similar to how static files such as `robots.txt` and `favicon.ico` are served.

The manifest must contain at least the following properties:

```json5
{
  "name": "My Awesome App",
  "start_url": "/",
  "display": "minimal-ui",
  "icons": [
    {
      "src": "/pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/pwa-1024x1024.png",
      "sizes": "1024x1024",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

> [!IMPORTANT]
> The [Add Icon Files](add-icon-files.md) section lists the exact icon requirements and provides ready-to-use sample icons.
> If you only need to build an app that installs and runs in the visionOS simulator, you may omit the manifest entirely or exclude any of the properties above. For missing properties, [WebSpatial Builder](#) will fill in default placeholders automatically.

## How manifest properties affect a WebSpatial app

### `start_url`

The entry point that loads when the app starts. This property both sets the WebSpatial app’s default [**Start Scene**](#) and **determines how the app is packaged**:

- If `start_url` is an absolute URL (including an `http`-prefixed domain) or is converted to one via [`--base`](#), the packaged app will **not** include your site’s built assets (for example, the files Vite outputs to `dist/`). Instead, the app will **load all pages and static files on demand** from the server at runtime.
- If `start_url` is a relative path and you do **not** supply a domain through [`--base`](#), the packaged app will bundle your entire site (for example, everything in `dist/`). This produces a **fully offline** app that loads HTML and other static files directly from the package.

### `scope`

(Optional) The [URL scope](#) of the app. Defaults to all pages under the same path as `start_url`.

This property decides which URLs open inside the WebSpatial app (either navigating within the current [Scene](#) or opening a new one). URLs outside the scope open in the browser.

### `display`

Sets the display mode, which controls which native options appear in each Scene’s **native scene menu**.

| Mode           | Menu Behavior                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| **`minimal-ui`** | Adds native navigation controls such as **Back** and **Reload**. Your pages don’t need to implement full navigation (similar to a traditional website). |
| **`standalone`** | Removes native navigation (e.g. no **Back** button). Only basic options like **View URL** remain. Your pages must handle all navigation (similar to a native app). |
| **`fullscreen`** | Hides the scene menu by default—comparable to a game running full-screen on mobile (no battery/time indicators). |
| **`tabbed`**     | Tabs are not supported in WebSpatial. This mode automatically falls back to **minimal-ui**. |
| **`browser`**    | Not supported by PWAs or WebSpatial apps. |

### `icons`

Icons used during installation. [WebSpatial Builder](#) will read compatible files specified here.

At minimum, include:

- An icon with `"purpose": "any"` (required for all PWAs)
- A maskable icon at least 1024×1024 px with `"purpose": "maskable"` (required by [visionOS apps](#))

> [!IMPORTANT]
> Manifest properties not mentioned above are currently ignored by WebSpatial apps.

## Link the Web App Manifest in HTML

Add a `<link rel="manifest" ...>` pointing to the manifest URL in the `<head>` of **every** HTML template file.

> [!IMPORTANT]
> Under the PWA spec, every page that belongs to this PWA site must reference the manifest via a `<link>` tag. Otherwise the page cannot be recognized as part of the Web App.
> WebSpatial follows the same requirement—any page that should open inside the WebSpatial app (rather than in the browser) must include the manifest URL.

```html
<link rel="manifest" href="/manifest.webmanifest" />
```

> [!TIP]
> If your build tool hides the HTML template and you can’t edit `<head>` directly, it should offer a way to inject custom `<link>` tags.
> For example, in **rsbuild** you can modify the built-in HTML template through `rsbuild.config.js`:
>```js
>  plugins: [pluginReact()],
>  html: {
>    tags: [
>      {
>        tag: "link",
>        attrs: { rel: "manifest", href: "/manifest.webmanifest" },
>      },
>    ],
>  },
> ```

## Automatically add the manifest with tooling

If you prefer not to create the manifest file and modify HTML by hand, many tools can generate a Web App Manifest and inject it into every HTML file for you.

Example: In a Vite project, use the **VitePWA** plugin.

> [!NOTE]
> The following example shows the minimal configuration, disabling the Service Worker features that VitePWA enables by default and adding only the manifest.

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      manifest: {
        name: "My Awesome App",
        start_url: "/",
        scope: "/",
        display: "minimal-ui",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-1024x1024.png",
            sizes: "1024x1024",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      injectRegister: false,
      devOptions: {
        enabled: true,
      },
    }),
  ],
});
```

---

Next step: [Test PWA Installability](test-pwa-installability.md)
