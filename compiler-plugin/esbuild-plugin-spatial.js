 const {spatialBabelJSXTransform} = require("./babel-plugin-jsx-spatial");

module.exports = (options) => {
  return {
    name: "esbuild-plugin-spatial",
    setup(build) {
      build.onLoad({ filter: /\.(jsx|tsx)$/ }, async (args) => {
        const contents =  spatialBabelJSXTransform(args.path);
        return {
          contents,
          loader: args.path.endsWith('.tsx') ? "tsx": "jsx",
        };
      });
    },
  };
};
