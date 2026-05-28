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

// No code transforms: tests render standalone via top-level navigation

var outdir = 'dist'
/** Default dev server port (override with PORT=...). Avoids 5173/5174 conflicts with other local apps. */
const DEFAULT_DEV_PORT = 5173
var port = process.env.PORT ? Number(process.env.PORT) : DEFAULT_DEV_PORT
const DEFAULT_LIVERELOAD_PORT = 35739
var liveReloadServerPort = process.env.LIVERELOAD_PORT
  ? Number(process.env.LIVERELOAD_PORT)
  : DEFAULT_LIVERELOAD_PORT

const buildOptions = {
  entryPoints: entryPoints,
  outdir,
  bundle: true,
  minify: isBuild,
  sourcemap: !isBuild,
  plugins,
  define: {
    __WEBSPATIAL_CORE_SDK_VERSION__: JSON.stringify(corePkg.version),
    __WEBSPATIAL_REACT_SDK_VERSION__: JSON.stringify(reactPkg.version),
  },
  // Avoid multiple react copies. https://github.com/evanw/esbuild/issues/3419
  //
  // IMPORTANT — every published SDK subpath this app may transitively reach
  // MUST be listed here. esbuild's `alias` is a prefix-match remap, so an
  // alias `@webspatial/react-sdk` → `src/eager.ts` causes any longer
  // specifier (e.g. `@webspatial/react-sdk/internal/facades-client`) to
  // get the prefix replaced naively, producing a nonsense path like
  // `src/eager.ts/internal/facades-client`. The fix is to list every
  // subpath explicitly so the more-specific alias wins. Adding a new
  // subpath to `packages/react/package.json#exports` requires adding a
  // matching alias here.
  alias: {
    three: path.resolve('node_modules/three/src/Three.js'),
    react: path.resolve('node_modules/react'),
    'react-dom': path.resolve('node_modules/react-dom'),
    '@webspatial/react-sdk/jsx-runtime': path.resolve(
      `${packagesBasePath}/react/src/jsx/jsx-runtime.ts`,
    ),
    '@webspatial/react-sdk/jsx-dev-runtime': path.resolve(
      `${packagesBasePath}/react/src/jsx/jsx-dev-runtime.ts`,
    ),
    // Internal `'use client'` boundary reached by `jsx-shared.ts` as an
    // external package self-reference (so the published `dist/jsx/jsx-runtime.js`
    // terminates at this file's `'use client'` directive for Next.js RSC
    // bundlers). When consuming source directly, the same specifier MUST
    // alias back to the source file or esbuild's prefix-match remaps it
    // onto `eager.ts/internal/facades-client` and fails to resolve.
    '@webspatial/react-sdk/internal/facades-client': path.resolve(
      `${packagesBasePath}/react/src/internal/facades-client.ts`,
    ),
    // Default lazy-load entry (`bootSpatial` / facades). `bridge.ts` dynamically
    // imports `../spatial`; alias the subpath so esbuild resolves the chunk.
    '@webspatial/react-sdk/spatial': path.resolve(
      `${packagesBasePath}/react/src/spatial/index.ts`,
    ),
    '@webspatial/react-sdk/eager': path.resolve(
      `${packagesBasePath}/react/src/eager.ts`,
    ),
    '@webspatial/react-sdk': path.resolve(
      `${packagesBasePath}/react/src/index.ts`,
    ),
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
  
  // Copy all src/*.html to dist and fix script/href paths
  const htmlFiles = await glob('./src/**/*.html')
  for (const file of htmlFiles) {
    const srcHtml = fs.readFileSync(file, 'utf8')
    const fixedHtml = srcHtml
      .replace(/src="\/dist\//g, 'src="/')
      .replace(/href="\/dist\//g, 'href="/')
      .replace(/dist\/src\//g, 'src/')
    const rel = file.replace(/^src\//, '')
    const dest = path.join(outdir, rel)
    const destDir = path.dirname(dest)
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })
    fs.writeFileSync(dest, fixedHtml)
  }
  
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

  // SPA fallback: deep links (e.g. /spatial-div-motion/multi-track) must serve index.html
  const spaFallback = function (req, res) {
    const raw = req.url || '/'
    const qIndex = raw.indexOf('?')
    const pathname = qIndex === -1 ? raw : raw.slice(0, qIndex)
    const search = qIndex === -1 ? '' : raw.slice(qIndex)
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(pathname)
    if (
      req.method === 'GET' &&
      pathname !== '/index.html' &&
      !hasExtension &&
      !pathname.startsWith('/public/')
    ) {
      req.url = '/index.html' + search
    }
    res.emit('next')
  }

  // Use http-server instead of ctx serve to avoid overhead delay of ~500ms
  const staticServer = createServer({
    root: './dist', // Serve from dist now to be consistent with production
    cache: -1, // Disable caching
    port: port, // Define the port
    before: [spaFallback],
  })
  staticServer.server.on('error', err => {
    if (err?.code === 'EADDRINUSE') {
      console.error(
        `Port ${port} is already in use. Try: PORT=${port + 1} npm run dev:web`,
      )
    } else {
      console.error('HTTP server error:', err)
    }
    process.exit(1)
  })
  staticServer.listen(port, () => {
    console.log('HTTP server is running on http://localhost:' + port)
  })

  let liveReloadActive = false
  try {
    var server = livereload.createServer({
      port: liveReloadServerPort,
      extraExts: ['ts', 'tsx'],
      delay: 50,
    })
    server.on('error', err => {
      console.warn(
        `LiveReload disabled (port ${liveReloadServerPort}):`,
        err?.code || err?.message || err,
      )
      liveReloadActive = false
    })
    server.server?.on?.('listening', () => {
      liveReloadActive = true
    })
    var watchPaths = [path.resolve(outdir)]
    watchPaths = watchPaths.concat(await glob('./src/**/*.html'))
    watchPaths.push('index.html')
    server.watch(watchPaths)
    liveReloadActive = true
  } catch (e) {
    console.warn('LiveReload disabled:', e?.code || e)
  }
  if (!liveReloadActive) {
    console.warn(
      'Continuing without LiveReload — refresh the browser manually after edits.',
    )
  }
  console.log('esbuild ready!')
}
