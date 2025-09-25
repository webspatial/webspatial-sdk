// src/index.ts

// 导出测试API
export * from './test-api';

// 导出模型
export * from './models/SpatialScene';
export * from './models/SpatializedElement';
export * from './models/Spatialized2DElement';
export * from './models/types';

// 导出适配器
export * from './adapters/types';
export * from './adapters/platformAbilityShim';

// 导出windowProxy相关
export * from './windowProxy/windowProxyBridge';