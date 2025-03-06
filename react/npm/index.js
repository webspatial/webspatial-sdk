'use strict'

if (process.env.XR_ENV === 'avp') {
  module.exports = require('../dist/cjs/default/index.js')
} else {
  module.exports = require('../dist/cjs/web/index.js')
}
