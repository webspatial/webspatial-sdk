#!/usr/bin/env bash
# Used by CI: when a PR touches packages/, require an accompanying .changeset/*.md
# (not README.md). Set SKIP_CHANGESET=1 when the PR has label skip-changeset.
set -euo pipefail

if [[ "${SKIP_CHANGESET:-0}" == "1" ]]; then
  echo "Skipping changeset check (skip-changeset)."
  exit 0
fi

BASE_SHA="${BASE_SHA:?BASE_SHA required}"
HEAD_SHA="${HEAD_SHA:?HEAD_SHA required}"

CHANGED=$(git diff --name-only "${BASE_SHA}" "${HEAD_SHA}" 2>/dev/null || true)

if ! grep -q '^packages/' <<<"$CHANGED" 2>/dev/null; then
  echo "No packages/ changes; changeset not required."
  exit 0
fi

# Any .changeset/*.md except README.md counts as a release note entry
if echo "$CHANGED" | grep -E '^\.changeset/.+\.md$' | grep -v '^\.changeset/README\.md$' | grep -q .; then
  echo "Changeset requirement satisfied."
  exit 0
fi

echo "::error::Changes under packages/ require a changeset. Run \`pnpm changeset\` at the repo root, commit the new file under .changeset/, and push. Maintainers may add the \`skip-changeset\` label to bypass when no release note is needed."
exit 1
