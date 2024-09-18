import * as esbuild from "esbuild";
import { tailwindPlugin } from "esbuild-plugin-tailwindcss";
import cssModulesPlugin from 'esbuild-css-modules-plugin'
import spatialTransformPlugin from "../compiler-plugin/esbuild-plugin-spatial.js";

import glob from "tiny-glob";
import path from "path";
import livereload from "livereload";

var targetAVP = (process.env.target === 'avp');
var entryPoints = await glob("./src/**/*.tsx");
entryPoints = entryPoints.concat(await glob("./src/**/*.ts"))
entryPoints.push('index.tsx')
entryPoints.push( 'src/index.css')

var plugins = targetAVP ? [ spatialTransformPlugin({})]: [];
plugins.push(cssModulesPlugin())
plugins.push(tailwindPlugin())

var outdir = targetAVP ? "dist-avp": "dist";
var port = targetAVP ? 5174: 5173;
var liveReloadServerPort = targetAVP ? 35729: 35730;

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
    "web-spatial": path.resolve("../npmLib/src"),
    "spatial-runtime": path.resolve("../runtime/src"),
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
watchPaths = watchPaths.concat(await glob("./src/**/*.tsx"));
watchPaths = watchPaths.concat(await glob("./src/**/*.ts"));
watchPaths.push("index.html");
watchPaths.push("index.tsx");
server.watch(watchPaths);
console.log("server created!");
