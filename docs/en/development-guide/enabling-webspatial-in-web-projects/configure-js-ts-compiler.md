# Configure the JS/TS Compiler

Current location: [Step 3: Integrate the WebSpatial SDK into Web Build Tools](step-3-integrate-webspatial-sdk-into-web-build-tools.md)

---

To use the [WebSpatial API]() inside a UI framework such as React, you need to integrate WebSpatial’s framework SDK (currently only the React SDK) into the JS/TS compiler used by your Web project. This allows the SDK to affect JSX transforms and other stages that involve the HTML/CSS APIs.

> [!IMPORTANT]
> In builds targeting desktop/mobile platforms and regular browsers, the SDK is inactive—it adds no extra code and makes no changes to behavior or performance. See the next section, “[Generate a WebSpatial-Specific Website](generate-a-webspatial-specific-website.md),” for details.

## TypeScript

In a React + TypeScript project, you typically integrate WebSpatial’s React SDK centrally in `tsconfig.json`.

```diff
{
  "compilerOptions": {
+   "jsxImportSource": "@webspatial/react-sdk",
```

> [!TIP]
> If `tsconfig.json` is split into a client-side `tsconfig.app.json` and a Node.js-side `tsconfig.node.json`, add this configuration to both files.

Some toolchains add an abstraction layer on top of `tsconfig`, so you must use the toolchain’s own configuration to modify `tsconfig`.

For example, `@vitejs/plugin-react-swc`:

```diff
// vite.config.js
import { defineConfig } from "vite";
+import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [
    react({
+     "jsxImportSource": "@webspatial/react-sdk",
    })
  ],
});
```

## JavaScript

In a React + JavaScript project, the JS compiler is usually embedded inside the Web build tool, so you need to integrate WebSpatial’s React SDK through the build tool’s configuration file.

For example, Vite:

```diff
// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
+     "jsxImportSource": "@webspatial/react-sdk",
    })
  ],
});
```

---

Next section: [Integrate Optimizations and Default Configuration into Web Build Tools](add-optimizations-and-defaults-to-web-build-tools.md)
