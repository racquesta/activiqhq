#!/usr/bin/env bash
# Fast-forward local main (or master) from origin. Safe no-op if no remote.
set -euo pipefail

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

REPO_ROOT="$(get_repo_root)"
cd "$REPO_ROOT"

if ! has_git; then
  echo "sync-main: not a git repository; skipping." >&2
  exit 0
fi

git fetch origin 2>/dev/null || {
  echo "sync-main: no origin remote or fetch failed; skipping." >&2
  exit 0
}

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
  echo "sync-main: no main or master branch found; skipping." >&2
  exit 0
fi

if git show-ref --verify --quiet "refs/heads/$MAIN"; then
  git checkout "$MAIN"
else
  git checkout -b "$MAIN" "origin/$MAIN"
fi
git pull --ff-only "origin" "$MAIN" 2>/dev/null || git pull --ff-only

echo "sync-main: on $(git rev-parse --abbrev-ref HEAD) at $(git rev-parse --short HEAD)"
