const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const repoRoot = path.resolve(__dirname, '..', '..')
const codeql = process.env.CODEQL || 'codeql'
const database = path.resolve(
  repoRoot,
  process.env.CODEQL_DATABASE || '.codeql-db/javascript-typescript',
)
const output = path.resolve(
  repoRoot,
  process.env.CODEQL_OUTPUT ||
    '.codeql-results/javascript-security-and-quality.sarif',
)
const suite =
  process.env.CODEQL_QUERY_SUITE ||
  'codeql/javascript-queries:codeql-suites/javascript-security-and-quality.qls'

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
  })

  if (result.error && result.error.code === 'ENOENT') {
    console.error(
      `\n${command} was not found. Install the CodeQL CLI and make sure it is on PATH, or set CODEQL=/path/to/codeql.`,
    )
    console.error(
      'Download: https://github.com/github/codeql-cli-binaries/releases',
    )
    process.exit(127)
  }

  if (result.status !== 0) {
    process.exit(result.status || 1)
  }
}

run(codeql, ['version'])

fs.rmSync(database, { recursive: true, force: true })
fs.mkdirSync(path.dirname(output), { recursive: true })

run(codeql, [
  'database',
  'create',
  database,
  '--language=javascript-typescript',
  '--source-root',
  repoRoot,
])

run(codeql, [
  'database',
  'analyze',
  database,
  suite,
  '--format=sarif-latest',
  '--output',
  output,
  '--download',
])

console.log(`\nCodeQL results written to ${path.relative(repoRoot, output)}`)
