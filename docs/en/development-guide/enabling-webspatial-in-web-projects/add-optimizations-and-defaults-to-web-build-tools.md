# Integrate Optimizations and Default Configuration into Web Build Tools

Current location: [Step 3: Integrate the WebSpatial SDK into Web Build Tools](step-3-integrate-webspatial-sdk-into-web-build-tools.md)

---

In addition to [Configure the JS/TS Compiler](configure-js-ts-compiler.md), a Web project that includes the [WebSpatial SDK]() needs several essential performance optimizations and default configuration values (convention over configuration). These optimizations and defaults are implemented through the project's web build tool and web server.

If your project uses a higher-level framework such as Next.js, Vite, or Rsbuild—tools that bundle a Web Builder and Web Server—you only need to add the corresponding [WebSpatial plugin]() to their configuration. These ready-made plugins spare you from manual setup and reduce boilerplate in the codebase.

If your project relies directly on a lower-level Web Builder such as Rspack or Webpack, you can follow the guidelines in this document to integrate these optimizations and defaults by hand.

> [!NOTE]
> A detailed list of optimizations and default settings appears in “[Generate a WebSpatial-Specific Website](generate-a-webspatial-specific-website.md)” and “[Check if Running in WebSpatial Mode](check-if-running-in-webspatial-mode.md).”

## React + Vite

Add the WebSpatial Vite plugin directly in `vite.config.ts` or `vite.config.js`:

```diff
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
+import webSpatial from "@webspatial/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
+   webSpatial(),
    react({
```

## React + Next.js

> [!WARNING]
> In testing. Documentation coming soon.

## React + Rsbuild

> [!WARNING]
> In testing. Documentation coming soon.

## React + Rspack / Webpack

> [!WARNING]
> In testing. Documentation coming soon.

## Configuration Without Plugins

> [!WARNING]
> In testing. Documentation coming soon.

---

Next section: [Generate a WebSpatial-Specific Website](generate-a-webspatial-specific-website.md)
