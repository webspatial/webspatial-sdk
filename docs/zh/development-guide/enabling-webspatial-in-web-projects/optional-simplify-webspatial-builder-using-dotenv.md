
# [可选] 用 dotenv 简化 Builder 的用法

返回：[步骤 2：添加 WebSpatial 应用打包构建工具](step-2-add-build-tool-for-packaged-webspatial-apps.md)

---

为了避免每次使用[这些 npm scripts](#) 时都要重复输入上述环境变量，可以在 [dotenv](#) 配置文件中统一管理本地需要的环境变量，在执行脚本前自动设置这些环境变量。

## dotenv 文件

首先，在根目录下创建 `.env.example`，提交到 Git：

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

要求所有开发者在 clone 这个仓库后，都首先创建 `.env.local` 文件：

> [!TIP]
> .gitignore 里通常都配置了 *.local，因此 .env.local 不会提交到 Git

```shell
cp .env.example .env.local
# Fill in the Team ID, Username and Password for Apple Developer Program in the .env file.
```

## 在 npm scripts 中使用环境变量

安装依赖：

```shell
pnpm add -D dotenv dotenv-cli
```

> [!IMPORTANT]
> 如果是 Vite 项目，不用安装上面的 `dotenv`，因为 Vite 项目默认支持 dotenv。但仍然需要 `dotenv-cli` 才能让 dotenv 文件在 npm scripts 里生效。

`dotenv-cli` 能让 npm scripts 可以使用 dotenv 文件里配置的环境变量。

需要把 npm scripts 中的三个 WebSpatial Builder 脚本，都嵌套在 `dotenv -e .env.local -- sh -c 'original script'` 中，比如：

```json5
"run:avp": "dotenv -e .env.local -- sh -c 'webspatial-builder run --base=$XR_DEV_SERVER'",
"build:avp": "dotenv -e .env.local -- sh -c 'webspatial-builder build --base=$XR_PRE_SERVER --bundle-id=$XR_BUNDLE_ID --teamId=$XR_TEAM_ID'",
"publish:avp": "dotenv -e .env.local -- sh -c 'webspatial-builder publish  --base=$XR_PROD_SERVER --bundle-id=$XR_BUNDLE_ID --teamId=$XR_TEAM_ID --version=$XR_VERSION --u=$XR_DEV_NAME --p=$XR_DEV_PASSWORD'",
```

## 在 Node.js 脚本中使用环境变量

如果要在其他基于 Node.js 的脚本里使用 dotenv 文件里配置的环境变量，需要在脚本顶部添加：

```js
import dotenv from "dotenv";

dotenv.config();

console.log(process.env.XR_ENV);
```

> [!TIP]
> 如果是 Vite 项目，可以用 Vite 自带的方法在 Node.js 脚本中使用 dotenv 文件里配置的环境变量。
> 比如在 vite.config.js 里：
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
> 在其他 Node.js 脚本里：
> ```js
> import { loadEnv } from 'vite';
>
> const env = loadEnv('', process.cwd(), '');
>
> console.log(env.XR_ENV);
> ```

## 在客户端 JS 代码中使用环境变量

见[步骤 3](step-3-integrate-webspatial-sdk-into-web-build-tools.md) 章节中的「[检查是否在 WebSpatial 模式下运行](check-if-running-in-webspatial-mode.md)」。


---

下一步：[步骤 3：在 Web 构建工具中集成 WebSpatial SDK](step-3-integrate-webspatial-sdk-into-web-build-tools.md)
