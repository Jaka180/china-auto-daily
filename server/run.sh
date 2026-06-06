#!/usr/bin/env bash
# 服务器端每日发布：拉取最新内容 → 创建公众号草稿
# 放进服务器 crontab，例如每天 06:20：
#   20 6 * * * /path/to/每日简报/server/run.sh >> /path/to/每日简报/server/publish.log 2>&1
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

echo "==== $(date '+%F %T') 开始 ===="

# 凭证：建议写在 server/.env（不提交 git），或用系统环境变量
if [ -f "server/.env" ]; then
  set -a; . server/.env; set +a
fi

# 拉取 Cowork 经 Mac 推上来的当日内容
git pull --ff-only origin main || git pull --ff-only origin master

# 发布草稿（如需自动群发改为：python3 server/wechat_publish.py --publish）
python3 server/wechat_publish.py

echo "==== $(date '+%F %T') 完成 ===="
