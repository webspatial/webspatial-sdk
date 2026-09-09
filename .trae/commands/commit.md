---
name: /commit
id: commit
category: Workflow
description: Stage changes and create a Conventional Commit with a mandatory ticket: trailer
---

Create a git commit that follows the repository's commit message convention.

**Input**: Optionally specify the commit type and/or ticket ID (e.g., `/commit fix ticket:123456`). If omitted, infer the type from the staged changes and ask the user for the ticket ID, or use `ticket: 0` for trivial changes.

**Rules (MANDATORY — never bypass)**

1. The commit message MUST use [Conventional Commits](https://www.conventionalcommits.org/) format:
   ```
   <type>(<scope>): <subject>

   <body>

   ticket: <ID>
   ```
2. The `ticket: <ID>` line is MANDATORY in every commit.
   - Use the Meego work item ID when one is known or provided.
   - Use `ticket: 0` for trivial changes with no associated work item.
   - If the user does not provide a ticket ID, ask for one before committing; if they explicitly say "no ticket" or it is clearly a trivial chore, use `ticket: 0` and tell the user.
3. NEVER use `git commit --no-verify`. The local `commit-msg` hook (commitlint) and CI both enforce these rules.
4. Allowed types: `feat` | `fix` | `docs` | `style` | `refactor` | `perf` | `test` | `build` | `ci` | `chore` | `revert`.
5. Scope (optional): the area touched, e.g. `react`, `core`, `cli`, `visionos`, `test-server`.
6. Subject: imperative mood, no trailing period; entire header <= 72 characters.
7. One logical change per commit. Do not bundle unrelated changes.

**Steps**

1. **Inspect the changes**

   ```bash
   git status
   git diff --cached
   git diff
   ```

   Determine what changed and infer the commit type and scope.

2. **Determine the ticket ID**

   - If provided in the command input, use it.
   - If the user mentioned a Meego ID in the conversation, use it.
   - Otherwise, ask the user: "What is the Meego ticket ID for this change? (Use 0 if there is no associated work item.)"

3. **Stage the relevant files**

   Stage only the files that belong to this logical change. If there are unrelated changes, leave them unstaged and mention them to the user.

   ```bash
   git add <files>
   ```

4. **Compose the commit message**

   Build the message following the format above. Include a concise body explaining *what* and *why* when the change is non-trivial.

   Example:
   ```
   fix(react): prevent portal sync loop on style recalc

   The head sync effect was re-running on every style recalculation,
   causing an infinite update loop in styled-components scenarios.
   Guard the effect with a shallow comparison of the tracked properties.

   ticket: 123456
   ```

5. **Commit**

   ```bash
   git commit -m "<message>"
   ```

   Do NOT append `--no-verify`. If the commit-msg hook rejects the message, read the error, fix the message, and retry.

6. **Verify**

   ```bash
   git log -1 --format=full
   ```

   Confirm the message contains both a valid Conventional Commits header and a `ticket:` line. Report the result to the user.

**If the user wants to amend the previous commit**

Use `git commit --amend` and re-apply the same message rules. Never amend a commit that has already been pushed to a shared branch without warning the user.
