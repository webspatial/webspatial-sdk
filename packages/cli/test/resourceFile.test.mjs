import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { clearDir } from '../dist/lib/resource/file.js'

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
