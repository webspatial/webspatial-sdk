## 背景

这个文件当前刻意保持最小化。

当前这条 change 先把 `proposal.md` 作为公共 API 定义和产品范围的主文档，把规范性行为放在 `specs/` 中。

## Goals / Non-Goals

**Goals:**
- 为后续如果仍然需要单独技术方案时预留位置

**Non-Goals:**
- 重复 `proposal.md` 中已经定义的公共 API
- 重复 `specs/` 中已经定义的规范性行为

## Decisions

- 在 proposal 阶段，把 `proposal.md` 作为目标态 API surface 的主来源
- 把 `specs/` 作为行为需求的主来源
- 详细的实现架构在真正阻塞实现时再单独补充

## Risks / Trade-offs

- [技术实现细节被延后] -> 如果实现开始时仍存在架构问题，需要在编码前补一轮单独的 design