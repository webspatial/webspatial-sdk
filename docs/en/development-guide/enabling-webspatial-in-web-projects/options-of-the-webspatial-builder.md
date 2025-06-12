# Options for WebSpatial Builder

Back to: [Step 2: Add Build Tool for Packaged WebSpatial Apps](step-2-add-build-tool-for-packaged-webspatial-apps.md)

---

The command-line options for [WebSpatial Builder](./step-2-add-build-tool-for-packaged-webspatial-apps.md) fall into two categories, each recommended to be handled differently.

<a id="constant-options"></a>
## Fixed options

For every developer on the project, the following options should be configured identically and rarely change unless the project structure or configuration changes.


<a id="constant-options-for-run"></a>
### `run`

<a id="manifest-for-run"></a>
#### `--manifest`, `--manifest-url`

You can supply the local path to the [Web App Manifest file](./add-web-app-manifest.md) with `--manifest`, or provide the manifest's URL with `--manifest-url`.

- If neither option is set, the Builder reads the manifest from `public/manifest.webmanifest` or `public/manifest.json` by default.
- If no manifest is found at the default path, the `run` command silently falls back to an internal default manifest and default icons. The resulting build is suitable only for early simulator testing.
- If a manifest is provided but missing required fields, the `run` command silently fills the gaps with internal defaults. The resulting build is suitable only for early simulator testing.

> [!TIP]
> The default manifest information bundled with the Builder is as follows:
> ```json5
> {
>     name: 'WebSpatialTest',
>     display: 'minimal-ui',
>     start_url: '/',
>     scope: '/',
> }
> ```

<a id="constant-options-for-build"></a>
### `build`

<a id="manifest-for-build"></a>
#### `--manifest`, `--manifest-url`

You can supply the local path to the [Web App Manifest file](./add-web-app-manifest.md) with `--manifest`, or provide the manifest's URL with `--manifest-url`.

- If neither option is set, the Builder reads the manifest from `public/manifest.webmanifest` or `public/manifest.json` by default.
- If no manifest is found at the default path, or the manifest is missing required fields, the Builder throws an error and aborts the build.

<a id="export"></a>
#### `--export`

The app package produced by the `build` command (for example, an IPA file) is written to the directory specified by `--export`.

- If omitted, the package is placed in the `build/` directory by default.

<a id="dist-for-build"></a>
#### `--project`

