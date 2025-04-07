if (process.env.XR_ENV === 'avp') {
  module.exports = require('./jsx-runtime.avp.js')
} else {
  module.exports = require('./jsx-runtime.web.js')
}
