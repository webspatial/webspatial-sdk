export function encodeSpatialStyle(spatialStyle: any) {
    return `spatial=back: ${spatialStyle.back};`;
  }
  
  export function decodeSpatialStyle(inputString: string) {
    const pattern = /"spatial=(\w+):\s*(\d+);"/;
    const match = pattern.exec(inputString);
    
    if (match) {
        return { [match[1]]: parseInt(match[2], 10) };
    }
    
    return null;
  }

export enum SpatialStyleInfoUpdateEvent {
  standInstanceLayout = 'standInstanceLayout',
  // portalInstanceProps = 'portalInstanceProps',
}

export const SpatialCustomVar = "--spatialCustomVar";
