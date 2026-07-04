#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
流水线失败告警 —— 任何步骤失败时用 Resend 发一封告警邮件。
用法：python3 server/notify_failure.py --step "生成日报正文" [--log /tmp/xxx.log]
凭证从环境变量读（run_daily.sh / run_weekly.sh 已 source server/.env）。
"""
import argparse, datetime, html, json, os, sys

try:
    import requests
except ImportError:
    sys.exit("缺少依赖：pip install requests")

API_URL = "https://api.resend.com/emails"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--step", required=True, help="失败的步骤名")
    ap.add_argument("--log", default=None, help="包含该步骤输出的日志文件，取末尾80行")
    a = ap.parse_args()

    key = os.environ.get("RESEND_API_KEY")
    if not key:
        sys.exit("未设置 RESEND_API_KEY，无法发送告警")
    to = [x.strip() for x in os.environ.get("EMAIL_TO", "junbo.wei@tomtom.com").split(",") if x.strip()]
    frm = os.environ.get("EMAIL_FROM", "onboarding@resend.dev")

    tail = ""
    if a.log and os.path.isfile(a.log):
        with open(a.log, encoding="utf-8", errors="replace") as f:
            tail = "".join(f.readlines()[-80:])

    now = datetime.datetime.now()
    subject = f"⚠️ 日报流水线失败：{a.step} | {now:%Y-%m-%d}"
    body = (
        "<div style='font-family:-apple-system,sans-serif;max-width:640px;'>"
        f"<p><b>步骤「{html.escape(a.step)}」失败</b>（{now:%F %T}）。"
        "SSH 登录服务器查看 <code>server/publish.log</code> / <code>server/weekly.log</code>。</p>"
        f"<pre style='background:#f6f8fa;padding:12px;font-size:12px;line-height:1.5;"
        f"white-space:pre-wrap;border-radius:6px;'>{html.escape(tail) or '(无日志)'}</pre></div>"
    )

    r = requests.post(API_URL, timeout=30,
                      headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                      data=json.dumps({"from": f"日报流水线告警 <{frm}>", "to": to,
                                       "subject": subject, "html": body}))
    try:
        data = r.json()
    except ValueError:
        data = {"raw": r.text}
    if r.status_code // 100 == 2 and data.get("id"):
        print(f"⚠️→✉️ 告警邮件已发送 (id={data['id']})")
    else:
        sys.exit(f"告警邮件发送失败 HTTP {r.status_code}: {data}")


if __name__ == "__main__":
    main()
