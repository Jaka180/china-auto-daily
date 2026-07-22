#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
通过 Resend 自动发送「中国车企出海日报」。

优先路径（Newsletter 正式用法）：
  - 读取网站仓库 articles/<date>-china-auto-daily.json
  - 调 Resend Broadcast API 发给 RESEND_SEGMENT_ID
  - Resend 负责群发队列与退订链接

兜底路径（内部测试/未配置 Segment）：
  - 读取 content/meta.json + content/wechat-content.html
  - 调 Resend emails API 发给 EMAIL_TO

凭证/配置（从环境变量读，run_daily.sh 会 source server/.env）：
  RESEND_API_KEY     必填。resend.com -> API Keys 创建
  RESEND_SEGMENT_ID  推荐。Contacts -> Segments -> China Auto Overseas Daily
  EMAIL_FROM         推荐使用已验证域名，如 daily@topchinacar.com
  EMAIL_TO           兜底直发收件人，逗号分隔；无 Segment 时才使用
  SITE_REPO_DIR      网站仓库路径，默认 ~/tochinacar

依赖：pip install requests
用法：python3 server/send_email.py [--dry-run]
"""
import argparse
import datetime
import html as html_lib
import json
import os
import re
import sys

try:
    import requests
except ImportError:
    sys.exit("缺少依赖：pip install requests")

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CONTENT = os.path.join(ROOT, "content")
SITE = "https://www.topchinacar.com"

EMAIL_API_URL = "https://api.resend.com/emails"
BROADCAST_API_URL = "https://api.resend.com/broadcasts"
DEFAULT_TO = "jackwee020@gmail.com"
DEFAULT_FROM = "onboarding@resend.dev"


def read_json(path, default=None):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def strip_tags(s):
    s = re.sub(r"<script\b[^>]*>.*?</script>", " ", s or "", flags=re.I | re.S)
    s = re.sub(r"<style\b[^>]*>.*?</style>", " ", s, flags=re.I | re.S)
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def load_meta():
    meta_path = os.path.join(CONTENT, "meta.json")
    meta = read_json(meta_path)
    if not meta:
        sys.exit(f"缺少 {meta_path}")
    return meta


def load_body_html(meta):
    content_path = os.path.join(CONTENT, meta.get("content_file", "wechat-content.html"))
    if not os.path.isfile(content_path):
        sys.exit(f"缺少 {content_path}")
    with open(content_path, encoding="utf-8") as f:
        return f.read()


def site_repo_candidates():
    configured = os.path.expanduser(os.environ.get("SITE_REPO_DIR", "~/tochinacar"))
    return [
        configured,
        os.path.join(ROOT, "topchinacar-site"),
    ]


def load_site_article(date_str):
    filename = f"{date_str}-china-auto-daily.json"
    for repo in site_repo_candidates():
        path = os.path.join(repo, "articles", filename)
        article = read_json(path)
        if article and article.get("slug"):
            return article
    return None


def safe_html_fragment(s):
    return str(s or "").replace("<section", "<div").replace("</section>", "</div>")


def link_button(label, href):
    return (
        f'<a href="{html_lib.escape(href, quote=True)}" '
        'style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;'
        'font-family:-apple-system,Segoe UI,Arial,sans-serif;font-size:13px;font-weight:700;'
        'letter-spacing:.08em;text-transform:uppercase;padding:12px 16px;border-radius:4px;">'
        f"{html_lib.escape(label)}</a>"
    )


def build_article_email(article, meta, fallback_html, include_unsubscribe):
    date_str = article.get("date") or meta.get("date") or ""
    slug = article.get("slug") or f"{date_str}-china-auto-daily"
    en_url = f"{SITE}/news/{slug}"
    zh_url = f"{SITE}/zh/news/{slug}"
    title_en = article.get("title_en") or f"China Auto Overseas Daily | {date_str}"
    title_zh = article.get("title_zh") or meta.get("title") or "中国车企出海日报"
    excerpt_en = article.get("excerpt_en") or ""
    excerpt_zh = article.get("excerpt_zh") or meta.get("digest") or ""
    html_en = safe_html_fragment(article.get("html_en"))
    html_zh = safe_html_fragment(article.get("html_zh"))
    if not html_en and not html_zh:
        html_zh = safe_html_fragment(fallback_html)

    unsubscribe = ""
    if include_unsubscribe:
        unsubscribe = (
            '<p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#9ca3af;">'
            'You are receiving this because you subscribed to China Auto Overseas Daily. '
            'Unsubscribe here: <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" '
            'style="color:#6b7280;">{{{RESEND_UNSUBSCRIBE_URL}}}</a></p>'
        )

    return f"""<!doctype html>
