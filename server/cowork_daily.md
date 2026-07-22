# 中国车企出海日报 — Claude Desktop 生成规范（不使用 Anthropic API）

> 这份文件由 Cowork 每日定时任务读取并执行。它取代了原来花 API 的
> `server/generate.py`（联网搜索+写稿）和 `server/site_publish.py`（转双语文章）。
> 生成用 Claude Desktop 内置模型 + 联网搜索，零 Anthropic API 费用。
> 本步骤**只生成内容文件**，不负责推送——推送/公众号/邮件由 Mac 本机 launchd
> 运行 `mac/distribute_daily.sh` 完成。

## 你的任务

作为「TopChinaCar / 中国车企出海日报」主编，联网搜索过去 24–72 小时中国车企的**出海（海外）**最新动态，产出一份中英双语增量日报，并写入下列文件。

工作目录（宿主机路径，用 Read/Write 工具直接读写）：
- 仓库根：`/Users/Junbo2TOM/Documents/china-auto-briefing`
- 内容目录：`.../content/`
- 网站文章目录：`.../topchinacar-site/articles/`

## 步骤

1. **确定北京日期**：用 bash `TZ=Asia/Shanghai date '+%Y-%m-%d'` 得到 `<DATE>`（如 2026-07-22）。中文日期 `<DATE_CN>` 形如「2026年7月22日」。`slug = <DATE>-china-auto-daily`。

2. **读近期文章做去重**：读 `topchinacar-site/articles/` 里最近 5 个 `*-china-auto-daily.json`，记录已用标题、摘要、来源链接。**今天只报增量**，不得把旧闻重新包装。

3. **联网搜索**（WebSearch）覆盖以下公司的出海动态，每家用类似 `"<公司> overseas export 2026"`、`"<公司> 海外 工厂 经销商 7月 2026"` 的关键词。重点：海外销量数字、经销商合作、海外设厂、新市场进入、定价、政策/关税、战略调整。优先最近 24–48 小时。无动态的公司不要编造。

   **覆盖公司**（15家车厂/集团；子品牌新闻和销量均计入母公司，不单独拆量）：
   - 传统整车集团：比亚迪BYD（腾势/方程豹/仰望）、吉利Geely（银河/领克/极氪/沃尔沃/路特斯/极星/雷达/smart/宝腾）、奇瑞Chery（星途/捷途/OMODA/Jaecoo/iCAR）、长安Changan（深蓝/阿维塔/启源/凯程）、上汽SAIC（荣威/名爵MG/智己/飞凡/大通Maxus/五菱）、一汽FAW（红旗/奔腾/解放）、长城GWM（哈弗/魏牌/坦克/欧拉/长城炮）、广汽GAC（传祺/埃安/昊铂）、东风Dongfeng（岚图/猛士/风行/奕派/纳米）、北汽BAIC（极狐/福田Foton）
   - 新势力：蔚来NIO（乐道/萤火虫）、理想Li Auto、小鹏XPeng、零跑Leapmotor、小米汽车Xiaomi
   - 华为鸿蒙智行HIMA：问界/智界/享界/尊界/尚界
   - 合资体系只在涉及出口/本地化/新能源/产能/海外战略时纳入。

## 新鲜度与去重规则（必须执行）

- TODAY'S MOVERS 只能写**新增事实**：来源/事件时间在最近两天内，或相比近期已覆盖内容出现新官方确认、新数字、新车型/市场、新签约、新投产时间、新价格、新关税/政策。
- 禁止把旧消息当今日新闻；禁止用「背景：某公司计划2030年…」填充 Movers。
- 硬新闻少时只写 1–3 个 Movers，不要凑篇幅。若几乎无新增，标题/摘要明确写「今日无重大新增出海事件 / No major new overseas updates」，正文写短版雷达日报。
- 只用搜索到的事实，不要编造数字或链接。

## 需要写出的文件

### 1. `content/meta.json`
```json
{"title": "中国车企出海日报 | <DATE_CN>：<今日1-2个最大信号一句话>",
 "digest": "<一句话摘要含关键数字，<=110字>",
 "author": "波波哥", "date": "<DATE>",
 "content_file": "wechat-content.html", "cover_file": "cover.jpg"}
```
title ≤ 64 字，digest ≤ 110 字。

### 2. `content/wechat-content.html`（公众号版，元素内联样式）
- 整体包在 `<section style="max-width:677px;margin:0 auto;font-family:-apple-system,'PingFang SC',sans-serif;color:#1c1c1e;font-size:15px;line-height:1.8;">` 里。
- 禁止 `<style>` 标签、禁止 flex、禁止 `::before`（公众号会剥离）。所有样式写成元素内联 `style`。
- 配色：深灰 `#111827`、红 `#dc2626`、正文 `#374151`、次要 `#9ca3af`、链接 `#3b82f6`、浅底 `#f9fafb`。
- 顶部深色 header（背景 `#111827`，红色底边）放标题「中国车企出海日报 / China Auto Overseas Briefing」、日期「<DATE_CN> · 早间版」。
- 结构：Executive Summary 摘要（中文段在上、英文段在下）→ **15家车厂月度出口数据 MONTHLY EXPORT DATA（强制，每期都要有）** → TODAY'S MOVERS 今日重点（每家：编号+中文名+英文名、子品牌、Key Moves 以红色 `▸` 开头 bullet 含数字/日期/来源链接、Strategic Read 用左红边框浅底斜体块 `border-left:3px solid #dc2626;background:#f9fafb;font-style:italic`）→ TODAY'S QUIET（只列公司名+一行说明，≤35字）→ CROSS-CUTTING THEMES（最多2个，须由今天≥2个新增事件支撑，否则写「今日新增信号不足以形成新趋势」）。
- 月度出口数据固定覆盖10家传统集团（比亚迪、吉利、奇瑞、长安、上汽、一汽、长城、广汽、东风、北汽）+5家新势力（蔚来、小鹏、理想、零跑、小米）。旗下20个子品牌全部并入母集团，**不单列、不重复计算**。
- 每家显示 `最近有来源的完整月份 + 数量 + metric口径 + 同比（如有）+ 来源`。若暂无数字也必须保留该车厂并写“暂无可核验月度数据”，绝不编造；不同月份、`overseas` 与 `customs_export` 必须明确提示不可直接横比。
- 来源链接内联：`<a href="URL" style="color:#3b82f6;font-size:12px;text-decoration:none;">[来源名]</a>`。
- 可参考 `archive/` 里往期 HTML 的排版风格。