If you want to [bundle the site files for offline use](./add-web-app-manifest.md#start-url) into the app package, use this option to tell the Builder where the built web files are located.

- If omitted, the Builder pulls web files from the `dist/` directory by default.

<a id="constant-options-for-publish"></a>
### `publish`

<a id="manifest-for-publish"></a>
#### `--manifest`, `--manifest-url`

You can supply the local path to the [Web App Manifest file](./add-web-app-manifest.md) with `--manifest`, or provide the manifest's URL with `--manifest-url`.

- If neither option is set, the Builder reads the manifest from `public/manifest.webmanifest` or `public/manifest.json` by default.
- If no manifest is found at the default path, or the manifest is missing required fields, the Builder throws an error and aborts the build.

<a id="dist-for-publish"></a>
#### `--project`

If you want to [bundle the site files for offline use](./add-web-app-manifest.md#start-url) into the app package, use this option to tell the Builder where the built web files are located.

- If omitted, the Builder pulls web files from the `dist/` directory by default.

<a id="inconsistent-options"></a>
## Options best set via env vars

The following options either contain sensitive information (such as the password for an Apple developer account) or vary between developers (such as different Dev Server ports). They should therefore be supplied using environment variables rather than being committed to Git (see the [recommended npm scripts in the previous section](./step-2-add-build-tool-for-packaged-webspatial-apps.md#npm-scripts)).

> [!NOTE]
> For best practice on environment variables, see ["[Optional] Simplify WebSpatial Builder with dotenv."](./optional-simplify-webspatial-builder-using-dotenv.md)

<a id="inconsistent-options-for-run"></a>
### `run`

<a id="base-for-devserver"></a>
#### `$XR_DEV_SERVER` (`--base`)

Use `--base` to specify the root part of URL for all HTML requests loaded in the [WebSpatial App Shell](../../core-concepts/unique-concepts-in-webspatial.md#webspatial-sdk). If the [`start_url` in the Web App Manifest](./add-web-app-manifest.md#start-url) is already set to a full URL, the root part of the URL is forcibly replaced by the value provided here.

> [!TIP]
> Examples:
> - `"start_url": "/home"`
> - `--base="http://mydomain.com/app/"`
> > Resulting URL: `http://mydomain.com/app/home`
> - `"start_url": "http://otherdomain.com/home"`
> - `--base="http://mydomain.com/app/"`
> > Resulting URL: `http://mydomain.com/app/home`
> - `"start_url": "/home"`
> - `--base="/app/"`
> > Resulting URL: `/app/home`

> [!IMPORTANT]
> **Best practice:**
> Set `$XR_DEV_SERVER` to point at a [Dev Server dedicated to the WebSpatial app](./generate-a-webspatial-specific-website.md), such as `http://localhost:3000/webspatial/avp/`.
> In this setup, site files (for example, the `dist` directory) are NOT [bundled for offline use](./add-web-app-manifest.md#start-url) into the Packaged WebSpatial App. After code changes you can rely on hot reload or simply refresh the page via the Dev Server, so there is no need to rerun `webspatial-builder run`, which greatly speeds up iteration.

<a id="inconsistent-options-for-build"></a>
### `build`

<a id="base-for-preview"></a>
#### `$XR_PRE_SERVER` (`--base`)

Use `--base` to specify the root part of URL for all HTML requests loaded in the [WebSpatial App Shell](../../core-concepts/unique-concepts-in-webspatial.md#webspatial-sdk). If the [`start_url` in the Web App Manifest](./add-web-app-manifest.md#start-url) is already set to a full URL, the root part of the URL is forcibly replaced by the value provided here.

> [!TIP]
> Examples:
> - `"start_url": "/home"`
> - `--base="http://mydomain.com/app/"`
> > Resulting URL: `http://mydomain.com/app/home`
> - `"start_url": "http://otherdomain.com/home"`
> - `--base="http://mydomain.com/app/"`
> > Resulting URL: `http://mydomain.com/app/home`
> - `"start_url": "/home"`
> - `--base="/app/"`
> > Resulting URL: `/app/home`

> [!IMPORTANT]
> If `$XR_PRE_SERVER` points at [a Web Server dedicated to the WebSpatial app](./generate-a-webspatial-specific-website.md), site files (for example, the `dist` directory) are NOT bundled for offline use into the Packaged WebSpatial App, so the web server must be reachable from the target device.
> If you don't include a domain in either `$XR_PRE_SERVER` or `start_url`, the site files are [bundled for offline use](./add-web-app-manifest.md#start-url), so the app runs without fetching site files from a web server.

<a id="inconsistent-options-for-build-or-publish"></a>
### `build` or `publish`

<a id="bundle-id"></a>
#### `$XR_BUNDLE_ID` (`--bundle-id`)

> [!IMPORTANT]
> Required during both real device testing (`build:avp`) and app distribution (`publish:avp`).

Provide the App ID (Bundle ID) needed by App Store Connect via `--bundle-id`. You must [register a dedicated Bundle ID](https://developer.apple.com/help/account/identifiers/register-an-app-id/) in App Store Connect first.

<a id="team-id"></a>
#### `$XR_TEAM_ID` (`--teamId`)

> [!IMPORTANT]
> Required during both real device testing (`build:avp`) and app distribution (`publish:avp`).

Provide your Apple Developer Team ID via `--teamId`.

<a id="inconsistent-options-for-publish"></a>
### `publish`

<a id="base-for-prod"></a>
#### `$XR_PROD_SERVER` (`--base`)

Use `--base` to specify the root part of URL for all HTML requests loaded in the [WebSpatial App Shell](../../core-concepts/unique-concepts-in-webspatial.md#webspatial-sdk). If the [`start_url` in the Web App Manifest](./add-web-app-manifest.md#start-url) is already set to a full URL, the root part of the URL is forcibly replaced by the value provided here.

> [!TIP]
> Examples:
> - `"start_url": "/home"`
> - `--base="http://mydomain.com/app/"`
> > Resulting URL: `http://mydomain.com/app/home`
> - `"start_url": "http://otherdomain.com/home"`
> - `--base="http://mydomain.com/app/"`
> > Resulting URL: `http://mydomain.com/app/home`
> - `"start_url": "/home"`
> - `--base="/app/"`
> > Resulting URL: `/app/home`

If `start_url` is an full URL with a production domain, and the web server [automatically serves WebSpatial-specific content when it detects the User Agent from the WebSpatial App Shell](./generate-a-webspatial-specific-website.md#single-web-server), you do NOT need to set this variable during the production release (`publish:avp`), the production URL comes directly from `start_url`.

If `start_url` is a relative URL, or the WebSpatial-specific content lives under a different URL, you must use this variable during the production release (`publish:avp` to supply the production domain and other root parts of the production URL.

> [!IMPORTANT]
> If `$XR_PROD_SERVER` points at [a Web Server dedicated to the WebSpatial app](./generate-a-webspatial-specific-website.md), site files (for example, the `dist` directory) are NOT bundled for offline use into the Packaged WebSpatial App, so the web server must be reachable from the target device.
> If you don't include a domain in either `$XR_PROD_SERVER` or `start_url`, the site files are [bundled for offline use](./add-web-app-manifest.md#start-url), so the app runs without fetching site files from a web server.

<a id="version"></a>
#### `$XR_VERSION` (`--version`)

> [!IMPORTANT]
> Required during app distribution (`publish:avp`).

Provide the version number required by App Store Connect via `--version`, for example "x.x". It must be higher than the previously submitted version.

<a id="username"></a>
#### `$XR_DEV_NAME` (`--u`)

> [!IMPORTANT]
> Required during app distribution (`publish:avp`).

Provide the Apple Developer account email via `--u`.

<a id="password"></a>
#### `$XR_DEV_PASSWORD` (`--p`)

> [!IMPORTANT]
> Required during app distribution (`publish:avp`).

Provide the [app-specific password](https://support.apple.com/102654) for the Apple Developer account via `--p`.

---

Next step: [Step 3: Integrate the WebSpatial SDK into Web Build Tools](step-3-integrate-webspatial-sdk-into-web-build-tools.md)
