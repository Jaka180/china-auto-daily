#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
周报生成 —— 汇总 archive/ 里最近7天的日报，调 Claude API（不联网）产出
「中国车企出海周报」，输出与日报同格式的 content/ 三件套，
后续封面/公众号/邮件流程全部复用。

退出码：0 成功；3 存档不足跳过（run_weekly.sh 据此静默退出）；其他为失败。
"""
import datetime, json, os, re, sys

try:
    import anthropic
except ImportError:
    sys.exit("缺少依赖：pip install anthropic")

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CONTENT = os.path.join(ROOT, "content")
ARCHIVE = os.path.join(ROOT, "archive")
os.makedirs(CONTENT, exist_ok=True)

MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")
API_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not API_KEY:
    sys.exit("未设置 ANTHROPIC_API_KEY")

today = datetime.date.today()
days = [today - datetime.timedelta(days=i) for i in range(6, -1, -1)]

chunks = []
for d in days:
    p = os.path.join(ARCHIVE, f"{d}.html")
    if not os.path.isfile(p):
        continue
    with open(p, encoding="utf-8") as f:
        raw = f.read()
    text = re.sub(r"<[^>]+>", " ", raw)
    text = re.sub(r"\s+", " ", text).strip()[:12000]
    chunks.append(f"【{d} 日报】\n{text}")

if len(chunks) < 3:
    print(f"[weekly] 存档不足（仅{len(chunks)}天），跳过本周周报。")
    sys.exit(3)

range_cn = f"{days[0].month}月{days[0].day}日–{days[-1].month}月{days[-1].day}日"
daily_texts = "\n\n".join(chunks)

PROMPT = f"""你是中国车企出海行业分析师。下面是过去一周（{range_cn}）每天的「中国车企出海日报」全文，请汇总提炼成一期中英双语「中国车企出海周报」的公众号图文正文。只依据给定材料，不要编造材料之外的事实与数字。

## 输出内容结构
1) Executive Summary 本周大势：中文段在上、英文段在下，各讲本周3条最大主线（含具体事件+数字）。
2) WEEK IN NUMBERS 本周关键数字：5-8条最有冲击力的数字 bullet（▸开头，注明公司）。
3) COMPANY ROUNDUP 公司周报：按本周重要性排序，有动态的公司各一块，含 公司中文名+英文名、本周动态汇总（▸开头bullet）、Weekly Read（斜体，本周对该公司意味着什么）。整周无动态的公司不列。
4) WEEKLY THEMES 本周主题：2-3个跨公司趋势，编号①②③。
5) NEXT WEEK WATCHLIST 下周关注：3-5条值得盯的事（已预告的发布会、交付节点、政策等，仅限材料中出现过的线索）。

## 严格的 HTML 排版要求（公众号会剥离<head>/<style>，不支持flex与::before）
- 用 <section> 与 <p>/<span>，所有样式写成元素内联 style 属性，禁止 <style> 标签、禁止 flex、禁止 ::before。
- 配色：深灰 #111827、红 #dc2626、正文 #374151、次要 #9ca3af、浅底 #f9fafb。
- 顶部 header 用深色块(背景#111827，红色底边)放标题「中国车企出海周报 / China Auto Overseas Weekly」、日期范围「{range_cn} · 周报版」。
- bullet 用字面 "▸"(红色 span)开头；Weekly Read 用左红边框浅底方块(border-left:3px solid #dc2626; background:#f9fafb; font-style:italic)。
- 周报不需要来源链接。
- 整个正文包在一个 <section style="max-width:677px;margin:0 auto;font-family:-apple-system,'PingFang SC',sans-serif;color:#1c1c1e;font-size:15px;line-height:1.8;"> 里。

## 输出格式（严格，便于程序解析）
只输出下面这个结构，不要任何额外说明、不要 markdown 代码围栏：
===META===
{{"title": "中国车企出海周报 | {range_cn}：<本周最大主线一句话>", "digest": "<一句话摘要含关键数字，<=110字>"}}
===HTML===
<section ...>...完整正文...</section>
===END===
title 不超过64字，digest 不超过110字。

## 本周日报材料
{daily_texts}"""

client = anthropic.Anthropic(api_key=API_KEY)
print(f"[weekly] model={MODEL} range={range_cn} 汇总{len(chunks)}天日报，调用 Claude API …")
resp = client.messages.create(
    model=MODEL,
    max_tokens=16000,
    messages=[{"role": "user", "content": PROMPT}],
)

text = "".join(b.text for b in resp.content if getattr(b, "type", None) == "text")
if not text.strip():
    sys.exit("模型未返回文本内容。")
text = text.replace("```html", "").replace("```json", "").replace("```", "")


def between(s, a, b):
    i = s.find(a)
    j = s.find(b, i + len(a)) if i != -1 else -1
    return s[i + len(a):j].strip() if (i != -1 and j != -1) else None


meta = None
meta_raw = between(text, "===META===", "===HTML===")
if meta_raw:
    try:
        meta = json.loads(meta_raw)
    except Exception:
        meta = None
if meta is None:
    mobj = re.search(r"\{[^{}]*\"title\"[^{}]*\}", text, re.S)
    if mobj:
        try:
            meta = json.loads(mobj.group(0))
        except Exception:
            meta = None
if meta is None:
    sys.stderr.write("⚠️ meta 解析失败，使用默认标题。\n")
    meta = {"title": f"中国车企出海周报 | {range_cn}", "digest": "16家中国车企一周出海动态汇总"}

si = text.find("<section")
se = text.rfind("</section>")
if si != -1 and se != -1:
    html = text[si:se + len("</section>")]
else:
    after = text.split("===HTML===", 1)
    html = after[1].split("===END===", 1)[0].strip() if len(after) > 1 else text
    sys.stderr.write("⚠️ 未找到 <section> 标签，使用退化解析。\n")

meta.update({"author": meta.get("author", "波波哥"), "date": str(today),
             "content_file": "wechat-content.html", "cover_file": "cover.jpg"})

with open(os.path.join(CONTENT, "wechat-content.html"), "w", encoding="utf-8") as f:
    f.write(html)
with open(os.path.join(CONTENT, "meta.json"), "w", encoding="utf-8") as f:
    json.dump(meta, f, ensure_ascii=False, indent=2)
with open(os.path.join(CONTENT, "briefing.html"), "w", encoding="utf-8") as f:
    f.write(f"<!DOCTYPE html><html lang=zh-CN><head><meta charset=UTF-8>"
            f"<meta name=viewport content='width=device-width,initial-scale=1'>"
            f"<title>{meta['title']}</title></head><body style='background:#eceef1;margin:0;padding:16px;'>{html}</body></html>")

print(f"[weekly] 完成：{meta['title']}")
