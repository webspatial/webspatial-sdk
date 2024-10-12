import {encodeSpatialStyle, SpatialStyleInfoUpdateEvent, SpatialCustomVar} from './common'
import { useEffect } from "react";

/**
 * notifyUpdateStandInstanceLayout is called when the document head changed 
 * or when the monitored div changed (in both cases spatialDiv's layout may be changed, so we need to update the layout)
 */
export function notifyUpdateStandInstanceLayout() {
  document.dispatchEvent(new CustomEvent(SpatialStyleInfoUpdateEvent.standInstanceLayout, {
    detail: {
     },
  }));
}

function handleTextNode(node) {
  const styleSheet = node.textContent;
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
      const backValue = match[1].trim();
      const encodedString = encodeSpatialStyle({ back: backValue });
      // add spatial style
      selectorRule.styleRules += ` ${SpatialCustomVar}: "${encodedString}";`;
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
  HTMLStyleElement.prototype.insertBefore = function (newNode, referenceNode) {
    if (newNode.nodeType === Node.TEXT_NODE) {
      handleTextNode(newNode);
    }

    return originalFn.apply(this, arguments);
  };
}

export function injectWebSpatialCapability() {
  injectStyleElement();
}

export function useMonitorDocumentChange() {
  useEffect(() => {
    const observer = new MutationObserver((mutationsList) => {
      notifyUpdateStandInstanceLayout();
    });

    const config = {
      childList: true,
      subtree: true,
      attributes: true,
    };

    observer.observe(document.head, config);

    return () => {
      observer.disconnect();
    };
  }, []);
}
