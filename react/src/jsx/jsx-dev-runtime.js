if (process.env.XR_ENV === 'avp') {
  module.exports = require('./jsx-dev-runtime.avp.js')
} else {
  module.exports = require('./jsx-dev-runtime.web.js')
}
