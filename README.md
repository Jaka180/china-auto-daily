# 中国车企出海日报 · 自动发布流水线

每天早上自动：**搜索 → 生成日报 + 封面 → 推到 GitHub → 服务器拉取 → 发布到公众号「波波哥的小酒馆」**。

## 为什么是这条链路

Cowork（生成日报的环境）出于安全限制**无法直接访问外网**——连不上微信 API、GitHub、也连不上你的服务器。它唯一的对外出口是**写文件到本机这个文件夹**。所以：

```
① Cowork 定时任务 06:00（自动）
   搜索 → 生成 content/wechat-content.html + content/cover.jpg + content/meta.json
   （同时更新 Cowork 仪表板 artifact）
        │  ← 写入本文件夹，沙盒唯一出口
        ▼
② 你的 Mac · launchd 06:15（自动）
   mac/push.sh → git commit & push 到 GitHub
        ▼
③ GitHub 仓库（内容 + 每日版本历史）
        ▼
④ 你的服务器 · cron 06:20（自动，固定IP已加公众号白名单）
   server/run.sh → git pull → server/wechat_publish.py → 公众号草稿
```

> **关键**：调用微信接口的机器，其公网 IP 必须在公众号后台
> 「设置与开发 → 基本配置 → IP白名单」里，否则换 token 报 `errcode 40164`。
> 服务器固定 IP 正是为此——这也是用服务器而非 Mac 直发的主要理由。

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
│   ├── wechat_publish.py     服务器发布脚本
│   ├── run.sh                服务器 cron 入口（git pull + 发布）
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

### B. Mac 定时中继（launchd）

```bash
cp ~/Documents/每日简报/mac/com.bobo.chinaauto.push.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.bobo.chinaauto.push.plist
# 立即测试一次：
launchctl start com.bobo.chinaauto.push
tail -f ~/Documents/每日简报/mac/push.log
```
> Mac 06:15 若处于关机/睡眠会错过；如需更稳可改用唤醒计划，或干脆把中继也放服务器。

### C. 服务器发布

```bash
# 1) 克隆仓库
git clone git@github.com:<你的账号>/china-auto-daily.git
cd china-auto-daily

# 2) 依赖
python3 -m pip install -r server/requirements.txt

# 3) 凭证（二选一）
#    方式① 环境变量写进 server/.env（已被 .gitignore 忽略）
printf 'WX_APPID=你的AppID\nWX_APPSECRET=你的AppSecret\n' > server/.env
#    方式② 复制 config.example.json 为 config.json 填入

# 4) 把【这台服务器的公网IP】加进公众号后台 IP白名单

# 5) 手测一次（只建草稿）
bash server/run.sh

# 6) 加 cron 每天 06:20
crontab -e
# 追加：
20 6 * * * /绝对路径/china-auto-daily/server/run.sh >> /绝对路径/china-auto-daily/server/publish.log 2>&1
```

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
