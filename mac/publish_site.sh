#!/usr/bin/env bash
# 把 topchinacar-site/ 的改动发布到 GitHub 网站仓库（Jaka180/tochinacar），
# push 后 Cloudflare Pages 自动部署。
# 用法（Mac 终端）：bash ~/Documents/china-auto-briefing/mac/publish_site.sh
set -euo pipefail

SRC="$HOME/Documents/china-auto-briefing/topchinacar-site"
REPO="https://github.com/Jaka180/tochinacar.git"
MSG="${1:-Prerendered multi-page + daily articles + quote funnel + SEO}"

[ -d "$SRC" ] || { echo "✗ 找不到 $SRC"; exit 1; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

echo "→ 克隆网站仓库…"
git clone -q "$REPO" "$TMP/site"

echo "→ 同步文件（css/ 与 images/ 保留仓库原有）…"
rsync -a --exclude .git "$SRC/" "$TMP/site/"

cd "$TMP/site"
git add -A
if git diff --cached --quiet; then
  echo "✓ 没有变更，无需发布。"
  exit 0
fi

echo "→ 本次变更："
git diff --cached --stat | tail -5
git commit -q -m "$MSG"
git push -q
echo "✅ 已推送。Cloudflare Pages 正在部署（1-2分钟）→ https://www.topchinacar.com"
echo ""
echo "别忘了（各一次）："
echo "  1. Cloudflare → tochinacar → Settings → 环境变量: RESEND_API_KEY / RESEND_AUDIENCE_ID / INQUIRY_TO"
echo "  2. GCP VM 配置 deploy key + clone + nodejs（见 topchinacar-site/README.md）"
