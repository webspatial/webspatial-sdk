// Cleanup param helpers
export function initializeSpatialOffset(offset: any) {
    if (offset.x === undefined) {
        offset.x = 0
    }
    if (offset.y === undefined) {
        offset.y = 0
    }
    if (offset.z === undefined) {
        offset.z = 0
    }
}
