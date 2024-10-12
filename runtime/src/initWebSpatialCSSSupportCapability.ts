import { encodeSpatialStyleRuleString } from "web-spatial/private";
import { notifyUpdateStandInstanceLayout } from "web-spatial/";

function handleTextNode(node: Node) {
  const styleSheet = node.textContent || '';
  const regex = /([^{]+)\{\s*([^}]+)\s*\}/g;
  const selectorRules = [];
  let match;
  while ((match = regex.exec(styleSheet)) !== null) {
    const selector = match[1].trim();
    const styleRules = match[2].trim();

    selectorRules.push({
      selector,
      styleRules,
    });
  }

  let needUpdateStyleSheet = false;
  selectorRules.forEach((selectorRule) => {
    const { selector, styleRules } = selectorRule;
    const spatialStyleRegex = /back:\s*([^;]+)/;
    const match = spatialStyleRegex.exec(styleRules);
    if (match) {
      // add spatial style
      const backValue = match[1].trim();
      selectorRule.styleRules += encodeSpatialStyleRuleString({ back: backValue });
      needUpdateStyleSheet = true;
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
  }
}

function injectStyleElement() {
  const originalFn = HTMLStyleElement.prototype.insertBefore;
 

  HTMLStyleElement.prototype.insertBefore = function insertBefore<T extends Node>(node: T, child: Node | null): T {
    if (node.nodeType === Node.TEXT_NODE) {
      handleTextNode(node);
    }

    return originalFn.apply(this, [arguments[0], arguments[1]]) as T;
  };
}

function monitorDocumentHeadChange() {
  const observer = new MutationObserver((mutationsList) => {
    notifyUpdateStandInstanceLayout();
  });

  const config = {
    childList: true,
    subtree: true,
    attributes: true,
  };

  observer.observe(document.head, config);
}

export function initWebSpatialCSSSupportCapability() {
  injectStyleElement();
  monitorDocumentHeadChange();
}

