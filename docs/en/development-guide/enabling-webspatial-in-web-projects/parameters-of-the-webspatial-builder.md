# Parameters for WebSpatial Builder

Back to: [Step 2: Add Build Tool for Packaged WebSpatial Apps](step-2-add-build-tool-for-packaged-webspatial-apps.md)

---

The command-line arguments for WebSpatial Builder fall into two categories, each recommended to be handled differently.

## Parameters that remain constant in the project

For every developer on the project, the following arguments should be configured identically and rarely change unless the project structure or configuration changes.

### `run`

#### `--manifest`, `--manifest-url`

You can supply the local path to the [Web App Manifest file]() with `--manifest`, or provide the manifest’s URL with `--manifest-url`.

- If neither argument is set, the Builder reads the manifest from `public/manifest.webmanifest` or `public/manifest.json` by default.
- If no manifest is found at the default path, the `run` command silently falls back to an internal default manifest and default icons. The resulting build is suitable only for early simulator testing.
- If a manifest is provided but missing required fields, the `run` command silently fills the gaps with internal defaults. The resulting build is likewise limited to early simulator testing.

> The default manifest information bundled with the Builder is as follows:
> ```json5
> {
>     name: 'WebSpatialTest',
>     display: 'minimal-ui',
>     start_url: '/',
>     scope: '/',
> }
> ```

### `build`

#### `--manifest`, `--manifest-url`

You can supply the local path to the [Web App Manifest file]() with `--manifest`, or provide the manifest’s URL with `--manifest-url`.

- If neither argument is set, the Builder reads the manifest from `public/manifest.webmanifest` or `public/manifest.json` by default.
- If no manifest is found at the default path, or the manifest is missing required fields, the Builder throws an error and aborts the build.

#### `--export`

The installation package produced by the `build` command (for example, an IPA file) is written to the directory specified by `--export`.

- If omitted, the package is placed in the `build/` directory by default.

#### `--project`

If you want to [bundle the site files for offline use]() into the installation package, use this argument to tell the Builder where the compiled web assets are located.

- If omitted, the Builder pulls assets from the `dist/` directory by default.

### `publish`

#### `--manifest`, `--manifest-url`

You can supply the local path to the [Web App Manifest file]() with `--manifest`, or provide the manifest’s URL with `--manifest-url`.

- If neither argument is set, the Builder reads the manifest from `public/manifest.webmanifest` or `public/manifest.json` by default.
- If no manifest is found at the default path, or the manifest is missing required fields, the Builder throws an error and aborts the build.

#### `--project`

If you want to [bundle the site files for offline use]() into the installation package, use this argument to tell the Builder where the compiled web assets are located.

- If omitted, the Builder pulls assets from the `dist/` directory by default.

## Parameters that should be configured via environment variables

The following arguments either contain sensitive information (such as the password for an Apple developer account) or vary between developers (such as different Dev Server ports). They should therefore be supplied using environment variables rather than being committed to Git (see the [recommended npm scripts in the previous section]()).

> [!NOTE]
> For best practice on environment variables, see “[Optional] Simplify WebSpatial Builder with dotenv.”

### `run`

#### `$XR_DEV_SERVER` (`--base`)

Use `--base` to specify the base URL for all page (HTML) requests loaded in the [WebSpatial App Shell](). If the [`start_url` in the Web App Manifest]() already includes a base (for example, an absolute URL), it is forcibly replaced by the value provided here.

Examples:

- `"start_url": "/home"`
- `--base=http://mydomain.com/app/`
  > Resulting URL: `http://mydomain.com/app/home`
- `"start_url": "http://otherdomain.com/home"`
- `--base=http://mydomain.com/app/`
  > Resulting URL: `http://mydomain.com/app/home`

Because `start_url` never includes the local development base (such as `http://localhost:3000/`), you must set this variable during local development (the [`run:avp` script]()).

