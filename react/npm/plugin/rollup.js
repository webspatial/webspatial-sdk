export default function injectProcessEnv() {
  return {
    name: 'rollup-plugin-inject-env',
    define: {
      'process.env.XR_ENV': JSON.stringify(process.env.XR_ENV || ''),
    },
  }
}
