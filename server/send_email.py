#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
通过 Resend 把当日日报发到邮箱。

读取：
  content/meta.json              标题/摘要/日期
  content/wechat-content.html    正文（内联样式，天生适合邮件客户端）

凭证/配置（从环境变量读，run_daily.sh 会 source server/.env）：
  RESEND_API_KEY   必填。resend.com → API Keys 创建
  EMAIL_TO         可选，默认 junbo.wei@tomtom.com
  EMAIL_FROM       可选，默认 onboarding@resend.dev
                   （免费账号未验证域名时只能用该地址，且只能发给
                     Resend 注册邮箱本人；验证自有域名后可改成
                     briefing@你的域名 并发给任何人）

依赖：pip install requests
用法：python3 server/send_email.py [--dry-run]
"""
import json, os, sys, argparse

try:
    import requests
except ImportError:
    sys.exit("缺少依赖：pip install requests")

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CONTENT = os.path.join(ROOT, "content")

API_URL = "https://api.resend.com/emails"
DEFAULT_TO = "junbo.wei@tomtom.com"
DEFAULT_FROM = "onboarding@resend.dev"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="只组装邮件不真正发送")
    a = ap.parse_args()

    meta_path = os.path.join(CONTENT, "meta.json")
    if not os.path.isfile(meta_path):
        sys.exit(f"缺少 {meta_path}")
    with open(meta_path, encoding="utf-8") as f:
        meta = json.load(f)

    content_path = os.path.join(CONTENT, meta.get("content_file", "wechat-content.html"))
    if not os.path.isfile(content_path):
        sys.exit(f"缺少 {content_path}")
    with open(content_path, encoding="utf-8") as f:
        body_html = f.read()

    # EMAIL_TO 支持逗号分隔多个收件人（发非注册邮箱需先在 Resend 验证自有域名）
    to_list = [x.strip() for x in os.environ.get("EMAIL_TO", DEFAULT_TO).split(",") if x.strip()]
    from_addr = os.environ.get("EMAIL_FROM", DEFAULT_FROM)
    subject = meta.get("title", f"中国车企出海日报 {meta.get('date', '')}")

    # 邮件外壳：很多客户端（尤其 Outlook）会忽略 <section>/max-width 样式，
    # 导致正文铺满全屏。这里用邮件安全的表格布局锁宽 640px，
    # 并把 <section> 换成 <div>（部分客户端会剥掉 section 标签）。
    digest = meta.get("digest", "")
    date_str = meta.get("date", "")
    body_div = (body_html.replace("<section", "<div")
                          .replace("</section>", "</div>"))
    html = f"""<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eceef1;">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:640px;max-width:640px;">
    <tr><td style="padding:0 4px 10px;font-family:-apple-system,'Segoe UI','PingFang SC',sans-serif;">
      <span style="font-size:13px;color:#6b7280;">{date_str} · 每日 06:20 自动送达</span>
    </td></tr>
    <tr><td style="background-color:#ffffff;border-radius:10px;padding:20px 22px;">
      <p style="margin:0 0 16px;padding:12px 14px;background-color:#f9fafb;border-left:3px solid #dc2626;font-family:-apple-system,'Segoe UI','PingFang SC',sans-serif;font-size:14px;line-height:1.7;color:#374151;">{digest}</p>
      {body_div}
    </td></tr>
    <tr><td align="center" style="padding:14px 4px 0;font-family:-apple-system,'Segoe UI','PingFang SC',sans-serif;font-size:12px;color:#9ca3af;">
      由每日简报流水线自动发送 · 公众号「波波哥的小酒馆」
    </td></tr>
  </table>
</td></tr></table>"""

    payload = {"from": f"中国车企出海日报 <{from_addr}>",
               "to": to_list, "subject": subject, "html": html}

    if a.dry_run:
        print(f"[dry-run] to={','.join(to_list)} from={from_addr}")
        print(f"[dry-run] subject={subject}")
        print(f"[dry-run] html 长度={len(html)} 字符，未发送。")
        return

    api_key = os.environ.get("RESEND_API_KEY")
    if not api_key or "在这里填" in api_key:
        sys.exit("未设置 RESEND_API_KEY（请写进 server/.env；resend.com → API Keys 创建）")

    r = requests.post(API_URL, timeout=30,
                      headers={"Authorization": f"Bearer {api_key}",
                               "Content-Type": "application/json"},
                      data=json.dumps(payload))
    try:
        data = r.json()
    except ValueError:
        data = {"raw": r.text}
    if r.status_code // 100 == 2 and data.get("id"):
        print(f"✅ 邮件已发送 → {','.join(to_list)}  (id={data['id']})")
    else:
        sys.exit(f"✗ 发送失败 HTTP {r.status_code}: {data}\n"
                 "  常见原因：403→免费账号只能发给 Resend 注册邮箱本人（需验证域名后才能发任意收件人）；"
                 "401→API key 错误。")


if __name__ == "__main__":
    main()
