#!/usr/bin/env bash
# 一键配置发布服务器（Ubuntu，含 Oracle Cloud Always Free ARM/A1 机型）
# 在已 git clone 的仓库根目录运行：
#   cd china-auto-daily && bash server/setup_server.sh
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"
echo "仓库目录：$REPO_DIR"

# ---------- 1. 系统依赖 ----------
echo "==> 安装 git / python3 / requests"
if command -v apt >/dev/null 2>&1; then
  sudo apt update -y
  sudo apt install -y git python3 python3-pip cron
  # Ubuntu 24.04 起 pip 受 PEP668 限制，优先用系统包安装 requests
  sudo apt install -y python3-requests || pip3 install requests --break-system-packages
  # 封面中文渲染所需字体
  sudo apt install -y fonts-noto-cjk || true
  # Claude API SDK（服务器自助生成日报用）
  pip3 install anthropic --break-system-packages || sudo apt install -y python3-pip && pip3 install anthropic --break-system-packages || true
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
EOF
  chmod 600 server/.env
  echo "==> 已生成 server/.env 模板，请填入 AppID / AppSecret / ANTHROPIC_API_KEY"
else
  echo "==> server/.env 已存在，跳过"
fi

# ---------- 3. 安装每日 cron（06:20）----------
CRON_LINE="20 6 * * * $REPO_DIR/server/run_daily.sh >> $REPO_DIR/server/publish.log 2>&1"
EXISTING=$(crontab -l 2>/dev/null | grep -vF "/server/run" || true)
printf '%s\n%s\n' "$EXISTING" "$CRON_LINE" | grep -v '^$' | crontab - || true
echo "==> 已写入 cron：每天 06:20 运行 run_daily.sh（生成→封面→发布，全自动）"
crontab -l | grep run_daily.sh || true

# ---------- 4. 展示本机公网 IP（用于公众号白名单）----------
echo
echo "================ 还差两步（手动）================"
IP=$(curl -s --max-time 8 https://api.ipify.org || curl -s --max-time 8 ifconfig.me || echo "（取IP失败，请在 Oracle 控制台查看实例公网IP）")
echo "① 把这台服务器的公网 IP 加进公众号后台白名单："
echo "      >>>  $IP  <<<"
echo "   位置：mp.weixin.qq.com → 设置与开发 → 基本配置 → IP白名单"
echo "   （Oracle 默认给的是临时公网IP，务必在控制台把它「保留/Reserved」成静态，否则重启可能变）"
echo
echo "② 填好 server/.env 里的 AppID/AppSecret 后，手测一次："
echo "      cd $REPO_DIR && bash server/run.sh"
echo "   成功会打印「✅ 草稿已创建」。之后每早 06:20 自动建草稿。"
echo "================================================"
