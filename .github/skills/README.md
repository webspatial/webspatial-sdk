# OpenSpec agent skills

These directories contain **SKILL.md** instructions for AI coding agents working with [OpenSpec](https://github.com/Fission-AI/OpenSpec) in this repository (`openspec/` change proposals, tasks, and archives).

This `.github/skills/` tree is the canonical checked-in copy for the OpenSpec skill text. The same OpenSpec skills are mirrored under `.coco/skills/`, `.codex/skills/`, `.cursor/skills/`, and `.trae/skills/` only so each tool can discover skills from its preferred path. Keep mirrored `SKILL.md` files byte-for-byte identical unless a specific tool requires wrapper metadata.

Trae command files under `.trae/commands/opsx-*.md` are intentionally thin wrappers around the matching `.trae/skills/openspec-*/SKILL.md` files; put workflow behavior in the skill, not the command wrapper.

| Skill | Purpose |
| ----- | ------- |
| `openspec-apply-change` | Implement tasks from an active OpenSpec change |
| `openspec-archive-change` | Archive a completed change |
| `openspec-explore` | Explore requirements and design before coding |
| `openspec-propose` | Scaffold a new OpenSpec change |

## Using them in your editor

Point your agent configuration at a skill path, for example:

- **Cursor**: add the folder under Project Rules or Skills so each `SKILL.md` can be loaded by name (see your editor docs for “skills” or “rules” paths).

Requirements: the `openspec` CLI available in the environment where the agent runs commands.
