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
    from zoneinfo import ZoneInfo
except ImportError:
    ZoneInfo = None

try:
    import anthropic
except ImportError:
    sys.exit("缺少依赖：pip install anthropic")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content")
os.makedirs(CONTENT, exist_ok=True)
HISTORY_FILE = os.path.join(CONTENT, "daily-history.json")

MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")
API_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not API_KEY:
    sys.exit("未设置 ANTHROPIC_API_KEY（请写进 server/.env）")

# 北京时间日期
now = datetime.datetime.now(ZoneInfo("Asia/Shanghai")) if ZoneInfo else datetime.datetime.now()
today = now.strftime("%Y-%m-%d")
today_date = now.date()
y, m, d = today.split("-")
date_cn = f"{int(y)}年{int(m)}月{int(d)}日"
fresh_cutoff = (today_date - datetime.timedelta(days=2)).isoformat()


def strip_tags(s):
    s = re.sub(r"<script\b[^>]*>.*?</script>", " ", s or "", flags=re.I | re.S)
    s = re.sub(r"<style\b[^>]*>.*?</style>", " ", s, flags=re.I | re.S)
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def shorten(s, limit=600):
    s = strip_tags(s)
    return s[:limit].rstrip() + ("..." if len(s) > limit else "")


def article_links(html, limit=12):
    seen = []
    for href, label in re.findall(r"<a\b[^>]*href=[\"']([^\"']+)[\"'][^>]*>(.*?)</a>", html or "", flags=re.I | re.S):
        label = shorten(label, 80) or href
        if href not in [x[0] for x in seen]:
            seen.append((href, label))
        if len(seen) >= limit:
            break
    return seen


