import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')
const repoRoot = path.resolve(packageRoot, '..', '..')
const generateScript = path.join(scriptDir, 'generate-component-docs.mjs')

execSync(`node "${generateScript}"`, {
  cwd: repoRoot,
  stdio: 'inherit',
})

try {
  execSync(
    'git diff --exit-code -- docs/generated/react-components.json docs/generated/react-components.md',
    {
      cwd: repoRoot,
      stdio: 'inherit',
    },
  )
} catch (_error) {
  console.error(
    'Component docs are out of date. From repo root run: pnpm docs:components (or pnpm -F @webspatial/react-sdk run docs:components)',
  )
  process.exit(1)
}

console.log('Component docs are up to date.')
