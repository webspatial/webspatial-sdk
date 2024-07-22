import * as esbuild from 'esbuild'
import { tailwindPlugin } from 'esbuild-plugin-tailwindcss';
import  glob  from "tiny-glob";
import  path  from "path";
import livereload from "livereload"

var entryPoints = await glob("./src/**/*.tsx");
entryPoints = entryPoints.concat(await glob("./src/**/*.ts"))
entryPoints.push('index.tsx')
entryPoints.push( 'src/index.css')

var ctx = await esbuild.context({
        entryPoints: entryPoints,
        outdir: 'dist',
        bundle: true,
        minify: false,
        sourcemap: true,
        plugins: [tailwindPlugin({})],
        // Get live reload to work. Bug with number of tabs https://github.com/evanw/esbuild/issues/802 in default esbuild live reload
         banner: { js: `
            document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] +
  ':35729/livereload.js?snipver=1"></' + 'script>')
            `, },
        // Avoid multiple react copies. https://github.com/evanw/esbuild/issues/3419
        alias: {
            react: path.resolve('node_modules/react'),
        }
});
ctx.watch()
ctx.serve({
    servedir: '.',
    port: 5173,
})

var server = livereload.createServer();
server.watch(path.resolve("dist"));
console.log("server created!")
