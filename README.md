<div align="center">
  <img src="assets/logo.png" alt="WebSpatial Logo" width="400"/>
</div>

# WebSpatial SDK

WebSpatial is a set of [minimal extensions to HTML/CSS/DOM APIs](https://tpac2025.webspatial.dev/) plus a [polyfill](https://www.w3.org/2001/tag/doc/polyfills/)-style open-source [SDK](https://webspatial.dev/docs/introduction/getting-started#webspatial-sdk). It brings [spatialized UI capabilities](https://webspatial.dev/docs/introduction/getting-started#features) equivalent to [native spatial apps](https://webspatial.dev/docs/concepts/spatial-computing.md#spatial-app) and a [2D containing 3D](https://webspatial.dev/docs/introduction/getting-started#philosophy) developer experience into Web standards and mainstream Web frameworks. This allows HTML content on [spatial computing](https://webspatial.dev/docs/concepts/spatial-computing.md) platforms to break free from the screen, enter real space, gain real volume, support natural spatial interactions and flexible 3D programming, while preserving the Web's original [cross-platform nature](https://webspatial.dev/docs/introduction/getting-started#philosophy), mental model, and [development workflow](https://webspatial.dev/docs/introduction/getting-started#preview). The goal is to let the mainstream Web ecosystem and Web developers move seamlessly into the era of [spatial computing and multimodal AI](https://tpac2025.webspatial.dev/).

## Packages

- [`@webspatial/react-sdk`](./packages/react/): React integration for WebSpatial APIs
- [`@webspatial/core-sdk`](./packages/core/): the underlying runtime-facing SDK
- [`@webspatial/builder`](./packages/cli/): tooling for previewing, building, and publishing packaged WebSpatial apps
- [`@webspatial/platform-visionos`](./packages/visionOS/): the visionOS runtime package used by Builder

## Documentation

The current documentation lives at [webspatial.dev](https://webspatial.dev).

- [Getting Started](https://webspatial.dev/docs/introduction/getting-started): overview, features, supported projects and platforms, installation, setup, preview, debugging, and distribution
- [Concepts](https://webspatial.dev/docs/concepts): spatial computing, WebSpatial apps, scenes, spatialized HTML elements, interactions, and 2D containing 3D
- [How-to](https://webspatial.dev/docs/how-to): practical setup guides for PWA requirements, SSR, Xcode, and App Store Connect
- [API](https://webspatial.dev/docs/api): reference docs for the React SDK and WebSpatial Builder:
- [React SDK API](https://webspatial.dev/docs/api/react-sdk): React components, CSS APIs, DOM APIs, events, JS APIs, and scene options
- [Builder API](https://webspatial.dev/docs/api/builder): `run`, `build`, and `publish`

## Contributing

We welcome contributions. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