> [!IMPORTANT]
> **Best practice:**
> Set `$XR_DEV_SERVER` to point at a Dev Server dedicated to the WebSpatial app, such as `http://localhost:3000/webspatial/avp/`. See “[Generate a WebSpatial-specific site](generate-a-webspatial-specific-website.md)” for how to run such a Dev Server.
> In this setup, site files (for example, the `dist` directory) are **not** [bundled for offline use]() into the Packaged WebSpatial App. After code changes you can rely on hot reload or simply refresh the page via the Dev Server, so there is no need to rerun `webspatial-builder run`, which greatly speeds up iteration.

### `build`

#### `$XR_PRE_SERVER` (`--base`)

Use `--base` to specify the base URL for all page (HTML) requests loaded in the [WebSpatial App Shell](). If the [`start_url` in the Web App Manifest]() already includes a base (for example, an absolute URL), it is forcibly replaced by the value provided here.

Because `start_url` does not include the domain of your local or preview server, you typically set this variable for development builds and preview testing (the [`build:avp` script]()).

> If `$XR_PRE_SERVER` points at a local Web Server dedicated to the WebSpatial app (see “[Generate a WebSpatial-specific site](generate-a-webspatial-specific-website.md)”), site files (for example, the `dist` directory) are **not** bundled for offline use into the Packaged WebSpatial App, and the server must be reachable from the target device.
> If you supply a relative base via `$XR_PRE_SERVER` or `start_url`, the site files (for example, `dist`) **are** [bundled for offline use](), so the app runs without fetching assets from a server.

### `build` or `publish`

#### `$XR_BUNDLE_ID` (`--bundle-id`)

> [!IMPORTANT]
> Required during both build (`build:avp`) and distribution (`publish:avp`).

Provide the App ID (Bundle ID) needed by App Store Connect via `--bundle-id`. You must [register a dedicated Bundle ID]() in App Store Connect first:

![image]()

#### `$XR_TEAM_ID` (`--teamId`)

> [!IMPORTANT]
> Required during both build (`build:avp`) and distribution (`publish:avp`).

Provide your Apple Developer Team ID via `--teamId`.

![image]()

### `publish`

#### `$XR_PROD_SERVER` (`--base`)

Use `--base` to specify the base URL for all page (HTML) requests loaded in the [WebSpatial App Shell](). If the [`start_url` in the Web App Manifest]() already includes a base (for example, an absolute URL), it is forcibly replaced by the value provided here.

If `start_url` is an absolute URL with a domain, and the Web Server automatically serves WebSpatial-specific content when it detects the User Agent from the App Shell, you do **not** need to set this variable during the production release (`publish:avp`); the base comes directly from `start_url`.

If `start_url` is relative, or the WebSpatial-specific content lives under a different URL structure, you **must** set this variable during the production release (`publish:avp`).

> If `$XR_PROD_SERVER` or `start_url` contains a domain, site files (for example, `dist`) are **not** [bundled for offline use](). Ensure the Web Server and any CDN URLs are reachable from the target device.
> If you supply a relative base via `$XR_PROD_SERVER` or `start_url`, the site files (for example, `dist`) **are** [bundled for offline use](), so the app runs without fetching assets from a server.

#### `$XR_VERSION` (`--version`)

> [!IMPORTANT]
> Required during distribution (`publish:avp`).

Provide the version number required by App Store Connect via `--version`, for example "x.x". It must be higher than the previously submitted version.

#### `$XR_DEV_NAME` (`--u`)

> [!IMPORTANT]
> Required during distribution (`publish:avp`).

Provide the Apple Developer account email via `--u`.

#### `$XR_DEV_PASSWORD` (`--p`)

> [!IMPORTANT]
> Required during distribution (`publish:avp`).

Provide the [app-specific password]() for the Apple Developer account via `--p`.

---

Next step: [Step 3: Integrate the WebSpatial SDK into Web Build Tools](step-3-integrate-webspatial-sdk-into-web-build-tools.md)
