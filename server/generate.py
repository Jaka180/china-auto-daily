#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
服务器端日报生成 —— 用 Anthropic Claude API(带联网搜索)自动搜索中国车企出海动态并写稿。
产出：
  content/wechat-content.html   公众号版正文（元素内联样式）
  content/meta.json             标题/作者/摘要/日期
  content/briefing.html         完整网页版备份

凭证/配置（从环境变量读，run_daily.sh 会 source server/.env）：
  ANTHROPIC_API_KEY   必填
  ANTHROPIC_MODEL     可选，默认 claude-sonnet-4-6

依赖：pip install anthropic
"""
import json, os, re, sys, datetime

try:
    import anthropic
except ImportError:
    sys.exit("缺少依赖：pip install anthropic")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content")
os.makedirs(CONTENT, exist_ok=True)

MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")
API_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not API_KEY:
    sys.exit("未设置 ANTHROPIC_API_KEY（请写进 server/.env）")

# 北京时间日期
today = datetime.datetime.now().strftime("%Y-%m-%d")
y, m, d = today.split("-")
date_cn = f"{int(y)}年{int(m)}月{int(d)}日"

PROMPT = f"""你是中国车企出海行业分析师。今天是 {date_cn}。请用联网搜索（web_search）查询过去24-48小时内、以下14家中国车企/品牌的最新出海动态，然后产出一份中英双语「中国车企出海日报」的公众号图文正文。

## 覆盖公司
传统OEM：比亚迪BYD（含腾势Denza）、上汽SAIC（含MG）、奇瑞Chery（含OMODA/Jaecoo）、长安Changan（含深蓝Deepal/阿维塔Avatr）、长城GWM（含Haval/Tank）、东风Dongfeng（含岚图Voyah）、广汽GAC（含埃安Aion）、北汽BAIC
新势力：蔚来NIO（含Firefly）、理想Li Auto、小鹏XPeng、零跑Leapmotor、小米汽车Xiaomi
华为汽车：鸿蒙智行（问界AITO/智界Luxeed/享界/尊界/尚界）

每家用关键词如 "[公司] overseas export 2026"、"[公司] 海外 工厂 经销商 {int(m)}月 2026" 搜索。重点：海外销量数字、经销商合作、海外设厂、新市场进入、战略调整。优先最近24-48小时；无动态的公司不要编造。

## 输出内容结构
1) Executive Summary 摘要：中文段在上、英文段在下，各讲今日3个最大信号（含具体事件+数字）。
2) TODAY'S MOVERS 今日重点：按重要性排序，有动态的公司各一块，含 公司编号+中文名+英文名、子品牌(如有)、Key Moves(▸开头bullet，含数字与来源链接)、Strategic Read(斜体洞察，讲战略意义与风险)。
3) TODAY'S QUIET 今日无显著动态：列出当日无重要海外新闻的公司及简短背景。
4) CROSS-CUTTING THEMES 跨公司趋势：2-3个，编号①②③。

## 严格的 HTML 排版要求（公众号会剥离<head>/<style>，不支持flex与::before）
- 用 <section> 与 <p>/<span>，所有样式写成元素内联 style 属性，禁止 <style> 标签、禁止 flex、禁止 ::before。
- 配色：深灰 #111827、红 #dc2626、正文 #374151、次要 #9ca3af、链接 #3b82f6、浅底 #f9fafb。
- 顶部 header 用深色块(背景#111827，红色底边)放标题「中国车企出海日报 / China Auto Overseas Briefing」、日期「{date_cn} · 早间版」、三组公司名单。
- bullet 用字面 "▸"(红色 span)开头；摘要的"中文"/"EN"标签用字面文字写进段首。
- Strategic Read 用左红边框浅底方块(border-left:3px solid #dc2626; background:#f9fafb; font-style:italic)。
- 来源链接用 <a href="URL" style="color:#3b82f6;font-size:12px;text-decoration:none;">[来源名]</a> 内联。
- 整个正文包在一个 <section style="max-width:677px;margin:0 auto;font-family:-apple-system,'PingFang SC',sans-serif;color:#1c1c1e;font-size:15px;line-height:1.8;"> 里。

## 输出格式（严格，便于程序解析）
只输出下面这个结构，不要任何额外说明、不要 markdown 代码围栏：
===META===
{{"title": "中国车企出海日报 | {date_cn}：<今日1-2个最大信号一句话>", "digest": "<一句话摘要含关键数字，<=110字>"}}
===HTML===
<section ...>...完整公众号正文...</section>
===END===
title 不超过64字，digest 不超过110字。"""

client = anthropic.Anthropic(api_key=API_KEY)

print(f"[generate] model={MODEL} date={today} 调用 Claude API（联网搜索中，可能需要1-3分钟）…")
resp = client.messages.create(
    model=MODEL,
    max_tokens=16000,
    messages=[{"role": "user", "content": PROMPT}],
    tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 24}],
)

# 拼接最终文本块
text = "".join(b.text for b in resp.content if getattr(b, "type", None) == "text")
if not text.strip():
    sys.exit("模型未返回文本内容，请检查模型名/额度。")

# 去掉可能的 markdown 围栏
text = text.replace("```html", "").replace("```json", "").replace("```", "")

def between(s, a, b):
    i = s.find(a)
    j = s.find(b, i + len(a)) if i != -1 else -1
    return s[i + len(a):j].strip() if (i != -1 and j != -1) else None

# meta：优先标记内的 JSON
meta = None
meta_raw = between(text, "===META===", "===HTML===")
if meta_raw:
    try:
        meta = json.loads(meta_raw)
    except Exception:
        meta = None
if meta is None:
    # 兜底：从全文里抓第一个 {...} 试解析
    mobj = re.search(r"\{[^{}]*\"title\"[^{}]*\}", text, re.S)
    if mobj:
        try:
            meta = json.loads(mobj.group(0))
        except Exception:
            meta = None
if meta is None:
    sys.stderr.write("⚠️ meta 解析失败，使用默认标题。\n")
    meta = {"title": f"中国车企出海日报 | {date_cn}", "digest": "14家中国车企海外动态日报"}

# html：不依赖结尾标记，直接截取 <section>...</section>（最稳）
si = text.find("<section")
se = text.rfind("</section>")
if si != -1 and se != -1:
    html = text[si:se + len("</section>")]
else:
    # 退而求其次：取 ===HTML=== 之后的内容
    after = text.split("===HTML===", 1)
    html = after[1].split("===END===", 1)[0].strip() if len(after) > 1 else text
    sys.stderr.write("⚠️ 未找到 <section> 标签，使用退化解析。\n")

meta.update({"author": meta.get("author", "波波哥"), "date": today,
             "content_file": "wechat-content.html", "cover_file": "cover.jpg"})

with open(os.path.join(CONTENT, "wechat-content.html"), "w", encoding="utf-8") as f:
    f.write(html)
with open(os.path.join(CONTENT, "meta.json"), "w", encoding="utf-8") as f:
    json.dump(meta, f, ensure_ascii=False, indent=2)
with open(os.path.join(CONTENT, "briefing.html"), "w", encoding="utf-8") as f:
    f.write(f"<!DOCTYPE html><html lang=zh-CN><head><meta charset=UTF-8>"
            f"<meta name=viewport content='width=device-width,initial-scale=1'>"
            f"<title>{meta['title']}</title></head><body style='background:#eceef1;margin:0;padding:16px;'>{html}</body></html>")

print(f"[generate] 完成：{meta['title']}")
print(f"[generate] 已写入 content/wechat-content.html ({len(html)} 字符) 与 meta.json")
