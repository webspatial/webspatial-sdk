const { spawnSync } = require('child_process')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..', '..')
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

const tsconfigs = [
  'packages/core/tsconfig.json',
  'packages/react/tsconfig.json',
  'packages/cli/tsconfig.json',
  'apps/test-server/tsconfig.json',
  'tests/ci-test/tsconfig.json',
  'tests/react18-compat/tsconfig.json',
  'tests/react19-compat/tsconfig.json',
]

let failed = false
const unusedDiagnosticPattern = /\bTS(6133|6196|6138)\b/

for (const tsconfig of tsconfigs) {
  console.log(`\nChecking unused locals: ${tsconfig}`)
  const result = spawnSync(
    pnpm,
    [
      'exec',
      'tsc',
      '-p',
      tsconfig,
      '--noUnusedLocals',
      'true',
      '--noEmit',
      '--pretty',
      'false',
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  )

  if (result.error) {
    console.error(result.error.message)
    failed = true
    continue
  }

  const output = [result.stdout, result.stderr].filter(Boolean).join('\n')
  const unusedDiagnostics = output
    .split('\n')
    .filter(line => unusedDiagnosticPattern.test(line))

  if (unusedDiagnostics.length > 0) {
    console.error(unusedDiagnostics.join('\n'))
    failed = true
  } else if (result.status !== 0) {
    console.warn(
      `No unused-local diagnostics found in ${tsconfig}; ignoring non-unused TypeScript diagnostics for this focused check.`,
    )
  }
}

if (failed) {
  process.exit(1)
}
