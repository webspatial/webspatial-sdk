const path = require('path')
const fs = require('fs')
const { getEnv, infix } = require('./shared')

function injectProcessEnv() {
  return {
    name: 'vite-plugin-inject-env',
    config: () => {
      const xrEnv = getEnv()
      const output =
        xrEnv !== 'web'
          ? {
              entryFileNames: `assets/[name]-[hash].${infix}.js`, // no share js entry
              chunkFileNames: `assets/[name]-[hash].${infix}.js`, // no share js chunk
              assetFileNames: 'assets/[name]-[hash][extname]', // shared css image
            }
          : {}

      return {
        define: {
          'process.env.XR_ENV': JSON.stringify(xrEnv),
          'import.meta.env.XR_ENV': JSON.stringify(xrEnv), // visible in development
        },
        build: {
          emptyOutDir: xrEnv === 'web', // keep dist folder
          rollupOptions: { output },
          commonjsOptions: {
            include: [/@webspatial\/react-sdk\/.*/, /node_modules/],
          },
        },
        optimizeDeps: {
          force: true, // ignore cache
          include: [
            '@webspatial/react-sdk',
            '@webspatial/react-sdk/jsx-dev-runtime',
            '@webspatial/react-sdk/jsx-runtime',
            '@webspatial/core-sdk',
            // force to use prebuild package completely
            // hybrid cjs&esm will cause the static variable like requestCounter be reset
          ], // prebuild cjs to esm
        },
      }
    },
    renderStart(outputOptions) {
      // rename index.html to index.avp.html
      const xrEnv = getEnv()
      if (xrEnv === 'web') {
        return
      }

      const outDir = outputOptions.dir || 'dist'
      const indexPath = path.resolve(outDir, 'index.html')
      const tempIndexPath = path.resolve(outDir, 'index.html.tmp')

      if (fs.existsSync(indexPath)) {
        fs.renameSync(indexPath, tempIndexPath)
        console.log(
          `[Build Start] Renamed existing index.html to ${tempIndexPath}`,
        )
      }
    },
    writeBundle(outputOptions) {
      const xrEnv = getEnv()
      if (xrEnv === 'web') {
        return
      }
      const outDir = outputOptions.dir || 'dist'
      const indexHtmlPath = path.resolve(outDir, 'index.html')
      const tempIndexPath = path.resolve(outDir, 'index.html.tmp')
      const newHtmlPath = path.resolve(outDir, 'index.avp.html')

      if (fs.existsSync(indexHtmlPath)) {
        fs.renameSync(indexHtmlPath, newHtmlPath)
        console.log(`Renamed index.html to ${newHtmlPath}`)
      }

      // recover index.html.tmp to index.html
      if (fs.existsSync(tempIndexPath)) {
        fs.renameSync(tempIndexPath, indexHtmlPath)
        console.log(`Renamed ${tempIndexPath} back to index.html`)
      }
    },
  }
}
module.exports = injectProcessEnv
