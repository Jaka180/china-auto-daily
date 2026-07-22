#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build and inject the mandatory 15-automaker overseas-volume tables.

Monthly observations live in data/overseas-sales.csv. Official or sourced
full-year/YTD observations live in data/overseas-period-totals.csv. The
script never fills a missing month and never derives China exports by
subtracting overseas production from overseas sales.
"""
import argparse
import csv
import datetime as dt
import html
import json
import os
import re


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(ROOT, "data", "overseas-sales.csv")
PERIOD_PATH = os.path.join(ROOT, "data", "overseas-period-totals.csv")
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
VALID_KEYS = {row[0] for row in AUTOMAKERS}

START = "<!-- MONTHLY_EXPORT_RADAR_START -->"
END = "<!-- MONTHLY_EXPORT_RADAR_END -->"
BLOCK_RE = re.compile(r"\s*" + re.escape(START) + r".*?" + re.escape(END) + r"\s*", re.S)


def fail(message):
    raise SystemExit(f"✗ {message}")


def parse_int(row, field, path, allow_blank=False):
    value = (row.get(field) or "").strip()
    if allow_blank and not value:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        fail(f"{path}: {row.get('company_key', '?')} 的 {field} 非法")


def load_monthly_rows():
    if not os.path.isfile(CSV_PATH):
        fail(f"找不到 {CSV_PATH}")
    rows_by_key = {key: [] for key in VALID_KEYS}
    with open(CSV_PATH, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            key = (row.get("company_key") or "").strip()
            units = (row.get("overseas_units") or "").strip()
            source = (row.get("source_url") or "").strip()
            # A numeric value without a source is not publishable as verified data.
            if key not in rows_by_key or not units or not source:
                continue
            row["year"] = parse_int(row, "year", CSV_PATH)
            row["month"] = parse_int(row, "month", CSV_PATH)
            row["overseas_units"] = parse_int(row, "overseas_units", CSV_PATH)
            rows_by_key[key].append(row)
    return rows_by_key


def load_period_rows():
    if not os.path.isfile(PERIOD_PATH):
        fail(f"找不到 {PERIOD_PATH}")
    rows_by_key = {key: [] for key in VALID_KEYS}
    with open(PERIOD_PATH, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            key = (row.get("company_key") or "").strip()
            if key not in rows_by_key:
                fail(f"{PERIOD_PATH}: 未知 company_key {key}")
            if not (row.get("source_url") or "").strip():
                fail(f"{PERIOD_PATH}: {key} 的周期总量缺少来源")
            for field in ("year", "start_month", "end_month", "total_units"):
                row[field] = parse_int(row, field, PERIOD_PATH)
            for field in ("china_export_units", "overseas_production_units"):
                row[field] = parse_int(row, field, PERIOD_PATH, allow_blank=True)
            rows_by_key[key].append(row)
    return rows_by_key


def derived_period(rows, year, start_month, end_month):
    selected = [r for r in rows if r["year"] == year and start_month <= r["month"] <= end_month]
    by_month = {r["month"]: r for r in selected}
    ordered = [by_month[m] for m in sorted(by_month)]
    if not ordered:
        return None
    metrics = {r.get("metric") for r in ordered}
    sources = {r.get("source_url") for r in ordered}
    return {
        "year": year,
        "start_month": start_month,
        "end_month": end_month,
        "total_units": sum(r["overseas_units"] for r in ordered),
        "metric": metrics.pop() if len(metrics) == 1 else "mixed",
        "china_export_units": None,
        "overseas_production_units": None,
        "qualifier": "exact",
        "source_url": sources.pop() if len(sources) == 1 else "",
        "note": "derived from sourced monthly rows",
        "derived": True,
        "coverage_months": len(ordered),
        "complete": len(ordered) == end_month - start_month + 1,
    }


def explicit_period(periods, year, start_month, end_month):
    matches = [
        dict(r) for r in periods
        if r["year"] == year and r["start_month"] == start_month and r["end_month"] == end_month
    ]
    if len(matches) > 1:
        fail(f"周期总量重复: {year}-{start_month}-{end_month}")
    if not matches:
        return None
    result = matches[0]
    result.update({
        "derived": False,
        "coverage_months": end_month - start_month + 1,
        "complete": True,
    })
    return result


def build_records(target_month):
    monthly = load_monthly_rows()
    periods = load_period_rows()
    records = []
    for key, name_en, name_zh, group_type in AUTOMAKERS:
        rows = monthly[key]
        months_2026 = []
        by_month = {r["month"]: r for r in rows if r["year"] == 2026 and r["month"] <= target_month}
        for month in range(1, target_month + 1):
            months_2026.append({"month": month, "data": by_month.get(month)})

        annual = explicit_period(periods[key], 2025, 1, 12)
        if not annual:
            candidate = derived_period(rows, 2025, 1, 12)
            annual = candidate if candidate and candidate["complete"] else None

        cumulative = explicit_period(periods[key], 2026, 1, target_month)
        if not cumulative:
            cumulative = derived_period(rows, 2026, 1, target_month)

        candidates = [r for r in rows if (r["year"], r["month"]) <= (2026, target_month)]
        records.append({
            "company_key": key,
            "company_en": name_en,
            "company_zh": name_zh,
            "group_type": group_type,
            "annual_2025": annual,
            "months_2026": months_2026,
            "cumulative_2026": cumulative,
            "latest": max(candidates, key=lambda r: (r["year"], r["month"])) if candidates else None,
        })
    return records


def metric_zh(metric):
    return {
        "overseas": "海外总量（含海外生产，未拆分）",
        "customs_export": "中国出口",
        "mixed": "混合口径",
    }.get(metric, "口径未披露")


def metric_en(metric):
    return {
        "overseas": "overseas total incl. local output; unsplit",
        "customs_export": "exports from China",
        "mixed": "mixed metrics",
    }.get(metric, "metric undisclosed")


def metric_short(metric, lang):
    if lang == "zh":
        return {"overseas": "总", "customs_export": "出", "mixed": "混"}.get(metric, "?")
    return {"overseas": "total", "customs_export": "export", "mixed": "mixed"}.get(metric, "?")


def qualified_number(period, lang):
    prefixes = {
        "zh": {"more_than": ">", "about": "约"},
        "en": {"more_than": ">", "about": "~"},
    }
    prefix = prefixes[lang].get(period.get("qualifier"), "")
    return f'{prefix}{period["total_units"]:,}'


def linked_value(value, url, lang, inline=False):
    escaped = html.escape(url or "", quote=True)
    label = "来源" if lang == "zh" else "Source"
    if not escaped:
        return value
    if inline:
        return f'<a href="{escaped}" style="color:#1d4ed8;text-decoration:none;font-weight:700;">{value}</a>'
    return f'<strong>{value}</strong> <a href="{escaped}">[{label}]</a>'


def period_cell(period, lang, is_cumulative=False, inline=False):
    if not period:
        return "—<br><small>未披露</small>" if lang == "zh" else "—<br><small>not disclosed</small>"
    value = linked_value(qualified_number(period, lang), period.get("source_url"), lang, inline=inline)
    scope = metric_zh(period.get("metric")) if lang == "zh" else metric_en(period.get("metric"))
    lines = [value, f"<small>{scope}</small>"]
    if period.get("china_export_units") is not None and period.get("metric") != "customs_export":
        exports = f'{period["china_export_units"]:,}'
        lines.append(
            f"<small>其中中国出口 {exports}</small>" if lang == "zh"
            else f"<small>of which China exports: {exports}</small>"
        )
    if period.get("overseas_production_units") is not None:
        production = f'{period["overseas_production_units"]:,}'
        lines.append(
            f"<small>另披露海外生产 {production}（不可相加）</small>" if lang == "zh"
            else f"<small>overseas production also reported: {production} (not additive)</small>"
        )
    if is_cumulative:
        if period.get("derived") and not period.get("complete"):
            covered = period.get("coverage_months", 0)
            total = period["end_month"] - period["start_month"] + 1
            status = f"已披露{covered}/{total}个月小计" if lang == "zh" else f"subtotal for {covered}/{total} disclosed months"
        else:
            status = f'1–{period["end_month"]}月累计' if lang == "zh" else f'Jan–{period["end_month"]} cumulative'
        lines.append(f"<small>{status}</small>")
    return "<br>".join(lines)


def brand_url(key, zh=False):
    lang = "/zh" if zh else ""
    return f"https://www.topchinacar.com{lang}/chinese-car-brands/{key}"


def compact_metric(metric, lang):
    if lang == "zh":
        return {
            "overseas": "海外总量 · 未拆分",
            "customs_export": "中国出口",
            "mixed": "混合口径",
        }.get(metric, "口径未披露")
    return {
        "overseas": "overseas total · unsplit",
        "customs_export": "exports from China",
        "mixed": "mixed metrics",
    }.get(metric, "metric undisclosed")


def summary_period(period, lang, label, is_cumulative=False):
    label_html = (
        f'<small style="display:block;margin-bottom:3px;color:#6b7280;font-size:10px;line-height:1.3;letter-spacing:.04em;">{label}</small>'
    )
    if not period:
        missing = "未披露" if lang == "zh" else "not disclosed"
        return label_html + f'<strong style="font-size:15px;color:#9ca3af;">—</strong><br><small style="color:#9ca3af;font-size:10px;">{missing}</small>'

    value = linked_value(qualified_number(period, lang), period.get("source_url"), lang, inline=True)
    lines = [label_html + f'<span style="font-size:15px;line-height:1.25;">{value}</span>']
    lines.append(f'<small style="display:block;margin-top:3px;color:#4b5563;font-size:10px;line-height:1.35;">{compact_metric(period.get("metric"), lang)}</small>')

    if period.get("china_export_units") is not None and period.get("metric") != "customs_export":
        exports = f'{period["china_export_units"]:,}'
        detail = f"中国出口 {exports}" if lang == "zh" else f"China exports {exports}"
        lines.append(f'<small style="display:block;color:#4b5563;font-size:10px;line-height:1.35;">{detail}</small>')
    if period.get("overseas_production_units") is not None:
        production = f'{period["overseas_production_units"]:,}'
        detail = (
            f"海外生产 {production}（不可相加）" if lang == "zh"
            else f"overseas output {production} (not additive)"
        )
        lines.append(f'<small style="display:block;color:#4b5563;font-size:10px;line-height:1.35;">{detail}</small>')

    if is_cumulative:
        if period.get("derived") and not period.get("complete"):
            covered = period.get("coverage_months", 0)
            total = period["end_month"] - period["start_month"] + 1
            status = f"已披露 {covered}/{total} 月小计" if lang == "zh" else f"subtotal: {covered}/{total} months disclosed"
            color = "#b45309"
        else:
            status = f'1–{period["end_month"]}月累计' if lang == "zh" else f'Jan–{period["end_month"]} cumulative'
            color = "#047857"
        lines.append(f'<small style="display:block;margin-top:3px;color:{color};font-size:10px;font-weight:700;line-height:1.35;">{status}</small>')
    return "".join(lines)


def monthly_td(item, lang):
    month = item["month"]
    row = item["data"]
    month_label = f"{month}月" if lang == "zh" else dt.date(2000, month, 1).strftime("%b")
    base = 'width:16.666%;min-width:0;border:1px solid #e5e7eb;padding:7px 3px;vertical-align:top;text-align:center;background:#ffffff;line-height:1.3;'
    month_html = f'<small style="display:block;margin-bottom:4px;color:#6b7280;font-size:10px;font-weight:700;">{month_label}</small>'
    if not row:
        missing = "未披露" if lang == "zh" else "n/a"
        return f'<td style="{base}">{month_html}<strong style="color:#9ca3af;font-size:13px;">—</strong><br><small style="color:#9ca3af;font-size:9px;">{missing}</small></td>'

    value = f'{row["overseas_units"]:,}'
    value = linked_value(value, row.get("source_url"), lang, inline=True)
    metric = metric_short(row.get("metric"), lang)
    if row.get("metric") == "customs_export":
        badge = "background:#fff1f2;color:#be123c;"
    else:
        badge = "background:#eff6ff;color:#1d4ed8;"
    return (
        f'<td style="{base}">{month_html}'
        f'<span style="display:block;white-space:nowrap;font-size:12px;color:#111827;">{value}</span>'
        f'<small style="display:inline-block;margin-top:4px;padding:1px 5px;border-radius:8px;{badge}font-size:9px;font-weight:700;line-height:1.4;">{metric}</small>'
        "</td>"
    )


def table_rows(record, lang, add_spacer=True):
    if lang == "zh":
        name = record["company_zh"]
        subname = record["company_en"]
        annual_label = "2025全年"
        cumulative_label = "2026累计"
    else:
        name = record["company_en"]
        subname = ""
        annual_label = "2025 FULL YEAR"
        cumulative_label = "2026 YTD"
    link = brand_url(record["company_key"], zh=(lang == "zh"))
    name_html = f'<a href="{link}" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:800;line-height:1.25;">{html.escape(name)}</a>'
    if subname:
        name_html += f'<small style="display:block;margin-top:3px;color:#d1d5db;font-size:10px;line-height:1.2;">{html.escape(subname)}</small>'
    header = (
        '<tr>'
        f'<td colspan="2" style="width:33.333%;min-width:0;border:1px solid #111827;border-left:4px solid #dc2626;padding:10px 10px;vertical-align:top;text-align:left;background:#111827;">{name_html}</td>'
        f'<td colspan="2" style="width:33.333%;min-width:0;border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;text-align:left;background:#f8fafc;">{summary_period(record["annual_2025"], lang, annual_label)}</td>'
        f'<td colspan="2" style="width:33.333%;min-width:0;border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;text-align:left;background:#f8fafc;">{summary_period(record["cumulative_2026"], lang, cumulative_label, is_cumulative=True)}</td>'
        '</tr>'
    )
    months = '<tr>' + "".join(monthly_td(item, lang) for item in record["months_2026"]) + '</tr>'
    spacer = '<tr><td colspan="6" style="height:10px;border:0;padding:0;background:#ffffff;font-size:0;line-height:0;">&nbsp;</td></tr>' if add_spacer else ""
    return header + months + spacer


def build_table(records, lang):
    table_style = ' style="width:100%;max-width:100%;border-collapse:collapse;table-layout:fixed;margin:6px 0 16px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;font-size:11px;color:#374151;"'
    return (
        f"<table{table_style}><tbody>"
        + "".join(table_rows(r, lang, add_spacer=(index < len(records) - 1)) for index, r in enumerate(records))
        + "</tbody></table>"
    )


def build_site(records, lang):
    traditional = [r for r in records if r["group_type"] == "traditional"]
    startups = [r for r in records if r["group_type"] == "new_force"]
    if lang == "zh":
        intro = (
            "<h2>15家车厂出口与海外生产数据</h2>"
            "<p>子品牌并入母集团。表中“出”=中国出口；“总”=海外销量口径，通常包括中国出口车与海外本地产销，但来源未拆分两部分。"
            "缺月以“—”表示；累计若缺月，只列已披露月份小计，绝不补算。蓝色数值可打开原始来源。</p>"
            "<p><strong>传统车企集团（10）</strong></p>"
        )
        middle = "<p><strong>造车新势力（5）</strong></p>"
    else:
        intro = (
            "<h2>Exports and overseas output: 15 automakers</h2>"
            "<p>Subsidiary brands are consolidated into their parent groups. “Export” means exports from China; “total” means overseas volume that may include local output when the source does not split the two. "
            "A dash marks an undisclosed month; an incomplete YTD is explicitly shown as a disclosed-month subtotal. Blue figures link to their original sources.</p>"
            "<p><strong>Traditional auto groups (10)</strong></p>"
        )
        middle = "<p><strong>EV startups (5)</strong></p>"
    return START + intro + build_table(traditional, lang) + middle + build_table(startups, lang) + END


def build_wechat(records):
    traditional = [r for r in records if r["group_type"] == "traditional"]
    startups = [r for r in records if r["group_type"] == "new_force"]
    return (
        START
        + '<section style="padding:8px 12px 10px;">'
        + '<p style="margin:0 0 8px;font-size:16px;font-weight:bold;color:#111827;border-left:4px solid #dc2626;padding-left:10px;">15家车厂出口与海外生产数据</p>'
        + '<p style="margin:0 0 10px;color:#6b7280;font-size:12px;line-height:1.65;">子品牌并入母集团。“出”=中国出口；“总”=通常含中国出口车与海外本地产销的海外销量、来源未拆分。缺月以“—”表示；不完整累计仅为已披露月份小计。蓝色数值可打开原始来源。</p>'
        + '<p style="margin:8px 0 4px;color:#dc2626;font-size:12px;font-weight:bold;">传统车企集团 · 10</p>'
        + build_table(traditional, "zh")
        + '<p style="margin:10px 0 4px;color:#dc2626;font-size:12px;font-weight:bold;">造车新势力 · 5</p>'
        + build_table(startups, "zh")
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
    try:
        run_date = dt.date.fromisoformat(args.date)
    except ValueError:
        fail(f"非法日期 {args.date}")
    target_month = min(12, max(1, run_date.month - 1))

    records = build_records(target_month)
    if len(records) != 15:
        fail(f"车厂数量应为15，实际为{len(records)}")
    if sum(r["group_type"] == "traditional" for r in records) != 10:
        fail("传统车企数量不是10")
    if sum(r["group_type"] == "new_force" for r in records) != 5:
        fail("新势力数量不是5")

    audit = {
        "generated_at": args.date,
        "date": args.date,
        "period": {"annual_year": 2025, "monthly_year": 2026, "through_month": target_month},
        "counts": {"traditional": 10, "new_force": 5, "automakers": 15},
        "scope": "subsidiary brands consolidated; China exports and overseas production are split only when explicitly sourced",
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
    fragment = build_wechat(records)
    write_text(wechat_path, inject_before_movers(wechat, fragment, wechat_path))
    write_text(briefing_path, inject_before_movers(briefing, fragment, briefing_path))

    with open(article_path, encoding="utf-8") as f:
        article = json.load(f)
    article["html_zh"] = inject_before_first_h2(article.get("html_zh", ""), build_site(records, "zh"), "html_zh")
    article["html_en"] = inject_before_first_h2(article.get("html_en", ""), build_site(records, "en"), "html_en")
    with open(article_path, "w", encoding="utf-8") as f:
        json.dump(article, f, ensure_ascii=False, indent=2)
        f.write("\n")

    monthly = sum(any(item["data"] for item in r["months_2026"]) for r in records)
    annual = sum(r["annual_2025"] is not None for r in records)
    cumulative = sum(r["cumulative_2026"] is not None for r in records)
    print(f"✅ 已注入15家车厂表格：2025全年{annual}家，2026月度{monthly}家，2026累计/小计{cumulative}家")


if __name__ == "__main__":
    main()
