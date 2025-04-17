import * as esbuild from 'esbuild'
import { tailwindPlugin } from 'esbuild-plugin-tailwindcss'
import glob from 'tiny-glob'
import path from 'path'
import livereload from 'livereload'
import { sassPlugin, postcssModules } from 'esbuild-sass-plugin'
import { createServer } from 'http-server'

import corePkg from '../core/package.json' assert { type: 'json' }
import reactPkg from '../react/package.json' assert { type: 'json' }

var entryPoints = await glob('./src/**/*.tsx')
entryPoints = entryPoints.concat(await glob('./src/**/*.ts'))
entryPoints.push('index.tsx')
entryPoints.push('src/index.css')

var plugins = []
plugins.push(tailwindPlugin())
plugins.push(
  sassPlugin({
    filter: /\.module\.scss$/,
    transform: postcssModules({}, []),
  }),
)
plugins.push(sassPlugin())

var outdir = 'dist'
var port = 5173
var liveReloadServerPort = 35729

var ctx = await esbuild.context({
  entryPoints: entryPoints,
  outdir,
  bundle: true,
  minify: false,
  sourcemap: true,
  jsx: 'automatic',
  plugins,
  define: {
    'process.env.XR_ENV': JSON.stringify(process.env.XR_ENV),
    __WEBSPATIAL_CORE_SDK_VERSION__: JSON.stringify(corePkg.version),
    __WEBSPATIAL_REACT_SDK_VERSION__: JSON.stringify(reactPkg.version),
  },
  // Get live reload to work. Bug with number of tabs https://github.com/evanw/esbuild/issues/802 in default esbuild live reload
  banner: {
    js: `
        let liveReloadScript = document.createElement("script")
        liveReloadScript.src = 'http://' + (location.host || 'localhost').split(':')[0] +':${liveReloadServerPort}/livereload.js?snipver=1'
        document.head.append(liveReloadScript)
       `,
  },
  // Avoid multiple react copies. https://github.com/evanw/esbuild/issues/3419
  alias: {
    react: path.resolve('node_modules/react'),
    'react-dom': path.resolve('node_modules/react-dom'),
    '@webspatial/react-sdk/jsx-runtime': path.resolve(
      '../react/src/jsx/jsx-runtime.ts',
    ),
    '@webspatial/react-sdk': path.resolve('../react/src'),
    '@webspatial/core-sdk': path.resolve('../core/src'),
  },
})

ctx.watch()

// Use http-server instead of ctx serve to avoid overhead delay of ~500ms
const staticServer = createServer({
  root: './', // Set the root directory
  cache: -1, // Disable caching
  port: port, // Define the port
})
staticServer.listen(port, () => {
  console.log('HTTP server is running on http://localhost:' + port)
})

var server = livereload.createServer({
  port: liveReloadServerPort,
  extraExts: ['ts', 'tsx'],
  delay: 50,
})
var watchPaths = [path.resolve(outdir)]
watchPaths = watchPaths.concat(await glob('./src/**/*.html'))
// watchPaths = watchPaths.concat(await glob("./src/**/*.tsx"));
// watchPaths = watchPaths.concat(await glob("./src/**/*.ts"));
watchPaths.push('index.html')
// watchPaths.push("index.tsx");
server.watch(watchPaths)
console.log('esbuild ready!')
