// this is for the solution of process before style is added to document
import {encodeSpatialStyle, SpatialStyleInfoUpdateEvent} from './common'

function handleTextNode(node) {
  const styleSheet = node.textContent;
  const regex = /([^{]+)\{\s*([^}]+)\s*\}/g;
  const selectorRules = [];
  let match;
  while ((match = regex.exec(styleSheet)) !== null) {
    const selector = match[1].trim(); // 提取选择器
    const styleRules = match[2].trim(); // 提取样式规则
    
    // 处理样式规则
    selectorRules.push({
      selector,
      styleRules,
    });
  }

  let needUpdateStyleSheet = false;
  selectorRules.forEach((selectorRule) => {
    const { selector, styleRules } = selectorRule;
    const hasContent = /content:\s*[^;]+;?/.test(styleRules);
    if (hasContent) {
      // 不能处理content属性
      return;
    }
    // 使用正则表达式提取 back 值
    const spatialStyleRegex = /back:\s*([^;]+)/;
    const match = spatialStyleRegex.exec(styleRules);
    if (match) {
      const backValue = match[1].trim(); // 提取并去除空格
      console.log(backValue); // 输出: 12
      const encodedString = encodeSpatialStyle({ back: backValue });
      // add content: "encodedString"
      selectorRule.styleRules += ` content: "${encodedString}";`;
      needUpdateStyleSheet = true;
    } else {
      console.log("未找到 back 值");
    }
  });

  if (needUpdateStyleSheet) {
    let updatedTextContent = selectorRules.reduce(
      (acc, { selector, styleRules }) => {
        acc += `${selector} {${styleRules}}`;
        return acc;
      },
      ""
    );

    node.textContent = updatedTextContent;
    console.log('dbg updatedTextContent:', updatedTextContent)

    requestAnimationFrame(  () => {
      // to avoid react warning
      document.dispatchEvent(new CustomEvent(SpatialStyleInfoUpdateEvent, {
        detail: {
         },
      }));
    });
  }
}

function makeStyleObjectProxy(styleObject) {
  const originalInsertBefore = styleObject.insertBefore.bind(styleObject);
  styleObject.insertBefore = function (node) {
    console.log("dbg process insertBefore node", node);
    if (node.nodeType === Node.TEXT_NODE) {
      // handle node.textContent
      handleTextNode(node);
    }
    originalInsertBefore(...arguments);
  };

  return styleObject;
}

// function proxy createElement style
function proxyDocument() {
  const originalCreateElement = document.createElement.bind(document);

  const hackedCreateElement = function (tag) {
    const retElement = originalCreateElement(...arguments);
    if (tag === "style") {
      return makeStyleObjectProxy(retElement);
    } else {
      return retElement;
    }
  };
  document.createElement = hackedCreateElement;
}

export function injectWebSpatialCapability() {
  proxyDocument();
}
