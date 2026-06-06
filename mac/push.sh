#!/usr/bin/env bash
# Mac 端中继：把 Cowork 每早生成的当日内容 commit 并 push 到 GitHub。
# 由 launchd 每天 06:15 触发（见 com.bobo.chinaauto.push.plist）。
set -euo pipefail

REPO_DIR="/Users/Junbo2TOM/Documents/每日简报"
cd "$REPO_DIR"

LOG="$REPO_DIR/mac/push.log"
echo "==== $(date '+%F %T') push 开始 ====" >> "$LOG"

# 确保是 git 仓库（首次需手动 init，见 README）
if [ ! -d .git ]; then
  echo "尚未 git init，跳过。请先按 README 初始化并关联 GitHub。" >> "$LOG"
  exit 0
fi

git add -A
if git diff --cached --quiet; then
  echo "无变更，跳过 push。" >> "$LOG"
  exit 0
fi

DATE=$(python3 -c "import json;print(json.load(open('content/meta.json'))['date'])" 2>/dev/null || date '+%F')
git commit -m "每日简报 $DATE" >> "$LOG" 2>&1
git push origin HEAD >> "$LOG" 2>&1
echo "==== $(date '+%F %T') push 完成 ($DATE) ====" >> "$LOG"
