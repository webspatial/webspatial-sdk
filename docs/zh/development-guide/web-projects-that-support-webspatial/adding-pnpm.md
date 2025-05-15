
# 添加 pnpm

上一步：[创建新的 Web 项目](creating-new-web-projects.md)

---

pnpm 是 npm 的一个替代品，使用硬链接和符号链接来节省磁盘空间，并提供更快的安装速度。

> [安装 pnpm](https://pnpm.io/installation)

在根目录下添加 `.npmrc`：

```
shamefully-hoist=true
strict-peer-dependencies=false
auto-install-peers=true
```

在 `.gitignore` 中加入：

```
.pnpm-store/
.pnpm-state.json
.pnpmfile.cjs
```

确保 pnpm 有[全局安装](https://pnpm.io/installation)。
> [!TIP]
> 通过 corepack 安装：
> ```shell
> npm install --global corepack
> corepack enable pnpm
> ```
> 或直接通过 npm 来安装：
> ```shell
> npm install -g pnpm
> ```

在项目中初次用 pnpm 安装依赖，自动生成 `pnpm-lock.yaml`：

```shell
rm -rf node_modules
pnpm install
```

[可选] 在 `package.json` 中添加方便 pnpm 使用的 npm scripts：

```json5
"install:clean": "rm -rf node_modules && pnpm install",
"install:update": "rm -rf node_modules pnpm-lock.yaml package-lock.json && pnpm install",
```

---

下一步：
- [添加 TailwindCSS + PostCSS](adding-tailwindcss-and-postcss.md)
- [在 Web 项目中启用 WebSpatial](../enabling-webspatial-in-web-projects/README.md)

