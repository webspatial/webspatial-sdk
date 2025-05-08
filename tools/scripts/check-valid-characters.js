const fs = require('fs')
const f = process.argv[1]

if (!f.endsWith('check-valid-characters.js')) {
  const c = fs
    .readFileSync(f, 'utf8')
    .split('\\n')
    .filter(l => /[\\u4E00-\\u9FFF]/.test(l))
  if (c.length) {
    console.error('Non english characters detected:\\n' + c.join('\\n'))
    process.exit(1)
  }
}
