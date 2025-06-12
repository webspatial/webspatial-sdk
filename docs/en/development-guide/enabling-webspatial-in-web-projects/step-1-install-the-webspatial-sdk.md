# Step 1: Install the WebSpatial SDK

Previous step: [Prerequisite: Become a (Minimal) PWA](prerequisite-become-a-minimal-pwa.md)

---

<a id="core-deps-for-runtime"></a>
## Core runtime dependencies

```shell
pnpm add @webspatial/react-sdk @webspatial/core-sdk @google/model-viewer three
```

> [!NOTE]
> `@google/model-viewer` and `three` are dependencies used inside the SDK, but their package sizes are relatively large compared to the SDK itself. Plus, many web projects might already use them, and having multiple versions installed could cause conflicts. In the future, the SDK might remove direct dependencies on them. So, they're declared as peerDependencies for now, you'll need to install them explicitly in your web project.

<a id="react-sdk"></a>
### `@webspatial/react-sdk`

The [SDK](../../core-concepts/unique-concepts-in-webspatial.md#webspatial-sdk) offered by WebSpatial for React, which can be plugged into existing regular React projects to enable immediate use of the [WebSpatial API](../../core-concepts/unique-concepts-in-webspatial.md#webspatial-api).

<a id="core-sdk"></a>
### `@webspatial/core-sdk`

Both the React SDK (and forthcoming SDKs for other Web frameworks) are implemented on top of the Core SDK. The Core SDK is a framework-agnostic, lower-level pure-JS API that relies internally on a non-standard JS Bridge API so that the [WebSpatial App Shell](../../core-concepts/unique-concepts-in-webspatial.md#webspatial-sdk) can natively spatialize 2D HTML content and render 3D content.

<a id="core-deps-for-building"></a>
## Core build-time dependencies

```shell
pnpm add -D @webspatial/builder
```

<a id="builder"></a>
### `@webspatial/builder`

WebSpatial's packaging tool turns your website into a [Packaged WebSpatial App](../../core-concepts/unique-concepts-in-webspatial.md#webspatial-sdk). It's the must-have dev tool right now for developing, testing, and distributing WebSpatial apps on visionOS.

See ["Step 2: Add the WebSpatial App Build Tool"](./step-2-add-build-tool-for-packaged-webspatial-apps.md) for how to use it.

<a id="optional-deps-for-building"></a>
### Optional core build-time dependencies

These optional dependencies let each Web project include only the platform support it actually needs, keeping builds lean.

<a id="visionos"></a>
#### `@webspatial/platform-visionos`

```shell
pnpm add -D @webspatial/platform-visionos
```

Includes the [WebSpatial App Shell](../../core-concepts/unique-concepts-in-webspatial.md#webspatial-sdk) needed to generate a visionOS app and provide spatial capabilities.


> [!NOTE]
> This package is currently required, as visionOS is the sole spatial computing platform supported by WebSpatial at this stage.

<a id="visionos-simulator"></a>

> [!TIP]
> **Install Xcode and the visionOS Simulator**
>
> To build and package a visionOS app and debug it in the visionOS simulator, you need to install the relevant global dependencies: Xcode and the visionOS Simulator.
>
> Prerequisite: a Mac computer
>
> Steps:
> 1. Open the Mac App Store, search for "Xcode", and install it.
> 2. On first launch, agree to the license and enter the admin password to install additional components.
> 3. Click the top menu "Xcode" > "Settings…". In the "Components" tab, find visionOS and visionOS Simulator under "Platform Support", then install both.

<a id="non-core-deps-for-building"></a>
## Non-core build-time dependencies

These plugins integrate with popular third-party toolchains to simplify setup and apply [essential performance optimizations and sensible defaults](./add-optimizations-and-defaults-to-web-build-tools.md).

<a id="plugin-vite"></a>
### `@webspatial/vite-plugin`

If you use a React + Vite project:

```shell
pnpm add -D @webspatial/vite-plugin
```

WebSpatial's Vite plugin adds the required optimizations and defaults when your Web project uses Vite as its web build tool and web server.

<a id="plugin-next"></a>
### `@webspatial/next-plugin`

If you use a React + Next.js project:

```shell
pnpm add -D @webspatial/next-plugin
```

WebSpatial's Next.js plugin adds the required optimizations and defaults when your Web project is based on Next.js framework.

<a id="plugin-rsbuild"></a>
### `@webspatial/rsbuild-plugin`

If you use a React + Rsbuild project:

```shell
pnpm add -D @webspatial/rsbuild-plugin
```

WebSpatial's Rsbuild plugin adds the required optimizations and defaults when your Web project uses Rsbuild as its web build tool and web server.

<a id="plugin-rspack"></a>
### `@webspatial/rspack-plugin`

If you use a React + Rspack project:

```shell
pnpm add -D @webspatial/rspack-plugin
```

WebSpatial's Rspack plugin adds the required optimizations and defaults when your Web project uses Rspack as its web build tool and web server.

---

Next step: [Step 2: Add the WebSpatial App Build Tool](step-2-add-build-tool-for-packaged-webspatial-apps.md)
