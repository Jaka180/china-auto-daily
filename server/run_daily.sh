#!/usr/bin/env bash
# 服务器端每日全自动：生成 → 存档 → 封面 → 链接校验 → 公众号 → 网站 → 邮件
# cron（setup_server.sh 已写入）：
#   20 6 * * * /path/to/china-auto-daily/server/run_daily.sh >> /path/to/china-auto-daily/server/publish.log 2>&1
# 任何关键步骤失败会通过 Resend 发告警邮件（notify_failure.py）。
set -uo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

echo "==== $(date '+%F %T') 开始 ===="

# 凭证/配置：ANTHROPIC_API_KEY / WX_APPID / WX_APPSECRET / RESEND_API_KEY
#           RESEND_SEGMENT_ID / EMAIL_TO(兜底) / EMAIL_FROM / WX_AUTO_PUBLISH(1=自动群发)
if [ -f "server/.env" ]; then
  set -a; . server/.env; set +a
fi

# 可选：拉取最新代码（失败也继续）
git pull --ff-only 2>/dev/null || true

DATE=$(date '+%F')
TMPLOG=$(mktemp)
trap 'rm -f "$TMPLOG"' EXIT

alert() {  # $1=步骤名；告警本身失败只打日志
  python3 server/notify_failure.py --step "$1" --log "$TMPLOG" || echo "⚠️ 告警邮件发送失败"
}
step() {   # $1=步骤名，其余=命令；输出同屏并留底供告警引用
  echo "---- $1 ----"
  : > "$TMPLOG"
  "${@:2}" 2>&1 | tee -a "$TMPLOG"
}

if ! step "1/7 生成日报正文" python3 server/generate.py; then
  echo "✗ 生成失败，终止。"; alert "生成日报正文"; exit 1
fi

echo "---- 2/7 存档 ----"
mkdir -p archive
cp -f content/briefing.html "archive/$DATE.html" && cp -f content/meta.json "archive/$DATE.json" \
  && echo "已存档 archive/$DATE.html" || echo "⚠️ 存档失败（不影响发布）"

if ! step "3/7 生成封面" python3 tools/make_cover.py --date "$DATE" --out content/cover.jpg; then
  echo "✗ 封面失败，终止。"; alert "生成封面"; exit 1
fi

step "4/7 校验来源链接" python3 server/check_links.py || echo "⚠️ 链接校验异常（不影响发布）"

PUB_FLAG=""
[ "${WX_AUTO_PUBLISH:-0}" = "1" ] && PUB_FLAG="--publish"
if ! step "5/7 公众号发布${PUB_FLAG:+(自动群发)}" python3 server/wechat_publish.py $PUB_FLAG; then
  echo "⚠️ 公众号失败，继续发邮件。"; alert "公众号发布"
fi

# 网站文章：生成中英文 /news + /zh/news 页面，并 push 到 TopChinaCar 网站仓库。
# 首次运行时 site_publish.py 会按 SITE_REPO_URL 自动 clone SITE_REPO_DIR。
if ! step "6/7 topchinacar.com 发布文章" python3 server/site_publish.py; then
  echo "✗ 网站发布失败，跳过日报邮件。"; alert "网站发布文章"; exit 1
fi

if ! step "7/7 Resend 发日报" python3 server/send_email.py; then
  echo "⚠️ 邮件失败。"; alert "Resend 发日报"
fi

echo "==== $(date '+%F %T') 完成 ===="
