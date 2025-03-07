const path = require('path')
const fs = require('fs')
const { getEnv, AVP } = require('./shared')

function injectProcessEnv() {
  return {
    name: 'vite-plugin-inject-env',
    config: () => {
      const xrEnv = getEnv()

      const isAVP = xrEnv === AVP

      const output = isAVP
        ? {
            entryFileNames: `assets/[name]-[hash].${AVP}.js`, // no share js entry
            chunkFileNames: `assets/[name]-[hash].${AVP}.js`, // no share js chunk
            assetFileNames: 'assets/[name]-[hash][extname]', // shared css image
          }
        : {}

      return {
        resolve: {
          alias: [
            {
              find: /^@webspatial\/react-sdk$/,
              replacement: isAVP
                ? '@webspatial/react-sdk/default'
                : '@webspatial/react-sdk/web',
            },
          ],
        },
        define: {
          'process.env.XR_ENV': JSON.stringify(xrEnv),
          'import.meta.env.XR_ENV': JSON.stringify(xrEnv), // visible in development
        },
        build: {
          emptyOutDir: xrEnv !== AVP, // keep dist folder
          rollupOptions: {
            output,
          },
        },
        optimizeDeps: {},
      }
    },
    renderStart(outputOptions) {
      // rename index.html to index.avp.html
      const xrEnv = getEnv()
      if (xrEnv !== AVP) {
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
      if (xrEnv !== AVP) {
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
