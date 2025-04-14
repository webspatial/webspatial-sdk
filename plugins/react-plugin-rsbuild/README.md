# install

```js
// rsbuild.config.ts

import {defineConfig} from '@rsbuild/core';
import {pluginReact} from '@rsbuild/plugin-react';
import webspatial from '@webspatial/rsbuild-plugin';

export default defineConfig({
    plugins: [
        pluginReact({
            swcReactOptions: {
                runtime: 'automatic',
                importSource: '@webspatial/react-sdk',
            },
        }),
        webspatial(),
    ],
});

```

in package.json, make sure `concurrently` is installed

```json
"scripts":{
  "dev:all":"concurrently \"rsbuild dev\"  \"XR_ENV=avp rsbuild dev \" ",
   "build:all":"rsbuild build && XR_ENV=avp rsbuild build",
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
