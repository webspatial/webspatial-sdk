import { debug } from "loglevel";
import { MutableRefObject, useEffect, useRef, useState } from "react";

function extractClassAndSpatialStyle(cssText: string) {
  const regex = /\.(\w+)\{[^}]*?back:(\d+);[^}]*?\}/g;
  const result: Record<string, object> = {};
  let match;

  while ((match = regex.exec(cssText)) !== null) {
    const className = match[1];
    const backValue = match[2];
    result[className] = { back: Number(backValue) };
  }

  return result;
}
 
// dynamic 
// static css style 
// third cdn css
// compile css plugin -> 

// <link ref: sfsdf >



export const gSpatialStyleInfo: Record<string, any> = {};

function parseCurrentGlobalStyle() {
  // 获取所有 <style> 标签
  const styleTags = document.getElementsByTagName("style");
  // 遍历每个 <style> 标签并提取内容
  for (let i = 0; i < styleTags.length; i++) {
    const styleTag = styleTags[i];
    if (styleTag.textContent) {
      const spatialStyleInfo = extractClassAndSpatialStyle(
        styleTag.textContent
      );
      Object.assign(gSpatialStyleInfo, spatialStyleInfo);
    }
  }
}

// hello

export function monitorGlobalStyles() {
  // console.log("dbg monitorGlobalStyles");
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // console.log("元素的mutation被修改", mutation);

      const element = mutation.target as Element;

      if (element.tagName === "STYLE" && element.textContent) {
        const spatialStyleInfo = extractClassAndSpatialStyle(
          element.textContent
        );
        if (spatialStyleInfo) {
          Object.assign(gSpatialStyleInfo, spatialStyleInfo);
        }
      }
    });
  });

  const config = {
    childList: true,
    subtree: true,
    attributes: true,
    // attributeFilter: ["style", "class"],
  };

  observer.observe(document.head, config);

  // parse current style
  parseCurrentGlobalStyle();
}

function parseStyleToSpatialProperties(style: any) {
  let zOffset = 0;
  if (style.back) {
    zOffset = parseInt(style.back);
  }
  return { zOffset };
}

export function useSpatialClassWatcher(
  targetStandardNodeGetter: () => Element | null | undefined,
  updateZOffset: (zOffset: number) => void
) {
  const [zOffset, setZOffset] = useState<undefined | number>(undefined);
  const spatialStyle = useRef<{ zOffset: number | undefined }>({
    zOffset: undefined,
  });

  useEffect(() => {
    const targetNode: HTMLElement = targetStandardNodeGetter() as HTMLElement;

    function checkClassAndUpdateZOffset() {
      for (const className of targetNode.classList) {
        const curStyle = gSpatialStyleInfo[className];
        if (curStyle) {
          const spatialProperties = parseStyleToSpatialProperties(curStyle);
          spatialStyle.current.zOffset = spatialProperties.zOffset;
          // just force update
          setZOffset(spatialProperties.zOffset);
          // console.log("dbg updateZOffset");
          updateZOffset(spatialProperties.zOffset);
          break;
        }
      }
    }

    const observer = new MutationObserver((mutationsList) => {
      for (let mutation of mutationsList) {
        if (mutation.type === "attributes") {
          if (mutation.attributeName === "class") {
            console.log("class 属性发生变化:", mutation.target.nodeValue);
            if (mutation.target === targetNode) {
              checkClassAndUpdateZOffset();
            }
          }
          if (mutation.attributeName === "style") {
            console.log("style 属性发生变化:", mutation.target.nodeValue);
          }
        }
      }
    });
    const config = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    };

    if (targetNode) {
      observer.observe(targetNode, config);
    }

    checkClassAndUpdateZOffset();

    return () => {
      observer.disconnect();
    };
  }, []);

  return [spatialStyle];
}


