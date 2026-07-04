#!/usr/bin/env bash
# Mac 端中继：把 Cowork 每早生成的当日内容 commit 并 push 到 GitHub。
# 由 launchd 每天 06:15 触发（见 com.bobo.chinaauto.push.plist）。
set -euo pipefail

REPO_DIR="/Users/Junbo2TOM/Documents/china-auto-briefing"
cd "$REPO_DIR"

LOG="$REPO_DIR/mac/push.log"
echo "==== $(date '+%F %T') push 开始 ====" >> "$LOG"

# 确保是 git 仓库（首次需手动 init，见 README）
if [ ! -d .git ]; then
  echo "尚未 git init，跳过。请先按 README 初始化并关联 GitHub。" >> "$LOG"
  exit 0
fi

DATE=$(python3 -c "import json;print(json.load(open('content/meta.json'))['date'])" 2>/dev/null || date '+%F')

# 有工作区改动就提交（无改动则跳过提交，但仍会 push 未推送的历史提交）
git add -A
if ! git diff --cached --quiet; then
  git commit -m "每日简报 $DATE" >> "$LOG" 2>&1
  echo "$(date '+%F %T') 已提交当日变更" >> "$LOG"
else
  echo "$(date '+%F %T') 工作区无改动" >> "$LOG"
fi

# 无论是否有新提交，都尝试 push（已同步时 git 自身会判定 up-to-date，无副作用）
if git push origin HEAD >> "$LOG" 2>&1; then
  echo "==== $(date '+%F %T') push 完成 ($DATE) ====" >> "$LOG"
else
  echo "==== $(date '+%F %T') push 失败，见上方日志 ====" >> "$LOG"
fi
