## Context

`xr_spatial_scene` 位于 SDK 内置场景默认值与应用层 `initScene()` 回调之间。当前分支已经补了 mixed-case manifest 输入相关的测试和文档，但还缺少 OpenSpec 设计文档来统一说明同层别名如何解析 场景 override 如何覆盖顶层值 以及哪些值会在暴露给运行时之前完成归一化。

## Goals / Non-Goals

**Goals:**
- 为受支持的 `xr_spatial_scene` 键定义确定性的别名解析规则。
- 在允许顶层和按场景 override 同时使用别名的前提下，保持现有 override 优先级不变。
- 在 manifest 派生默认值进入场景初始化链路前，将其归一化为运行时使用的 camelCase 结构。
- 保持同一场景名重复调用 `initScene()` 时的既有回调链行为。

**Non-Goals:**
- 为当前分支之外的 manifest 字段引入新的别名支持。
- 改变场景单位的校验或格式化规则。
- 改变 `initScene()` 回调返回值高于 manifest 默认值的优先级。
- 归一化应用代码返回的任意 callback 值。

## Decisions

### Decision: 字段清洗独立完成

这次 change 先做字段清洗。字段清洗只负责在字段出现的源对象内解析别名，不负责决定顶层和 override 谁优先。这里的源对象主要是顶层 `xr_spatial_scene`、`window` override 和 `volume` override。在单个对象层内，snake_case 胜出，胜者独占该层这个逻辑字段的整个值；如果胜者值仍然是对象，则只在这个胜出对象内部继续递归解析受支持的嵌套别名。

```mermaid
flowchart TD
    A[读取一个源对象] --> B[检查当前层受支持别名]
    B --> C{同层同时存在两种别名}
    C -->|是| D[snake_case 胜出]
    C -->|否| E[保留唯一存在的值]
    D --> F[败者整值丢弃]
    E --> G[保留当前值]
    F --> H{胜者值是否仍是对象}
    G --> H
    H -->|是| I[进入对象内部继续清洗]
    H -->|否| J[当前对象清洗完成]
```

原因:
- 这样可以把别名冲突的处理边界限制在单个源对象内，避免不同来源之间互相串扰。
- manifest 文档本身以 snake_case 命名为主。
- 当前分支中的测试已经明确断言同层别名冲突时应当优先采用 snake_case。
- 这条规则可以同时解释顶层整个对象替换和嵌套对象内部键冲突，不需要再引入第二套规则。

备选方案:
- 先把多个来源对象合并，再统一清洗。否决原因是合并后会丢失别名来自哪个优先级层的信息。
- 让 camelCase 优先，或者把重复声明视为错误。否决原因是这两种方案都会破坏当前分支已有 manifest 或测试预期。

### Decision: 优先级应用保持不变

字段清洗完成后，系统再对归一化后的对象按既有优先级链做 deep merge。这里的 deep merge 只是在已经清洗完成的对象之间应用原有规则，不重新参与别名判定。这个 change 不改变 built in defaults、顶层 manifest 值、按场景 override 和 `initScene` callback 返回值之间的优先级。

这里可以直接理解为：

- `window 默认配置 = 清洗后的 top level defaults + 清洗后的 window override`
- `volume 默认配置 = 清洗后的 top level defaults + 清洗后的 volume override`

这里的加号表示沿用既有 merge 规则，不是字面上的对象相加。后续 `initScene` callback 仍然可以继续覆盖这些默认配置。

原因:
- 这样可以明确区分本次 change 的实际范围，只修改字段清洗，不修改优先级链。
- 可以复用现有的默认值合并行为，降低回归风险。

备选方案:
- 在字段清洗的同时重定义跨层优先级。否决原因是这会扩大 change 范围，也不符合当前实现和测试。

### Decision: 只归一化 manifest 派生默认值 不归一化 callback 链状态

manifest 输入会先归一化为运行时 camelCase 结构，再作为第一次 `initScene()` 的 `pre` 值使用。但一旦 callback 返回了对象，该返回值会原样保存，并在后续同名场景调用中原样传回。

```mermaid
sequenceDiagram
    participant Manifest
    participant SceneManager
    participant App

    Manifest->>SceneManager: 提供 mixed-case manifest 数据
    SceneManager->>SceneManager: 归一化 manifest 别名
    SceneManager-->>App: 首次 pre 来自 manifest 默认值
    App-->>SceneManager: callback 返回值
    SceneManager->>SceneManager: 存储原始 callback 返回值
    SceneManager-->>App: 下一次 pre 来自上一次原始返回值
```

原因:
- 这样可以保持当前分支测试所验证的既有链式语义。
- 也可以避免在第一次 callback 之后静默改写开发者自有对象。

备选方案:
- 每次都在存储前归一化 callback 返回值。否决原因是会在多次调用之间悄悄重写应用状态。

### Decision: 将支持面限定在当前分支已实现并已验证的别名集合

这个 change 只文档化并实现以下别名:
- `default_size` 和 `defaultSize`
- `world_scaling` 和 `worldScaling`
- `world_alignment` 和 `worldAlignment`
- `baseplate_visibility` 和 `baseplateVisibility`
- `window_scene` 和 `windowScene`
- `volume_scene` 和 `volumeScene`
- `resizability` 中的 `min_width` `min_height` `max_width` `max_height`

原因:
- 这些别名正好与当前分支实现和测试覆盖一致。
- 超出已验证范围继续扩展会变成猜测。
- 递归规则描述的是已支持别名的行为方式，不代表未来所有深层路径都会自动获得 alias 支持。

## Risks / Trade-offs

- Risk: 输入示例中仍会看到 mixed naming。Mitigation: 把所有 manifest 派生运行时默认值统一归一化为 camelCase，保证下游逻辑一致。
- Risk: 开发者可能误以为 callback 返回值也会被归一化。Mitigation: 文档中明确只有 manifest 派生默认值会归一化，而 callback 链会保留原始返回值。
- Risk: 未来继续扩别名时可能偏离当前约定。Mitigation: 在扩大支持面之前，先在 spec 中补充明确场景，再新增测试。

## Migration Plan

不需要数据迁移。已有 manifest 会继续工作，mixed-case manifest 则会在不改变外部 API 结构的前提下获得更强兼容性。若回滚，只需移除新增的归一化路径以及对应测试和文档。

## Open Questions

当前分支没有剩余开放问题。受支持的别名集合和优先级行为都已经由实现与测试共同覆盖。