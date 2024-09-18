const esbuild = require('esbuild');
const transformPlugin = require('../esbuild-plugin-spatial');
esbuild.build({
  entryPoints: ['test/input.tsx'], // 输入文件
  bundle: true,
  external: ['react', 'react-dom', 'web-spatial'],
  jsx: 'automatic',
  outdir: 'dist',
  plugins: [transformPlugin({})],
}).catch(() => process.exit(1));