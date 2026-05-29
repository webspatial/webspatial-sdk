const fs = require('fs')
const { exec } = require('child_process')

var getLicense = cmd => {
  return new Promise((res, rej) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`)
        rej('JSON ERROR')
        return
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`)
        rej('JSON STDERROR')
        return
      }

      const dependencies = JSON.parse(stdout)
      res(dependencies)
    })
  })
}

var main = async () => {
  var runtimeDeps = await getLicense(
    'cd packages/core && npx license-checker --json && cd ../..',
  )
  var reactDeps = await getLicense(
    'cd packages/react && npx license-checker --json && cd ../..',
  )

  var cliDeps = await getLicense(
    'cd packages/cli && npx license-checker --json && cd ../..',
  )

  var testServerDeps = await getLicense(
    'cd apps/test-server && npx license-checker --json && cd ../..',
  )

  var citestDeps = await getLicense(
    'cd tests/ci-test && npx license-checker --json && cd ../..',
  )

  var rootDeps = await getLicense('npx license-checker --json')

  var dependencies = {
    ...runtimeDeps,
    ...reactDeps,
    ...cliDeps,
    ...testServerDeps,
    ...citestDeps,
    ...rootDeps,
  }
  let attributionText =
    '## Licenses and Attributions\n\nThis project uses the following third-party libraries:\n\n'

  for (const [packageName, details] of Object.entries(dependencies)) {
    if (packageName.startsWith('@webspatial')) {
      continue
    }
    if (packageName.indexOf('webspatial-sdk') >= 0) {
      continue
    }
    attributionText += `- [${packageName}](${details.repository || 'No repository link'}) - Licensed under the ${details.licenses}\n`
  }

  // Replace ## Licenses and Attributions with the new text
  const contributingFile = './CONTRIBUTING.md'
  if (fs.existsSync(contributingFile)) {
    const originalContent = fs.readFileSync(contributingFile, 'utf-8')

    const idx = originalContent.indexOf('## Licenses and Attributions')
    const prevContent = originalContent.substring(0, idx)

    const newContent = prevContent.concat(attributionText)

    fs.writeFileSync(contributingFile, newContent)
    console.log('finished')
  } else {
    console.log('attributionText \n', attributionText)
  }
}
main()