def load_json(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def recent_history_block():
    """Build a compact anti-repeat context from previous generated outputs."""
    items = []

    # Yesterday's local briefing is still present before today's run overwrites content/.
    prev_meta = load_json(os.path.join(CONTENT, "meta.json"), None)
    prev_html_path = os.path.join(CONTENT, "wechat-content.html")
    if prev_meta and prev_meta.get("date") and prev_meta.get("date") != today and os.path.isfile(prev_html_path):
        try:
            with open(prev_html_path, encoding="utf-8") as f:
                prev_html = f.read()
            items.append({
                "date": prev_meta.get("date"),
                "title": prev_meta.get("title", ""),
                "digest": prev_meta.get("digest", ""),
                "links": article_links(prev_html, 10),
            })
        except Exception:
            pass

    # Persistent server-side history created after each successful generation.
    hist = load_json(HISTORY_FILE, [])
    if isinstance(hist, list):
        for item in hist[-5:]:
            if item.get("date") != today:
                items.append(item)

    # Website article repo, if it already exists on the VM.
    site_repo = os.path.expanduser(os.environ.get("SITE_REPO_DIR", "~/tochinacar"))
    articles_dir = os.path.join(site_repo, "articles")
    if os.path.isdir(articles_dir):
        daily_files = sorted(
            name for name in os.listdir(articles_dir)
            if name.endswith(".json") and "china-auto-daily" in name
        )[-8:]
        for name in daily_files:
            article = load_json(os.path.join(articles_dir, name), None)
            if not article or article.get("date") == today:
                continue
            events = article.get("events") if isinstance(article.get("events"), list) else []
            links = []
            for ev in events:
                url = ev.get("source_url")
                if url:
                    links.append((url, ev.get("company") or "Source"))
            items.append({
                "date": article.get("date"),
                "title": article.get("title_en") or article.get("title_zh") or "",
                "digest": article.get("excerpt_en") or article.get("excerpt_zh") or "",
                "links": links[:10],
            })

    # De-duplicate by date/title, keep newest compact set.
    deduped = []
    seen = set()
    for item in items:
        key = (item.get("date"), item.get("title"))
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    deduped = deduped[-5:]
    if not deduped:
        return ""

    lines = [
        "## 最近已覆盖内容（强制去重上下文）",
        "这些标题、摘要、来源链接已经报道过。今天不得把它们重新包装成 TODAY'S MOVERS；只有出现新的日期、新数字、新市场、新签约或新官方确认，才可再次报道。",
    ]
    for item in deduped:
        links = "; ".join(f"{label}: {url}" for url, label in item.get("links", [])[:6])
        lines.append(f"- {item.get('date')}: {item.get('title')}\n  摘要: {item.get('digest')}\n  已用来源: {links or 'n/a'}")
    return "\n".join(lines)


previous_context = recent_history_block()

PROMPT = f"""你是中国车企出海行业分析师。今天是 {date_cn}。请用联网搜索（web_search）查询过去24-72小时内、以下中国车企/品牌的最新出海动态，然后产出一份中英双语「中国车企出海日报」的公众号图文正文。

核心原则：这是一份“增量日报”，不是行业背景复述。读者已经看过前几天的日报，今天只需要知道“新增了什么”。

## 覆盖公司（各家动态含其所有子品牌，子品牌新闻计入母公司板块）
传统整车集团（10家；比亚迪归入传统整车集团，不归入新势力；按新能源转型、海外能力和自主品牌权重优先追踪）：
- 比亚迪BYD：比亚迪、腾势Denza、方程豹Fang Cheng Bao、仰望Yangwang
- 吉利控股Geely Holding：吉利、银河Galaxy、领克Lynk & Co、极氪Zeekr、沃尔沃Volvo、路特斯Lotus、极星Polestar、雷达Riddara、smart、宝腾Proton
- 奇瑞集团Chery：奇瑞、星途Exeed、捷途Jetour、OMODA、Jaecoo、iCAR、智界Luxeed/合作品牌
- 长安汽车集团Changan：长安、深蓝Deepal、阿维塔Avatr、启源Nevo/Qiyuan、凯程Kaicene、长安福特、长安马自达
- 上汽集团SAIC：荣威Roewe、名爵MG、智己IM Motors、飞凡Rising/Feifan、大通Maxus/LDV、五菱Wuling（含宝骏Baojun）、上汽大众、上汽通用
- 一汽集团FAW：红旗Hongqi、奔腾Bestune、解放Jiefang、一汽大众、一汽丰田
- 长城汽车GWM：哈弗Haval、魏牌Wey、坦克Tank、欧拉Ora、长城皮卡/长城炮Poer
- 广汽集团GAC：广汽传祺Trumpchi、埃安Aion、昊铂Hyptec、广汽丰田、广汽本田
- 东风集团Dongfeng：东风、岚图Voyah、猛士MHero、风行Forthing、奕派eπ、纳米Nammi、风神Aeolus、东风日产、东风本田
- 北汽集团BAIC：北京汽车、极狐Arcfox、北京奔驰、北京现代、福田Foton（商用车出口）
新势力：蔚来NIO（含乐道Onvo、萤火虫Firefly）、理想Li Auto、小鹏XPeng、零跑Leapmotor、小米汽车Xiaomi
华为汽车：鸿蒙智行HIMA（问界AITO、智界Luxeed、享界Stelato、尊界Maextro、尚界Shangjie）

每家用关键词如 "[公司] overseas export 2026"、"[公司] 海外 工厂 经销商 {int(m)}月 2026" 搜索。重点：海外销量数字、经销商合作、海外设厂、新市场进入、战略调整。优先最近24-48小时；无动态的公司不要编造。
合资体系只在涉及出口、本地化、新能源、产能调整或海外战略时纳入；常规国内合资新闻不作为出海动态。

{previous_context}

## 新鲜度与去重规则（非常重要，必须执行）
1) TODAY'S MOVERS 只能写“新增事实”，要求至少满足一项：
   - 来源发布时间或事件发生时间在 {fresh_cutoff} 至 {today} 之间；
   - 或者相比最近已覆盖内容，出现新的官方确认、新数字、新车型/市场、新签约、新投产时间、新价格、新关税/政策变化。
2) 禁止把旧消息当今日新闻：
   - 禁止重复上期已经写过的工厂规划、渠道目标、年度目标、月度销量数字，除非有新的日期或新的数字；
   - 禁止用“背景：某公司计划2030年...”填充 TODAY'S MOVERS；
   - 禁止把 TODAY'S QUIET 写成长段公司背景。
3) 如果今天硬新闻很少，可以只写1-3个 Movers；不要为了凑篇幅重复旧内容。
4) 如果没有足够新增事实，标题和摘要必须明确写“今日无重大新增出海事件/No major new overseas updates”，正文写短版雷达日报，说明哪些公司搜索过但没有新增硬信号。
5) 每条 KEY MOVES 必须包含具体新增点；最好写明“来源日期/事件日期”。无法确认新鲜度的内容只能放在 Market Context 或 TODAY'S QUIET，不能放入 Movers。
6) CROSS-CUTTING THEMES 只能基于今天新增的 Movers。如果少于2个相互独立的新增事件，就写“今日新增信号不足以形成新的跨公司趋势”，不要强行总结大趋势。

## 输出内容结构
1) Executive Summary 摘要：中文段在上、英文段在下，只讲今天的新增信号；如果新增很少，明确说“今日硬新闻有限”。
2) TODAY'S MOVERS 今日重点：按重要性排序，只写有新增硬信号的公司。每家公司含 公司编号+中文名+英文名、子品牌(如有)、Key Moves(▸开头bullet，含新增事实、数字、日期与来源链接)、Strategic Read(斜体洞察，讲新增变化的战略意义与风险)。
3) TODAY'S QUIET 今日无显著动态：只列公司名 + “过去24-72小时未检索到可确认海外新增硬信号”，不要写历史背景；每家公司一行不超过35字。
4) CROSS-CUTTING THEMES 跨公司趋势：最多2个；必须由今天至少2个新增事件共同支持。否则写“今日新增信号不足以形成新趋势”。

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
    tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 28}],
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
    meta = {"title": f"中国车企出海日报 | {date_cn}", "digest": "16家中国车企海外动态日报"}

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

history = load_json(HISTORY_FILE, [])
if not isinstance(history, list):
    history = []
history = [x for x in history if x.get("date") != today]
history.append({
    "date": today,
    "title": meta.get("title", ""),
    "digest": meta.get("digest", ""),
    "links": article_links(html, 16),
})
history = history[-14:]
with open(HISTORY_FILE, "w", encoding="utf-8") as f:
    json.dump(history, f, ensure_ascii=False, indent=2)

print(f"[generate] 完成：{meta['title']}")
print(f"[generate] 已写入 content/wechat-content.html ({len(html)} 字符) 与 meta.json")
