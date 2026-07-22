#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
读 data/overseas-sales.csv(唯一事实来源)→ 校验 → 生成 data/overseas-sales.json。
用法:python3 data/build_json.py
JSON 供网站 /data 页与日报消费;不要手改 JSON,只改 CSV 后重跑本脚本。
"""
import csv, json, os, sys, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(HERE, "overseas-sales.csv")
JSON_PATH = os.path.join(HERE, "overseas-sales.json")

VALID_KEYS = {
    "byd", "geely", "chery", "changan", "saic", "faw", "gwm", "gac", "dongfeng", "baic",
    "nio", "xpeng", "li", "leapmotor", "xiaomi",
}
VALID_METRIC = {"overseas", "customs_export"}

def fail(msg):
    sys.exit(f"✗ {msg}")

if not os.path.isfile(CSV_PATH):
    fail(f"找不到 {CSV_PATH}")

rows = []
with open(CSV_PATH, encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for i, r in enumerate(reader, start=2):  # 行号含表头
        key = (r.get("company_key") or "").strip()
        if key not in VALID_KEYS:
            fail(f"第{i}行 company_key 非法:{key!r}")
        try:
            year = int(r["year"]); month = int(r["month"])
        except Exception:
            fail(f"第{i}行 year/month 非整数")
        if not (1 <= month <= 12):
            fail(f"第{i}行 month 越界:{month}")
        units = (r.get("overseas_units") or "").strip()
        if units != "":
            if not units.isdigit():
                fail(f"第{i}行 overseas_units 必须为非负整数或留空:{units!r}")
            units = int(units)
        else:
            units = None
        metric = (r.get("metric") or "overseas").strip() or "overseas"
        if metric not in VALID_METRIC:
            fail(f"第{i}行 metric 非法:{metric!r}")
        yoy = (r.get("yoy_pct") or "").strip()
        yoy = float(yoy) if yoy != "" else None
        rows.append({
            "company_key": key,
            "company_en": (r.get("company_en") or "").strip(),
            "company_zh": (r.get("company_zh") or "").strip(),
            "group_type": (r.get("group_type") or "").strip(),
            "year": year, "month": month,
            "overseas_units": units, "metric": metric,
            "yoy_pct": yoy,
            "source_url": (r.get("source_url") or "").strip(),
            "note": (r.get("note") or "").strip(),
        })

# 按公司聚合成时间序列
series = {}
for r in rows:
    k = r["company_key"]
    s = series.setdefault(k, {
        "company_en": r["company_en"], "company_zh": r["company_zh"],
        "group_type": r["group_type"], "data": [],
    })
    s["data"].append({
        "year": r["year"], "month": r["month"],
        "overseas_units": r["overseas_units"], "metric": r["metric"],
        "yoy_pct": r["yoy_pct"], "source_url": r["source_url"], "note": r["note"],
    })
for s in series.values():
    s["data"].sort(key=lambda d: (d["year"], d["month"]))

out = {
    "meta": {
        "metric": "monthly overseas sales (units), incl. overseas-plant output; 'customs_export' where a month only had customs data",
        "generated_at": datetime.date.today().isoformat(),
        "companies_tracked": 15,
        "coverage_note": "Seeded 2025-2026. Gaps are expected and filled forward monthly by the briefing pipeline; blank = not yet sourced.",
    },
    "series": series,
}
with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

# 覆盖率报告
print(f"✓ 生成 {JSON_PATH}（{len(rows)} 行,{len(series)} 家）")
for k in sorted(VALID_KEYS):
    if k in series:
        d = series[k]["data"]
        filled = sum(1 for x in d if x["overseas_units"] is not None)
        months = sorted({(x["year"], x["month"]) for x in d})
        span = f"{months[0][0]}-{months[0][1]:02d}→{months[-1][0]}-{months[-1][1]:02d}" if months else "—"
        print(f"  {k:9s} {filled:2d} 个月有值  [{span}]")
    else:
        print(f"  {k:9s}  0 —— 暂无数据")
