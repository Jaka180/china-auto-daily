#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成「中国车企出海日报」封面图 — 2.35:1 (1410x600)
被 Cowork 每日定时任务调用： python3 tools/make_cover.py --date 2026-06-07 --out content/cover.jpg

字体自动探测：优先 CJK 字体(Droid Fallback / Noto CJK / PingFang)，Latin 用 Poppins/Lato/DejaVu。
在 Cowork 沙盒(Ubuntu)与 macOS 上都能跑。
"""
import argparse, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def find_font(cands):
    for p in cands:
        if os.path.exists(p):
            return p
    return None

CJK = find_font([
    "/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf",
    "/usr/share/fonts-droid-fallback/truetype/DroidSansFallback.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJKsc-Bold.otf",
    "/System/Library/Fonts/PingFang.ttc",            # macOS
    "/System/Library/Fonts/STHeiti Medium.ttc",
])
LAT_B = find_font([
    "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf",
    "/usr/share/fonts/truetype/lato/Lato-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
])
LAT_M = find_font([
    "/usr/share/fonts/truetype/google-fonts/Poppins-Medium.ttf",
    "/usr/share/fonts/truetype/lato/Lato-Medium.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
]) or LAT_B

if not CJK or not LAT_B:
    sys.exit("找不到可用字体(CJK 或 Latin)。请安装 fonts-noto-cjk 或在 macOS 上运行。")

TITLE_CN = "中国车企出海日报"
KICKER = "CHINA AUTO · OVERSEAS BRIEFING"
SUBTITLE = "16 家车企 · 每日海外动态 · 中英双语"
BRAND = "波波哥的小酒馆"

def render(date_str, out_path, pill_text=None, subtitle=None, title_cn=None):
    W, H = 1410, 600
    img = Image.new("RGB", (W, H), "#111827")
    d = ImageDraw.Draw(img, "RGBA")
    top, mid, bot = (11,15,26), (17,24,39), (28,37,54)
    for y in range(H):
        t = y / H
        if t < 0.55:
            f = t/0.55; c = tuple(int(top[i]+(mid[i]-top[i])*f) for i in range(3))
        else:
            f = (t-0.55)/0.45; c = tuple(int(mid[i]+(bot[i]-mid[i])*f) for i in range(3))
        d.line([(0,y),(W,y)], fill=c)
    glow = Image.new("RGBA",(W,H),(0,0,0,0)); gd = ImageDraw.Draw(glow)
    gd.ellipse([W-560,-180,W+220,H+180], fill=(220,38,38,70))
    glow = glow.filter(ImageFilter.GaussianBlur(70))
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    d = ImageDraw.Draw(img,"RGBA")

    def arc(p0,p1,ctrl,color,wd):
        pts=[]
        for i in range(41):
            t=i/40
            x=(1-t)**2*p0[0]+2*(1-t)*t*ctrl[0]+t**2*p1[0]
            y=(1-t)**2*p0[1]+2*(1-t)*t*ctrl[1]+t**2*p1[1]
            pts.append((x,y))
        d.line(pts, fill=color, width=wd, joint="curve")
    arc((985,145),(1355,180),(1170,250),(51,65,85,150),2)
    arc((960,360),(1370,350),(1170,440),(51,65,85,140),2)
    arc((1030,240),(1380,275),(1210,150),(51,65,85,130),2)
    for (x,y) in [(985,145),(1355,180),(960,360),(1370,350)]:
        d.ellipse([x-6,y-6,x+6,y+6], fill=(220,38,38,230))
    for (x,y) in [(1180,240),(1200,385),(1130,195)]:
        d.ellipse([x-4,y-4,x+4,y+4], fill=(248,113,113,150))

    def draw_mixed(draw, xy, text, size, fill, spacing=0):
        x,y = xy
        fl = ImageFont.truetype(LAT_B, size); fc = ImageFont.truetype(CJK, size)
        al = fl.getmetrics()[0]; ac = fc.getmetrics()[0]
        for ch in text:
            if ord(ch) < 0x3000:
                font = fl; off = max(0, ac-al)
            else:
                font = fc; off = max(0, al-ac)
            draw.text((x, y+off), ch, font=font, fill=fill)
            x += draw.textlength(ch, font=font) + spacing
        return x
    def width_mixed(text, size, spacing=0):
        fl = ImageFont.truetype(LAT_B, size); fc = ImageFont.truetype(CJK, size)
        tmp = ImageDraw.Draw(Image.new("RGB",(10,10))); w=0
        for ch in text:
            font = fl if ord(ch) < 0x3000 else fc
            w += tmp.textlength(ch, font=font) + spacing
        return w

    d.rectangle([84,180,92,420], fill="#dc2626")
    f_kick = ImageFont.truetype(LAT_B, 26); xx = 120
    for ch in KICKER:
        d.text((xx,196), ch, font=f_kick, fill=(156,163,175)); xx += d.textlength(ch, font=f_kick)+3
    d.text((118,232), title_cn or TITLE_CN, font=ImageFont.truetype(CJK, 92), fill="#ffffff")
    draw_mixed(d, (120,360), subtitle or SUBTITLE, 36, (209,213,219), spacing=1)
    pill = pill_text or f"{date_str} · 早间版"
    pw = width_mixed(pill, 30, 1) + 56
    d.rounded_rectangle([120,418,120+pw,472], radius=27, fill="#dc2626")
    draw_mixed(d, (148,427), pill, 30, "#ffffff", spacing=1)
    d.text((120,500), BRAND, font=ImageFont.truetype(CJK, 24), fill=(107,114,128))
    d.rectangle([0,H-7,W,H], fill="#dc2626")

    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    img.save(out_path, "JPEG", quality=92)
    print(f"cover saved -> {out_path} ({W}x{H})")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", required=True, help="如 2026-06-07，将渲染为 '2026年6月7日'")
    ap.add_argument("--out", default="content/cover.jpg")
    ap.add_argument("--pill", default=None, help="覆盖角标文字，默认 '{日期} · 早间版'（周报用）")
    ap.add_argument("--subtitle", default=None, help="覆盖副标题文字")
    ap.add_argument("--title", default=None, help="覆盖中文主标题")
    a = ap.parse_args()
    # 2026-06-07 -> 2026年6月7日
    try:
        y,m,dd = a.date.split("-"); disp = f"{int(y)}年{int(m)}月{int(dd)}日"
    except Exception:
        disp = a.date
    render(disp, a.out, pill_text=a.pill, subtitle=a.subtitle, title_cn=a.title)
