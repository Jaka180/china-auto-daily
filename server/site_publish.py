#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把当日日报转成一篇英文编辑文章，发布到 topchinacar.com（Cloudflare Pages）。

流程：
  1. 读 content/meta.json + content/wechat-content.html（当日日报）
  2. 调 Claude API 生成文章 JSON：
     - 双语标题/摘要/正文（英文为主，编辑口吻，非日报罗列）
     - events[] 结构化数据（公司/品牌/市场/动作/来源）——为将来的数据产品积累
  3. 写入网站仓库 articles/<日期>-daily.json
  4. node build.js 重新生成静态页 → git commit + push → Cloudflare 自动部署

凭证/配置（环境变量，run_daily.sh 会 source server/.env）：
  ANTHROPIC_API_KEY   必填（与 generate.py 共用）
  ANTHROPIC_MODEL     可选，默认 claude-sonnet-4-6
  SITE_REPO_DIR       网站仓库本地路径，默认 ~/tochinacar；目录不存在则跳过不报错

首次配置（在 GCP VM 上，只做一次）：
  1) GitHub 网站仓库 Settings → Deploy keys → 添加 VM 的公钥（勾选 Allow write access）
     公钥生成：ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""
  2) git clone git@github.com:Jaka180/tochinacar.git ~/tochinacar
  3) sudo apt install -y nodejs
  4) cd ~/tochinacar && git config user.name "briefing-bot" && git config user.email "bot@topchinacar.com"
"""
import json, os, re, subprocess, sys, datetime

try:
    import anthropic
except ImportError:
    sys.exit("缺少依赖：pip install anthropic")

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CONTENT = os.path.join(ROOT, "content")

SITE_REPO = os.path.expanduser(os.environ.get("SITE_REPO_DIR", "~/tochinacar"))
MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")
API_KEY = os.environ.get("ANTHROPIC_API_KEY")

if not os.path.isdir(SITE_REPO):
    print(f"[site] SITE_REPO_DIR 不存在（{SITE_REPO}），跳过网站发布。")
    sys.exit(0)
if not API_KEY:
    sys.exit("未设置 ANTHROPIC_API_KEY")

meta_path = os.path.join(CONTENT, "meta.json")
html_path = os.path.join(CONTENT, "wechat-content.html")
if not (os.path.isfile(meta_path) and os.path.isfile(html_path)):
    sys.exit("缺少当日 content/meta.json 或 wechat-content.html")

with open(meta_path, encoding="utf-8") as f:
    meta = json.load(f)
with open(html_path, encoding="utf-8") as f:
    briefing_html = f.read()

date = meta.get("date") or datetime.date.today().isoformat()
slug = f"{date}-china-auto-daily"

PROMPT = f"""You are the editor of TopChinaCar, an independent English-language publication covering Chinese automakers for overseas readers (executives, dealers, analysts, enthusiasts).

Below is today's ({date}) internal bilingual briefing on Chinese automakers' overseas moves. Turn it into ONE published article.

Requirements:
1. html_en: an English editorial article, NOT a bullet-dump. Structure: a 2-3 sentence lede on the day's biggest signal, then 3-6 short sections with <h2> headings grouping related news (e.g. by theme or company), each with specific numbers and inline source links preserved as <a href="...">[Source]</a>. End with a one-paragraph "What it means" analysis. Use only clean semantic HTML: <p>, <h2>, <ul>, <li>, <a>, <em>, <strong>. No inline styles, no <section>, no images.
2. html_zh: the same article in Chinese (same structure, faithful but natural).
3. title_en: headline, max 90 chars, specific (numbers/names), no clickbait. title_zh: Chinese headline.
4. excerpt_en / excerpt_zh: one-sentence summary with the key numbers, max 200 chars.
5. events: REQUIRED, non-negotiable. One structured record for EVERY distinct news item you covered in the article — an article with 6 sections should yield roughly 8-20 events. An empty array is only acceptable if the briefing itself contains zero news. Each record: {{"company": "<parent company EN>", "brand": "<brand EN or null>", "market": "<country/region EN or 'Global'>", "action": "<one of: sales_figures | plant | dealer_network | market_entry | product_launch | pricing | partnership | policy | other>", "summary_en": "<one sentence with numbers>", "source_url": "<url or null>"}}.
6. Only use facts from the briefing. Do not invent numbers or links. If the briefing is thin, a shorter article is fine — but events must still list whatever items exist.

