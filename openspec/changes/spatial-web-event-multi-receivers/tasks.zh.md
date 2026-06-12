## 1. 规范与对齐

- [x] 1.1 为 `SpatialWebEvent` 多 receiver 行为补充 OpenSpec 的 proposal design tasks 和 spec 文件。
- [x] 1.2 让文档中的 receiver 生命周期说明与当前分支实现及现有调用方式保持一致。

## 2. 核心事件路由

- [x] 2.1 把单 callback 存储改为按 id 维护多 receiver 注册表。
- [x] 2.2 将每次收到的事件载荷分发给该 id 当前注册的全部 receiver。
- [x] 2.3 同时支持指定 callback 移除和整组 id 清理，并在集合为空时删除注册表项。

## 3. 验证

- [x] 3.1 增加或更新测试，验证同一个 id 下的多个 receiver 都会被调用。
- [x] 3.2 增加或更新测试，验证精确移除某个 callback 后其他 receiver 仍然保持活跃。
- [x] 3.3 增加或更新测试，验证整组移除会为 destroy 与一次性回调流程清空对应 id 条目。
- [x] 3.4 增加或更新测试，验证某个 receiver 抛出异常后不会阻止其余 receiver 继续完成扇出分发。