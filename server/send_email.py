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

    to_addr = os.environ.get("EMAIL_TO", DEFAULT_TO)
    from_addr = os.environ.get("EMAIL_FROM", DEFAULT_FROM)
    subject = meta.get("title", f"中国车企出海日报 {meta.get('date', '')}")

    # 邮件外壳：浅灰背景 + 摘要头，正文沿用公众号内联样式版
    digest = meta.get("digest", "")
    html = (
        "<div style='background:#eceef1;margin:0;padding:16px;'>"
        f"<p style='max-width:677px;margin:0 auto 12px;font-family:-apple-system,sans-serif;"
        f"font-size:13px;color:#6b7280;'>{digest}</p>"
        f"{body_html}"
        "<p style='max-width:677px;margin:12px auto 0;font-family:-apple-system,sans-serif;"
        "font-size:12px;color:#9ca3af;'>由每日简报流水线自动发送 · 公众号「波波哥的小酒馆」</p>"
        "</div>"
    )

    payload = {"from": f"中国车企出海日报 <{from_addr}>",
               "to": [to_addr], "subject": subject, "html": html}

    if a.dry_run:
        print(f"[dry-run] to={to_addr} from={from_addr}")
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
        print(f"✅ 邮件已发送 → {to_addr}  (id={data['id']})")
    else:
        sys.exit(f"✗ 发送失败 HTTP {r.status_code}: {data}\n"
                 "  常见原因：403→免费账号只能发给 Resend 注册邮箱本人（需验证域名后才能发任意收件人）；"
                 "401→API key 错误。")


if __name__ == "__main__":
    main()
