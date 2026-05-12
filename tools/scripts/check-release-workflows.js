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
  'pnpm add --global npm@11.5.1',
  'npm beta release workflow must install the trusted-publishing npm CLI via pnpm.',
)
assertExcludes(
  betaWorkflow,
  'npm install -g npm',
  'npm beta release workflow must not use npm to upgrade npm.',
)
assertIncludes(
  betaWorkflow,
  'pnpm exec changeset publish --tag beta --no-git-tag',
  'npm beta release workflow must publish snapshot packages with the beta tag.',
)
