## 1. 公开 API 与能力契约

- [ ] 1.1 定义 `SpatialDiv` 版本的 `useAnimation` 配置类型（`SpatialDivAnimationConfig`、`SpatialDivAnimatedValues`）、返回类型（`SpatialDivAnimatedProps`、`AnimationApi`）与 `AnimationError` 形状，覆盖 `back`、`transform.translate.x/y/z`、`opacity`、`depth`、`width`、`height`，明确 `duration` 默认值为 `0.3`，`opacity` 校验范围为 `[0, 1]` 闭区间
- [ ] 1.2 在 `useAnimation` hook 入口实现基于 `config.to` key 集合的 entity / SpatialDiv 自动分叉逻辑，确保 entity 路径代码不受改动（仅新增外层 if/else 分支和 `__kind` 标记）
  - **依赖** 1.1（需要 SpatialDiv 配置类型定义）
- [ ] 1.3 为空间化 HTML 节点补充 `animation` prop 的对外类型，并约束其仅在 `enable-xr` 链路上生效；在绑定阶段增加 `__kind` 校验（entity animation 绑到 SpatialDiv 或反之时抛错）
  - **依赖** 1.2（需要 `__kind` 标记机制就绪）
- [ ] 1.4 扩展 runtime capability 数据与文档，新增 `supports('spatialDivAnimation')` 的公开契约
- [ ] 1.5 实现 `SpatialDiv` 动画配置校验，覆盖白名单限制、数值范围（含 `opacity` 闭区间 `[0, 1]`、`width/height >= 0`）、`timingFunction` 与 `loop` 结构、entity/SpatialDiv key 互斥
  - **依赖** 1.1（需要类型定义）

## 2. Core SDK 与 Bridge 会话流程

- [ ] 2.1 在 `@webspatial/core-sdk` 中为 `Spatialized2DElement` 增加 `animateSpatialDiv(command)` 方法，play 返回 `AnimateSpatialDivResult`，其余返回 `void`
  - **依赖** 1.1（需要命令和结果类型定义）
- [ ] 2.2 设计并接入 `AnimateSpatialized2DElement` 的 JSBridge 命令结构，以及 `_completed`（payload: `SpatialDivAnimatedValues`）、`_stopped`（payload: `SpatialDivAnimatedValues`）、`_failed`（payload: `AnimationError`）事件命名和 payload；确保 listener 在 play 命令发送前注册
  - **依赖** 2.1（需要命令入口就绪）
- [ ] 2.3 打通 `play`、`pause`、`resume`、`stop` 的命令串行化（按调用顺序发送至 bridge）、会话 id 全局唯一、异步失败上报（通过 `_failed` 事件）；实现终态事件互斥保证（`_completed` 与 `_stopped` 对同一 `animationId` 互斥）
  - **依赖** 2.2（需要 bridge 命令和事件就绪）
- [ ] 2.4 实现 `from` 缺省时的当前值快照逻辑：所有字段从 native 侧 `Spatialized2DElement` 当前状态读取（非 DOM），快照仅覆盖 `to` 中声明的字段，`delay` 不改变快照时机；覆盖 queued、delay 和 stop 点结果返回
  - **依赖** 2.1（需要 `animateSpatialDiv` 入口）
- [ ] 2.5 实现 `finished` / `stopped` Promise 在元素卸载时的行为：MUST NOT resolve，MUST NOT 调用生命周期回调
  - **依赖** 2.3（需要会话管理就绪）

## 3. React SpatialDiv 集成

- [ ] 3.1 在 React 层实现 `SpatialDiv` 版本的 `useAnimation(config)` 内部绑定与 `AnimationApi` 行为，包括 `isAnimating` / `isPaused` 五态状态机（idle / queued / delaying / running / paused）
  - **依赖** 1.2（需要 hook 分叉逻辑）、2.1（需要 core 命令入口）
- [ ] 3.2 在 `PortalInstanceObject` / `Spatialized2DElementContainer` 链路接入 `animation` prop 绑定、解绑和单元素复用校验；实现 animation prop 替换（stop-old → start-new，旧 `onStop` 先于新 `onStart`）和移除行为
  - **依赖** 3.1（需要 AnimationApi 就绪）、1.3（需要 prop 类型和 `__kind` 校验）
