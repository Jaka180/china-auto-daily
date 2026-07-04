#!/usr/bin/env bash
# 每周日全自动周报：汇总 archive/ 最近7天日报 → 周报草稿 + 邮件
# cron（setup_server.sh 已写入）：
#   0 8 * * 0 /path/to/china-auto-daily/server/run_weekly.sh >> /path/to/china-auto-daily/server/weekly.log 2>&1
set -uo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

echo "==== $(date '+%F %T') 周报开始 ===="

if [ -f "server/.env" ]; then
  set -a; . server/.env; set +a
fi
git pull --ff-only 2>/dev/null || true

DATE=$(date '+%F')
TMPLOG=$(mktemp)
trap 'rm -f "$TMPLOG"' EXIT

alert() {
  python3 server/notify_failure.py --step "$1" --log "$TMPLOG" || echo "⚠️ 告警邮件发送失败"
}
step() {
  echo "---- $1 ----"
  : > "$TMPLOG"
  "${@:2}" 2>&1 | tee -a "$TMPLOG"
}

step "1/4 生成周报" python3 server/weekly.py
rc=$?
if [ "$rc" -eq 3 ]; then
  echo "存档不足，本周跳过。"; exit 0
elif [ "$rc" -ne 0 ]; then
  echo "✗ 周报生成失败，终止。"; alert "生成周报"; exit 1
fi

WEEK_PILL="$(date -d '-6 days' '+%-m月%-d日')–$(date '+%-m月%-d日') · 周报版"
if ! step "2/4 生成封面" python3 tools/make_cover.py --date "$DATE" --out content/cover.jpg \
      --title "中国车企出海周报" --pill "$WEEK_PILL" --subtitle "16 家车企 · 一周出海大事 · 中英双语"; then
  echo "✗ 封面失败，终止。"; alert "周报封面"; exit 1
fi

PUB_FLAG=""
[ "${WX_AUTO_PUBLISH:-0}" = "1" ] && PUB_FLAG="--publish"
if ! step "3/4 公众号发布${PUB_FLAG:+(自动群发)}" python3 server/wechat_publish.py $PUB_FLAG; then
  echo "⚠️ 公众号失败，继续发邮件。"; alert "周报公众号发布"
fi

if ! step "4/4 Resend 发邮件" python3 server/send_email.py; then
  echo "⚠️ 邮件失败。"; alert "周报邮件"
fi

echo "==== $(date '+%F %T') 周报完成 ===="
