#!/usr/bin/env node
/**
 * WebSpatial public-API snapshot command.
 *
 *   node tools/api-snapshot/cli.js update
 *       Regenerate tools/api-snapshot/api-baseline.json from the current
 *       sources + built .d.ts. Run after an intentional API change and commit
 *       the result. (Root script: pnpm run api:snapshot)
 *
 *   node tools/api-snapshot/cli.js check [--report <file>]
 *       Regenerate the snapshot, diff it against the committed baseline, and
 *       print a markdown report of every change. Exits 1 on any drift so CI
 *       forces the diff to be visible (and the baseline updated) in the PR.
 *       (Root script: pnpm run api:snapshot:check)
 *
 * Prerequisite for both: the react-sdk .d.ts must be built —
 *   pnpm --filter @webspatial/core-sdk build && pnpm --filter @webspatial/react-sdk build
 */
const fs = require('fs')
const path = require('path')
const { extractSnapshot } = require('./extract')
const { diffSnapshots, renderReport } = require('./report')

const BASELINE_PATH = path.join(__dirname, 'api-baseline.json')

// The baseline is committed and the repo's pre-commit hook runs prettier on
// *.json, so the generator must emit prettier's formatting or regeneration
// and the hook would fight each other.
async function serialize(snapshot) {
  const prettier = require('prettier')
  const text = JSON.stringify(snapshot, null, 2)
  const config = (await prettier.resolveConfig(BASELINE_PATH)) ?? {}
  return prettier.format(text, { ...config, filepath: BASELINE_PATH })
}

async function main() {
  const [, , command, ...rest] = process.argv
  const reportFlagIndex = rest.indexOf('--report')
  const reportPath =
    reportFlagIndex >= 0 ? rest[reportFlagIndex + 1] : undefined

  if (command !== 'update' && command !== 'check') {
    console.error(
      'Usage: node tools/api-snapshot/cli.js <update|check> [--report <file>]',
    )
    process.exit(2)
  }

  const snapshot = extractSnapshot()

  if (command === 'update') {
    fs.writeFileSync(BASELINE_PATH, await serialize(snapshot))
    console.log(`Wrote ${path.relative(process.cwd(), BASELINE_PATH)}`)
    const inconsistencies = Object.entries(snapshot.consistency)
    if (inconsistencies.length > 0) {
      console.log('')
      console.log(
        `Note: ${inconsistencies.length} known cross-source inconsistencies are recorded in the baseline:`,
      )
      for (const [id, message] of inconsistencies) {
        console.log(`  - [${id}] ${message}`)
      }
    }
    return
  }

  if (!fs.existsSync(BASELINE_PATH)) {
    console.error(
      `Missing baseline ${path.relative(process.cwd(), BASELINE_PATH)}.\n` +
        'Generate it with: pnpm run api:snapshot',
    )
    process.exit(1)
  }

  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'))
  const changes = diffSnapshots(baseline, snapshot)
  const report = renderReport(changes, snapshot)

  if (reportPath) {
    fs.mkdirSync(path.dirname(path.resolve(reportPath)), { recursive: true })
    fs.writeFileSync(reportPath, report + '\n')
  }
  console.log(report)

  if (changes.length > 0) {
    console.error('')
    console.error(
      `API snapshot drift: ${changes.length} change(s) vs tools/api-snapshot/api-baseline.json.`,
    )
    process.exit(1)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
