
# WebSpatial Builder 的参数

返回：[步骤 2：添加 WebSpatial 应用打包构建工具](step-2-add-build-tool-for-packaged-webspatial-apps.md)

---

WebSpatial Builder 命令的参数，分为两类，推荐用不同的方式来使用。

## 在项目中维持不变的参数

对于项目的所有开发者来说，以下参数的配置都是应该保持一致的，不会因人而异（比如在不同开发环境里有不同配置）。
这些参数通常也不会变更，除非相关的工程结构和配置方式发生了变化。

### `run`

#### `--manifest`, `--manifest-url`

可以通过 `--manifest` 参数提供 [Web App Manifest 文件]()的本地路径，或通过 `--manifest-url` 参数提供 Web App Manifest 的 URL。

- 如果不设置这两个参数，默认会从 `public/manifest.webmanifest` 或 `public/manifest.json` 读取 manifest
- 如果从默认路径下找不到 manifest，Builder 在 `run` 命令的执行过程中，不会提示错误，而是用内部自带的默认 manifest 文件和默认图标来完成打包，这种包仅限于模拟器上的早期调试
- 如果提供了 manifest，但里面缺少一些必要属性，Builder 在 `run` 命令的执行过程中，不会提示错误，而是用内部自带的默认配置来填补空缺，完成打包，这种包仅限于模拟器上的早期调试

> Builder 提供的默认 manifest 信息如下：
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

可以通过 `--manifest` 参数提供 [Web App Manifest 文件]()的本地路径，或通过 `--manifest-url` 参数提供 Web App Manifest 的 URL。

- 如果不设置这两个参数，默认会从 `public/manifest.webmanifest` 或 `public/manifest.json` 读取 manifest
- 如果从默认路径下找不到 manifest，或 manifest 里缺少一些必要属性，Builder 都会报错，中断这次打包

#### `--export`

`build` 命令生成的应用安装包（比如 IPA 文件），会放在 `--export` 参数指定的目录里。

- 如果不提供这个参数，应用安装包默认会放在 `build/` 目录里。

#### `--project`

如果希望把网站文件[离线打包]()进应用安装包，可以用这个参数让 Builder 知道这个 Web 项目构建出的 Web 文件产物在哪个目录里。

- 如果不提供这个参数，默认会从 `dist/` 目录获取构建产物。

### `publish`

#### `--manifest`, `--manifest-url`

可以通过 `--manifest` 参数提供 [Web App Manifest 文件]()的本地路径，或通过 `--manifest-url` 参数提供 Web App Manifest 的 URL。

- 如果不设置这两个参数，默认会从 `public/manifest.webmanifest` 或 `public/manifest.json` 读取 manifest
- 如果从默认路径下找不到 manifest，或 manifest 里缺少一些必要属性，Builder 都会报错，中断这次打包

#### `--project`

如果希望把网站文件[离线打包]()进应用安装包，可以用这个参数让 Builder 知道这个 Web 项目构建出的 Web 文件产物在哪个目录里。

- 如果不提供这个参数，默认会从 `dist/` 目录获取构建产物。

## 适合用环境变量来配置的参数

以下参数要么涉及保密信息（比如 Apple 开发者账号的密码），要么仓库的不同开发者需要在本地做各自不同的配置（比如要用不同的 Dev Server 端口）。
因此这些参数的配置不适合提交到 Git，推荐通过环境变量来设置这些参数（见[上一节推荐的 npm scripts]()）。

> [!NOTE]
> 配置环境变量的最佳实践可参考「[可选] 用 dotenv 来简化打包命令的用法」章节。

### `run`

#### `$XR_DEV_SERVER` (`--base`)

通过 `--base` 参数提供 [WebSpatial App Shell]() 中要加载的所有网页（HTML）URL 的 base 部分。
如果 [Web App Manifest 中的 `start_url`]() 也包含 base（比如是完整的网址），会被强制替换成这个参数指定的 base。

比如：
- `"start_url": "/home"`
- `--base=http://mydomain.com/app/`
> 上面这种组合，得到的 URL 是 `http://mydomain.com/app/home`
- `"start_url": "http://otherdomain.com/home"`
- `--base=http://mydomain.com/app/`
> 上面这种组合，得到的 URL 是 `http://mydomain.com/app/home`

由于 `start_url` 中不会提供本地开发环境的 base（比如 `http://localhost:3000/`），通常在 WebSpatial 应用的开发调试环节（[`run:avp` 脚本]()）必须设置这个环境变量。

> [!IMPORTANT]
> 最佳实践：
>
> 把 `$XR_DEV_SERVER` 配置为专门针对 WebSpatial 应用运行的本地 Dev Server 网址（比如 `http://localhost:3000/webspatial/avp/`, 运行这种 Dev Server 的方法见下文的「[生成 WebSpatial 专用网站](generate-a-webspatial-specific-website.md)」章节）。
>
> 在这种情况下，网站文件（比如 `dist` 目录）不会被[离线打包]()进 Packaged WebSpatial App 中。
> 修改网站代码后，可以通过 Dev Server 实现 WebSpatial 界面的热更新，或直接刷新页面，就能看到效果变化，不需要再次执行 `webspatial-builder run` 命令生成新的包，调试效率更高。

