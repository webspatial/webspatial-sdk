## install

create a rspack project using `pnpm create rspack@latest`

`pnpm i -D @webspatial/rspack-plugin`

## setup

in `rspack.config.mjs`

```mjs
import path, {dirname} from 'node:path';
import {defineConfig} from '@rspack/cli';
import {rspack} from '@rspack/core';
import RefreshPlugin from '@rspack/plugin-react-refresh';
import WebspatialPlugin from '@webspatial/rspack-plugin';
import {fileURLToPath} from 'node:url';

const isDev = process.env.NODE_ENV === 'development';

// Target browsers, see: https://github.com/browserslist/browserslist
const targets = ['chrome >= 87', 'edge >= 88', 'firefox >= 78', 'safari >= 14'];
const __dirname = dirname(fileURLToPath(import.meta.url));
export default defineConfig({
    context: __dirname,
    entry: {
        main: './src/main.tsx',
    },
    resolve: {
        extensions: ['...', '.ts', '.tsx', '.jsx'],
    },
    module: {
        rules: [
            {
                test: /\.svg$/,
                type: 'asset',
            },
            {
                test: /\.(jsx?|tsx?)$/,
                use: [
                    {
                        loader: 'builtin:swc-loader',
                        options: {
                            jsc: {
                                parser: {
                                    syntax: 'typescript',
                                    tsx: true,
                                },
                                transform: {
                                    react: {
                                        importSource: '@webspatial/react-sdk', // ADD THIS
                                        runtime: 'automatic',
                                        development: isDev,
                                        refresh: isDev,
                                    },
                                },
                            },
                            env: {targets},
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        new rspack.HtmlRspackPlugin({
            template: './index.html',
        }),
        isDev ? new RefreshPlugin() : null,
        new WebspatialPlugin(), // <<<--- ADD THIS
        // {outputDir:'myoutput'}
    ].filter(Boolean),
    optimization: {
        minimizer: [
            new rspack.SwcJsMinimizerRspackPlugin(),
            new rspack.LightningCssMinimizerRspackPlugin({
                minimizerOptions: {targets},
            }),
        ],
    },
    experiments: {
        css: true,
    },
    devServer: {
        port: 3000,
    },
    output: {
        // publicPath: '/mybase',
        // path: path.resolve(process.cwd(), 'dist2'),
    },
});


```