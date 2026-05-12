const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..', '..')
const betaWorkflowPath = path.join(
  repoRoot,
  '.github',
  'workflows',
  'npm-beta-release.yml',
)
const betaWorkflow = fs.readFileSync(betaWorkflowPath, 'utf8')

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
  betaWorkflow,
  'branches:\n      - main',
  'npm beta release workflow must run on pushes to main.',
)
assertIncludes(
  betaWorkflow,
  'node-version: 24',
  'npm beta release workflow must use Node 24 so the active npm CLI supports trusted publishing.',
)
assertIncludes(
  betaWorkflow,
  "FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'",
  'npm beta release workflow must opt into the Node 24 JavaScript action runtime.',
)
assertExcludes(
  betaWorkflow,
  'pnpm add --global npm',
  'npm beta release workflow must not install npm into pnpm global storage.',
)
assertExcludes(
  betaWorkflow,
  'npm install -g npm',
  'npm beta release workflow must not self-upgrade the runner-provided npm CLI.',
)
assertIncludes(
  betaWorkflow,
  "execFileSync('npm', ['--version']",
  'npm beta release workflow must verify the active npm CLI version after upgrade.',
)
assertIncludes(
  betaWorkflow,
  'pnpm exec changeset publish --tag beta --no-git-tag',
  'npm beta release workflow must publish snapshot packages with the beta tag.',
)
