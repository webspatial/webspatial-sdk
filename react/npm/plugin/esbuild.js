const { definePlugin } = require('esbuild-plugin-define')

const injectEnvPlugin = () => {
  return definePlugin({
    process: {
      env: {
        XR_ENV: process.env.XR_ENV,
      },
    },
  })
}
module.exports = injectEnvPlugin