<html>
<body style="margin:0;background:#f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="680" cellpadding="0" cellspacing="0" border="0" style="width:680px;max-width:100%;background:#ffffff;border:1px solid #e5e7eb;">
        <tr><td style="padding:22px 24px 18px;background:#111827;border-bottom:4px solid #dc2626;">
          <div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#fca5a5;">China Auto Overseas Daily</div>
          <h1 style="font-family:Georgia,serif;font-size:26px;line-height:1.24;margin:10px 0 8px;color:#fff;">{html_lib.escape(title_en)}</h1>
          <p style="font-family:-apple-system,Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.65;margin:0;color:#d1d5db;">{html_lib.escape(title_zh)}</p>
          <p style="font-family:-apple-system,Segoe UI,Arial,sans-serif;font-size:12px;margin:12px 0 0;color:#9ca3af;">{html_lib.escape(date_str)} · Daily dispatch</p>
        </td></tr>
        <tr><td style="padding:22px 24px;font-family:-apple-system,Segoe UI,Arial,sans-serif;color:#1f2937;">
          <p style="margin:0 0 10px;font-size:15px;line-height:1.7;"><strong>EN</strong> · {html_lib.escape(excerpt_en)}</p>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.7;"><strong>中文</strong> · {html_lib.escape(excerpt_zh)}</p>
          <p style="margin:0 0 28px;">{link_button("Read English", en_url)} <span style="display:inline-block;width:8px;"></span>{link_button("阅读中文", zh_url)}</p>
          <div style="border-top:1px solid #e5e7eb;padding-top:22px;">
            <h2 style="font-family:Georgia,serif;font-size:20px;margin:0 0 12px;color:#111827;">English Briefing</h2>
            <div style="font-size:15px;line-height:1.75;color:#374151;">{html_en}</div>
          </div>
          <div style="border-top:1px solid #e5e7eb;margin-top:26px;padding-top:22px;">
            <h2 style="font-family:Georgia,serif;font-size:20px;margin:0 0 12px;color:#111827;">中文简报</h2>
            <div style="font-size:15px;line-height:1.85;color:#374151;">{html_zh}</div>
          </div>
          {unsubscribe}
        </td></tr>
        <tr><td align="center" style="padding:16px 24px;background:#f9fafb;font-family:-apple-system,Segoe UI,Arial,sans-serif;font-size:12px;color:#9ca3af;">
          TopChinaCar · Chinese auto intelligence for global markets
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def build_legacy_email(meta, body_html, include_unsubscribe):
    digest = meta.get("digest", "")
    date_str = meta.get("date", "")
    body_div = safe_html_fragment(body_html)
    unsubscribe = ""
    if include_unsubscribe:
        unsubscribe = (
            '<p style="margin:18px 0 0;font-family:-apple-system,Segoe UI,Arial,sans-serif;'
            'font-size:12px;line-height:1.6;color:#9ca3af;">Unsubscribe: '
            '<a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#6b7280;">'
            '{{{RESEND_UNSUBSCRIBE_URL}}}</a></p>'
        )
    return f"""<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eceef1;">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:640px;max-width:640px;">
    <tr><td style="padding:0 4px 10px;font-family:-apple-system,'Segoe UI','PingFang SC',sans-serif;">
      <span style="font-size:13px;color:#6b7280;">{html_lib.escape(date_str)} · 每日 06:20 自动送达</span>
    </td></tr>
    <tr><td style="background-color:#ffffff;border-radius:10px;padding:20px 22px;">
      <p style="margin:0 0 16px;padding:12px 14px;background-color:#f9fafb;border-left:3px solid #dc2626;font-family:-apple-system,'Segoe UI','PingFang SC',sans-serif;font-size:14px;line-height:1.7;color:#374151;">{html_lib.escape(digest)}</p>
      {body_div}
      {unsubscribe}
    </td></tr>
    <tr><td align="center" style="padding:14px 4px 0;font-family:-apple-system,'Segoe UI','PingFang SC',sans-serif;font-size:12px;color:#9ca3af;">
      TopChinaCar · China Auto Overseas Daily
    </td></tr>
  </table>
</td></tr></table>"""