- [ ] 3.3 实现 `back`、`opacity`、`depth`、`width`、`height` 的属性级普通同步抑制与恢复；按字段维护缓存，在会话结束前释放抑制标记，回调后的下一个 React 渲染周期恢复常规同步
  - **依赖** 3.2（需要绑定链路就绪）
- [ ] 3.4 实现 `transform` 动画期间的整体 transform 同步抑制、缓存和会话结束后的恢复
  - **依赖** 3.2（需要绑定链路就绪）
- [ ] 3.5 实现 play 重入（alive 会话存在时 play → stop old → start new）、stop-old failure blocks start-new、config 更新不影响 alive 会话、控制命令按调用顺序串行化
  - **依赖** 3.1（需要状态机就绪）、2.3（需要命令串行化就绪）
- [ ] 3.6 对未开启 `enable-xr` 或不支持 runtime 的使用路径给出 warning（每个 hook 实例至多一次），并保持 `play()` 为 no-op；不支持 runtime 时 `isAnimating` 保持 `false`
  - **依赖** 1.4（需要 capability key 就绪）

## 4. Native 播放

- [ ] 4.1 在 visionOS runtime 中增加 `SpatialDiv` 动画会话存储、播放控制器和生命周期管理
  - **依赖** 2.2（需要 bridge 命令结构就绪）
- [ ] 4.2 实现白名单字段的 native 插值与应用，包括 `transform.translate.x/y/z`、`back`、`depth`、`opacity`、`width`、`height`
  - **依赖** 4.1（需要会话管理就绪）
- [ ] 4.3 实现 `delay`、reset loop（含瞬时重置，不重新快照）、reverse loop、pause（含 delay 期间 pause 保留剩余 delay）、resume、stop 的 native 语义，并返回 `_completed` / `_stopped` 终态
  - **依赖** 4.2（需要插值就绪）
- [ ] 4.4 实现 bridge / native 异步失败的 `_failed` 事件与错误 payload 回传；确保 play 失败后不发 `_completed` / `_stopped`，pause/resume/stop 失败后会话保持失败前状态
  - **依赖** 4.3（需要播放语义就绪）

## 5. 验证与文档

- [ ] 5.1 增加 capability 测试，覆盖 `supports('spatialDivAnimation')` 的 true / false / 稳定性，以及与 `supports('useAnimation')` 的独立性
  - **依赖** 1.4
- [ ] 5.2 增加 hook 分叉测试，覆盖 entity key / SpatialDiv key / 混用 key 抛错 / `__kind` 绑定校验
  - **依赖** 1.2、1.3
- [ ] 5.3 增加 React 行为测试，覆盖 autoStart、manual play、queued play（含排队期间 pause/stop）、delay pause/resume、delay pause then stop、delay 直接 stop、play 重入（stop old → start new 顺序保证）、config 更新不影响 alive 会话、控制命令串行化、stop-old failure blocks start-new、single-binding error、animation prop 替换/移除、warning
  - **依赖** 3.1–3.6
- [ ] 5.4 增加同步竞争测试，覆盖属性级抑制（含缓存和恢复）、transform 整体抑制、抑制释放时机（回调前释放标记）、以及 `width` / `height` 不自动回写 DOM
  - **依赖** 3.3、3.4
- [ ] 5.5 增加 bridge / native 会话测试，覆盖 completed、stopped、failed（含 play 失败和 pause/resume/stop 失败）、终态事件互斥、loop 和 stop 点语义、listener 注册时序、`animationId` 唯一性、unmount 时 Promise 不 resolve
  - **依赖** 2.3、2.5、4.3、4.4
- [ ] 5.6 增加状态机测试，覆盖 isAnimating / isPaused 在 idle / queued / delaying / running / paused 各状态下的值，以及 stop/completion 后在回调触发前变为 false
  - **依赖** 3.1
- [ ] 5.7 更新 `docs/` 与 `apps/test-server` 示例，演示 `SpatialDiv` 动画 API（入场动画、手动触发 + stop 同步尺寸、循环浮动）、白名单字段、能力检测与已知限制
  - **依赖** 5.3（需要核心行为验证通过）
