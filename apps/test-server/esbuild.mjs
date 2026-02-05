import * as esbuild from 'esbuild'
import { tailwindPlugin } from 'esbuild-plugin-tailwindcss'
import glob from 'tiny-glob'
import path from 'path'
import fs from 'fs'
import livereload from 'livereload'
import { sassPlugin, postcssModules } from 'esbuild-sass-plugin'
import { createServer } from 'http-server'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const isBuild = process.argv.includes('--build')
const packagesBasePath = '../../packages'

const corePkg = require(`${packagesBasePath}/core/package.json`)
const reactPkg = require(`${packagesBasePath}/react/package.json`)

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
var port = process.env.PORT ? Number(process.env.PORT) : 5173
var liveReloadServerPort = 35729

const buildOptions = {
  entryPoints: entryPoints,
  outdir,
  bundle: true,
  minify: isBuild,
  sourcemap: !isBuild,
  jsx: 'automatic',
  plugins,
  define: {
    'process.env.XR_ENV': JSON.stringify(process.env.XR_ENV ?? ''),
    __WEBSPATIAL_CORE_SDK_VERSION__: JSON.stringify(corePkg.version),
    __WEBSPATIAL_REACT_SDK_VERSION__: JSON.stringify(reactPkg.version),
  },
  // Avoid multiple react copies. https://github.com/evanw/esbuild/issues/3419
  alias: {
    react: path.resolve('node_modules/react'),
    'react-dom': path.resolve('node_modules/react-dom'),
    '@webspatial/react-sdk/jsx-runtime': path.resolve(
      `${packagesBasePath}/react/src/jsx/jsx-runtime.ts`,
    ),
    '@webspatial/react-sdk': path.resolve(`${packagesBasePath}/react/src`),
    '@webspatial/core-sdk': path.resolve(`${packagesBasePath}/core/src`),
  },
}

async function copyPublicFolder(src, dest) {
  if (!fs.existsSync(src)) return
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
  
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      await copyPublicFolder(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

async function prepareDist() {
  console.log('Preparing dist folder...')
  if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true })
  
  // Copy index.html and fix paths
  let html = fs.readFileSync('index.html', 'utf8')
  // Remove /dist prefix from paths because dist will be the root in production
  html = html.replace(/src="\/dist\//g, 'src="/')
  html = html.replace(/href="\/dist\//g, 'href="/')
  fs.writeFileSync(path.join(outdir, 'index.html'), html)
  
  // Copy public folder contents directly to dist root or to /public
  // Most SPAs serve public folder contents from the root
  await copyPublicFolder('public', outdir)
  console.log('Assets copied to dist.')
}

if (isBuild) {
  console.log('Building for production...')
  await esbuild.build(buildOptions)
  await prepareDist()
  console.log('Build complete!')
  process.exit(0)
} else {
  var ctx = await esbuild.context({
    ...buildOptions,
    // Get live reload to work. Bug with number of tabs https://github.com/evanw/esbuild/issues/802 in default esbuild live reload
    banner: {
      js: `
        let liveReloadScript = document.createElement("script")
        liveReloadScript.src = 'http://' + (location.host || 'localhost').split(':')[0] +':${liveReloadServerPort}/livereload.js?snipver=1'
        document.head.append(liveReloadScript)
       `,
    },
  })

  ctx.watch()
  await prepareDist()

  // Use http-server instead of ctx serve to avoid overhead delay of ~500ms
  const staticServer = createServer({
    root: './dist', // Serve from dist now to be consistent with production
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
  watchPaths.push('index.html')
  server.watch(watchPaths)
  console.log('esbuild ready!')
}
