#!/usr/bin/env bash
# 服务器端每日全自动：生成日报 → 生成封面 → 发布公众号草稿 → Resend 发邮件
# 完全不依赖 Mac / Cowork。放进服务器 crontab，例如每天 06:20：
#   20 6 * * * /path/to/china-auto-daily/server/run_daily.sh >> /path/to/china-auto-daily/server/publish.log 2>&1
set -uo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

echo "==== $(date '+%F %T') 开始 ===="

# 凭证/配置：ANTHROPIC_API_KEY / ANTHROPIC_MODEL / WX_APPID / WX_APPSECRET / RESEND_API_KEY / EMAIL_TO / EMAIL_FROM
if [ -f "server/.env" ]; then
  set -a; . server/.env; set +a
fi

# 可选：拉取最新代码（不影响主流程，失败也继续）
git pull --ff-only 2>/dev/null || true

DATE=$(date '+%F')

echo "---- 1/4 生成日报正文 ----"
if ! python3 server/generate.py; then
  echo "✗ 生成失败，终止。" ; exit 1
fi

echo "---- 2/4 生成封面 ----"
if ! python3 tools/make_cover.py --date "$DATE" --out content/cover.jpg; then
  echo "✗ 封面生成失败，终止。" ; exit 1
fi

echo "---- 3/4 发布草稿 ----"
# 默认只建草稿；如需自动群发，把下一行改成： python3 server/wechat_publish.py --publish
# 草稿失败不终止——邮件仍照发（各自独立）
python3 server/wechat_publish.py || echo "⚠️ 公众号草稿失败（见上方错误），继续发邮件。"

echo "---- 4/4 Resend 发邮件 ----"
python3 server/send_email.py || echo "⚠️ 邮件发送失败（见上方错误）。"

echo "==== $(date '+%F %T') 完成 ===="
