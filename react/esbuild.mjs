import * as esbuild from 'esbuild'
import dtsPlugin from 'esbuild-plugin-d.ts'
import glob from 'tiny-glob'
import path from 'path'
import fs from 'fs'
import { exec } from 'child_process'

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

// for dynamic choose version we should ship 2 kinds of cjs output and switch by env variable

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
    name: 'CJS + default bundled',
    entryPoints: ['./src/index.ts'],
    outfile: 'dist/cjs/default/index.js',
    dir: 'dist/cjs',
    define: { __WEB__: 'false' },
    tsconfig: 'tsconfig.default.json',
    format: 'cjs',
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
    name: 'CJS + web bundled',
    entryPoints: ['./src/index.ts'],
    outfile: 'dist/cjs/web/index.js',
    dir: 'dist/cjs',
    define: { __WEB__: 'true' },
    tsconfig: 'tsconfig.web.json',
    format: 'cjs',
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
  // {
  //   name: 'ESM + default bundled',
  //   entryPoints: ['./src/index.ts'],
  //   outfile: 'dist/default/index.js',
  //   dir: 'dist/default',
  //   define: { __WEB__: 'false' },
  //   tsconfig: 'tsconfig.default.json',
  //   format: 'esm',
  //   bundle: true,
  //   external: [
  //     'react',
  //     'react-dom',
  //     'three',
  //     '@xrsdk/runtime',
  //     'lodash.isequal',
  //     '@google/model-viewer',
  //   ],
  // },
  // {
  //   name: 'ESM + web bundled',
  //   entryPoints: ['./src/index.ts'],
  //   outfile: 'dist/web/index.js',
  //   dir: 'dist/web',
  //   define: { __WEB__: 'true' },
  //   tsconfig: 'tsconfig.web.json',
  //   format: 'esm',
  //   bundle: true,
  //   external: [
  //     'react',
  //     'react-dom',
  //     'three',
  //     '@xrsdk/runtime',
  //     'lodash.isequal',
  //     '@google/model-viewer',
  //   ],
  //   alias: { '@xrsdk/runtime': './src/noRuntime.ts' }, // replace the reference to runtime with empty module
  // },
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

  // mkDistDir()
  // copyNpmToDist()

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

function mkDistDir() {
  const distPath = path.resolve('dist')
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true })
    console.log(`Created dist directory at ${distPath}`)
  }
}

function copyNpmToDist() {
  exec('cp -rf npm/* dist/', (err, stdout, stderr) => {
    if (err) {
      console.error('Error copying npm folder:', err)
      return
    }
    console.log('Copied npm folder to dist:', stdout)
  })
}

run()
