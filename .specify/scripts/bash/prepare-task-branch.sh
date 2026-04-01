#!/usr/bin/env bash
# Sync main from origin, then create or update a task branch named from tasks.md.
# Usage: prepare-task-branch.sh T014 [path/to/tasks.md]
# Env: ALLOW_DIRTY=1 to allow uncommitted changes (not recommended).
set -euo pipefail

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

TASK_ID="${1:-}"
TASKS_FILE="${2:-}"

usage() {
  echo "Usage: $0 T014 [path/to/tasks.md]" >&2
  echo "  Creates branch T014-<slug-from-task-line> from updated main." >&2
  exit 1
}

if [[ -z "$TASK_ID" ]] || [[ ! "$TASK_ID" =~ ^T[0-9]+[a-z]?$ ]]; then
  usage
fi

REPO_ROOT="$(get_repo_root)"
cd "$REPO_ROOT"

if ! has_git; then
  echo "prepare-task-branch: not a git repository; nothing to do." >&2
  exit 0
fi

if [[ -n "$(git status --porcelain 2>/dev/null)" ]] && [[ "${ALLOW_DIRTY:-}" != "1" ]]; then
  echo "prepare-task-branch: working tree is not clean. Commit or stash, or set ALLOW_DIRTY=1." >&2
  exit 1
fi

if [[ -z "$TASKS_FILE" ]]; then
  TASKS_FILE="$(find "$REPO_ROOT/specs" -name tasks.md -type f 2>/dev/null | head -1 || true)"
fi

if [[ -z "$TASKS_FILE" || ! -f "$TASKS_FILE" ]]; then
  echo "prepare-task-branch: could not find tasks.md (pass as second argument)." >&2
  exit 1
fi

LINE="$(grep -E "^- \[[ xX]\] ${TASK_ID} " "$TASKS_FILE" | head -1 || true)"
if [[ -z "$LINE" ]]; then
  echo "prepare-task-branch: no line for ${TASK_ID} in $TASKS_FILE" >&2
  exit 1
fi

# "- [ ] T014 [Shared] Description..." -> "Description..."
REST="$(echo "$LINE" | sed -E 's/^- \[[ xX]\] //' | sed -E "s/^${TASK_ID} //" | sed -E 's/^(\[[^]]+\] )+//')"

SLUG="$(echo "$REST" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g' | sed -E 's/^-|-$//g')"
SLUG="${SLUG:0:56}"
SLUG="${SLUG%-}"
if [[ -z "$SLUG" ]]; then
  SLUG="task"
fi

BRANCH="${TASK_ID}-${SLUG}"

git fetch origin 2>/dev/null || true

MAIN=""
if git show-ref --verify --quiet refs/remotes/origin/main; then
  MAIN=main
elif git show-ref --verify --quiet refs/remotes/origin/master; then
  MAIN=master
elif git show-ref --verify --quiet refs/heads/main; then
  MAIN=main
elif git show-ref --verify --quiet refs/heads/master; then
  MAIN=master
else
  echo "prepare-task-branch: no main or master branch found." >&2
  exit 1
fi

if git show-ref --verify --quiet "refs/heads/$MAIN"; then
  git checkout "$MAIN"
else
  git checkout -b "$MAIN" "origin/$MAIN"
fi
if git remote get-url origin >/dev/null 2>&1; then
  git pull --ff-only "origin" "$MAIN" 2>/dev/null || git pull --ff-only
fi

if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git checkout "$BRANCH"
  git merge --no-edit "$MAIN" || {
    echo "prepare-task-branch: merge of $MAIN into $BRANCH failed; resolve conflicts manually." >&2
    exit 1
  }
  echo "prepare-task-branch: updated existing branch $BRANCH (merged $MAIN)."
else
  git checkout -b "$BRANCH"
  echo "prepare-task-branch: created and checked out $BRANCH from $MAIN."
fi
