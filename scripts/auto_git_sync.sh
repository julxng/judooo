#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/Users/juliusng/Documents/judooo"
BRANCH="main"
LOG_FILE="/Users/juliusng/Documents/judooo/logs/auto_git_sync.log"

mkdir -p "$(dirname "$LOG_FILE")"

cd "$REPO_DIR"

# Skip if repo is in a conflicted merge/rebase/cherry-pick state.
if [ -d ".git/rebase-apply" ] || [ -d ".git/rebase-merge" ] || [ -f ".git/MERGE_HEAD" ] || [ -f ".git/CHERRY_PICK_HEAD" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') skipped: repository has pending git operation" >> "$LOG_FILE"
  exit 0
fi

git add -A

# Exit early if there is nothing staged.
if git diff --cached --quiet; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') no changes" >> "$LOG_FILE"
  exit 0
fi

git commit -m "chore: auto-sync $(date '+%Y-%m-%d %H:%M:%S')"
git push origin "$BRANCH"

echo "$(date '+%Y-%m-%d %H:%M:%S') synced successfully" >> "$LOG_FILE"
