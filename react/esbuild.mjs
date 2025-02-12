import * as esbuild from 'esbuild'
import dtsPlugin from 'esbuild-plugin-d.ts'
import glob from 'tiny-glob'
//@ts-ignore
import path from 'path'
//@ts-ignore
import fs from 'fs'

const entryPoints = await glob('./src/**/*.tsx')
const entryPointsTs = await glob('./src/**/*.ts')
const allEntryPoints = entryPoints.concat(entryPointsTs)
function clearDist(dir) {
  const distPath = path.resolve(dir)
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true })
    console.log(`Cleared ${distPath}`)
  }
}
// for developer to use, we should ship 2 kinds of output
// 1. ESM unbundled, used with compiling tools (this not treeshaking well for unused import)
// 2. ESM bundled, used by <script> tag

// to target platforms we provide:
// 1. default. AVP impl
// 2. web.

// so we have 2*2 matrix as follow:
// - ESM + default unbundled ❌
// - ESM + web unbundled ❌(this not treeshaking well for unused import)
// - ESM + default bundled ✅
// - ESM + web bundled ✅

// unbundled ESM cannot remove unused import

const targets = [
  {
    name: 'ESM + default bundled',
    entryPoints: ['./src/index.ts'],
    outfile: 'dist/default/index.js',
    dir: 'dist/default',
    define: { __WEB__: 'false' },
    tsconfig: 'tsconfig.default.json',
    format: 'esm',
    bundle: true,
    external: [
      'react',
      'react-dom',
      'three',
      '@xrsdk/runtime',
      'lodash.isequal',
      '@google/model-viewer',
    ],
  },
  {
    name: 'ESM + web bundled',
    entryPoints: ['./src/index.ts'],
    outfile: 'dist/web/index.js',
    dir: 'dist/web',
    define: { __WEB__: 'true' },
    tsconfig: 'tsconfig.web.json',
    format: 'esm',
    bundle: true,
    external: [
      'react',
      'react-dom',
      'three',
      '@xrsdk/runtime',
      'lodash.isequal',
      '@google/model-viewer',
    ],
    alias: { '@xrsdk/runtime': './src/noRuntime.ts' }, // replace the reference to runtime with empty module
  },
]

async function run() {
  const contexts = []

  for (const target of targets) {
    // clearDist(target.dir)

    const ctx = await esbuild.context({
      entryPoints: target.entryPoints, //['./src/index.ts'],
      outdir: target.outdir,
      outfile: target.outfile,
      bundle: target.bundle,
      //@ts-ignore
      format: target.format,
      keepNames: true,
      // minify: true, // fixme: enable this to remove unreachable code inside function
      treeShaking: true,
      sourcemap: true,
      jsx: 'automatic',
      plugins: [
        dtsPlugin({
          tsconfig: target.tsconfig,
        }),
      ],
      define: target.define,
      alias: target.alias,
      external: target.external,
    })

    contexts.push(ctx)
  }

  // Check if --watch flag is provided in the command line arguments
  const watchMode = process.argv.includes('--watch')

  if (watchMode) {
    for (const ctx of contexts) {
      await ctx.watch()
    }
    console.log('All builds started in watch mode!')
  } else {
    for (const ctx of contexts) {
      await ctx.rebuild()
    }
    console.log('All builds completed!')
    process.exit(0)
  }
}

run()
