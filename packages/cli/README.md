<div align="left">
  <img src="../../assets/logo.png" alt="WebSpatial Logo" width="400"/>
</div>
<br/>

# WebSpatial Builder

The build tool transforms websites into Packaged WebSpatial Apps for debugging and distributing on spatial computing platforms.

## Run on PICO OS 6

With a PICO OS 6 device connected through ADB, launch a hosted WebSpatial app
using the default development URL:

```sh
webspatial-builder run-pico
```

Use `--base` when the app is hosted at a different URL. The URL must expose a
Web Manifest:

```sh
webspatial-builder run-pico --base http://10.0.2.2:4173
```

The command loads and prepares the manifest itself, so only `adb` is
required. It uses the default connected ADB device.

Manifest lookup follows the same order as `run`:

1. `--manifest-url <url>` downloads a remote manifest.
2. `--manifest <path>` reads a path relative to the current directory.
3. With neither option, the command checks `public/manifest.json`, then
   `public/manifest.webmanifest`, and finally uses the development manifest.

## Documentation

For WebSpatial Builder:

- [Add Build Tool for Packaged WebSpatial Apps](https://webspatial.dev/docs/development-guide/enabling-webspatial-in-web-projects/step-2-add-build-tool-for-packaged-webspatial-apps)

For WebSpatial:

- [Introduction](https://webspatial.dev/docs/introduction)
- [Quick Example](https://webspatial.dev/docs/quick-example)
- [Core Concepts](https://webspatial.dev/docs/core-concepts)
- [Development Guide](https://webspatial.dev/docs/development-guide)
