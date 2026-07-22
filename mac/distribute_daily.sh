#!/usr/bin/env bash
# 中国车企出海日报 —— Mac 本机分发（零 Anthropic API）
#
# 前提：Cowork 定时任务已在 content/ 与 topchinacar-site/articles/ 写好当天内容。
# 本脚本做：封面 → 推送网站(GitHub→Cloudflare) → Resend 邮件 → 把 content/ 推到
#          china-auto-daily 仓库（供 GCP VM 拉取后发公众号草稿）。
# 公众号发布不在这里做——它由 GCP VM（固定白名单 IP）运行 server/run_wechat.sh 完成。
# 由 launchd (com.bobo.chinaauto.distribute.plist) 每工作日自动调用；也可手动运行：
#   bash ~/Documents/china-auto-briefing/mac/distribute_daily.sh
set -uo pipefail

REPO_DIR="$HOME/Documents/china-auto-briefing"
cd "$REPO_DIR" || { echo "✗ 找不到 $REPO_DIR"; exit 1; }

# 凭证：RESEND_API_KEY / EMAIL_TO / EMAIL_FROM 等
[ -f server/.env ] && { set -a; . server/.env; set +a; }

DATE=$(TZ=Asia/Shanghai date '+%Y-%m-%d')
ART="topchinacar-site/articles/${DATE}-china-auto-daily.json"

echo "==== $(date '+%F %T') 分发开始 (${DATE}) ===="

# 守卫：确认 Cowork 已生成当天内容，否则中止，避免发旧稿。
if [ ! -f "$ART" ] || [ ! -f content/meta.json ] || [ ! -f content/wechat-content.html ]; then
  echo "✗ 未找到当天内容（$ART 或 content/*）。Cowork 生成任务可能还没跑或失败，本次不分发。"
  exit 1
fi
if ! grep -q "\"date\": *\"${DATE}\"" content/meta.json 2>/dev/null; then
  echo "✗ content/meta.json 的日期不是 ${DATE}，疑似旧稿，本次不分发。"
  exit 1
fi

# 1) 强制注入15家车厂月度出口数据。失败就中止，不能再发送缺数据的日报。
echo "---- 1/5 注入月度出口数据 ----"
if ! python3 tools/inject_export_radar.py --date "$DATE"; then
  echo "✗ 月度出口数据注入失败，本次不发布、不发邮件。"
  exit 1
fi

# 2) 封面（纯 PIL，需 pip3 install pillow）——WeChat 与邮件都用它
echo "---- 2/5 生成封面 ----"
python3 tools/make_cover.py --date "$DATE" --out content/cover.jpg || echo "⚠️ 封面失败（不阻塞）"

# 3) 网站：合并到 tochinacar 仓库并 push，Cloudflare 自动部署
echo "---- 3/5 发布网站 ----"
bash mac/publish_site.sh "Daily article ${DATE}" || echo "✗ 网站发布失败。"

# 4) 邮件（Resend，无 IP 限制）
echo "---- 4/5 Resend 发日报 ----"
python3 server/send_email.py || echo "⚠️ 邮件失败"

# 5) 把当天 content/（正文+封面+meta）与 data/（数据底座）推到 china-auto-daily，
#    供 GCP VM 拉取发公众号,并让出口销量数据底座进入版本管理
echo "---- 5/5 推送 content/ + data/ ----"
git add content/ data/ 2>/dev/null
if git diff --cached --quiet; then
  echo "content/、data/ 无变更，跳过 push。"
else
  git commit -q -m "Daily content + data ${DATE}" && git push -q && echo "✅ 已推送，VM 稍后拉取发公众号" \
    || echo "✗ 推送失败——VM 将拿不到当天公众号内容"
fi

echo "==== $(date '+%F %T') 分发完成 ===="
