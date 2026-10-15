const { execFileSync } = require('node:child_process')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const cli = path.join(root, 'node_modules/@commitlint/cli/cli.js')

function isVerifiedDependabot(commit) {
  const { author, committer } = commit
  return (
    author?.login === 'dependabot[bot]' &&
    author.id === 49699333 &&
    author.type === 'Bot' &&
    ((committer?.login === 'web-flow' && committer.id === 19864447) ||
      (committer?.login === 'dependabot[bot]' && committer.id === 49699333)) &&
    commit.commit?.verification?.verified === true &&
    commit.commit.verification.reason === 'valid'
  )
}

async function validateCommits({ shas, getCommit, getMessage, lint, log }) {
  for (const sha of shas) {
    let commit
    try {
      commit = await getCommit(sha)
    } catch {
      // Unavailable identity information must never grant an exemption.
      log(`Could not verify ${sha}; applying all commit message rules.`)
    }
    if (commit && isVerifiedDependabot(commit)) {
      log(`Exempting verified Dependabot commit ${sha} from message rules.`)
      continue
    }
    lint(getMessage(sha))
  }
}

async function main() {
  const args = process.argv.slice(2)
  const from = args.includes('--from') ? args[args.indexOf('--from') + 1] : null
  const to = args[args.indexOf('--to') + 1]
  if (
    !args.includes('--to') ||
    !/^[a-f0-9]{40}$/i.test(to) ||
    (from !== null && !/^[a-f0-9]{40}$/i.test(from))
  ) {
    throw new Error(
      'Expected --to <commit SHA> and optional --from <commit SHA>',
    )
  }
  const shas = from
    ? execFileSync('git', ['rev-list', '--reverse', `${from}..${to}`, '--'], {
        cwd: root,
        encoding: 'utf8',
      })
        .trim()
        .split('\n')
        .filter(Boolean)
    : [to]

  await validateCommits({
    shas,
    async getCommit(sha) {
      const repository = process.env.GITHUB_REPOSITORY
      const token = process.env.GH_TOKEN
      if (!repository || !token) throw new Error('Missing GitHub credentials')
      const response = await fetch(
        `${process.env.GITHUB_API_URL || 'https://api.github.com'}/repos/${repository}/commits/${sha}`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28',
          },
          signal: AbortSignal.timeout(15000),
        },
      )
      if (!response.ok)
        throw new Error(`Commit lookup failed: ${response.status}`)
      const commit = await response.json()
      if (commit.sha !== sha) throw new Error('Commit SHA mismatch')
      return commit
    },
    getMessage: sha =>
      execFileSync('git', ['show', '-s', '--format=%B', sha, '--'], {
        cwd: root,
        encoding: 'utf8',
      }),
    lint: message =>
      execFileSync(process.execPath, [cli, '--verbose'], {
        cwd: root,
        input: message,
        stdio: ['pipe', 'inherit', 'inherit'],
      }),
    log: console.log,
  })
}

module.exports = { isVerifiedDependabot, validateCommits }

if (require.main === module) {
  main().catch(error => {
    console.error(error.message)
    process.exitCode = 1
  })
}
