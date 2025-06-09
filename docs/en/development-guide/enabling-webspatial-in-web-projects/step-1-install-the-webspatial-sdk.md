# Step&nbsp;1: Install the WebSpatial SDK

Previous step: [Prerequisite: Become a (Minimal) PWA](prerequisite-become-a-minimal-pwa.md)

---

> [!TIP]
> If you are working with a [newly created Web project], follow the steps in “Add pnpm” to switch the project to pnpm. This will make the dependency installation below noticeably faster.

<a id="core-deps-for-runtime"></a>
## Install core dependencies required at runtime

```shell
pnpm add @webspatial/react-sdk @webspatial/core-sdk @google/model-viewer three
```

<a id="react-sdk"></a>
### `@webspatial/react-sdk`

The React SDK from the [WebSpatial SDK]() makes the [WebSpatial API]() immediately available inside React.

<a id="core-sdk"></a>
### `@webspatial/core-sdk`

Both the React SDK (and forthcoming SDKs for other Web frameworks) are implemented on top of the Core SDK. The Core SDK is a framework-agnostic, lower-level pure-JS API that relies internally on a non-standard JS Bridge API so that the WebSpatial App Shell can natively spatialize 2D HTML content and render 3D content.

> [!NOTE]
> `@google/model-viewer` and `three` are required internally by the SDK. Because these packages are large, are often needed directly by Web projects themselves, and may become optional in future SDK versions, they are declared as peerDependencies. You need to install them explicitly in your Web project.

<a id="core-deps-for-building"></a>
## Install core dependencies required at build time

```shell
pnpm add -D @webspatial/builder
```

<a id="builder"></a>
### `@webspatial/builder`

The WebSpatial build tool packages the current Web site into a [Packaged WebSpatial App](). It is currently essential for developing, debugging, and distributing WebSpatial apps on visionOS.

See the detailed API in [Step 2: Add the WebSpatial App Build Tool](step-2-add-build-tool-for-packaged-webspatial-apps.md).

<a id="optional-deps-for-building"></a>
### Optional core dependencies for build time

These optional dependencies let each Web project include only the platform support it actually needs, keeping builds lean.

> [!NOTE]
> For now they are effectively required, because visionOS is the only spatial-computing platform currently supported by WebSpatial.

```shell
pnpm add -D @webspatial/platform-visionos
```

<a id="visionos"></a>
### `@webspatial/platform-visionos`

Includes the [WebSpatial App Shell]() needed to generate a visionOS app and provide spatial capabilities.

<a id="visionos-simulator"></a>
#### Install Xcode and the visionOS Simulator

To build and package a visionOS app and debug it in the simulator, you need the global tools Xcode and the visionOS Simulator. Steps:

> Prerequisite: you must use a Mac.

1. Open the Mac App Store, search for “Xcode,” and install it.
2. Launch Xcode for the first time, accept the license, and enter your administrator password to install additional components.
3. Choose **Xcode ▸ Settings…**, open the **Components** tab, and in **Platform Support** find **visionOS** and **visionOS Simulator**. Download and install both items.

<a id="non-core-deps-for-building"></a>
## Non-core dependencies for build time

These plugins integrate with popular third-party toolchains to simplify setup and apply [essential performance optimizations and sensible defaults]().

If you use a React + Vite project:

```shell
pnpm add -D @webspatial/vite-plugin
```

<a id="plugin-vite"></a>
### `@webspatial/vite-plugin`

The WebSpatial Vite plugin adds the required optimizations and defaults when your Web project uses Vite as its Web builder and development server.

If you use a React + Next.js project:

```shell
pnpm add -D @webspatial/next-plugin
```

<a id="plugin-next"></a>
### `@webspatial/next-plugin`

> [!WARNING]
> Currently in testing; documentation coming soon.

If you use a React + rsbuild project:

```shell
pnpm add -D @webspatial/rsbuild-plugin
```

<a id="plugin-rsbuild"></a>
### `@webspatial/rsbuild-plugin`

> [!WARNING]
> Currently in testing; documentation coming soon.

If you use a React + rspack project:

```shell
pnpm add -D @webspatial/rspack-plugin
```

<a id="plugin-rspack"></a>
### `@webspatial/rspack-plugin`

> [!WARNING]
> Currently in testing; documentation coming soon.

If you use a React + webpack project:

> [!WARNING]
> Currently in testing; documentation coming soon.

---

Next step: [Step 2: Add the WebSpatial App Build Tool](step-2-add-build-tool-for-packaged-webspatial-apps.md)