Output EXACTLY this structure — five sections with these literal markers, no code fences, no commentary. The META and EVENTS sections are JSON; the HTML sections are raw HTML (NOT JSON-escaped):
===META===
{{"title_en": "...", "title_zh": "...", "excerpt_en": "...", "excerpt_zh": "..."}}
===HTML_EN===
<p>...</p>
===HTML_ZH===
<p>...</p>
===EVENTS===
[{{"company": "...", "brand": null, "market": "...", "action": "...", "summary_en": "...", "source_url": null}}]
===END===

Today's briefing:
{briefing_html}"""

print(f"[site] model={MODEL} 生成英文文章…")
client = anthropic.Anthropic(api_key=API_KEY)
resp = client.messages.create(
    model=MODEL, max_tokens=12000,
    messages=[{"role": "user", "content": PROMPT}],
)
text = "".join(b.text for b in resp.content if getattr(b, "type", None) == "text")
text = text.replace("```json", "").replace("```", "")

def between(s, a, b):
    i = s.find(a)
    j = s.find(b, i + len(a)) if i != -1 else -1
    return s[i + len(a):j].strip() if (i != -1 and j != -1) else None

meta_raw = between(text, "===META===", "===HTML_EN===")
html_en = between(text, "===HTML_EN===", "===HTML_ZH===")
html_zh = between(text, "===HTML_ZH===", "===EVENTS===")
events_raw = between(text, "===EVENTS===", "===END===")

if not (meta_raw and html_en):
    sys.exit("✗ 模型输出缺少 META 或 HTML_EN 分段")

try:
    meta_obj = json.loads(meta_raw, strict=False)
except Exception as e:
    sys.exit(f"✗ META JSON 解析失败：{e}")

events = []
if events_raw:
    try:
        events = json.loads(events_raw, strict=False)
    except Exception as e:
        sys.stderr.write(f"⚠️ events 解析失败（不阻塞发布）：{e}\n")

article = {
    "slug": slug, "date": date,
    "tag_en": "Daily Briefing", "tag_zh": "每日简报",
    "title_en": meta_obj.get("title_en", ""), "title_zh": meta_obj.get("title_zh", ""),
    "excerpt_en": meta_obj.get("excerpt_en", ""), "excerpt_zh": meta_obj.get("excerpt_zh", ""),
    "html_en": html_en, "html_zh": html_zh or html_en,
    "events": events if isinstance(events, list) else []
}
if not article["title_en"]:
    sys.exit("✗ 缺少 title_en")

out_dir = os.path.join(SITE_REPO, "articles")
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, f"{slug}.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(article, f, ensure_ascii=False, indent=2)
print(f"[site] 已写入 {out_path}（{len(article.get('events', []))} 条结构化事件）")


def run(cmd, **kw):
    r = subprocess.run(cmd, cwd=SITE_REPO, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        sys.exit(f"✗ {' '.join(cmd)} 失败：\n{r.stdout}\n{r.stderr}")
    return r.stdout


run(["git", "pull", "--ff-only"])
print("[site] node build.js …")
run(["node", "build.js"])
run(["git", "add", "-A"])
status = run(["git", "status", "--porcelain"])
if not status.strip():
    print("[site] 无变更，跳过 push。")
    sys.exit(0)
run(["git", "commit", "-m", f"Daily article {date}"])
run(["git", "push"])
print(f"[site] ✅ 已推送，Cloudflare Pages 将自动部署 → https://www.topchinacar.com/news/{slug}")
