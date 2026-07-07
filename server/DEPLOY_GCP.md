# GCP e2-micro 部署指南（V3）

目标:一台免费的 GCP 常驻 VM,每天 06:20(北京时间)自动:生成日报 → 渲染封面 → 公众号建草稿 → Resend 发邮件到配置的收件邮箱 → 发布中英文网站日报。

## 0. 前置准备(部署前先拿到这三样)

1. **Anthropic API Key**:console.anthropic.com → API Keys(需绑卡,每天约几美分~¥1)。
2. **Resend API Key**:注册 resend.com → API Keys → Create。
   - 免费账号未验证域名时,只能从 `onboarding@resend.dev` 发给**注册邮箱本人**。若需发给其他邮箱，请先验证自有域名。
   - 若想用自己域名发信(如 briefing@bobopub.com),在 Resend 后台 Domains 添加域名并配置 DNS 后,把 `.env` 里 `EMAIL_FROM` 改掉。
3. **公众号 AppID / AppSecret**:mp.weixin.qq.com → 设置与开发 → 基本配置。
4. **GitHub 网站仓库写权限**:日报会自动写入 `Jaka180/tochinacar` 的 `articles/` 并 push，Cloudflare Pages 自动部署。

## 1. 创建 e2-micro 实例(免费额度)

console.cloud.google.com → Compute Engine → Create instance:

- **Region**:必须是 `us-west1`、`us-central1` 或 `us-east1`(免费额度只在这三个区)
- **Machine type**:`e2-micro`
- **Boot disk**:Ubuntu 24.04 LTS,标准永久盘 ≤30GB
- 网络默认即可(本流程只需出站,无需开任何入站端口)

## 2. 固定公网 IP(必须,微信白名单依赖它)

VPC network → IP addresses → 找到该实例的 External IP → **Reserve(提升为 Static)**。

> 免费细则:静态 IP **挂在运行中的实例上**不收费;实例停机或 IP 闲置才计费。所以保持实例常开即可。

## 3. 部署

浏览器点实例旁的 **SSH** 按钮(或 `gcloud compute ssh`)登入,然后:

```bash
git clone https://github.com/<你的账号>/china-auto-daily.git
cd china-auto-daily
bash server/setup_server.sh
```

脚本会:装依赖（含 Node.js）→ 生成 `server/.env` 模板 → 时区设为北京时间 → 写入每天 06:20 的 cron → 打印公网 IP。

## 3.1 配置网站仓库写权限（必须，否则日报不会出现在网站）

在 VM 上生成部署密钥：

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

到 GitHub 网站仓库 `Jaka180/tochinacar`：

Settings → Deploy keys → Add deploy key → 粘贴公钥 → 勾选 **Allow write access**。

`server/.env` 默认已包含：

```bash
SITE_REPO_DIR=$HOME/tochinacar
SITE_REPO_URL=git@github.com:Jaka180/tochinacar.git
```

第一次执行 `server/site_publish.py` 时会自动 clone 到 `~/tochinacar`。之后每天会写入：

- 英文页：`/news/YYYY-MM-DD-china-auto-daily`
- 中文页：`/zh/news/YYYY-MM-DD-china-auto-daily`

## 4. 填凭证 + 加白名单

```bash
nano server/.env
```

填入四项:`WX_APPID`、`WX_APPSECRET`、`ANTHROPIC_API_KEY`、`RESEND_API_KEY`(`EMAIL_TO` 默认已是 `jackwee020@gmail.com`)。

把脚本打印的公网 IP 加进:mp.weixin.qq.com → 设置与开发 → 基本配置 → **IP白名单**。

## 5. 手测一次

```bash
bash server/run_daily.sh
```

预期输出依次:`[generate] 完成` → 封面生成 → `✅ 草稿已创建` → `✅ 邮件已发送 → jackwee020@gmail.com` → `[site] ✅ 已推送`。

之后每天 06:20 自动运行,日志在 `server/publish.log`:

```bash
tail -f server/publish.log
```

## 故障排查

| 现象 | 处理 |
|---|---|
| errcode 40164 | 服务器 IP 不在公众号白名单,或 IP 没固定被重启换掉了 |
| 邮件 403 | 免费 Resend 只能发给注册邮箱本人；确认收件人是当前 Resend 注册邮箱，或验证自有域名 |
| 邮件 401 | RESEND_API_KEY 错误 |
| 网站日报没出现 | `tail server/publish.log` 看第7步；确认 GitHub Deploy key 已勾选 write access，且 `SITE_REPO_URL` 指向 `git@github.com:Jaka180/tochinacar.git` |
| cron 没跑 | `crontab -l` 确认有条目;`timedatectl` 确认时区是 Asia/Shanghai |
| 生成超时/报错 | 检查 ANTHROPIC_API_KEY 额度;e2-micro 内存小,`free -h` 看是否 OOM(可加 1G swap:`sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`) |
