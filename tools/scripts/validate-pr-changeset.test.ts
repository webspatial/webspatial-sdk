import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const scriptPath = path.resolve('tools/scripts/validate-pr-changeset.sh')

function makeRepo() {
  const repoDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'validate-pr-changeset-'),
  )

  const run = (args: string[]) =>
    execFileSync('git', args, {
      cwd: repoDir,
      stdio: 'pipe',
      encoding: 'utf8',
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: 'Codex',
        GIT_AUTHOR_EMAIL: 'codex@example.com',
        GIT_COMMITTER_NAME: 'Codex',
        GIT_COMMITTER_EMAIL: 'codex@example.com',
      },
    }).trim()

  run(['init'])
  run(['checkout', '-b', 'main'])

  fs.mkdirSync(path.join(repoDir, 'packages/core'), { recursive: true })
  fs.writeFileSync(
    path.join(repoDir, 'packages/core/package.json'),
    '{"name":"core"}\n',
  )
  run(['add', '.'])
  run(['commit', '-m', 'base'])
  const baseSha = run(['rev-parse', 'HEAD'])

  fs.writeFileSync(
    path.join(repoDir, 'packages/core/package.json'),
    '{"name":"core","version":"1.0.1"}\n',
  )
  run(['add', '.'])
  run(['commit', '-m', 'change packages'])
  const headSha = run(['rev-parse', 'HEAD'])

  return { repoDir, baseSha, headSha }
}

function runValidation(env: Record<string, string>) {
  return spawnSync('bash', [scriptPath], {
    cwd: env.REPO_DIR,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...env,
    },
  })
}

afterEach(() => {
  // Nothing to clean up here because each test uses a unique OS temp dir.
})

describe('validate-pr-changeset.sh', () => {
  it('requires a changeset for normal package changes', () => {
    const { repoDir, baseSha, headSha } = makeRepo()
    const result = runValidation({
      REPO_DIR: repoDir,
      BASE_SHA: baseSha,
      HEAD_SHA: headSha,
    })

    expect(result.status).toBe(1)
    expect(result.stderr + result.stdout).toContain('require a changeset')
  })

  it('skips the requirement for stable merge PRs', () => {
    const { repoDir, baseSha, headSha } = makeRepo()
    const result = runValidation({
      REPO_DIR: repoDir,
      BASE_SHA: baseSha,
      HEAD_SHA: headSha,
      PR_HEAD_REF: 'stable-merge-main',
      PR_TITLE: 'Merge stable into main',
      PR_BODY: 'This pull request was created automatically by GitHub Actions.',
    })

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Skipping changeset check')
  })
})
