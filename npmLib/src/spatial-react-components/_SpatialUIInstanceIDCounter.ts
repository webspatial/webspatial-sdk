export let _SpatialUIInstanceIDCounter = 0

export function _incSpatialUIInstanceIDCounter() {
    _SpatialUIInstanceIDCounter++
    return _SpatialUIInstanceIDCounter;
}