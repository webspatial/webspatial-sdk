'use strict'

if (process.env.XR_ENV === 'web') {
  module.exports = require('../dist/cjs/web/index.js')
} else {
  module.exports = require('../dist/cjs/default/index.js')
}
