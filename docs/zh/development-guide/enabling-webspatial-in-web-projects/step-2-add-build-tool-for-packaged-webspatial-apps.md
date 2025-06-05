
# 步骤 2：添加 WebSpatial 应用打包构建工具

上一步：[步骤 1：安装 WebSpatial SDK](step-1-install-the-webspatial-sdk.md)

---

## WebSpatial Builder

为了启用当前浏览器还不支持的 [WebSpatial API](#)，获得空间化能力，需要让网站代码[在 WebSpatial App Shell 中运行](#)。

获得 WebSpatial App Shell 的方法之一，是基于当前的 Web 项目打包出 [Packaged WebSpatial App](#)，在 visionOS 这样的空间计算平台上安装和独立运行。

> [!TIP]
> 另一种方法是在对应平台上提前安装 WebSpatial Browser 应用（开发中），直接在这个浏览器里访问 WebSpatial App 的网址。由于目前无法保证 visionOS 平台上的目标用户已经安装或愿意安装这个浏览器，因此只有打包、上架应用商店的方法，能保证 WebSpatial App 对 visionOS 平台上的目标用户可用。

在开发调试阶段，需要生成应用，在  visionOS 模拟器或自己个人的真机设备中安装。

在分发阶段，需要生成应用，提交到像 App Store Connect 这样的平台，用于在其他人的真机中测试，乃至上架应用商店，对外发布。

[`@webspatial/builder`](#) 可以满足上述需求。

WebSpatial Builder 是一个命令行工具，主命令是 `webspatial-builder`，包含三个子命令，分别是：

### `run`

```shell
webspatial-builder run --base=$XR_DEV_SERVER
```

基于当前的 WebSpatial 项目，构建出 visionOS 应用， 自动调起[本地的 visionOS 模拟器](#)，自动在模拟器中安装应用，启动运行。

这个命令专门用于本地开发环境，是调试 [Packaged WebSpatial App](#) 最方便快捷的方法。
通常会[搭配 Dev Server](#) 来使用，`run` 命令构建出来的应用需要加载 Dev Server 生成的专门面向 visionOS 的网站网址。

WebSpatial Builder 构建出来的应用，在[起始场景](#)中默认加载的第一个网址，默认都是来自 [Web App Manifest 中的 `start_url`](#)。

> [!TIP]
> `run` 命令允许项目中暂时不包含 Web App Manifest，由 Builder 来提供默认的应用信息（包括 `start_url`）。

Web App Manifest 中对 `start_url` 的配置，要么是包含正式产品环境域名的完整网址，要么不会提供域名，会把 `start_url` 配置成相对地址。

对于前面这种情况，`run` 命令生成的应用会无法正确加载 Dev Server 生成的专用网址。

对于后面这种情况，`run` 命令会把所有网站文件都离线打包进应用安装包中，运行过程中完全从本地加载 Web 文件，同样不会加载 Dev Server 生成的专用网址，导致开发调试变得更麻烦（不能让 Dev Server 自动热更新，每次修改代码都需要重新构建打包和安装）。

因此，使用 run 命令时通常必须包含 [`--base 参数`](#)，通过这个参数提供 Dev Server 网址的 base 部分（比如 `http://localhost:3000/webspatial/avp/`）。

[`run` 命令的其他参数](#)都不是必须的。

### `build`

```shell
webspatial-builder build --base=$XR_PRE_SERVER --bundle-id=$XR_BUNDLE_ID --teamId=$XR_TEAM_ID
```

基于当前的 WebSpatial 项目，构建出 visionOS 应用的安装包（ipa 文件），包含来自 Apple 开发者账号的签名，可以用于真机设备测试。

如果 Apple 开发者账号是企业版，可以在其他人的 Vision Pro 设备上使用这个安装包。

否则，这个安装包只能在登录了相同账号的 Vision Pro 设备（开发者自己的设备）上使用。
这种情况下，要在其他人的 Vision Pro 设备上测试，只能通过 publish 命令。

在这种真机设备测试中，WebSpatial 应用加载的网址，跟正式产品环境要加载的网址，通常也是不一样的。

所以如果想使用测试环境的网址，使用 `build` 命令时就也必须包含 [`--base 参数`](#)，通过这个参数提供测试环境网址的 base 部分。

如果把 [`start_url`](#) 配置成相对地址，`build` 命令会把所有网站文件都离线打包进应用安装包中，运行过程中完全从本地加载 Web 文件。对于这种模式，`build` 命令不需要包含 `--base` 参数。

使用 `build` 命令时，始终必须搭配 [`--bundle-id`](#) 和 [`--teamId`](#) 参数，提供 visionOS 应用签名必须的信息。

[`build` 命令的其他参数](#)都不是必须的。

### `publish`

```shell
webspatial-builder publish  --base=$XR_PROD_SERVER --bundle-id=$XR_BUNDLE_ID --teamId=$XR_TEAM_ID --version=$XR_VERSION --u=$XR_DEV_NAME --p=$XR_DEV_PASSWORD
```

基于当前的 WebSpatial 项目，构建出 visionOS 应用，包含来自 Apple 开发者账号的签名，以及其他 App Store Connect 要求的正式信息，会自动提交到  App Store Connect，用于后续的测试、审核和应用商店上架。

使用 `publish` 命令时，始终必须搭配 [`--bundle-id`](#)、[`--teamId`](#)、[`--version`](#)、[`--u`](#)、[`--p`](#) 参数，提供 visionOS 应用签名和提交到 App Store Connect 必须的信息。

[`publish` 命令的其他参数](#)都不是必须的。

## npm scripts

可以在每次要运行 WebSpatial Builder 的时候，总是手动输入命令和上面介绍的这些参数。但这样会比较低效，最佳实践是在 package.json 里添加以下 npm script，把这些参数转换成环境变量，通过 npm script 来使用 WebSpatial Builder。

```json5
"run:avp": "webspatial-builder run --base=$XR_DEV_SERVER",
"build:avp": "webspatial-builder build --base=$XR_PRE_SERVER --bundle-id=$XR_BUNDLE_ID --teamId=$XR_TEAM_ID",
"publish:avp": "webspatial-builder publish  --base=$XR_PROD_SERVER --bundle-id=$XR_BUNDLE_ID --teamId=$XR_TEAM_ID --version=$XR_VERSION --u=$XR_DEV_NAME --p=$XR_DEV_PASSWORD",
```

把命令参数转换成环境变量之后，好处之一是可以统一在 dotenv 里维护部分环境变量，不用每次执行 npm script 时都要给环境变量赋值：

- [[可选] 用 dotenv 简化 Builder 的用法](optional-simplify-webspatial-builder-using-dotenv.md)


---

- 了解 [WebSpatial Builder 的参数](parameters-of-the-webspatial-builder.md)
- 或直接进入下一步：[步骤 3：在 Web 构建工具中集成 WebSpatial SDK](step-3-integrate-webspatial-sdk-into-web-build-tools.md)
