const fs = require('fs')
process.argv.slice(1).forEach(file => {
  if (fs.existsSync(file)) {
    const size = fs.statSync(file).size
    if (size >= 1048576) {
      console.error(`Error: ${file} is 1MB or larger`)
      process.exit(1)
    }
  }
})
