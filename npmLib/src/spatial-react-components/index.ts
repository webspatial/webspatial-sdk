export { Model, type ModelRef } from './Model';
export { SpatialIFrame } from './SpatialIFrame';
export { SpatialPrimitive, withSpatial } from './SpatialPrimitive';
export { type SpatialReactComponentProps, type SpatialReactComponentRef } from './SpatialReactComponent';
export {SpatialMonitor} from './SpatialMonitor';
export {injectWebSpatialCapability, useMonitorDocumentChange} from './globalInject';

// for compatibility
export { SpatialDiv } from './SpatialPrimitive';
export { type SpatialReactComponentProps as SpatialDivProps, type SpatialReactComponentRef as SpatialDivRef } from './SpatialReactComponent';
