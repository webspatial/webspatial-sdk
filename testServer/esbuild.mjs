import * as esbuild from "esbuild";
import { tailwindPlugin } from "esbuild-plugin-tailwindcss";


import glob from "tiny-glob";
import path from "path";
import livereload from "livereload";
import {sassPlugin, postcssModules} from 'esbuild-sass-plugin'

var entryPoints = await glob("./src/**/*.tsx");
entryPoints = entryPoints.concat(await glob("./src/**/*.ts"))
entryPoints.push('index.tsx')
entryPoints.push( 'src/index.css')

var plugins = []
plugins.push(tailwindPlugin())
plugins.push(sassPlugin({
  filter: /\.module\.scss$/,
  transform: postcssModules({}, [])
}))

var outdir = "dist";
var port = 5173
var liveReloadServerPort = 35729

var ctx = await esbuild.context({
  entryPoints: entryPoints,
  outdir,
  bundle: true,
  minify: false,
  sourcemap: true,
  jsx: "automatic",
  plugins,
  // Get live reload to work. Bug with number of tabs https://github.com/evanw/esbuild/issues/802 in default esbuild live reload
  banner: {
    js: `
            document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] +
  ':${liveReloadServerPort}/livereload.js?snipver=1"></' + 'script>')
            `,
  },
  // Avoid multiple react copies. https://github.com/evanw/esbuild/issues/3419
  alias: {
    react: path.resolve("node_modules/react"),
    "react-dom": path.resolve("node_modules/react-dom"),
    "@xrsdk/jsx-runtime": path.resolve("../jsx-runtime/src/jsx-runtime"),
  },
});
ctx.watch();
ctx.serve({
  servedir: ".",
  port,
});

var server = livereload.createServer({
    port:liveReloadServerPort,
  extraExts: ["ts", "tsx"],
  delay: 50,
});
var watchPaths = [path.resolve(outdir)];
watchPaths = watchPaths.concat(await glob("./src/**/*.html"));
// watchPaths = watchPaths.concat(await glob("./src/**/*.tsx"));
// watchPaths = watchPaths.concat(await glob("./src/**/*.ts"));
watchPaths.push("index.html");
// watchPaths.push("index.tsx");
server.watch(watchPaths);
console.log("server created!");
