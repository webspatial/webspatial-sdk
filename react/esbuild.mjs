import * as esbuild from 'esbuild'
import dtsPlugin from 'esbuild-plugin-d.ts'
import glob from 'tiny-glob'

const entryPoints = await glob('./src/**/*.tsx')
const entryPointsTs = await glob('./src/**/*.ts')
const allEntryPoints = entryPoints.concat(entryPointsTs)

const targets = [
  {
    name: 'h5',
    dir: 'dist/h5',
    define: { __WEB__: 'true' },
  },
  {
    name: 'default',
    dir: 'dist/default',
    define: { __WEB__: 'false' },
  },
]

async function run() {
  const contexts = []

  for (const target of targets) {
    const ctx = await esbuild.context({
      entryPoints: allEntryPoints,
      outdir: target.dir,
      bundle: false,
      format: 'esm',
      keepNames: true,
      minify: true, // fixme: enable this to remove unreachable code inside function
      treeShaking: true,
      sourcemap: true,
      jsx: 'automatic',
      plugins: [dtsPlugin()],
      define: target.define,
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
