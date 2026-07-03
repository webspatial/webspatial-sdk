## 1. 符号审计

- [ ] 1.1 审计 packages、apps、tests、native sources 和生成的 public declarations 中所有 `xrCurrentSceneDefaults`、`xrCurrentSceneType` 以及相关 scene hook globals 引用。
- [ ] 1.2 确认每个引用要么属于本次删除工作，要么只保留在 proposal/spec/migration 文本中。

## 2. 先写失败测试

- [ ] 2.1 新增或调整 Core SDK 测试，确保 `window.xrCurrentSceneType` 仍被声明或由 scene polyfill 安装时测试失败。
- [ ] 2.2 新增或调整 Core SDK 测试，证明未注册匹配的 `initScene(target, ...)` 时，`window.open(url, target)` 仍会解析 window scene 兜底配置。
- [ ] 2.3 新增或调整 manifest/default 测试，证明未调用 `initScene()` 的 `window.open` 仍会应用 manifest-derived scene defaults。
- [ ] 2.4 新增或调整 React SDK public-surface/type 测试，证明被删除 globals 不再作为受支持 window members 暴露。
- [ ] 2.5 增加当前可用的最小 visionOS 回归检查，证明 pending scene opening 不依赖被删除 globals，且不会卡在 pending 状态。
- [ ] 2.6 运行定向测试，并确认它们先因目标行为缺失而失败。

## 3. SDK 实现

- [ ] 3.1 从 Core SDK global TypeScript declarations 中删除目标 scene globals。
- [ ] 3.2 删除 Core SDK scene polyfill 中对目标 globals 的读写。
- [ ] 3.3 让未调用 `initScene()` 的 `window.open` scene creation 复用现有 scene 默认配置解析路径，不新增 JS 侧默认值。
- [ ] 3.4 保留现有 `initScene()` callback 行为、callback chaining，以及 scene-type default 优先级。
- [ ] 3.5 删除 opened-page 侧 `window.xrCurrentSceneDefaults(pre)` runtime override 支持；需要覆盖受支持配置行为时，改用发起侧 `initScene(target, ...)`、manifest defaults 或 fallback defaults。
- [ ] 3.6 删除或更新手动赋值被删除 globals 的 demos/tests；仍需覆盖受支持 scene 配置行为时，改用 `initScene()` 或 manifest defaults。

## 4. VisionOS Native 实现

- [ ] 4.1 审计 `packages/visionOS/web-spatial/model/SpatialScene.swift` 中的 `didFinishLoad -> checkHookExist()` 流程，以及附近仅为支持被删除 globals 存在的 bridge 状态。
- [ ] 4.2 从 visionOS pending-scene visibility 流程中删除 `checkHookExist` global existence check。
- [ ] 4.3 确保删除 `checkHookExist` 后，pending scene 仍会通过 open-time config 或现有 native fallback 路径推进到可见状态，避免页面未定义被删除 globals 时卡在 pending。
- [ ] 4.4 保留与被删除 globals 无关的受支持 visionOS `SpatialScene` 生命周期行为。

## 5. 验证

- [ ] 5.1 运行定向 Core SDK scene polyfill 和 manifest scene 测试。
- [ ] 5.2 运行覆盖 `initScene()` 的 React SDK public surface 和 stateless utility 测试。
- [ ] 5.3 运行被触达 pending-scene 路径可用的 visionOS 检查。
- [ ] 5.4 最后做一次全仓搜索，确保被删除 globals 不再出现在 public declarations、runtime polyfill logic、demos 或 tests 中，迁移/spec 文本除外。
