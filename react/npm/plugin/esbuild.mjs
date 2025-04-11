import { definePlugin } from 'esbuild-plugin-define'
const injectEnvPlugin = () => {
  return definePlugin({
    process: {
      env: {
        XR_ENV: process.env.XR_ENV,
      },
    },
  })
}
export default injectEnvPlugin
