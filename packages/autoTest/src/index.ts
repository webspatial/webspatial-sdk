// src/index.ts

// 导出测试API
export * from './test-api/index.js'

// 导出模型
export * from './models/SpatialScene.js'
export * from './models/SpatializedElement.js'
export * from './models/Spatialized2DElement.js'
export * from './models/types.js'

// 导出适配器
export * from './adapters/types.js'
export * from './adapters/platformAbilityShim.js'

// 导出windowProxy相关
export * from './windowProxy/windowProxyBridge.js'
