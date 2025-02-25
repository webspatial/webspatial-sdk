'use strict'

console.log('process.env.NODE_ENV=', process.env.NODE_ENV)
if (process.env.XR_ENV === 'web') {
  module.exports = require('./cjs/index.web.js')
} else {
  module.exports = require('./cjs/index.default.js')
}
