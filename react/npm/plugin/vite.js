export default function injectProcessEnv() {
  return {
    name: 'vite-plugin-inject-env',
    config: () => ({
      define: {
        'process.env.XR_ENV': JSON.stringify(process.env.XR_ENV || ''),
      },
    }),
  }
}
