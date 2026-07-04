#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
发布前校验正文来源链接，剔除明确失效的链接（整个 <a> 标签移除）。
保守策略：只有 404/410 或连接/DNS 失败才算死链；403/405/超时等视为存活
（很多媒体站反爬会拒绝脚本请求，不能误杀）。
作用于 content/wechat-content.html（原始版已先存档到 archive/）。
"""
import concurrent.futures, os, re, sys

try:
    import requests
except ImportError:
    sys.exit("缺少依赖：pip install requests")

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PATH = os.path.join(ROOT, "content", "wechat-content.html")

UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"}
MAX_LINKS = 60


def alive(url):
    try:
        r = requests.get(url, timeout=8, stream=True, allow_redirects=True, headers=UA)
        r.close()
        return r.status_code not in (404, 410)
    except requests.exceptions.ConnectionError:
        return False  # DNS 失败 / 拒绝连接
    except Exception:
        return True   # 超时等一律不误杀


def main():
    if not os.path.isfile(PATH):
        sys.exit(f"缺少 {PATH}")
    with open(PATH, encoding="utf-8") as f:
        html = f.read()

    urls = re.findall(r'<a\s[^>]*href="(https?://[^"]+)"', html)
    uniq = list(dict.fromkeys(urls))[:MAX_LINKS]
    if not uniq:
        print("[check_links] 正文无外链，跳过。")
        return

    print(f"[check_links] 校验 {len(uniq)} 个来源链接 …")
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
        results = list(ex.map(alive, uniq))
    dead = [u for u, ok in zip(uniq, results) if not ok]

    for u in dead:
        html = re.sub(r'<a\s[^>]*href="' + re.escape(u) + r'"[^>]*>.*?</a>',
                      "", html, flags=re.S)
        print(f"[check_links] ✗ 移除死链: {u}")

    if dead:
        with open(PATH, "w", encoding="utf-8") as f:
            f.write(html)
    print(f"[check_links] 完成：{len(uniq) - len(dead)} 存活，{len(dead)} 个已移除。")


if __name__ == "__main__":
    main()
