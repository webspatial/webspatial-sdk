// this is for the solution of process before style is added to document
import {encodeSpatialStyle, SpatialStyleInfoUpdateEvent, SpatialCustomVar} from './common'
import { useEffect } from "react";

let idleCallback;
export function notifyUpdateStandInstanceLayout() {
  if (!idleCallback) {
    idleCallback = requestAnimationFrame(() => {
      console.log('dbg notifyUpdateStandInstanceLayout')
      document.dispatchEvent(new CustomEvent(SpatialStyleInfoUpdateEvent.standInstanceLayout, {
        detail: {
         },
      }));
      idleCallback = undefined
    });
  }
}

function notifyUpdateSpatialStyle() {
  if (!idleCallback) {
    idleCallback = requestAnimationFrame(() => {
      console.log('dbg notifyUpdateSpatialStyle')
      document.dispatchEvent(new CustomEvent(SpatialStyleInfoUpdateEvent.portalInstanceProps, {
        detail: {
         },
      }));
      idleCallback = undefined
    });
  }
}

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
    // 使用正则表达式提取 back 值
    const spatialStyleRegex = /back:\s*([^;]+)/;
    const match = spatialStyleRegex.exec(styleRules);
    if (match) {
      const backValue = match[1].trim();
      const encodedString = encodeSpatialStyle({ back: backValue });
      // add content: "encodedString"
      selectorRule.styleRules += ` ${SpatialCustomVar}: "${encodedString}";`;
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
    notifyUpdateSpatialStyle();
  }
}

function injectStyleElement() {
  const originalFn = HTMLStyleElement.prototype.insertBefore;
  HTMLStyleElement.prototype.insertBefore = function (newNode, referenceNode) {
    if (newNode.nodeType === Node.TEXT_NODE) {
      handleTextNode(newNode);
    }

    return originalFn.apply(this, arguments);
  };
}

export function injectWebSpatialCapability() {
  // proxyDocument();
  injectStyleElement();
}

export function useMonitorDocumentChange() {
  useEffect(() => {
    const observer = new MutationObserver((mutationsList) => {
      console.log('dbg MutationObserver', mutationsList)
      notifyUpdateStandInstanceLayout();
    });

    const config = {
      childList: true,
      subtree: true,
      attributes: true,
      // attributeFilter: ["style", "class"],
    };

    observer.observe(document.head, config);

    return () => {
      observer.disconnect();
    };
  }, []);
}
