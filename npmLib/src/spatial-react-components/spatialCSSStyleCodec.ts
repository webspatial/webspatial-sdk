const SpatialCustomVar = "--spatialCustomVar";

export function encodeSpatialStyleRuleString(spatialStyle: any) {
  const encodedString = `spatial=back: ${spatialStyle.back};`;
  return ` ${SpatialCustomVar}: "${encodedString}";`;
}

export function decodeSpatialStyle(computedStyle: CSSStyleDeclaration) {
  const inputString = computedStyle.getPropertyValue(SpatialCustomVar);

  const pattern = /"spatial=(\w+):\s*(\d+);"/;
  const match = pattern.exec(inputString);

  if (match) {
    return { [match[1]]: parseInt(match[2], 10) };
  }

  return null;
}

