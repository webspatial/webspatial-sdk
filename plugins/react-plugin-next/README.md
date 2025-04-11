# install

```js

import withWebspatial from '@webspatial/next-plugin';

const nextConfig: NextConfig = withWebspatial()({
    // other config
});
```

in package.json, make sure `concurrently` is installed

```json
"scripts":{
  "dev:all":"concurrently \"next dev\"  \"XR_ENV=avp next dev \" ",
  "build:all": "next build && XR_ENV=avp next build"
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
