#  (Optional) Add pnpm

Previous step: [Creating New Web Projects](creating-new-web-projects.md)

---

pnpm is a drop-in replacement for npm. It saves disk space by using hard links and symlinks, and it delivers faster install times.

## Add an `.npmrc` file

Create an `.npmrc` file in the project root.

```ini
shamefully-hoist=true
strict-peer-dependencies=false
auto-install-peers=true
```

## Update `.gitignore`

Add the appropriate pnpm-related entries to `.gitignore`.

```
.pnpm-store/
.pnpm-state.json
.pnpmfile.cjs
```

## Verify pnpm is installed globally

Make sure pnpm is installed globally on your system.

> [!TIP]
> You can install it with Corepack,
> ```shell
> corepack enable pnpm
> ```
> or directly with npm.
> ```shell
> npm install -g pnpm
> ```

## Generate `pnpm-lock.yaml`

When you install dependencies with pnpm for the first time, it automatically creates `pnpm-lock.yaml`.

```shell
rm -rf node_modules
pnpm install
```

<a id="npm-scripts"></a>
## (Optional) Add npm scripts

You can add helper npm scripts in `package.json` to simplify common pnpm commands.

```json5
"install:clean": "rm -rf node_modules && pnpm install",
"install:update": "rm -rf node_modules pnpm-lock.yaml package-lock.json && pnpm install",
```

---

Next steps:

- [Add TailwindCSS + PostCSS](adding-tailwindcss-and-postcss.md)
- [Enable WebSpatial in Web Projects](../enabling-webspatial-in-web-projects/README.md)
