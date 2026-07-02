#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
邮件发布脚本 —— 读取 content/ 下当日内容，通过 SMTP 发送 HTML 邮件。

读取：
  content/meta.json          标题/摘要/日期
  content/wechat-content.html 正文（已内联样式，邮件客户端同样兼容）
  content/cover.jpg          封面图（可选，取不到就不内联，不报错）

凭证/配置（从环境变量读，run_daily_email.sh 会 source server/.env）：
  SMTP_HOST / SMTP_PORT(默认587) / SMTP_USER / SMTP_PASS   必填
  EMAIL_FROM   必填，发件人地址
  EMAIL_TO     可选，默认 junbo.wei@tomtom.com

依赖：仅标准库（smtplib / email）
"""
import json, os, sys, smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CONTENT = os.path.join(ROOT, "content")

SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASS = os.environ.get("SMTP_PASS")
EMAIL_FROM = os.environ.get("EMAIL_FROM")
EMAIL_TO = os.environ.get("EMAIL_TO", "junbo.wei@tomtom.com")

missing = [k for k, v in {
    "SMTP_HOST": SMTP_HOST, "SMTP_USER": SMTP_USER,
    "SMTP_PASS": SMTP_PASS, "EMAIL_FROM": EMAIL_FROM,
}.items() if not v]
if missing:
    sys.exit(f"缺少环境变量：{', '.join(missing)}（请写进 server/.env 或 GitHub Actions secrets）")

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

msg = MIMEMultipart("related")
msg["Subject"] = subject
msg["From"] = EMAIL_FROM
msg["To"] = EMAIL_TO

alt = MIMEMultipart("alternative")
alt.attach(MIMEText(meta.get("digest", ""), "plain", "utf-8"))
alt.attach(MIMEText(full_html, "html", "utf-8"))
msg.attach(alt)

if has_cover:
    with open(cover_path, "rb") as f:
        img = MIMEImage(f.read(), _subtype="jpeg")
    img.add_header("Content-ID", "<cover>")
    img.add_header("Content-Disposition", "inline", filename="cover.jpg")
    msg.attach(img)

print(f"[send_email] 发送 “{subject}” 到 {EMAIL_TO} via {SMTP_HOST}:{SMTP_PORT} …")
try:
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as s:
        s.starttls()
        s.login(SMTP_USER, SMTP_PASS)
        s.sendmail(EMAIL_FROM, [EMAIL_TO], msg.as_string())
except smtplib.SMTPAuthenticationError as e:
    sys.exit(f"✗ SMTP 认证失败，请检查 SMTP_USER/SMTP_PASS：{e}")
except Exception as e:
    sys.exit(f"✗ 邮件发送失败：{e}")

print("✅ 邮件已发送")
