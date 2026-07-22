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

echo "→ 同步文件（css/ articles/ 保留仓库原有）…"
# 2026-07-05 改版：品牌页迁移到 /chinese-car-brands，清理仓库里的旧路径产物
rm -rf "$TMP/site/brands" "$TMP/site/zh/brands" "$TMP/site/brands.html" "$TMP/site/zh/brands.html" "$TMP/site/news-sitemap.xml"
# articles/ 采用"合并"策略：保留仓库里 GCP 每日产出的文章，同时把本地新增的
# 长文（如 content-plan 的 20 篇奠基文章）一并同步上去。
rsync -a --exclude .git --exclude js/articles-data.js "$SRC/" "$TMP/site/"

cd "$TMP/site"
if command -v node >/dev/null 2>&1; then
  echo "→ 重新构建（合并仓库里的每日文章）…"
  node build.js
else
  echo "⚠️ 本机未装 Node（brew install node），跳过重建——每日文章列表可能暂时缺失，服务器明早会自动修复。"
fi
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
