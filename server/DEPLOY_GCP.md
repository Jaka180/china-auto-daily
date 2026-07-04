# GCP e2-micro 部署指南（V3）

目标:一台免费的 GCP 常驻 VM,每天 06:20(北京时间)自动:生成日报 → 渲染封面 → 公众号建草稿 → Resend 发邮件到 junbo.wei@tomtom.com。

## 0. 前置准备(部署前先拿到这三样)

1. **Anthropic API Key**:console.anthropic.com → API Keys(需绑卡,每天约几美分~¥1)。
2. **Resend API Key**:注册 resend.com(建议直接用 junbo.wei@tomtom.com 注册)→ API Keys → Create。
   - 免费账号未验证域名时,只能从 `onboarding@resend.dev` 发给**注册邮箱本人**——所以用 tomtom 邮箱注册即可直接收信。
   - 若想用自己域名发信(如 briefing@bobopub.com),在 Resend 后台 Domains 添加域名并配置 DNS 后,把 `.env` 里 `EMAIL_FROM` 改掉。
3. **公众号 AppID / AppSecret**:mp.weixin.qq.com → 设置与开发 → 基本配置。

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

脚本会:装依赖 → 生成 `server/.env` 模板 → 时区设为北京时间 → 写入每天 06:20 的 cron → 打印公网 IP。

## 4. 填凭证 + 加白名单

```bash
nano server/.env
```

填入四项:`WX_APPID`、`WX_APPSECRET`、`ANTHROPIC_API_KEY`、`RESEND_API_KEY`(`EMAIL_TO` 默认已是 junbo.wei@tomtom.com)。

把脚本打印的公网 IP 加进:mp.weixin.qq.com → 设置与开发 → 基本配置 → **IP白名单**。

## 5. 手测一次

```bash
bash server/run_daily.sh
```

预期输出依次:`[generate] 完成` → 封面生成 → `✅ 草稿已创建` → `✅ 邮件已发送 → junbo.wei@tomtom.com`。

之后每天 06:20 自动运行,日志在 `server/publish.log`:

```bash
tail -f server/publish.log
```

## 故障排查

| 现象 | 处理 |
|---|---|
| errcode 40164 | 服务器 IP 不在公众号白名单,或 IP 没固定被重启换掉了 |
| 邮件 403 | 免费 Resend 只能发给注册邮箱本人;确认注册邮箱是 junbo.wei@tomtom.com,或验证自有域名 |
| 邮件 401 | RESEND_API_KEY 错误 |
| cron 没跑 | `crontab -l` 确认有条目;`timedatectl` 确认时区是 Asia/Shanghai |
| 生成超时/报错 | 检查 ANTHROPIC_API_KEY 额度;e2-micro 内存小,`free -h` 看是否 OOM(可加 1G swap:`sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`) |
