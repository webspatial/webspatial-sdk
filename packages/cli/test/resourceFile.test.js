const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')

const { clearDir } = require('../dist/lib/resource/file')

test('clearDir removes nested files and dangling symbolic links', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'clear-dir-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const nestedDirectory = path.join(directory, 'nested')

  fs.mkdirSync(nestedDirectory)
  fs.writeFileSync(path.join(nestedDirectory, 'file.txt'), 'content')
  fs.symlinkSync(
    path.join(directory, 'missing-target'),
    path.join(directory, 'dangling-link'),
  )

  clearDir(directory)

  assert.deepEqual(fs.readdirSync(directory), [])
})
