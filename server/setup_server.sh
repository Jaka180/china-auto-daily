#!/usr/bin/env bash
# 一键配置发布服务器（Ubuntu；适用 GCP e2-micro / Oracle Always Free 等任意固定IP VM）
# 在已 git clone 的仓库根目录运行：
#   cd china-auto-daily && bash server/setup_server.sh
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"
echo "仓库目录：$REPO_DIR"

# ---------- 1. 系统依赖 ----------
echo "==> 安装 git / python3 / requests / nodejs"
if command -v apt >/dev/null 2>&1; then
  sudo apt update -y
  sudo apt install -y git python3 python3-pip cron nodejs npm
  # Ubuntu 24.04 起 pip 受 PEP668 限制，优先用系统包安装 requests
  sudo apt install -y python3-requests || pip3 install requests --break-system-packages
  # 封面渲染：Pillow + 中文字体
  sudo apt install -y python3-pil fonts-noto-cjk || true
  # Claude API SDK（服务器自助生成日报用）——兼容新老 pip
  sudo apt install -y python3-pip || true
  pip3 install anthropic || pip3 install --user anthropic || pip3 install anthropic --break-system-packages || true
  sudo systemctl enable --now cron 2>/dev/null || true
else
  echo "非 apt 系统，请手动安装 git / python3 / python3-requests / fonts-noto-cjk / pip install anthropic"
fi

# ---------- 2. 凭证模板 ----------
if [ ! -f server/.env ]; then
  cat > server/.env <<'EOF'
# 凭证（本文件已被 .gitignore 忽略，勿提交）
WX_APPID=在这里填AppID
WX_APPSECRET=在这里填AppSecret
ANTHROPIC_API_KEY=在这里填AnthropicKey
# 可选，默认 claude-sonnet-4-6
# ANTHROPIC_MODEL=claude-sonnet-4-6

# Resend 发邮件（resend.com → API Keys 创建）
RESEND_API_KEY=在这里填ResendKey
# 可逗号分隔多个收件人（发非注册邮箱需先在 Resend 验证自有域名）
EMAIL_TO=jackwee020@gmail.com
# 未验证自有域名时只能用 onboarding@resend.dev（且只能发给 Resend 注册邮箱本人）
EMAIL_FROM=onboarding@resend.dev

# 公众号：0=只建草稿(默认，人工确认后群发)；1=自动群发(不可撤回，慎开)
WX_AUTO_PUBLISH=0

# TopChinaCar 网站自动发布：日报会写入网站仓库 articles/，生成 /news 与 /zh/news 双语页面
SITE_REPO_DIR=$HOME/tochinacar
SITE_REPO_URL=git@github.com:Jaka180/tochinacar.git
SITE_GIT_USER_NAME=briefing-bot
SITE_GIT_USER_EMAIL=bot@topchinacar.com
EOF
  chmod 600 server/.env
  echo "==> 已生成 server/.env 模板，请填入 AppID / AppSecret / ANTHROPIC_API_KEY / RESEND_API_KEY"
else
  echo "==> server/.env 已存在，跳过"
fi

# ---------- 3. 时区设为北京时间（GCP 默认 UTC，否则 cron 时间会错 8 小时）----------
sudo timedatectl set-timezone Asia/Shanghai 2>/dev/null || true
echo "==> 时区：$(timedatectl show -p Timezone --value 2>/dev/null || date +%Z)"

# ---------- 4. 安装 cron：每日 06:20 日报 + 每周日 08:00 周报 ----------
CRON_DAILY="20 6 * * * $REPO_DIR/server/run_daily.sh >> $REPO_DIR/server/publish.log 2>&1"
CRON_WEEKLY="0 8 * * 0 $REPO_DIR/server/run_weekly.sh >> $REPO_DIR/server/weekly.log 2>&1"
EXISTING=$(crontab -l 2>/dev/null | grep -vF "/server/run" || true)
printf '%s\n%s\n%s\n' "$EXISTING" "$CRON_DAILY" "$CRON_WEEKLY" | grep -v '^$' | crontab - || true
echo "==> 已写入 cron：每天 06:20 日报 / 每周日 08:00 周报"
crontab -l | grep '/server/run' || true

# ---------- 4b. 日志轮转 + 自动安全更新 ----------
sudo tee /etc/logrotate.d/china-auto-daily >/dev/null <<LOGEOF
$REPO_DIR/server/*.log {
  monthly
  rotate 6
  compress
  missingok
  notifempty
  copytruncate
}
LOGEOF
echo "==> 已配置 logrotate（server/*.log 按月轮转，保留6份）"
sudo apt install -y unattended-upgrades >/dev/null 2>&1 || true
printf 'APT::Periodic::Update-Package-Lists "1";\nAPT::Periodic::Unattended-Upgrade "1";\n' \
  | sudo tee /etc/apt/apt.conf.d/20auto-upgrades >/dev/null
echo "==> 已开启 Ubuntu 自动安全更新"

# ---------- 5. 展示本机公网 IP（用于公众号白名单）----------
echo
echo "================ 还差两步（手动）================"
IP=$(curl -s --max-time 8 https://api.ipify.org || curl -s --max-time 8 ifconfig.me || echo "（取IP失败，请在云控制台查看实例公网IP）")
echo "① 把这台服务器的公网 IP 加进公众号后台白名单："
echo "      >>>  $IP  <<<"
echo "   位置：mp.weixin.qq.com → 设置与开发 → 基本配置 → IP白名单"
echo "   （GCP：VPC network → IP addresses 把该 IP 提升为 Static；Oracle：设为 Reserved。否则重启可能变）"
echo
echo "② 填好 server/.env 里的 AppID/AppSecret/ANTHROPIC_API_KEY/RESEND_API_KEY 后，手测一次："
echo "      cd $REPO_DIR && bash server/run_daily.sh"
echo "   成功会打印「✅ 草稿已创建」和「✅ 邮件已发送」。之后每早 06:20 全自动。"
echo "================================================"
