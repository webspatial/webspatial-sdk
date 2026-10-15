const { test } = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const path = require('node:path')
const { validateCommits } = require('./lint-commit-range.cjs')

const root = path.resolve(__dirname, '../..')
const bot = {
  author: { login: 'dependabot[bot]', id: 49699333, type: 'Bot' },
  committer: { login: 'web-flow', id: 19864447 },
  commit: { verification: { verified: true, reason: 'valid' } },
}
const valid = 'fix: update tooling\n\nticket: 123'
// Deliberately violates ticket and length rules, like a generated grouped update.
const generated = `chore(deps): ${'a'.repeat(80)}\n\n${'b'.repeat(101)}`

function validate(commits, lookup = async sha => commits[sha].identity) {
  const checked = []
  const promise = validateCommits({
    shas: Object.keys(commits),
    getCommit: lookup,
    getMessage: sha => commits[sha].message,
    lint(message) {
      checked.push(message)
      execFileSync(process.execPath, ['node_modules/@commitlint/cli/cli.js'], {
        cwd: root,
        input: message,
        stdio: 'pipe',
      })
    },
    log() {},
  })
  return { promise, checked }
}

test('verified Dependabot is exempt, while a valid human follow-up is linted', async () => {
  const { promise, checked } = validate({
    bot: { identity: bot, message: generated },
    human: { identity: { author: { login: 'maintainer' } }, message: valid },
  })
  await promise
  assert.deepEqual(checked, [valid])
})

test('a human follow-up without ticket still fails in a Dependabot PR', async () => {
  const { promise } = validate({
    bot: { identity: bot, message: generated },
    human: { identity: {}, message: 'fix: update tooling' },
  })
  await assert.rejects(promise)
})

for (const [name, identity] of [
  ['unsigned bot', { ...bot, commit: { verification: { verified: false } } }],
  ['spoofed bot login', { ...bot, author: { ...bot.author, id: 123 } }],
  ['human committer', { ...bot, committer: { login: 'maintainer', id: 123 } }],
  ['human author', { ...bot, author: { login: 'maintainer', id: 123 } }],
]) {
  test(`${name} receives all normal message checks`, async () => {
    const { promise } = validate({ commit: { identity, message: generated } })
    await assert.rejects(promise)
  })
}

test('an unavailable GitHub API falls back to normal linting', async () => {
  const lookup = async () => {
    throw new Error('API unavailable')
  }
  const passing = validate({ human: { message: valid } }, lookup)
  await passing.promise
  assert.deepEqual(passing.checked, [valid])
  const failing = validate({ bot: { message: generated } }, lookup)
  await assert.rejects(failing.promise)
})
