const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..', '..')
const changesetsWorkflowPath = path.join(
  repoRoot,
  '.github',
  'workflows',
  'changesets.yml',
)
const changesetsWorkflow = fs.readFileSync(changesetsWorkflowPath, 'utf8')

function assertIncludes(haystack, needle, message) {
  if (!haystack.includes(needle)) {
    throw new Error(message)
  }
}

function assertExcludes(haystack, needle, message) {
  if (haystack.includes(needle)) {
    throw new Error(message)
  }
}

assertIncludes(
  changesetsWorkflow,
  'branches:\n      - stable',
  'Changesets workflow must run on pushes to stable for release.',
)
assertIncludes(
  changesetsWorkflow,
  '\n      - main\n',
  'Changesets workflow must run on pushes to main for beta snapshot release.',
)

const publishBetaStart = changesetsWorkflow.indexOf('  publish-beta:')
const syncMainStart = changesetsWorkflow.indexOf(
  '  sync_main:',
  publishBetaStart,
)
if (publishBetaStart === -1 || syncMainStart === -1) {
  throw new Error(
    'changesets.yml must define jobs publish-beta (main beta) and sync_main in that order.',
  )
}
const publishBetaBlock = changesetsWorkflow.slice(
  publishBetaStart,
  syncMainStart,
)

assertIncludes(
  publishBetaBlock,
  "github.ref == 'refs/heads/main'",
  'publish-beta job must run only on pushes to main.',
)
assertIncludes(
  publishBetaBlock,
  'node-version: 24',
  'publish-beta job must use Node 24 so the active npm CLI supports trusted publishing.',
)
assertIncludes(
  publishBetaBlock,
  "FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'",
  'publish-beta job must opt into the Node 24 JavaScript action runtime.',
)
assertExcludes(
  publishBetaBlock,
  'pnpm add --global npm',
  'publish-beta job must not install npm into pnpm global storage.',
)
assertExcludes(
  publishBetaBlock,
  'npm install -g npm',
  'publish-beta job must not self-upgrade the runner-provided npm CLI.',
)
assertIncludes(
  publishBetaBlock,
  "execFileSync('npm', ['--version']",
  'publish-beta job must verify the active npm CLI version.',
)
assertIncludes(
  publishBetaBlock,
  'pnpm exec changeset publish --tag beta --no-git-tag',
  'publish-beta job must publish snapshot packages with the beta tag.',
)
