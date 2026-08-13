import path from 'node:path'
import { fileURLToPath } from 'node:url'

import rspack from '@rspack/core'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default {
  context: __dirname,
  entry: {
    index: './src/main.tsx',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'assets/[name]-[contenthash:8].js',
    chunkFilename: 'assets/[name]-[contenthash:8].js',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        // core-sdk currently emits ESM with extensionless relative imports
        // (`./SpatialObject` rather than `./SpatialObject.js`). Rspack's
        // strict ESM resolver treats those as fully specified by default, so
        // the fixture opts into extension probing for package-internal SDK JS.
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.[cm]?[jt]sx?$/,
        exclude: /node_modules/,
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: 'typescript',
              tsx: true,
            },
            transform: {
              react: {
                runtime: 'automatic',
                importSource: '@webspatial/react-sdk',
              },
            },
          },
        },
      },
    ],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
  performance: {
    hints: false,
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      filename: 'index.html',
      chunks: ['index'],
      templateContent: '<!doctype html><div id="root"></div>',
    }),
  ],
  devServer: {
    port: 3050,
    static: {
      directory: path.resolve(__dirname, 'public'),
      publicPath: '/',
      watch: true,
    },
  },
}
