import { execSync } from 'node:child_process'
import path from 'node:path'

const packageRoot = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '..',
)
const repoRoot = path.resolve(packageRoot, '..', '..')

execSync('node packages/react/scripts/generate-component-docs.mjs', {
  cwd: repoRoot,
  stdio: 'inherit',
})

try {
  execSync('git diff --exit-code -- docs/generated/react-components.json', {
    cwd: repoRoot,
    stdio: 'inherit',
  })
} catch (_error) {
  console.error(
    'Component docs are out of date. Run: pnpm -F @webspatial/react-sdk run docs:components',
  )
  process.exit(1)
}

console.log('Component docs are up to date.')
