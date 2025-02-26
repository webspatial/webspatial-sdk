#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
const targetArg = args.find(arg => arg.startsWith('--target='))
const target = targetArg ? targetArg.split('=')[1] : 'default'

const packagePath = path.resolve(__dirname, '../package.json')
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))

packageJson.exports = {
  './web': './dist/web/index.js',
  './default': './dist/default/index.js',
  '.': target === 'web' ? './dist/web/index.js' : './dist/default/index.js',
}

fs.writeFileSync(
  packagePath,
  JSON.stringify(packageJson, null, 2) + '\n',
  'utf-8',
)

console.log(`Switched to target: ${target}`)
