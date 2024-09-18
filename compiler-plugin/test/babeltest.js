//# sourceURL=dynamicScript.js

// import generate from "@babel/generator";
const {spatialBabelJSXTransform} = require("../babel-plugin-jsx-spatial");

const output = spatialBabelJSXTransform("test/input.tsx");

console.log(output);
