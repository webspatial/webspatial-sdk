const fs = require('fs')
const path = require('path')
var inputFile = process.argv[2]

if (!inputFile) {
  console.error('No input file specified.')
  process.exit(1)
}

console.error('Scanning file: ' + inputFile)

// exclude some files
const excludedFiles = ['package.json', 'sensitiveWords.js']

if (excludedFiles.includes(path.basename(inputFile))) {
  console.error('Skipping excluded file: ' + path.basename(inputFile))
  process.exit(0)
}

var scanResults = fs
  .readFileSync(inputFile, 'utf8')
  .split('\n')
  .filter(line => {
    // Match against known sensitive words
    var regex =
      /(WAN)|(AKLT)|(AKAP)|(tokenizer)|(transformer)|(token_id)|(tokenid)|(attention_head)/i
    if (regex.test(line)) {
      console.error(regex + '\nfailed on line:\n' + line + '\n\n')
      return true
    }
    regex =
      /(A3T)|(AKIA)|(AGPA)|(AIDA)|(AROA)|(AIPA)|(ANPA)|(ANVA)|(ASIA)|(LTAI)|(AKTP)|(app_id)|(appid)/i
    if (regex.test(line)) {
      console.error(regex + '\ndetected on line:\n' + line + '\n\n')
      return true
    }
    regex =
      /(byted)|(bytedance)|(feishu)|(larkoffice)|(testak)|(testsk)|(key)|(token)|(auth)|(pass)|(cookie)/i
    if (regex.test(line)) {
      console.error(regex + '\ndetected on line:\n' + line + '\n\n')
      return true
    }
    regex =
      /(session)|(password)|(app_id)|(appid)|(secret_key)|(access_key)|(secretkey)|(accesskey)|(credential)|(secret)|(access)/i
    if (regex.test(line)) {
      console.error(regex + '\ndetected on line:\n' + line + '\n\n')
      return true
    }

    // Match against ip address
    regex = /(\d+\.\d+\.\d+\.\d+)/i
    if (regex.test(line)) {
      console.error(regex + '\ndetected on line:\n' + line + '\n\n')
      return true
    }
  })

if (scanResults.length) {
  console.error('Verify that you are not committing sensitive information.')
  process.exit(1)
}