### `build`

#### `$XR_PRE_SERVER` (`--base`)

通过 `--base` 参数提供 [WebSpatial App Shell]() 中要加载的所有网页（HTML）URL 的 base 部分。
如果 [Web App Manifest 中的 `start_url`]() 也包含 base（比如是完整的网址），会被强制替换成这个参数指定的 base。

由于 `start_url` 中不会提供本地开发环境获线上预览环境的域名，通常在 WebSpatial 应用的开发调试环节和测试预览环节（[`build:avp` 脚本]()）必须设置这个环境变量。

> 如果把 `$XR_PRE_SERVER` 配置为专门针对 WebSpatial 应用的本地 Web Server 网址（运行这种 Web Server 的方法见下文的「[生成 WebSpatial 专用网站](generate-a-webspatial-specific-website.md)」章节），网站文件（比如 dist 目录）不会被离线打包进 Packaged WebSpatial App 中，需要确保本地 Web Server 网址能从真机上访问。
>
> 如果通过 `$XR_PRE_SERVER` 或 `start_url` 把 base 配置为不含域名的相对路径，网站文件（比如 `dist` 目录）会被[离线打包]()进 Packaged WebSpatial App 中，应用在真机设备上运行时不需要从服务器加载网页和其他静态 web 文件。

### `build` 或 `publish`

#### `$XR_BUNDLE_ID (`--bundle-id`)

> [!IMPORTANT]
> 在构建（[`build:avp` 脚本]()）或分发（[`publish:avp` 脚本]()）环节都必须提供这个环境变量

通过 `--bundle-id` 提供 [App Store Connect 需要的应用 ID（Bundle ID）]()，需要先在 App Store Connect 中[注册一个专用的 Bundle ID]()：

#### `$XR_TEAM_ID` (`--teamId`)

> [!IMPORTANT]
> 在构建（[`build:avp` 脚本]()）或分发（[`publish:avp` 脚本]()）环节都必须提供这个环境变量

通过 `--teamId` 提供 Apple 开发者账号的 Team ID。

### `publish`

#### `$XR_PROD_SERVER` (`--base`)

通过 `--base` 参数提供 [WebSpatial App Shell]() 中要加载的所有网页（HTML）URL 的 base 部分。
如果 [Web App Manifest 中的 `start_url`]() 也包含 base（比如是完整的网址），会被强制替换成这个参数指定的 base。

如果 `start_url` 配置为包含域名的绝对地址，且 Web Server 会[自动判断 User Agent]() 为来自 WebSpatial App Shell 的请求提供 WebSpatial 专用的网站代码，则在正式发布环节（[`publish:avp` 脚本]()）不需要设置这个环境变量，base 直接由 `start_url` 提供。

如果 `start_url` 配置为不含域名的相对地址，或者 Web Server 提供的 WebSpatial 专用网站代码跟面向普通浏览器的网站代码有不同的 URL（比如 base 不同），则在正式发布环节（[`publish:avp` 脚本]()）必须设置这个环境变量。

> 如果把 `$XR_PROD_SERVER` 或 `start_url` 配置为包含域名的绝对地址，网站文件（比如 dist 目录）不会被[离线打包]()进 Packaged WebSpatial App 中，需要确保 Web Server 网址和静态文件的 CDN 网址都能从真机上访问。
>
> 如果通过 `$XR_PROD_SERVER` 或 `start_url` 把 base 配置为不含域名的相对路径，网站文件（比如 dist 目录）会被[离线打包]()进 Packaged WebSpatial App 中，应用在真机设备上运行时不需要从服务器加载网页和其他静态 web 文件。

#### `$XR_VERSION` (`--version`)

> [!IMPORTANT]
> 在分发（[`publish:avp` 脚本]()）环节都必须提供这个环境变量

通过 `--version` 提供 App Store Connect 需要的版本号。比如 "x.x"，必须大于上一个版本号。

#### `$XR_DEV_NAME` (`--u`)

> [!IMPORTANT]
> 在分发（[`publish:avp` 脚本]()）环节都必须提供这个环境变量

通过 `--u` 提供 App Store Connect 需要的 Apple 开发者账号（邮箱）。

#### `$XR_DEV_PASSWORD` (`--p`)

> [!IMPORTANT]
> 在分发（[`publish:avp` 脚本]()）环节都必须提供这个环境变量

通过 `--p` 提供 App Store Connect 需要的[密码]()。

---

下一步：[步骤 3：在 Web 构建工具中集成 WebSpatial SDK](step-3-integrate-webspatial-sdk-into-web-build-tools.md)
