# 中国车企出海日报 · 自动发布流水线

每天早上,**服务器一台机器全自动**：搜索 → 生成日报 + 封面 → 公众号「波波哥的小酒馆」建草稿 → Resend 发邮件到 junbo.wei@tomtom.com。不依赖 Mac、不依赖 Cowork。

## 架构（V3 · GCP e2-micro + 邮件）

服务器用 **Claude API(带联网搜索)** 自己生成日报,再渲染封面,再发草稿和邮件。一条 cron 串起四步：

```
GCP e2-micro · cron 每天 06:20（北京时间，静态IP已加公众号白名单）
   server/run_daily.sh：
     1) server/generate.py       调 Claude API 联网搜索14家车企 → wechat-content.html + meta.json
     2) tools/make_cover.py      渲染 2.35:1 封面 cover.jpg
     3) server/wechat_publish.py 上传封面 + 创建公众号草稿（后台确认后手动群发）
     4) server/send_email.py     Resend 发日报邮件 → junbo.wei@tomtom.com
```

**部署指南见 [`server/DEPLOY_GCP.md`](server/DEPLOY_GCP.md)。**

> **三个关键前提**：
> 1. 调微信接口的机器公网 IP 必须在公众号后台「设置与开发 → 基本配置 → IP白名单」里(否则 `errcode 40164`)——必须用固定 IP 的常驻 VM,serverless(Vercel 等)出口 IP 不固定,不可行。
> 2. 需要一个 **Anthropic API Key**(console.anthropic.com 创建,绑卡充值),每天一次生成约几美分~¥1 量级。
> 3. 需要一个 **Resend API Key**(resend.com,建议用 junbo.wei@tomtom.com 注册;免费账号未验证域名时只能发给注册邮箱本人)。

### 版本历史
- **V1(废弃)**:Cowork 在 Mac 上生成 → launchd push GitHub → 服务器 pull 发布。依赖 Mac 开机,已弃用。`mac/` 目录仅作历史参考,launchd 任务应卸载:`launchctl unload ~/Library/LaunchAgents/com.bobo.chinaauto.push.plist`
- **V2(退役)**:Oracle Always Free 服务器自助生成+发布。服务器已停。
- **V3(当前)**:GCP e2-micro,新增 Resend 邮件推送。

---

## 目录结构

```
每日简报/
├── content/                  ← Cowork 每天覆盖写入
│   ├── wechat-content.html   公众号版正文（内联样式）
│   ├── cover.jpg             封面 2.35:1
│   ├── briefing.html         完整网页版（备份）
│   └── meta.json             标题/作者/摘要/日期
├── tools/
│   └── make_cover.py         封面生成器（Cowork 调用）
├── mac/
│   ├── push.sh               Mac 中继：commit & push
│   ├── com.bobo.chinaauto.push.plist   launchd 定时
│   └── *.log
├── server/
│   ├── DEPLOY_GCP.md         ★ GCP 部署指南（从这里开始）
│   ├── run_daily.sh          cron 入口：生成→封面→草稿→邮件
│   ├── generate.py           Claude API 生成日报
│   ├── wechat_publish.py     公众号建草稿
│   ├── send_email.py         Resend 发邮件
│   ├── setup_server.sh       一键装依赖/写cron/生成.env
│   ├── requirements.txt
│   └── config.example.json   凭证模板（复制为 config.json，勿提交）
├── .gitignore
└── README.md
```

---

## 一次性安装

### A. GitHub 仓库（在 Mac 上，用 GitHub CLI）

本地仓库已初始化好（main 分支、含首个提交）。只需用 `gh` 建私有远程仓库并推送：

```bash
# 没装过 gh 先装：
brew install gh
# 一次性脚本（默认仓库名 china-auto-daily，可传参改名）：
bash ~/Documents/每日简报/mac/setup_github.sh
```

脚本会：检查/触发 `gh auth login` 浏览器授权 → 创建**私有**仓库 → 推送。  
`gh` 授权后会把推送凭证存进系统钥匙串，后续 launchd 自动 `git push` 免密。

> 等价手动命令：`gh repo create china-auto-daily --private --source=. --remote=origin --push`

### B. 服务器部署（GCP e2-micro）

完整步骤见 **[`server/DEPLOY_GCP.md`](server/DEPLOY_GCP.md)**。概要：GCP 建 e2-micro(免费区)→ 静态 IP → `git clone` + `bash server/setup_server.sh` → 填 `server/.env` 四个凭证 → IP 加公众号白名单 → `bash server/run_daily.sh` 手测。

默认**只创建草稿**，你在公众号后台预览确认后手动群发；邮件则直接发出。  
确认稳定后想全自动群发，把 `server/run_daily.sh` 里发布那行改成
`python3 server/wechat_publish.py --publish`（注意：群发不可撤回，仅能删除）。

---

## 安全提示

- AppSecret 等凭证只放 `server/.env` 或 `config.json`，**已被 `.gitignore` 排除**，切勿提交。
- 你此前在对话里贴过 AppSecret，建议到公众号后台**重置一次**。
- 仓库建议设为 **私有**。

## 故障排查

| 现象 | 原因 / 处理 |
|---|---|
| `errcode 40164` | 当前机器公网IP不在白名单 → 后台添加 |
| `errcode 40013/40125` | AppID / AppSecret 填错 |
| 草稿无样式 | 正文须用 `content/wechat-content.html`（内联样式版），勿用 `briefing.html` |
| 邮件 403 | 免费 Resend 只能发给注册邮箱本人 → 用 junbo.wei@tomtom.com 注册,或验证自有域名 |
| 邮件 401 | RESEND_API_KEY 填错 |
| 当天没跑 | 服务器上 `tail server/publish.log`;`crontab -l` 确认 cron 在;`timedatectl` 确认时区 Asia/Shanghai |
