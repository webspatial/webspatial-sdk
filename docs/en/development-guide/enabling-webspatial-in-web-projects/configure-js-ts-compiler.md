# Configure the JS/TS Compiler

Current location: [Step 3: Integrate the WebSpatial SDK into Web Build Tools](step-3-integrate-webspatial-sdk-into-web-build-tools.md)

---

To use the [WebSpatial API](../../core-concepts/unique-concepts-in-webspatial.md#webspatial-api) inside a UI framework such as React, you need to integrate WebSpatial's framework SDK (currently only the [React SDK](./step-1-install-the-webspatial-sdk.md#react-sdk)) into the JS/TS compiler used by your Web project. This allows the SDK to affect JSX transforms and other stages that involve the HTML/CSS APIs.

> [!IMPORTANT]
> In builds targeting desktop/mobile platforms and regular browsers, [the SDK is inactive](./generate-a-webspatial-specific-website.md) - it adds no extra code and makes no changes to behavior or performance.

## TypeScript

In a React + TypeScript project, you typically integrate WebSpatial's React SDK in `tsconfig.json`.

```diff
{
  "compilerOptions": {
+   "jsxImportSource": "@webspatial/react-sdk",
```

> [!TIP]
> If `tsconfig.json` is split into a client-side `tsconfig.app.json` and a Node.js-side `tsconfig.node.json`, add this configuration to both files.

Some toolchains add an abstraction layer on top of `tsconfig`, so in these cases, you must use the toolchain's own configuration to modify `tsconfig`.

For example, if your Vite project is using SWC, you'll need to add the `jsxImportSource` via the SWC plugin config.

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

Example [using Rsbuild](./add-optimizations-and-defaults-to-web-build-tools.md#rsbuild):

```diff
// rsbuild.config.ts
import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'

export default defineConfig({
  plugins: [
    pluginReact({
      swcReactOptions: {
        runtime: 'automatic',
+       importSource: '@webspatial/react-sdk',
      },
    }),
```

Example [using Rspack](./add-optimizations-and-defaults-to-web-build-tools.md#rspack):

```diff
  module: {
    rules: [
      {
        test: /\.(jsx?|tsx?)$/,
        use: [
          {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                },
                transform: {
                  react: {
+                   importSource: '@webspatial/react-sdk',
                    runtime: 'automatic',
                    development: isDev,
                    refresh: isDev,
                  },
                },
```

## JavaScript

In a React + JavaScript project, the JS compiler is usually embedded inside the Web build tool, so you need to integrate WebSpatial's React SDK through the build tool's configuration file.

Example [using Vite](./add-optimizations-and-defaults-to-web-build-tools.md#vite):

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
