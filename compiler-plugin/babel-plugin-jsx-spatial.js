// import generate from "@babel/generator";
const generate = require("@babel/generator").default;
const t = require("@babel/types");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const fs = require("fs");

function spatialBabelJSXTransform(filePath) {
  debugger
  // 读取 TSX 文件
  const code = fs.readFileSync(filePath, "utf-8");
  // 解析 TSX 代码
  const ast = parser.parse(code, {
    sourceType: "module",
    plugins: [
      "typescript",
      "jsx", // 确保启用 JSX 支持
    ],
  });

  let findSpatial = false;

  traverse(ast, {
    JSXAttribute(path) {
      if (t.isJSXIdentifier(path.node.name, { name: "style" })) {
        const styleObject = path.node.value.expression;

        if (t.isObjectExpression(styleObject)) {
          const backProperty = styleObject.properties.find(
            (prop) =>
              t.isObjectProperty(prop) &&
              t.isIdentifier(prop.key, { name: "back" })
          );
          if (backProperty) {
            // mark findSpatial
            findSpatial = true;

            // 获取 back 的值
            const backValue = backProperty.value.value;

            // 移除 'back' 属性
            styleObject.properties = styleObject.properties.filter(
              (prop) =>
                !t.isObjectProperty(prop) ||
                !t.isIdentifier(prop.key, { name: "back" })
            );

            // 替换为 <SpatialPrimitive.div>
            const parentJSXOpeningElement = path.findParent((p) =>
              p.isJSXOpeningElement()
            );
            const SpatialElementName = `SpatialPrimitive.${parentJSXOpeningElement.node.name.name}`;
            parentJSXOpeningElement.node.name =
              t.JSXIdentifier(SpatialElementName);

            // 创建新的 spatialStyle 属性
            const spatialStyleAttr = t.jsxAttribute(
              t.jsxIdentifier("spatialStyle"),
              t.jsxExpressionContainer(
                t.objectExpression([
                  t.objectProperty(
                    t.identifier("position"),
                    t.objectExpression([
                      t.objectProperty(t.identifier("x"), t.numericLiteral(0)),
                      t.objectProperty(t.identifier("y"), t.numericLiteral(0)),
                      t.objectProperty(
                        t.identifier("z"),
                        t.numericLiteral(backValue)
                      ),
                    ])
                  ),
                ])
              )
            );
            parentJSXOpeningElement.node.attributes.push(spatialStyleAttr);

            // 替换</div> 为</SpatialPrimitive.div>
            const closingElement =
              parentJSXOpeningElement.parent.closingElement;
            if (closingElement) {
              closingElement.name = t.JSXIdentifier(SpatialElementName);
            }
          }
        }
      }
    },
  });

  // 在 AST 的开头插入 import 语句
  if (findSpatial) {
    const importDeclaration = t.importDeclaration(
      [
        t.importSpecifier(
          t.identifier("SpatialPrimitive"),
          t.identifier("SpatialPrimitive")
        ),
      ],
      t.stringLiteral("web-spatial")
    );
    // 将 import 声明插入到 AST 的开头
    ast.program.body.unshift(importDeclaration);
  }
  
  const output = generate(ast, {}, code);
  return output.code;
}

module.exports = {
  spatialBabelJSXTransform,
};
