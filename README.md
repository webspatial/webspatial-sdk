

<div align="center">
  <img src="assets/logo.png" alt="WebSpatial Logo" width="400"/>

  <a href="https://youtu.be/QRWjRoKKuXI?si=RvC66Y7X_eyWoRwv" target="_blank">[Video] What if the web could be spatialized too? </a>
</div>

# WebSpatial SDK

WebSpatial is a set of spatial APIs and ready-to-use SDK that extend the standard 2D Web ecosystem to support spatial computing across platforms. It enables the entire HTML/CSS-based Web world to step into the spatial era, gaining spatial power on par with native apps (like visionOS apps) while keeping the advantages they already have.

- **Open standard vision**: Extends existing HTML/CSS/JS with minimal new spatial APIs
- **2D Developer friendly**: Extending the existing web development ecosystem and 2D web development mindset
- **Zero-rewrite adoption** – Drop the SDK into an existing React project and with zero intrusion or additional cost
- **Cross-platform** – desktops, mobiles, and spatial-computing platfroms share one codebase.

<div align="center" style="width: 100%; max-width: 860px;">
  <table>
    <tr>
      <td align="center">
        <img src="assets/screenshot-desktop.png" width="400"/>
        <em>Before SDK integration</em>
      </td>
      <td align="center">
        <img src="assets/screenshot-spatial.png" width="400"/>
        <em>After SDK integration</em>
      </td>
    </tr>
  </table>
</div>

## Documentation

See the https://webspatial.dev/ for the docs.

It’s recommended to read the docs in order, especially the first three chapters:
1. [**Introduction**](https://webspatial.dev/docs/introduction): Introduces the problems WebSpatial solves and the benefits it brings.
2. [**Quick Example**](https://webspatial.dev/docs/quick-example): Use a minimal example to get a quick feel for the actual results and development experience of the WebSpatial SDK.
3. [**Core Concepts**](https://webspatial.dev/docs/core-concepts): Learn the fundamental concepts of [Spatial Apps](https://webspatial.dev/docs/core-concepts/shared-space-and-spatial-apps) and the [WebSpatial SDK](https://webspatial.dev/docs/core-concepts/unique-concepts-in-webspatial).

The fourth chapter provides comprehensive and detailed [**Development Guide**](https://webspatial.dev/docs/development-guide).

> The guide is sequential but also supports targeted lookup.

The guide has three parts:

1. [What web projects can use WebSpatial API](https://webspatial.dev/docs/development-guide/web-projects-that-support-webspatial).
2. How to [add the WebSpatial SDK](https://webspatial.dev/docs/development-guide/enabling-webspatial-in-web-projects) to your web projects, [use WebSpatial Builder for visionOS testing](https://webspatial.dev/docs/development-guide/enabling-webspatial-in-web-projects/step-2-add-build-tool-for-packaged-webspatial-apps) (simulator or device), and how to bring spatial features to your site while still [keeping it a standard, cross-platform website](https://webspatial.dev/docs/development-guide/enabling-webspatial-in-web-projects/step-3-integrate-webspatial-sdk-into-web-build-tools).
3. How to [use the WebSpatial API](https://webspatial.dev/docs/development-guide/using-the-webspatial-api) ([Spatialization](https://webspatial.dev/docs/development-guide/using-the-webspatial-api/spatialize-html-elements), [Material](https://webspatial.dev/docs/development-guide/using-the-webspatial-api/add-material-backgrounds), [Elevation](https://webspatial.dev/docs/development-guide/using-the-webspatial-api/elevate-2d-elements), [Scenes](https://webspatial.dev/docs/development-guide/using-the-webspatial-api/manage-multiple-scenes), [3D](https://webspatial.dev/docs/development-guide/using-the-webspatial-api/add-3d-content)) in web projects where the SDK is already integrated.

There are currently two sample projects:

1. One is the [Quick Example](https://webspatial.dev/docs/quick-example) itself, which you can build it from scratch, or just grab the ready-made version from [the repo](https://github.com/webspatial/quick-example). There's also a [video](https://youtu.be/ddBBDBq7nhs) showing the full setup process.
2. The other is the ["techshop" demo](https://github.com/webspatial/sample-techshop), showcases more realistic spatial UI design and also demonstrates [cross-platform functionality](https://webspatial.dev/docs/introduction/built-on-the-existing-web-ecosystem#example-techshop).

> [!WARNING]
> The WebSpatial SDK is newly open-sourced and may have bugs or missing docs/examples. If you run into issues, don't spend too much time trying to fix them yourself, just share sample code with us on [Discord](https://discord.gg/nhFhSuhNF2) or [GitHub Issues](https://github.com/webspatial/webspatial-sdk/issues). That way, we can quickly assess the problem and offer a solution, suggestion, or hotfix.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING) for details.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
