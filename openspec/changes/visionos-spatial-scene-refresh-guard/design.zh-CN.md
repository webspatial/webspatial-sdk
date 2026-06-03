# 设计：VisionOS SpatialScene 刷新保护

## 背景

VisionOS `SpatialScene` 持有 native scene 对象，并接收前端驱动的 SpatialDiv 创建请求。页面刷新 cleanup 只发生在某个时间点，而请求到达可能存在延迟，因此 native scene 必须拒绝属于旧页面代际的请求。

## 目标 / 非目标

**目标：**

- 让 VisionOS `SpatialScene` 成为当前页面 generation 的权威持有者。
- 使用 `wsepoch` 作为 stale 请求拒收的 freshness 唯一裁决字段。
- 将 `rid` 仅用于关联与诊断。
- 对不携带 `wsepoch` 的请求保持兼容。
- 增强 inspect 输出，便于刷新问题诊断。

**非目标：**

- 本 change 不重新定义前端请求构造方式。
- 本 change 不使用 `rid` 做 freshness 判断。
- 本 change 不要求 compatibility mode 下所有请求都必须携带 `wsepoch`。

## 决策

### 决策 1：`SpatialScene` 持有当前页面 generation

`SpatialScene` 必须维护 `currentPageGeneration`，并在页面重新加载开始时、scene 对象 cleanup 之前递增该值。

### 决策 2：native freshness 判断只使用 `wsepoch`

请求处理路径在字段存在时必须解析 `rid` 与 `wsepoch`。

如果 `wsepoch` 存在且与 `currentPageGeneration` 不匹配，该请求必须被视为 stale，且不得将内容挂载到当前 scene。

### 决策 3：compatibility mode 对缺失 `wsepoch` 的请求告警并接受

如果请求未携带 `wsepoch`，VisionOS 必须记录兼容性 warning，并继续接受该请求。

这样可以保持旧前端 bundle 的兼容性，但 stale 请求拒收仅在 `wsepoch` 存在时生效。

### 决策 4：inspect 输出暴露 generation 与对象标识

Inspect 输出必须包含当前页面 generation，以及能够让评审者对比 scene children 与 retained objects 的对象标识诊断。

### 决策 5：日志关联 generation 与请求标识

日志必须能够在单次刷新周期内回答以下问题：

- 页面 generation 何时递增
- 哪个 `rid` / `wsepoch` 被接受
- 哪个 `rid` / `wsepoch` 被判定为 stale 并拒绝
- cleanup 后 scene 中剩余哪些对象 id

## 风险 / 取舍

- **[风险] 旧前端 bundle 不发 `wsepoch`** -> 在 compatibility mode 下告警并接受。
- **[风险] 请求到达与刷新 cleanup 存在竞态** -> 使用页面 generation 作为权威 freshness 边界。
- **[风险] 错误地将 `rid` 用于 freshness** -> 文档与实现都明确 `rid` 只用于关联。

## 验证

- 验证 `wsepoch` 匹配的请求仍然成功挂载。
- 验证 stale `wsepoch` 请求会被丢弃。
- 验证缺失 `wsepoch` 的请求保持兼容并产生 warning。
- 验证普通重复刷新后的 inspect 输出保持稳定。
