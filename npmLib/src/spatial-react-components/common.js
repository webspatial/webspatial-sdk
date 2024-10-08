export function encodeSpatialStyle(spatialStyle) {
    return `spatial=back: ${spatialStyle.back};`;
  }
  
  export function decodeSpatialStyle(inputString) {
    // 定义正则表达式，匹配外部引号和内容
    const pattern = /"spatial=(\w+):\s*(\d+);"/;
    // 使用exec方法查找匹配
    const match = pattern.exec(inputString);
    
    // 如果匹配成功，返回一个对象
    if (match) {
        return { [match[1]]: parseInt(match[2], 10) };
    }
    
    // 如果没有匹配，返回null
    return null;
  }

export const SpatialStyleInfoUpdateEvent = "SpatialStyleInfoUpdateEvent";
