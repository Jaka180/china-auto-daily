#!/usr/bin/env bash
# 一次性：用 GitHub CLI 创建私有仓库并推送（中国车企出海日报流水线）
# 用法：
#   bash ~/Documents/china-auto-briefing/mac/setup_github.sh [仓库名]
# 仓库名默认 china-auto-daily
set -euo pipefail

REPO_NAME="${1:-china-auto-daily}"
REPO_DIR="/Users/Junbo2TOM/Documents/china-auto-briefing"
cd "$REPO_DIR"

# 1) 检查 gh
if ! command -v gh >/dev/null 2>&1; then
  echo "未检测到 GitHub CLI。请先安装：  brew install gh"
  exit 1
fi

# 2) 检查登录状态，未登录则触发浏览器授权
if ! gh auth status >/dev/null 2>&1; then
  echo "首次使用，开始 GitHub 授权（浏览器会打开）…"
  gh auth login
fi

# 3) 确保本地是 git 仓库且有提交
if [ ! -d .git ]; then
  git init -q && git symbolic-ref HEAD refs/heads/main
fi
git add -A
git diff --cached --quiet || git commit -q -m "update pipeline"

# 4) 已有 origin 就直接推；否则创建私有仓库并推送
if git remote get-url origin >/dev/null 2>&1; then
  echo "已存在 origin：$(git remote get-url origin)，直接推送…"
  git push -u origin HEAD
else
  echo "创建私有仓库 $REPO_NAME 并推送…"
  gh repo create "$REPO_NAME" --private --source=. --remote=origin --push
fi

echo
echo "✅ 完成。远程仓库："
gh repo view --json url -q .url 2>/dev/null || git remote get-url origin
echo "接下来：① 安装 Mac launchd（见 README B 节）② 服务器 clone+cron（README C 节）"
