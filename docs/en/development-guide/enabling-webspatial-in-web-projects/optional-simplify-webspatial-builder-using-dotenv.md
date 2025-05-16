# [Optional] Simplify Builder Usage with dotenv

Return: [Step 2 – Add Build Tool for Packaged WebSpatial Apps](step-2-add-build-tool-for-packaged-webspatial-apps.md)

---

To avoid typing the same environment variables each time you run [these npm scripts](), you can place all required local variables in a [dotenv]() configuration file and have them loaded automatically before the scripts run.

## dotenv Files

First, create `.env.example` in the project root and commit it to Git:

```ini
XR_DEV_SERVER=
XR_PRE_SERVER=
XR_PROD_SERVER=
XR_BUNDLE_ID=
XR_TEAM_ID=
XR_VERSION=
XR_DEV_NAME=
XR_DEV_PASSWORD=
```

All developers must then create their own `.env.local` file after cloning the repository:

> [!TIP]
> `*.local` is usually listed in `.gitignore`, so `.env.local` will not be committed to Git.

```shell
cp .env.example .env.local
# Fill in the Team ID, Username and Password for Apple Developer Program in the .env file.
```

## Using Environment Variables in npm scripts

Install dependencies:

```shell
pnpm add -D dotenv dotenv-cli
```

> [!IMPORTANT]
> For Vite projects you do not need to install the `dotenv` package above, because Vite already supports dotenv. You still need `dotenv-cli` so that the variables in dotenv files take effect inside npm scripts.

`dotenv-cli` lets npm scripts access the variables defined in dotenv files.

Wrap each of the three WebSpatial Builder scripts in npm scripts with `dotenv -e .env.local -- sh -c 'original script'`, for example:

```json5
"run:avp": "dotenv -e .env.local -- sh -c 'webspatial-builder run --base=$XR_DEV_SERVER'",
"build:avp": "dotenv -e .env.local -- sh -c 'webspatial-builder build --base=$XR_PRE_SERVER --bundle-id=$XR_BUNDLE_ID --teamId=$XR_TEAM_ID'",
"publish:avp": "dotenv -e .env.local -- sh -c 'webspatial-builder publish  --base=$XR_PROD_SERVER --bundle-id=$XR_BUNDLE_ID --teamId=$XR_TEAM_ID --version=$XR_VERSION --u=$XR_DEV_NAME --p=$XR_DEV_PASSWORD'",
```

## Using Environment Variables in Node.js Scripts

If you need to use variables from dotenv files in other Node.js-based scripts, add the following line at the top of the script:

```js
import dotenv from "dotenv";

dotenv.config();

console.log(process.env.XR_ENV);
```

> [!TIP]
> In Vite projects you can use Vite’s built-in utilities to load variables from dotenv files in Node.js scripts.
> For example, in `vite.config.js`:
> ```diff
> -import { defineConfig } from 'vite'
> +import { defineConfig, loadEnv } from 'vite'
> import react from '@vitejs/plugin-react'
>
> export default defineConfig(({ mode }) => {
> + const env = loadEnv(mode, process.cwd(), '')
> + console.log(env.XR_ENV)
>   return {
>    plugins: [
>      react(),
> ```
> In other Node.js scripts:
> ```js
> import { loadEnv } from 'vite';
>
> const env = loadEnv('', process.cwd(), '');
>
> console.log(env.XR_ENV);
> ```

## Using Environment Variables in Client-side JS Code

See “[Check if Running in WebSpatial Mode](check-if-running-in-webspatial-mode.md)” in [Step 3](step-3-integrate-webspatial-sdk-into-web-build-tools.md).

---

Next: [Step 3 – Integrate the WebSpatial SDK into Web Build Tools](step-3-integrate-webspatial-sdk-into-web-build-tools.md)
