## 1. 规范与文档

- [x] 1.1 为 manifest 场景别名处理补充 OpenSpec 的 proposal design tasks 和 spec 文件。
- [x] 1.2 更新公开的 manifest API 文档，说明受支持的别名 优先级 和归一化行为。

## 2. 核心实现

- [x] 2.1 为 manifest 场景配置字段增加受支持的 snake_case 和 camelCase 别名解析逻辑。
- [x] 2.2 在合并场景默认值之前，归一化受支持的 `resizability` 别名和 override 选择器。
- [x] 2.3 在应用归一化 manifest 默认值的同时，保持现有 merge 优先级和 callback 链行为不变。

## 3. 验证

- [x] 3.1 增加或更新同层别名优先级与 override 优先级测试。
- [x] 3.2 增加或更新 mixed-case override 选择器和 `resizability` 别名归一化测试。
- [x] 3.3 增加或更新测试，确认 callback 链仍然接收上一次 callback 的原始返回值。