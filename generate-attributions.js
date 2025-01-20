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
    'cd runtime && npx license-checker --json && cd ..',
  )
  var reactDeps = await getLicense(
    'cd react && npx license-checker --json && cd ..',
  )
  var jsxRuntimeDeps = await getLicense(
    'cd jsx-runtime && npx license-checker --json && cd ..',
  )
  var testServerDeps = await getLicense(
    'cd testServer && npx license-checker --json && cd ..',
  )
  var rootDeps = await getLicense('npx license-checker --json')

  var dependencies = {
    ...runtimeDeps,
    ...reactDeps,
    ...jsxRuntimeDeps,
    ...testServerDeps,
    ...rootDeps,
  }
  let attributionText =
    '## Licenses and Attributions\n\nThis project uses the following third-party libraries:\n\n'

  for (const [packageName, details] of Object.entries(dependencies)) {
    attributionText += `- [${packageName}](${details.repository || 'No repository link'}) - Licensed under the ${details.licenses}\n`
  }

  // Append or write to README.md
  const readmePath = './README.md'
  if (fs.existsSync(readmePath)) {
    fs.appendFileSync(readmePath, `\n\n${attributionText}`)
    console.log('Attributions added to README.md')
  } else {
    fs.writeFileSync(readmePath, attributionText)
    console.log('README.md created with attributions.')
  }
}
main()
