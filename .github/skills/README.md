# OpenSpec agent skills

These directories contain **SKILL.md** instructions for AI coding agents working with [OpenSpec](https://github.com/Fission-AI/OpenSpec) in this repository (`openspec/` change proposals, tasks, and archives).

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
