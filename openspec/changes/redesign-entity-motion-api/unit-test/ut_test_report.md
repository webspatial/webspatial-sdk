# 单元测试生成结果汇总
**生成状态**：成功；**生成耗时**：`15.6 分钟`
---
## 总体统计
**单测增量覆盖率**：`72.3%`；**命中函数数**：6；**生成用例数**：3；**执行通过用例数**：3；
**修复编译失败包**：1；**修复执行失败用例数**：0；**发现缺陷数**：0
---
## 文件明细
| 文件路径 | 通过用例数 | 总用例数 | 覆盖率 |
|:---------|:----------:|:--------:|:------:|
| [SpatialScene.swift](file:///Users/bytedance/Projects/XRSDK-entity-motion-port/packages/visionOS/web-spatial/model/SpatialScene.swift) | 3 | 3 | 72.3% |
---
## 生成明细
| 文件名 | 执行成功数/生成用例数 | 生成后增量覆盖率 |
|:-------|:--------------------:|:----------------:|
| [EntityMotionTests.swift](file:///Users/bytedance/Projects/XRSDK-entity-motion-port/packages/visionOS/web-spatialTests/EntityMotionTests.swift) | 3/3 | 72.3% |
---
## 用例修复明细
| 修复类型 | 修复对象| 包含用例数 | 修复后增量覆盖率 |
|:-------|:-------:|:---------:|:-------------:|
| 测试基础设施 | [SpatialWebController.swift](file:///Users/bytedance/Projects/XRSDK-entity-motion-port/packages/visionOS/web-spatial/webview/SpatialWebController.swift) | 3 | 72.3% |
---
## 缺陷明细
暂无
---
## 失败用例明细
暂无
---
## 跳过函数明细
暂无
---
## 补测建议
| 对象 | 标题 | 优先级 | 补测动作 |
|:-----|:-----|:------:|:---------|
| [SpatialScene.swift](file:///Users/bytedance/Projects/XRSDK-entity-motion-port/packages/visionOS/web-spatial/model/SpatialScene.swift) | SpatialScene.swift 中 4 个函数存在未覆盖行 | P1 | `onCreateEntityAnimation` 未覆盖行: 1370-1371,1376-1380<br>`onUpdateEntityAnimation` 未覆盖行: 1392-1401<br>`onControlEntityAnimation` 未覆盖行: 1414,1416,1418,1420,1422,1428-1430<br>`onSetEntityAnimation` 未覆盖行: 1442-1449 |