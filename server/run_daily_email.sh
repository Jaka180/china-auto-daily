#!/usr/bin/env bash
# 每日全自动：生成日报 → 生成封面（可选） → 发送邮件
# 用 GitHub Actions（.github/workflows/daily-report.yml）调度，不需要常驻服务器/固定IP。
set -uo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

echo "==== $(date '+%F %T') 开始 ===="

# 凭证/配置：ANTHROPIC_API_KEY / RESEND_API_KEY / EMAIL_FROM / EMAIL_TO
if [ -f "server/.env" ]; then
  set -a; . server/.env; set +a
fi

DATE=$(date '+%F')

echo "---- 1/3 生成日报正文 ----"
if ! python3 server/generate.py; then
  echo "✗ 生成失败，终止。" ; exit 1
fi

echo "---- 2/3 生成封面（失败不影响发邮件）----"
python3 tools/make_cover.py --date "$DATE" --out content/cover.jpg || echo "⚠️ 封面生成失败，跳过封面，继续发邮件"

echo "---- 3/3 发送邮件 ----"
if ! python3 server/send_email.py; then
  echo "✗ 邮件发送失败。" ; exit 1
fi

echo "==== $(date '+%F %T') 完成 ===="
