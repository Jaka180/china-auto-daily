# 中国车企出海日报 · 自动发布流水线

每天早上全自动：搜索 → 生成日报 + 封面 → 发送邮件（或发布到公众号「波波哥的小酒馆」）。

## 架构（V3 · GitHub Actions + 邮件，推荐）

不需要自建服务器、不需要固定公网 IP。GitHub Actions 按 cron 定时跑：

```
GitHub Actions · 每天 22:20 UTC（北京时间 06:20）
  .github/workflows/daily-report.yml：
    1) server/generate.py         调 Claude API 联网搜索14家车企 → wechat-content.html + meta.json
    2) tools/make_cover.py        渲染 2.35:1 封面 cover.jpg（失败不影响后续）
    3) server/send_email.py       通过 SMTP 发送 HTML 邮件（内联封面图）
    4) 把 content/ 归档 commit 回仓库
```

**一次性配置**（仓库 Settings → Secrets and variables → Actions → New repository secret）：

| Secret | 说明 |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com 创建，联网搜索+生成日报用 |
| `SMTP_HOST` / `SMTP_PORT` | 发件邮箱的 SMTP 服务器，如 Gmail 是 `smtp.gmail.com` / `587` |
| `SMTP_USER` / `SMTP_PASS` | 发件邮箱账号 + 密码。**建议用一个普通邮箱的"应用专用密码"**（如 Gmail App Password），公司邮箱 SMTP 中继通常不允许 GitHub Actions 的外部 IP 直接鉴权发信 |
| `EMAIL_FROM` | 发件人地址（同 SMTP_USER 一般填一样） |
| `EMAIL_TO` | 收件人，不填默认 `junbo.wei@tomtom.com` |

配置好 secrets 后，去仓库 Actions 页面 → 选「中国车企出海日报（每日邮件）」→ **Run workflow** 手动跑一次即可测试；之后每天北京时间 06:20 自动跑。

也可以在自己有 `server/.env` 的机器上手动跑一次（本地测试/临时手动补发）：
```bash
bash server/run_daily_email.sh
```

---

## 架构（V2 · 服务器自助 + 微信公众号，可选）

如果除了邮件还想同时发公众号草稿，可以继续用下面这套（需要一台常驻服务器 + 固定公网 IP，因为微信接口强制 IP 白名单）：

服务器用 **Claude API(带联网搜索)** 自己生成日报,再渲染封面,再发草稿。一条 cron 串起三步：

```
你的服务器 · cron 每天 06:20（北京时间，固定IP已加公众号白名单）
   server/run_daily.sh：
     1) server/generate.py    调 Claude API 联网搜索14家车企 → wechat-content.html + meta.json
     2) tools/make_cover.py    渲染 2.35:1 封面 cover.jpg
     3) server/wechat_publish.py  上传封面 + 创建公众号草稿
```

> **两个关键前提**：
> 1. 调微信接口的机器公网 IP 必须在公众号后台「设置与开发 → 基本配置 → IP白名单」里(否则 `errcode 40164`)——服务器固定 IP 正为此。
> 2. 需要一个 **Anthropic API Key**(console.anthropic.com 创建,绑卡充值),每天一次生成约几美分~¥1 量级。

### 关于 Mac / Cowork（旧 V1，已不需要）
最初的链路是 Cowork(06:00 在 Mac 上跑)生成 → Mac(launchd 06:15)push 到 GitHub → 服务器 pull 发布。但 Cowork 是桌面应用、生成那步就要 Mac 开机,做不到"完全无 Mac"。V2 把生成也搬到服务器后,`mac/` 目录与 Cowork 定时任务都**不再需要**(可停用)。仓库里仍保留 `mac/`、`server/run.sh` 仅作历史参考。

---

## 目录结构

```
每日简报/
├── .github/workflows/
│   └── daily-report.yml      GitHub Actions 定时任务（V3 入口）
├── content/                  ← 每天自动覆盖写入 / Actions 自动 commit 归档
│   ├── wechat-content.html   正文（内联样式，公众号/邮件通用）
│   ├── cover.jpg             封面 2.35:1
│   ├── briefing.html         完整网页版（备份）
│   └── meta.json             标题/作者/摘要/日期
├── tools/
│   └── make_cover.py         封面生成器
├── mac/
│   ├── push.sh               Mac 中继：commit & push（旧 V1，仅历史参考）
│   ├── com.bobo.chinaauto.push.plist   launchd 定时
│   └── *.log
├── server/
│   ├── generate.py           调 Claude API 联网搜索 + 生成日报正文
│   ├── send_email.py         SMTP 发送邮件（V3）
│   ├── run_daily_email.sh    V3 本地/服务器手动入口：生成→封面→发邮件
│   ├── wechat_publish.py     微信公众号发布脚本（V2）
│   ├── run_daily.sh          V2 服务器 cron 入口：生成→封面→发公众号
│   ├── run.sh                旧版服务器 cron 入口（git pull + 发布）
│   ├── requirements.txt
│   └── config.example.json   微信凭证模板（复制为 config.json，勿提交）
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

### B. Mac 定时中继（launchd）

```bash
cp ~/Documents/每日简报/mac/com.bobo.chinaauto.push.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.bobo.chinaauto.push.plist
# 立即测试一次：
launchctl start com.bobo.chinaauto.push
tail -f ~/Documents/每日简报/mac/push.log
```
> Mac 06:15 若处于关机/睡眠会错过；如需更稳可改用唤醒计划，或干脆把中继也放服务器。

### C. 服务器发布（Oracle Cloud Always Free, Ubuntu）

**先在 Oracle 控制台开机：**
1. 创建实例：Always Free 的 `VM.Standard.A1.Flex`（ARM）或 `VM.Standard.E2.1.Micro`，镜像选 **Ubuntu 22.04 / 24.04**。
2. **把公网 IP 设为「保留 / Reserved」**（默认是临时 Ephemeral，重启可能变；微信白名单要固定 IP，这步必须做）。
3. 用 SSH 登入（Oracle 默认用户名 `ubuntu`，密钥在创建时下载）。

**登入后一条命令完成配置：**
```bash
git clone https://github.com/<你的账号>/china-auto-daily.git
cd china-auto-daily
bash server/setup_server.sh
```
脚本会：装 git/python3/requests → 生成 `server/.env` 模板 → 写好每天 06:20 的 cron → 打印这台机的公网 IP。

**然后手动两步（脚本结尾也会提示）：**
```bash
# ① 填凭证
nano server/.env          # 填入 WX_APPID / WX_APPSECRET
# ② 把脚本打印出来的公网 IP 加进公众号后台白名单
#    mp.weixin.qq.com → 设置与开发 → 基本配置 → IP白名单
# 然后手测一次（只建草稿）：
bash server/run.sh
```
看到「✅ 草稿已创建」即贯通；之后每早 06:20 自动建草稿。

> Oracle 默认只放行出站，本流程无需开任何入站端口。私钥仅放 `server/.env`（已被 .gitignore 忽略）。

默认**只创建草稿**，你在公众号后台预览确认后手动群发。  
确认稳定后，想全自动群发，把 `server/run.sh` 里的命令改成
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
| Mac 没 push | 检查 `mac/push.log`；确认 launchd 已 load、git 免密可用 |
| 当天没更新 | 检查 Cowork 定时任务是否成功写入 `content/` |
