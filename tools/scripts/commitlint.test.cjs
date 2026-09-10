const { test } = require('node:test')
const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const cli = path.join(root, 'node_modules/@commitlint/cli/cli.js')
const cases = [
  ['work item', 'feat(react): add scene persistence\n\nticket: 123456', true],
  ['no work item', 'chore: update tooling\n\nticket: 0', true],
  ['compact ticket', 'fix: update tooling\n\nticket:123', true],
  ['CRLF', 'fix: update tooling\r\n\r\nticket: 123\r\n', true],
  ['case insensitive', 'fix: update tooling\n\nTicket: 123', true],
  [
    'body and footer',
    'fix: update tooling\n\nExplain the change.\n\nticket: 123\n\nSigned-off-by: Example <example@example.com>',
    true,
  ],
  ['missing ticket', 'fix: update tooling', false],
  ['non-numeric ticket', 'fix: update tooling\n\nticket: ABC-123', false],
  ['split ticket', 'fix: update tooling\n\nticket:\n123', false],
  ['inline ticket', 'fix: update tooling\n\nReferences ticket: 123', false],
  ['invalid type', 'foo: update tooling\n\nticket: 123', false],
  ['long header', `fix: ${'a'.repeat(68)}\n\nticket: 123`, false],
  ['generated merge exemption', "Merge branch 'main' into topic", true],
]
for (const [name, message, valid] of cases) {
  test(name, () => {
    const result = spawnSync(process.execPath, [cli], {
      cwd: root,
      input: message,
      encoding: 'utf8',
    })
    assert.ifError(result.error)
    assert.equal(result.status, valid ? 0 : 1, result.stdout + result.stderr)
  })
}
