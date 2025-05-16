# Add TailwindCSS and PostCSS

Previous step: [Creating New Web Projects](creating-new-web-projects.md)

---

TailwindCSS is a utility-first CSS framework that provides a large set of atomic classes to speed up UI development.
PostCSS is a tool for transforming CSS with JavaScript, allowing you to use upcoming CSS features today.

## Install dependencies

Install the required packages with your package manager.

```bash
npm install -D tailwindcss postcss autoprefixer
```

## Generate configuration files

Run the following command to generate the TailwindCSS and PostCSS configuration files.

```shell
npx tailwindcss init -p
```

It will create `tailwind.config.js` and `postcss.config.js`.

## Configure template paths

Edit `tailwind.config.js` and specify the template paths that TailwindCSS should scan.

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## Integrate with your build tool

Finally, add the necessary configuration to your web build tool.
For example, if you are using Vite, add the TailwindCSS plugin in `vite.config.js`.

```js
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
```

---

Next steps:

- [Add pnpm](adding-pnpm.md)
- [Enable WebSpatial in Web Projects](../enabling-webspatial-in-web-projects/README.md)