### 3. `content/briefing.html`（网页备份）
把上面的 `<section>` 包进一个最小 HTML 文档：
`<!DOCTYPE html><html lang=zh-CN><head><meta charset=UTF-8><meta name=viewport content='width=device-width,initial-scale=1'><title><title></title></head><body style='background:#eceef1;margin:0;padding:16px;'><section>…</section></body></html>`

### 4. `topchinacar-site/articles/<slug>.json`（网站双语文章）
```json
{
  "slug": "<slug>", "date": "<DATE>",
  "published_at": "<北京时间 ISO8601，如 2026-07-22T06:30:00+08:00>",
  "tag_en": "China Auto Overseas Daily", "tag_zh": "中国车企出海日报",
  "title_en": "China Auto Overseas Daily | <DATE>: <具体英文标题，≤110字，无标题党>",
  "title_zh": "中国车企出海日报 | <具体中文标题>",
  "excerpt_en": "<一句话英文摘要含关键数字，≤200字>",
  "excerpt_zh": "<一句话中文摘要>",
  "html_en": "<英文正文，纯英文，见结构>",
  "html_zh": "<中文正文，同结构>",
  "events": [ ... ]
}
```
- **html_en 只能是英文**（含来源标签也用英文），**html_zh 只能是中文**。两者用固定结构：先 1–2 句 lede（无标题），然后 `<h2>What happened</h2>`（事实+数字+内联 `<a href>[Source]</a>）、`<h2>Why it matters</h2>`、`<h2>Market context</h2>`、`<h2>Impact on Chinese automakers</h2>`、`<h2>What to watch next</h2>`。中文版对应「发生了什么/为何重要/市场背景/对中国车企的影响/后续关注」。
- lede 后、`What happened / 发生了什么` 前必须插入“15家车厂月度出口数据”板块；该板块由最后的自动注入命令生成，避免漏项。
- 只用干净语义标签：`<p><h2><ul><li><a><em><strong>`。无内联样式、无 `<section>`、无图片。
- **events**：必填。文章里每一条独立新闻对应一条结构化记录（6 段的文章通常 8–20 条）。每条：`{"company":"<母公司英文>","brand":"<品牌英文或null>","market":"<国家/地区英文或'Global'>","action":"<sales_figures|plant|dealer_network|market_entry|product_launch|pricing|partnership|policy|other>","summary_en":"<含数字的一句话>","source_url":"<url或null>"}`。只有当日确实零新闻时 events 才可为空数组。

## 顺带维护:出口/海外销量数据底座（data/overseas-sales.csv）

这是一个持续累积的月度**海外销量**时间序列(10 传统 + 5 新势力),详见 `data/README.md`。
搜索过程中若看到某公司**上一个完整月**(不是本月、不是当日)的海外销量/出口新数字:

1. 读 `data/overseas-sales.csv`,看该「公司-月」是否已有行。
2. 若缺失或本次来源更权威,则追加/更新一行,字段见 README:
   `company_key,company_en,company_zh,group_type,year,month,overseas_units,metric,yoy_pct,source_url,note`
   - `metric`:能确认含海外厂产销的写 `overseas`,只查到海关出口写 `customs_export`。
   - 查不到就**留空**,绝不编造。优先补现有缺口(尤其 FAW `faw`、BAIC `baic` 尚无任何数据;Chery/SAIC/Changan/GAC/Dongfeng 及新势力 2025 与 2026 早月多缺)。
3. 改完 CSV 后运行 `python3 data/build_json.py` 重新生成 JSON 并校验。
4. 只补月度、已完成月份;日中零散数字不进数据底座(它进正文/events)。

当日无新月度数据则跳过本节,不改数据底座。

## 完成后
四个主内容文件与数据底座都完成后，**必须最后执行**：
```bash
python3 tools/inject_export_radar.py --date <DATE>
```
它会从 `data/overseas-sales.csv` 生成 `content/export-radar.json`，并把15家车厂月度数据强制注入公众号、邮件/网页备份和网站中英文章。命令失败则本次生成视为失败，不得跳过。

不要 git push、不要发邮件、不要碰公众号——这些由 Mac 本机 `mac/distribute_daily.sh` 在稍后自动完成。你只需确认四个内容文件及 `content/export-radar.json` 已写好(如更新了数据底座则确认已重跑 build_json.py)，并在结束消息里给出今天的标题、Movers 条数、月度数据覆盖数,以及是否更新了数据底座(哪几家哪个月)。
