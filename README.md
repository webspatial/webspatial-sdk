# WebSpatial

<div align="center">
  <img src="docs/assets/logo.png" alt="WebSpatial Logo" width="400"/>
</div>

> Make the Web Spatial Too

WebSpatial is a set of spatial APIs and a ready-to-use cross-platform spatial app SDK built on top of the existing standard 2D Web ecosystem. It enables the entire HTML/CSS-based Web world to step into the spatial era, gaining spatial power on par with native apps (like visionOS apps) while keeping the advantages they already have.

- **Open standard vision**: Extends existing HTML/CSS/JS with minimal new spatial APIs
- **Developer friendly**: Extending the existing web development ecosystem and 2D web development mindset
- **Zero-rewrite adoption** – Drop the SDK into an existing React project and with zero intrusion or additional cost
- **Cross-platform** – desktops, mobiles, and spatial-computing platfroms share one codebase.

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="docs/assets/screenshot-desktop.png" alt="2D View" width="400"/>
        <em>Before SDK integration</em>
      </td>
      <td align="center">
        <img src="docs/assets/screenshot-spatial.png" alt="Spatial View" width="400"/>
        <em>After SDK integration</em>
      </td>
    </tr>
  </table>
</div>

<!-- 示例：如何嵌入 YouTube 视频 -->
<!-- 将 YouTube 视频链接中的 watch?v= 替换为 embed/ -->
<!-- 例如：https://www.youtube.com/watch?v=VIDEO_ID 变为 https://www.youtube.com/embed/VIDEO_ID -->
<div align="center" style="width: 100%; max-width: 860px;">
  <iframe style="width: 100%; aspect-ratio: 16/9;" src="https://www.youtube.com/embed/QRWjRoKKuXI?si=Ml3wuNE8itxTXCMf" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>

## Documentation

- [Table of Contents](docs/en/README.md)
- [Introduction](docs/en/introduction/README.md)
- [Quick Start](docs/en/quick-start/README.md)
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
