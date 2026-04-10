## Why

仓库已经把 `xr_spatial_scene` 文档化为声明式 manifest 配置入口，但实际项目中的 manifest 往往会混用 snake_case 和 camelCase。这个 change 明确别名解析规则，让已有 manifest 能稳定生效，同时保持按场景类型的 override 行为不变，而不要求开发者重写配置。

## What Changes

- 支持在同一个 manifest 对象层级中读取受支持的 snake_case 和 camelCase `xr_spatial_scene` 字段别名。
- 明确规定当同一层同时出现两种别名时，snake_case 优先。
- 支持在 `overrides` 中同时读取 `window_scene` 和 `windowScene`，以及 `volume_scene` 和 `volumeScene`。
- 在通过 manifest 生成场景默认值之前，将受支持的输入别名归一化为运行时使用的 camelCase 结构。
- 保持内置默认值 顶层 manifest 值 按场景 override 和 `initScene()` 回调返回值之间的现有优先级规则不变。
- 保持 `initScene()` 链式调用行为不变，同一场景名的后续调用仍然接收上一次回调的原始返回值。

## Capabilities

### New Capabilities
- `manifest-scene-config`: 以明确的别名和优先级规则解析 manifest 中的 `xr_spatial_scene` 默认值与 override。

### Modified Capabilities

## Impact

- 影响 `packages/core/src/scene-polyfill.ts` 中的 manifest 解析和场景默认值解析逻辑。
- 影响 `packages/core/src/types/global.d.ts` 中对 manifest 别名的类型暴露。
- 影响 `packages/core/src/scene-polyfill.manifest.test.ts` 中的 manifest 行为测试。
- 影响 `docs/manifest-api.md` 中的公开文档。