#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
邮件发布脚本 —— 读取 content/ 下当日内容，通过 Resend API 发送 HTML 邮件。

读取：
  content/meta.json          标题/摘要/日期
  content/wechat-content.html 正文（已内联样式，邮件客户端同样兼容）
  content/cover.jpg          封面图（可选，取不到就不内联，不报错）

凭证/配置（从环境变量读，run_daily_email.sh 会 source server/.env）：
  RESEND_API_KEY   必填（resend.com 控制台创建）
  EMAIL_FROM       可选，默认 "China Auto Daily <onboarding@resend.dev>"
                   （未绑定自有域名时只能用 onboarding@resend.dev 发信）
  EMAIL_TO         可选，默认 junbo.wei@tomtom.com
                   （未绑定自有域名时，Resend 只允许发到注册账号自己的邮箱）

依赖：requests（见 server/requirements.txt）
"""
import base64, json, os, sys
try:
    import requests
except ImportError:
    sys.exit("缺少依赖：pip install requests")

API = "https://api.resend.com/emails"
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CONTENT = os.path.join(ROOT, "content")

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "China Auto Daily <onboarding@resend.dev>")
EMAIL_TO = os.environ.get("EMAIL_TO", "junbo.wei@tomtom.com")

if not RESEND_API_KEY:
    sys.exit("缺少环境变量：RESEND_API_KEY（请写进 server/.env 或 GitHub Actions secrets）")

meta_path = os.path.join(CONTENT, "meta.json")
html_path = os.path.join(CONTENT, "wechat-content.html")
cover_path = os.path.join(CONTENT, "cover.jpg")

if not os.path.isfile(meta_path) or not os.path.isfile(html_path):
    sys.exit("未找到 content/meta.json 或 content/wechat-content.html，请先运行 server/generate.py")

with open(meta_path, encoding="utf-8") as f:
    meta = json.load(f)
with open(html_path, encoding="utf-8") as f:
    body_html = f.read()

subject = meta.get("title", "中国车企出海日报")
has_cover = os.path.isfile(cover_path)
cover_tag = ('<p style="text-align:center;margin:0 0 16px;">'
             '<img src="cid:cover" style="max-width:100%;border-radius:8px;" alt="cover"></p>') if has_cover else ""

full_html = f"""<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"></head>
<body style="background:#eceef1;margin:0;padding:16px;">
{cover_tag}
{body_html}
</body></html>"""

payload = {
    "from": EMAIL_FROM,
    "to": [EMAIL_TO],
    "subject": subject,
    "html": full_html,
    "text": meta.get("digest", ""),
}

if has_cover:
    with open(cover_path, "rb") as f:
        cover_b64 = base64.b64encode(f.read()).decode("ascii")
    payload["attachments"] = [{
        "filename": "cover.jpg",
        "content": cover_b64,
        "content_id": "cover",
    }]

print(f"[send_email] 发送 “{subject}” 到 {EMAIL_TO} via Resend …")
try:
    r = requests.post(
        API,
        headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
        json=payload,
        timeout=30,
    )
except Exception as e:
    sys.exit(f"✗ 邮件发送失败（网络错误）：{e}")

if r.status_code >= 300:
    sys.exit(f"✗ 邮件发送失败：HTTP {r.status_code} {r.text}")

print(f"✅ 邮件已发送（id={r.json().get('id')}）")