def post_json(url, api_key, payload):
    r = requests.post(
        url,
        timeout=30,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        data=json.dumps(payload),
    )
    try:
        data = r.json()
    except ValueError:
        data = {"raw": r.text}
    return r, data


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="只组装邮件不真正发送")
    a = ap.parse_args()

    meta = load_meta()
    body_html = load_body_html(meta)
    date_str = meta.get("date") or datetime.date.today().isoformat()
    article = load_site_article(date_str)
    segment_id = os.environ.get("RESEND_SEGMENT_ID", "").strip()
    from_addr = os.environ.get("EMAIL_FROM", DEFAULT_FROM).strip()
    subject = (
        (article or {}).get("title_en")
        or meta.get("title")
        or f"China Auto Overseas Daily | {date_str}"
    )
    subject_prefix = os.environ.get("EMAIL_SUBJECT_PREFIX", "").strip()
    if subject_prefix:
        subject = f"{subject_prefix} {subject}"
    html = (
        build_article_email(article, meta, body_html, include_unsubscribe=bool(segment_id))
        if article
        else build_legacy_email(meta, body_html, include_unsubscribe=bool(segment_id))
    )

    if a.dry_run:
        mode = "broadcast" if segment_id else "direct"
        print(f"[dry-run] mode={mode} from={from_addr}")
        if segment_id:
            print(f"[dry-run] segment_id={segment_id}")
        else:
            to_list = [x.strip() for x in os.environ.get("EMAIL_TO", DEFAULT_TO).split(",") if x.strip()]
            print(f"[dry-run] to={','.join(to_list)}")
        print(f"[dry-run] subject={subject}")
        print(f"[dry-run] article={(article or {}).get('slug', 'none')}")
        print(f"[dry-run] html 长度={len(html)} 字符，未发送。")
        return

    api_key = os.environ.get("RESEND_API_KEY")
    if not api_key or "在这里填" in api_key:
        sys.exit("未设置 RESEND_API_KEY（请写进 server/.env；resend.com -> API Keys 创建）")

    if segment_id:
        payload = {
            "segment_id": segment_id,
            "from": f"China Auto Overseas Daily <{from_addr}>",
            "subject": subject,
            "html": html,
            "send": True,
        }
        r, data = post_json(BROADCAST_API_URL, api_key, payload)
        if r.status_code // 100 == 2 and data.get("id"):
            print(f"✅ Resend Broadcast 已创建并发送到 segment {segment_id} (id={data['id']})")
            return
        sys.exit(f"✗ Broadcast 发送失败 HTTP {r.status_code}: {data}")

    to_list = [x.strip() for x in os.environ.get("EMAIL_TO", DEFAULT_TO).split(",") if x.strip()]
    payload = {
        "from": f"China Auto Overseas Daily <{from_addr}>",
        "to": to_list,
        "subject": subject,
        "html": html,
    }
    r, data = post_json(EMAIL_API_URL, api_key, payload)
    if r.status_code // 100 == 2 and data.get("id"):
        print(f"✅ 邮件已发送 -> {','.join(to_list)} (id={data['id']})")
        return
    sys.exit(
        f"✗ 发送失败 HTTP {r.status_code}: {data}\n"
        "  常见原因：403 -> 免费账号只能发给 Resend 注册邮箱本人或需要验证域名；"
        "401 -> API key 错误。"
    )


if __name__ == "__main__":
    main()
