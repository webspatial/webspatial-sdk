# Creating a New Web Project

> You can also start from an existing Web project: [Web Projects that Support WebSpatial](README.md)

---

## Essentials of a Modern Web Project

To build a brand-new WebSpatial project from scratch, first create a modern Web project (currently React-only) that meets the following requirements:

- Use HTML APIs (for example, JSX) through a UI framework such as React
- Use CSS APIs through the same UI framework (supports [PostCSS, TailwindCSS](), CSS-in-JS, and other approaches)
- Manage project dependencies with npm or any npm-compatible package manager (for example, [pnpm]())
- Compile and build HTML and static web assets (JS, CSS, images, etc.) that run directly in desktop / mobile browsers
- Run a Web server that exposes URLs accessible from desktop / mobile browsers

> [!TIP]
> During development, run the built-in Dev Server with the `dev` script, which includes compilation and hot reload.
> For production, serve the built output with a production-grade static or dynamic Web server by running the `build` and `start` scripts.

## Initial Project Templates

Below are several options for creating a modern Web project that satisfies the requirements above. Any of these can serve as the starting point before you add the [WebSpatial SDK]().

> Ensure Node.js is installed first. See the [official Node.js site]() for installation instructions.

### React + Vite

```shell
npx create-vite --template react
```

### React + Vite + TypeScript

```shell
npx create-vite --template react-ts
```

### React + Next.js
> [!CAUTION]
> In testing — documentation coming soon

```shell
npx create-next-app --js
```

### React + Next.js + TypeScript
> [!CAUTION]
> In testing — documentation coming soon

```shell
npx create-next-app --ts
```

### React + Rsbuild
> [!CAUTION]
> In testing — documentation coming soon

```shell
npx create-rsbuild --template react
```

### React + Rsbuild + TypeScript
> [!CAUTION]
> In testing — documentation coming soon

```shell
npx create-rsbuild --template react-ts
```

### React + Rspack
> [!CAUTION]
> In testing — documentation coming soon

```shell
npx create-rspack --template react
```

### React + Rspack + TypeScript
> [!CAUTION]
> In testing — documentation coming soon

```shell
npx create-rspack --template react-ts
```

## Adding Other Common Features (Optional)

- [Add TailwindCSS + PostCSS](adding-tailwindcss-and-postcss.md)
- [Add pnpm](adding-pnpm.md)

---

Next step: [Enable WebSpatial in Web Projects](../enabling-webspatial-in-web-projects/README.md)
