![status: preview](https://img.shields.io/badge/status-preview-orange)
> ⚠️ This project is in **preview**. Expect some missing docs and potential stability issues. APIs and features may change.


<div align="center">
  <img src="docs/assets/logo.png" alt="WebSpatial Logo" width="400"/>

  Make the Web Spatial Too
</div>

# WebSpatial SDK

WebSpatial is a set of spatial APIs and ready-to-use SDK that extend the standard 2D Web ecosystem to support spatial computing across platforms. It enables the entire HTML/CSS-based Web world to step into the spatial era, gaining spatial power on par with native apps (like visionOS apps) while keeping the advantages they already have.

- **Open standard vision**: Extends existing HTML/CSS/JS with minimal new spatial APIs
- **Developer friendly**: Extending the existing web development ecosystem and 2D web development mindset
- **Zero-rewrite adoption** – Drop the SDK into an existing React project and with zero intrusion or additional cost
- **Cross-platform** – desktops, mobiles, and spatial-computing platfroms share one codebase.

<div align="center" style="width: 100%; max-width: 860px;">
  <table>
    <tr>
      <td align="center">
        <img src="docs/assets/screenshot-desktop.png" width="400"/>
        <em>Before SDK integration</em>
      </td>
      <td align="center">
        <img src="docs/assets/screenshot-spatial.png" width="400"/>
        <em>After SDK integration</em>
      </td>
    </tr>
  </table>
</div>

<div align="center" style="width: 100%; max-width: 860px;">
  <a href="https://youtu.be/QRWjRoKKuXI?si=RvC66Y7X_eyWoRwv" target="_blank">
    <img src="docs/assets/whatif.jpg" style="width: 100%" />
  </a>
</div>

## Documentation

- [Table of Contents](docs/en/README.md)
- [Introduction](docs/en/introduction/README.md)
- [Quick Example](docs/en/quick-start/README.md)
- [Core Concepts](docs/en/core-concepts/README.md)
- [Development Guide](docs/en/development-guide/README.md)

## Packages

- [@webspatial/react-sdk](packages/react/README.md) - The React SDK makes the WebSpatial API immediately available inside React.
- [@webspatial/core-sdk](packages/core/README.md) - The React SDK is implemented on top of the Core SDK, which is a framework-agnostic pure-JS API that enables the WebSpatial App Shell to natively spatialize 2D HTML content and render 3D content.
- [@webspatial/builder](packages/cli/README.md) - The build tool transforms websites into Packaged WebSpatial Apps for debugging and distributing on spatial computing platforms.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
