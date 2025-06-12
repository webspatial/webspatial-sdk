# Add Optimizations and Defaults to Web Build Tools

Current location: [Step 3: Integrate the WebSpatial SDK into Web Build Tools](step-3-integrate-webspatial-sdk-into-web-build-tools.md)

---

In addition to [Configure the JS/TS Compiler](./configure-js-ts-compiler.md), a Web project that includes the [WebSpatial SDK](../../core-concepts/unique-concepts-in-webspatial.md#webspatial-sdk) needs several essential performance optimizations and default configuration values (convention over configuration). These optimizations and defaults need to be implemented through the project's web build tool and web server.

If your project uses a higher-level framework such as Next.js, Vite, or Rsbuild—tools that bundle a web build tool and web server, you only need to add the corresponding [WebSpatial plugin](./step-1-install-the-webspatial-sdk.md#non-core-deps-for-building) to their configuration. These ready-made plugins spare you from manual setup and reduce boilerplate in the codebase.

<!-- If your project relies directly on a lower-level web build tool such as Webpack, you can follow the guidelines in this document to integrate these optimizations and defaults by hand. -->

> [!NOTE]
> What exactly is optimized and preconfigured is explained in ["Generate a WebSpatial-Specific Website"](./generate-a-webspatial-specific-website.md) and ["Check if Running in WebSpatial Mode"](./check-if-running-in-webspatial-mode.md).

<a id="vite"></a>
## React + Vite

Add the [Vite plugin](./step-1-install-the-webspatial-sdk.md#plugin-vite) in `vite.config.ts` or `vite.config.js`:

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

If it's a TypeScript project, add `/// <reference types="@webspatial/vite-plugin" />` to `vite-env.d.ts`.


<a id="next"></a>
## React + Next.js

Add the [Next.js plugin](./step-1-install-the-webspatial-sdk.md#plugin-next) in `next.config.ts` or `next.config.js`:

```diff
// next.config.ts
+import withWebSpatial from '@webspatial/next-plugin';

const nextConfig: NextConfig =
+ withWebSpatial()(
    {
      // other config
```

If it's a TypeScript project, create a `env.d.ts` file and add `/// <reference types="@webspatial/next-plugin" />`.


<a id="rsbuild"></a>
## React + Rsbuild

Add the [Rsbuild plugin](./step-1-install-the-webspatial-sdk.md#plugin-rsbuild) in `rsbuild.config.ts` or `rsbuild.config.mjs`:

```diff
// rsbuild.config.ts
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
+import webSpatial from '@webspatial/rsbuild-plugin';

export default defineConfig({
  plugins: [
    pluginReact({
      swcReactOptions: {
        runtime: 'automatic',
+       importSource: '@webspatial/react-sdk',
      },
    }),
+   webSpatial(),
  ],
})
```

If it's a TypeScript project, add `/// <reference types="@webspatial/rsbuild-plugin" />` to `env.d.ts`.


<a id="rspack"></a>
## React + Rspack

Add the [Rspack plugin](./step-1-install-the-webspatial-sdk.md#plugin-rspack) in `rspack.config.ts` or `rspack.config.mjs`:

```diff
// rspack.config.mjs
import path, { dirname } from 'node:path'
import { defineConfig } from '@rspack/cli'
import { rspack } from '@rspack/core'
import RefreshPlugin from '@rspack/plugin-react-refresh'
+import WebSpatialPlugin from '@webspatial/rspack-plugin'
import { fileURLToPath } from 'node:url'

const isDev = process.env.NODE_ENV === 'development'

// Target browsers, see: https://github.com/browserslist/browserslist
const targets = ['chrome >= 87', 'edge >= 88', 'firefox >= 78', 'safari >= 14']
const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  context: __dirname,
  entry: {
    main: './src/main.tsx',
  },
  resolve: {
    extensions: ['...', '.ts', '.tsx', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.svg$/,
        type: 'asset',
      },
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
              },
              env: { targets },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: './index.html',
    }),
    isDev ? new RefreshPlugin() : null,
+   new WebSpatialPlugin(),
  ].filter(Boolean),
  optimization: {
    minimizer: [
      new rspack.SwcJsMinimizerRspackPlugin(),
      new rspack.LightningCssMinimizerRspackPlugin({
        minimizerOptions: { targets },
      }),
    ],
  },
  experiments: {
    css: true,
  },
  devServer: {
    port: 3000,
  },
  output: {
    // publicPath: '/mybase',
  },
})
```

If it's a TypeScript project, add `/// <reference types="@webspatial/rspack-plugin" />` to `react-env.d.ts`.


<a id="no-plugins"></a>
## Configuration Without Plugins

> [!WARNING]
> In testing. Documentation coming soon.

---

Next section: [Generate a WebSpatial-Specific Website](generate-a-webspatial-specific-website.md)
