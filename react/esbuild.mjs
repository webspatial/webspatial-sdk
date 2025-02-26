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
