// webspatial-postcss-plugin.js

const SpatialCustomVar = "--spatialCustomVar";

function encodeSpatialStyleRuleString(spatialStyle) {
  const encodedString = `"spatial=back: ${spatialStyle.back};"`;
  return encodedString;
}

const plugin = (opts = {}) => {
  return {
    postcssPlugin: "webspatial-postcss-plugin",

    Rule: (rule) => { 

      let spatialProps = {};

      rule.walkDecls((decl) => {
        if (decl.prop === "back") {
          spatialProps[decl.prop] = decl.value 
          decl.remove();
        }
      });

      if (spatialProps) {
        rule.append({
          prop: SpatialCustomVar,
          value: encodeSpatialStyleRuleString(spatialProps),
        });
      }
    },
  };
};

plugin.postcss = true;

module.exports = plugin;
