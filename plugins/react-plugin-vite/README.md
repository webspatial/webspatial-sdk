# install

## for typescript project.
make sure add these:

```js
// tsconfig.json
{
  "jsx": "react-jsx",
  "jsxImportSource": "@webspatial/react-sdk",
}

```

```js
// vite.config.ts
import WebSpatial from '@webspatial/vite-plugin'
export default defineConfig({
  plugins: [
    react(),
    WebSpatial(), // <----- use it
  ],
})
```

## for javascript project.
make sure add these:

```js
// vite.config.ts

import WebSpatial from '@webspatial/vite-plugin'
export default defineConfig({
  plugins: [
    react({ jsxImportSource: '@webspatial/react-sdk' }),
    WebSpatial(), // <----- use it
  ],
})
```

in package.json, make sure `concurrently` is installed

```json
"scripts":{
  "dev:all":"concurrently \"vite\"  \"XR_ENV=avp vite \" ",
  "build:all": "vite build && XR_ENV=avp vite build"
}
```

if you are using react-router, please set basename like this

```js
const basename = process.env.XR_ENV === 'avp' ? '/webspatial/avp' : '/'
function App() {
  return <Router basename={basename}>// other logic</Router>
}
```

# dev

run `npm run dev:all` will startup the devServer

# build

run `npm run build:all` will build the output
