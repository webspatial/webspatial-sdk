# Creating a New Web Project

> [!TIP]
> You can also start from [existing Web projects](./README.md)

<a id="requirements"></a>
## Modern Web Project Essentials

To build a brand-new WebSpatial project from scratch, first create a modern Web project (currently React-only) that meets the following requirements:

- Use HTML APIs (for example, JSX) through a UI framework such as React
- Use CSS APIs through the same UI framework (supports [PostCSS, TailwindCSS](./adding-tailwindcss-and-postcss.md), CSS-in-JS, and other approaches)
- Manage project dependencies with npm or any npm-compatible package manager (like [pnpm](./adding-pnpm.md))
- Compile and build HTML and static web assets (JS, CSS, images, etc.) that run directly in desktop / mobile browsers
- Run a Web server that exposes URLs accessible from desktop / mobile browsers

<a id="templates"></a>
## Project Templates for Getting Started

Below are several options for creating a modern Web project that satisfies the requirements above. Any of these can serve as the starting point before you add the [WebSpatial SDK](../../core-concepts/unique-concepts-in-webspatial.md#webspatial-sdk).

> [!NOTE]
> Ensure Node.js is installed first. See the [official Node.js site](https://nodejs.org/en/download) for installation instructions.

1. React + Vite

   ```shell
   npx create-vite --template react
   ```

2. React + Vite + TypeScript

   ```shell
   npx create-vite --template react-ts
   ```

3. React + Next.js

   > [!CAUTION]
   > In testing — more docs to be added

   ```shell
   npx create-next-app --js
   ```

4. React + Next.js + TypeScript

   > [!CAUTION]
   > In testing — more docs to be added

   ```shell
   npx create-next-app --ts
   ```

5. React + Rsbuild

   > [!CAUTION]
   > In testing — more docs to be added

   ```shell
   npx create-rsbuild --template react
   ```

6. React + Rsbuild + TypeScript

   > [!CAUTION]
   > In testing — more docs to be added

   ```shell
   npx create-rsbuild --template react-ts
   ```

7. React + Rspack

   > [!CAUTION]
   > In testing — more docs to be added

   ```shell
   npx create-rspack --template react
   ```

8. React + Rspack + TypeScript

   > [!CAUTION]
   > In testing — more docs to be added

   ```shell
   npx create-rspack --template react-ts
   ```

<a id="other-features"></a>
## Adding Other Common Features (Optional)

- [Add TailwindCSS + PostCSS](./adding-tailwindcss-and-postcss.md)
- [Add pnpm](./adding-pnpm.md)

---

Next step: [Enable WebSpatial in Web Projects](../enabling-webspatial-in-web-projects/README.md)
