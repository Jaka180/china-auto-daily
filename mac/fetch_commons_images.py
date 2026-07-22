#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 Wikimedia Commons 下载车型/品牌图片（CC 自由授权，可商用，需署名）。

用法（Mac 终端）：
  python3 ~/Documents/china-auto-briefing/mac/fetch_commons_images.py

做什么：
  1. 对每个目标文件按候选关键词搜索 Commons（仅 File: 命名空间）
  2. 过滤：只要 jpg、横版、宽 >=1000px，排除内饰/徽标/细节图
  3. 下载 1400px 宽的缩放版到 topchinacar-site/images/（原文件先备份到 images/_old/）
  4. 记录作者+授权 → topchinacar-site/images/commons-credits.json
  5. 生成预览页 topchinacar-site/images/preview.html —— 打开检查，不满意的删掉重跑或手动换

跑完后把结果告诉 Claude，由它把图片和署名接进 js/data.js。
"""
import json, os, re, shutil, sys, time, urllib.parse, urllib.request

SITE = os.path.expanduser("~/Documents/china-auto-briefing/topchinacar-site")
IMG_DIR = os.path.join(SITE, "images")
OLD_DIR = os.path.join(IMG_DIR, "_old")
API = "https://commons.wikimedia.org/w/api.php"
UA = "TopChinaCarImageFetcher/1.0 (https://www.topchinacar.com; hello@topchinacar.com)"

# 目标文件名 -> 搜索关键词候选（依次尝试）
TARGETS = {
    # ---- 车型页缺图（现在是 SVG 占位）----
    "byd-seagull.jpg":      ["BYD Seagull", "BYD Dolphin Mini"],
    "byd-atto-3.jpg":       ["BYD Atto 3", "BYD Yuan Plus"],
    "byd-sealion-07.jpg":   ["BYD Sealion 07", "BYD Sealion"],
    "byd-han.jpg":          ["BYD Han EV", "BYD Han"],
    "byd-shark-6.jpg":      ["BYD Shark 6", "BYD Shark pickup"],
    "xiaomi-su7.jpg":       ["Xiaomi SU7"],
    "nio-et5.jpg":          ["NIO ET5"],
    "nio-onvo-l60.jpg":     ["Onvo L60", "NIO Onvo"],
    "nio-firefly.jpg":      ["NIO Firefly", "Firefly electric car"],
    "xpeng-mona-m03.jpg":   ["XPeng MONA M03", "Xpeng M03"],
    "li-l6.jpg":            ["Li Auto L6", "Lixiang L6"],
    "zeekr-7x.jpg":         ["Zeekr 7X"],
    "geely-galaxy-e5.jpg":  ["Geely Galaxy E5", "Geely EX5"],
    "geely-starship-7.jpg": ["Geely Galaxy Starship 7", "Geely Starship 7"],
    "tank-300.jpg":         ["Tank 300"],
    "mg-mg4.jpg":           ["MG4 EV", "MG MG4"],
    "leapmotor-b10.jpg":    ["Leapmotor B10"],
    "volvo-ex30.jpg":       ["Volvo EX30"],
    "chery-tiggo-8.jpg":    ["Chery Tiggo 8"],
    # ---- 替换媒体署名图（同名覆盖，原图备份到 _old/）----
    "hero-xiaomi.jpg":      ["Xiaomi SU7 Ultra", "Xiaomi SU7"],
    "xiaomi-su7-ultra.jpg": ["Xiaomi SU7 Ultra"],
    "nio-et9.jpg":          ["NIO ET9"],
    "xpeng-g6.jpg":         ["XPeng G6"],
    "liauto-mega.jpg":      ["Li Auto Mega", "Lixiang Mega"],
    "zeekr-001.jpg":        ["Zeekr 001"],
    "byd-brand.jpg":        ["BYD Seal U", "BYD Tang"],
    "nio-brand.jpg":        ["NIO ES8", "NIO ES6"],
    "xpeng-brand.jpg":      ["XPeng P7"],
    "liauto-brand.jpg":     ["Li Auto L9", "Lixiang L9"],
    "zeekr-brand.jpg":      ["Zeekr 009", "Zeekr X"],
    "geely-brand.jpg":      ["Geely Galaxy", "Geely Xingyue"],
    "chery-brand.jpg":      ["Chery Tiggo 7", "Chery Arrizo"],
    "gwm-brand.jpg":        ["Haval H6", "Great Wall Motor"],
    "saic-brand.jpg":       ["MG ZS EV", "Roewe RX5"],
    "dongfeng-brand.jpg":   ["Dongfeng Aeolus", "Dongfeng car"],
    "haval-brand.jpg":      ["Haval Jolion", "Haval H6"],
    "volvo-ex90.jpg":       ["Volvo EX90"],
    "lotus-eletre.jpg":     ["Lotus Eletre"],
    "tank-500.jpg":         ["Tank 500"],
    "wey-lanshan.jpg":      ["Wey Lanshan", "WEY Blue Mountain", "WEY SUV"],
    "ora-good-cat.jpg":     ["Ora Funky Cat", "Ora Good Cat", "Ora 03"],
    "denza-z9gt.jpg":       ["Denza Z9 GT", "Denza Z9"],
    "yangwang-u8.jpg":      ["Yangwang U8"],
    "fangchengbao-5.jpg":   ["Fangchengbao Bao 5", "Fang Cheng Bao 5", "Leopard 5"],
    "mg-cyberster.jpg":     ["MG Cyberster"],
    "maxus-mifa9.jpg":      ["Maxus MIFA 9", "SAIC Maxus MIFA"],
    "im-ls6.jpg":           ["IM LS6", "Zhiji LS6", "IM Motors"],
    "voyah-free.jpg":       ["Voyah Free"],
    "mhero-917.jpg":        ["M-Hero 917", "Dongfeng M-Hero"],
    "omoda-e5.jpg":         ["Omoda E5", "Omoda 5"],
    "jaecoo-7.jpg":         ["Jaecoo 7", "Jaecoo J7"],
    "exeed-vx.jpg":         ["Exeed VX", "Exeed"],
}

BAD_WORDS = re.compile(r"interior|dashboard|seat|badge|logo|emblem|engine|trunk|wheel|detail|rear seat|steering|door|IAA hall|charging port", re.I)


def api(params):
    params = dict(params, format="json")
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def strip_html(s):
    return re.sub(r"<[^>]+>", "", s or "").strip()


def find_image(queries):
    for q in queries:
        try:
            res = api({"action": "query", "list": "search", "srsearch": q,
                       "srnamespace": 6, "srlimit": 25})
        except Exception as e:
            print(f"  搜索失败 {q}: {e}"); continue
        titles = [h["title"] for h in res.get("query", {}).get("search", [])
                  if h["title"].lower().endswith((".jpg", ".jpeg"))
                  and not BAD_WORDS.search(h["title"])]
        if not titles:
            continue
        # 批量取 imageinfo
        try:
            info = api({"action": "query", "titles": "|".join(titles[:20]),
                        "prop": "imageinfo",
                        "iiprop": "url|size|extmetadata", "iiurlwidth": 1400})
        except Exception as e:
            print(f"  imageinfo 失败: {e}"); continue
        cands = []
        for page in info.get("query", {}).get("pages", {}).values():
            ii = (page.get("imageinfo") or [{}])[0]
            w, h = ii.get("width", 0), ii.get("height", 0)
            if w < 1000 or h <= 0 or w <= h:      # 要横版、够大
                continue
            ar = w / h
            if not (1.2 <= ar <= 2.4):            # 排除全景/怪比例
                continue
            meta = ii.get("extmetadata", {})
            lic = strip_html(meta.get("LicenseShortName", {}).get("value", ""))
            if not lic or "public domain" in lic.lower():
                lic = lic or "Public domain"
            author = strip_html(meta.get("Artist", {}).get("value", ""))[:60] or "Wikimedia Commons"
            cands.append({
                "title": page.get("title"),
                "url": ii.get("thumburl") or ii.get("url"),
                "w": w, "h": h, "area": w * h,
                "author": author, "license": lic,
                "page": ii.get("descriptionurl", ""),
            })
        if cands:
            cands.sort(key=lambda c: -c["area"])
            return cands[0]
    return None


def main():
    os.makedirs(OLD_DIR, exist_ok=True)
    credits, failed = {}, []
    for fname, queries in TARGETS.items():
        dest = os.path.join(IMG_DIR, fname)
        print(f"→ {fname}  ({queries[0]})")
        pick = find_image(queries)
        if not pick:
            print("  ✗ 没找到合适的图"); failed.append(fname); continue
        # 备份旧图
        if os.path.exists(dest):
            shutil.copy2(dest, os.path.join(OLD_DIR, fname))
        try:
            req = urllib.request.Request(pick["url"], headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
                f.write(r.read())
        except Exception as e:
            print(f"  ✗ 下载失败: {e}"); failed.append(fname); continue
        credits[fname] = {"author": pick["author"], "license": pick["license"],
                          "source": pick["page"], "commons_title": pick["title"],
                          "size": f'{pick["w"]}x{pick["h"]}'}
        print(f'  ✓ {pick["title"]}  {pick["w"]}x{pick["h"]}  {pick["license"]}  by {pick["author"]}')
        time.sleep(0.5)

    with open(os.path.join(IMG_DIR, "commons-credits.json"), "w", encoding="utf-8") as f:
        json.dump(credits, f, ensure_ascii=False, indent=2)

    # 预览页
    cards = "".join(
        f'<div style="display:inline-block;width:340px;margin:8px;vertical-align:top;font:12px sans-serif;">'
        f'<img src="{fn}?r={int(time.time())}" style="width:100%;border-radius:6px;"/>'
        f'<b>{fn}</b><br/>{c["license"]} · {c["author"]}<br/>'
        f'<a href="{c["source"]}">Commons 页面</a></div>'
        for fn, c in credits.items())
    with open(os.path.join(IMG_DIR, "preview.html"), "w", encoding="utf-8") as f:
        f.write(f"<html><body style='background:#111;color:#eee'><h2>下载结果 {len(credits)} 张"
                f"（失败 {len(failed)}：{', '.join(failed) or '无'}）</h2>{cards}</body></html>")

    print(f"\n完成：{len(credits)} 张成功，{len(failed)} 张失败{'：' + ', '.join(failed) if failed else ''}")
    print(f"预览：open {os.path.join(IMG_DIR, 'preview.html')}")
    print("检查满意后告诉 Claude 接线（署名信息在 images/commons-credits.json）。")


if __name__ == "__main__":
    main()
