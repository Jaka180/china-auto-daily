#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build and inject the mandatory 15-automaker monthly export radar.

The data source remains data/overseas-sales.csv.  The script never invents a
number: if an automaker has no sourced monthly value, the row is still shown
and explicitly marked as unavailable.
"""
import argparse
import csv
import datetime as dt
import html
import json
import os
import re
import sys


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(ROOT, "data", "overseas-sales.csv")
CONTENT_DIR = os.path.join(ROOT, "content")
ARTICLE_DIR = os.path.join(ROOT, "topchinacar-site", "articles")

AUTOMAKERS = [
    ("byd", "BYD", "比亚迪", "traditional"),
    ("geely", "Geely", "吉利", "traditional"),
    ("chery", "Chery", "奇瑞", "traditional"),
    ("changan", "Changan", "长安", "traditional"),
    ("saic", "SAIC", "上汽", "traditional"),
    ("faw", "FAW", "一汽", "traditional"),
    ("gwm", "Great Wall", "长城", "traditional"),
    ("gac", "GAC", "广汽", "traditional"),
    ("dongfeng", "Dongfeng", "东风", "traditional"),
    ("baic", "BAIC", "北汽", "traditional"),
    ("nio", "NIO", "蔚来", "new_force"),
    ("xpeng", "XPeng", "小鹏", "new_force"),
    ("li", "Li Auto", "理想", "new_force"),
    ("leapmotor", "Leapmotor", "零跑", "new_force"),
    ("xiaomi", "Xiaomi", "小米", "new_force"),
]

START = "<!-- MONTHLY_EXPORT_RADAR_START -->"
END = "<!-- MONTHLY_EXPORT_RADAR_END -->"
BLOCK_RE = re.compile(r"\s*" + re.escape(START) + r".*?" + re.escape(END) + r"\s*", re.S)


def fail(message):
    raise SystemExit(f"✗ {message}")


def load_latest():
    if not os.path.isfile(CSV_PATH):
        fail(f"找不到 {CSV_PATH}")
    rows_by_key = {key: [] for key, _, _, _ in AUTOMAKERS}
    with open(CSV_PATH, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            key = (row.get("company_key") or "").strip()
            units = (row.get("overseas_units") or "").strip()
            # A number without a source is not publishable as verified data.
            if key not in rows_by_key or not units or not (row.get("source_url") or "").strip():
                continue
            try:
                row["year"] = int(row["year"])
                row["month"] = int(row["month"])
                row["overseas_units"] = int(units)
            except (TypeError, ValueError):
                fail(f"{key} 存在非法 year/month/overseas_units")
            rows_by_key[key].append(row)

    result = []
    for key, name_en, name_zh, group_type in AUTOMAKERS:
        candidates = rows_by_key[key]
        latest = max(candidates, key=lambda r: (r["year"], r["month"])) if candidates else None
        result.append({
            "company_key": key,
            "company_en": name_en,
            "company_zh": name_zh,
            "group_type": group_type,
            "latest": latest,
        })
    return result


def metric_zh(metric):
    return "海外销量（含海外产销）" if metric == "overseas" else "海关出口"


def metric_en(metric):
    return "overseas sales incl. local output" if metric == "overseas" else "customs exports"


def yoy_zh(value):
    if value in (None, ""):
        return ""
    number = float(value)
    return f"，同比{'+' if number >= 0 else ''}{number:g}%"


def yoy_en(value):
    if value in (None, ""):
        return ""
    number = float(value)
    return f", YoY {'+' if number >= 0 else ''}{number:g}%"


def source_link(url, label):
    if not url:
        return ""
    return f' <a href="{html.escape(url, quote=True)}">[{label}]</a>'


def brand_url(key, zh=False):
    lang = "/zh" if zh else ""
    return f"https://www.topchinacar.com{lang}/chinese-car-brands/{key}"


def site_item(record, lang):
    latest = record["latest"]
    key = record["company_key"]
    name = f'{record["company_zh"]} {record["company_en"]}' if lang == "zh" else record["company_en"]
    link = brand_url(key, zh=(lang == "zh"))
    lead = f'<strong><a href="{link}">{html.escape(name)}</a></strong>'
    if not latest:
        message = "暂无可核验的月度出口/海外销量数据。" if lang == "zh" else "No verified monthly export/overseas-sales figure available."
        return f"<li>{lead}：{message}</li>" if lang == "zh" else f"<li>{lead}: {message}</li>"
    units = f'{latest["overseas_units"]:,}'
    if lang == "zh":
        body = (
            f'{latest["year"]}年{latest["month"]}月：<strong>{units}辆</strong>'
            f'（{metric_zh(latest.get("metric"))}{yoy_zh(latest.get("yoy_pct"))}）。'
            f'{source_link(latest.get("source_url"), "来源")}'
        )
        return f"<li>{lead}：{body}</li>"
    body = (
        f'{latest["year"]}-{latest["month"]:02d}: <strong>{units} vehicles</strong> '
        f'({metric_en(latest.get("metric"))}{yoy_en(latest.get("yoy_pct"))}).'
        f'{source_link(latest.get("source_url"), "Source")}'
    )
    return f"<li>{lead}: {body}</li>"


def build_site(records, lang):
    traditional = [r for r in records if r["group_type"] == "traditional"]
    startups = [r for r in records if r["group_type"] == "new_force"]
    if lang == "zh":
        intro = (
            "<h2>15家车厂月度出口数据</h2>"
            "<p>覆盖10家传统车企集团与5家造车新势力；旗下品牌并入母集团，不单独拆量。"
            "以下为各车厂最近一个有来源的完整月数据，月份可能不同；“海外销量”与“海关出口”口径不可直接横比。</p>"
            "<p><strong>传统车企集团（10）</strong></p><ul>"
        )
        middle = "</ul><p><strong>造车新势力（5）</strong></p><ul>"
    else:
        intro = (
            "<h2>Monthly export data: 15 automakers</h2>"
            "<p>The radar covers 10 traditional auto groups and five EV startups; subsidiary brands are consolidated into their parent groups. "
            "Each row uses the latest sourced complete month, so months may differ. Overseas sales and customs exports are not directly comparable.</p>"
            "<p><strong>Traditional auto groups (10)</strong></p><ul>"
        )
        middle = "</ul><p><strong>EV startups (5)</strong></p><ul>"
    return (
        START + intro
        + "".join(site_item(r, lang) for r in traditional)
        + middle
        + "".join(site_item(r, lang) for r in startups)
        + "</ul>" + END
    )


def wechat_line(record):
    latest = record["latest"]
    name = f'{record["company_zh"]} {record["company_en"]}'
    link = brand_url(record["company_key"], zh=True)
    if latest:
        value = (
            f'{latest["year"]}年{latest["month"]}月 · '
            f'<strong style="color:#111827;">{latest["overseas_units"]:,}辆</strong> · '
            f'{metric_zh(latest.get("metric"))}{yoy_zh(latest.get("yoy_pct"))}'
        )
        source = source_link(latest.get("source_url"), "来源").replace(
            '<a href=', '<a style="color:#3b82f6;font-size:11px;text-decoration:none;" href='
        )
    else:
        value = "暂无可核验的月度出口/海外销量数据"
        source = ""
    return (
        '<p style="margin:3px 0;color:#4b5563;font-size:13px;line-height:1.65;">'
        f'<a href="{link}" style="color:#111827;text-decoration:none;font-weight:bold;">{html.escape(name)}</a>'
        f' · {value}{source}</p>'
    )


def build_wechat(records):
    traditional = [r for r in records if r["group_type"] == "traditional"]
    startups = [r for r in records if r["group_type"] == "new_force"]
    return (
        START
        + '<section style="padding:8px 20px 10px;">'
        + '<p style="margin:0 0 8px;font-size:16px;font-weight:bold;color:#111827;border-left:4px solid #dc2626;padding-left:10px;">15家车厂月度出口数据 MONTHLY EXPORT DATA</p>'
        + '<p style="margin:0 0 10px;color:#6b7280;font-size:12px;line-height:1.65;">10家传统集团 + 5家新势力；子品牌并入母集团。展示各车厂最近一个有来源的完整月，月份可能不同；海外销量与海关出口口径不可直接横比。</p>'
        + '<p style="margin:8px 0 4px;color:#dc2626;font-size:12px;font-weight:bold;">传统车企集团 · 10</p>'
        + "".join(wechat_line(r) for r in traditional)
        + '<p style="margin:10px 0 4px;color:#dc2626;font-size:12px;font-weight:bold;">造车新势力 · 5</p>'
        + "".join(wechat_line(r) for r in startups)
        + "</section>"
        + END
    )


def inject_before_movers(text, fragment, path):
    clean = BLOCK_RE.sub("", text)
    marker = "今日重点 TODAY'S MOVERS"
    marker_pos = clean.find(marker)
    if marker_pos < 0:
        fail(f"{path} 找不到 {marker}")
    insert_pos = clean.rfind("<section", 0, marker_pos)
    if insert_pos < 0:
        fail(f"{path} 找不到 Movers 外层 section")
    return clean[:insert_pos] + fragment + "\n\n" + clean[insert_pos:]


def inject_before_first_h2(text, fragment, label):
    clean = BLOCK_RE.sub("", text)
    pos = clean.find("<h2>")
    if pos < 0:
        fail(f"{label} 找不到第一个 h2")
    return clean[:pos] + fragment + "\n" + clean[pos:]


def write_text(path, value):
    with open(path, "w", encoding="utf-8") as f:
        f.write(value)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=dt.date.today().isoformat())
    args = ap.parse_args()

    records = load_latest()
    if len(records) != 15:
        fail(f"车厂数量应为15，实际为{len(records)}")
    if sum(r["group_type"] == "traditional" for r in records) != 10:
        fail("传统车企数量不是10")
    if sum(r["group_type"] == "new_force" for r in records) != 5:
        fail("新势力数量不是5")

    audit = {
        "generated_at": args.date,
        "date": args.date,
        "counts": {"traditional": 10, "new_force": 5, "automakers": 15},
        "scope": "subsidiary brands consolidated into parent automaker groups",
        "automakers": records,
    }
    audit_path = os.path.join(CONTENT_DIR, "export-radar.json")
    with open(audit_path, "w", encoding="utf-8") as f:
        json.dump(audit, f, ensure_ascii=False, indent=2)

    wechat_path = os.path.join(CONTENT_DIR, "wechat-content.html")
    briefing_path = os.path.join(CONTENT_DIR, "briefing.html")
    article_path = os.path.join(ARTICLE_DIR, f"{args.date}-china-auto-daily.json")
    for path in (wechat_path, briefing_path, article_path):
        if not os.path.isfile(path):
            fail(f"找不到 {path}")

    with open(wechat_path, encoding="utf-8") as f:
        wechat = f.read()
    with open(briefing_path, encoding="utf-8") as f:
        briefing = f.read()
    write_text(wechat_path, inject_before_movers(wechat, build_wechat(records), wechat_path))
    write_text(briefing_path, inject_before_movers(briefing, build_wechat(records), briefing_path))

    with open(article_path, encoding="utf-8") as f:
        article = json.load(f)
    article["html_zh"] = inject_before_first_h2(article.get("html_zh", ""), build_site(records, "zh"), "html_zh")
    article["html_en"] = inject_before_first_h2(article.get("html_en", ""), build_site(records, "en"), "html_en")
    with open(article_path, "w", encoding="utf-8") as f:
        json.dump(article, f, ensure_ascii=False, indent=2)
        f.write("\n")

    sourced = sum(r["latest"] is not None for r in records)
    print(f"✅ 已注入15家车厂月度出口数据：{sourced}家有值，{15-sourced}家明确标注缺失")


if __name__ == "__main__":
    main()
