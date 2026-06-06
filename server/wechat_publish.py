#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
服务器端发布脚本 —— 读取 content/ 下当日内容，发布到微信公众号「波波哥的小酒馆」。

读取：
  content/meta.json          标题/作者/摘要/日期/文件名
  content/wechat-content.html 图文正文（已内联样式）
  content/cover.jpg          封面图

流程：token → 上传封面为永久素材(thumb) → draft/add 创建草稿
默认只建草稿；加 --publish 则继续调用 freepublish 正式群发（不可撤回，仅能删除）。

凭证读取顺序：环境变量 WX_APPID / WX_APPSECRET，其次 server/config.json。

⚠️ 运行机器的公网 IP 必须在公众号后台「IP白名单」内，否则 token 报 errcode 40164。
依赖：pip install requests
"""
import argparse, json, os, sys
try:
    import requests
except ImportError:
    sys.exit("缺少依赖：pip install requests")

API = "https://api.weixin.qq.com"
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CONTENT = os.path.join(ROOT, "content")


def load_creds():
    appid = os.environ.get("WX_APPID")
    secret = os.environ.get("WX_APPSECRET")
    if appid and secret:
        return appid, secret
    cfg = os.path.join(HERE, "config.json")
    if os.path.isfile(cfg):
        with open(cfg, encoding="utf-8") as f:
            c = json.load(f)
        return c.get("appid"), c.get("appsecret")
    sys.exit("未找到凭证：请设置 WX_APPID/WX_APPSECRET 环境变量，或创建 server/config.json")


def get_token(appid, secret):
    r = requests.get(f"{API}/cgi-bin/token",
                     params={"grant_type": "client_credential", "appid": appid, "secret": secret},
                     timeout=20)
    data = r.json()
    if "access_token" not in data:
        raise SystemExit(f"获取 token 失败：{data}\n  40164→IP不在白名单 / 40013→AppID错 / 40125→AppSecret错")
    return data["access_token"]


def upload_thumb(token, cover_path):
    if not os.path.isfile(cover_path):
        raise SystemExit(f"封面不存在：{cover_path}")
    with open(cover_path, "rb") as f:
        r = requests.post(f"{API}/cgi-bin/material/add_material",
                          params={"access_token": token, "type": "image"},
                          files={"media": (os.path.basename(cover_path), f)}, timeout=60)
    data = r.json()
    if "media_id" not in data:
        raise SystemExit(f"上传封面失败：{data}")
    return data["media_id"]


def add_draft(token, meta, thumb_media_id, content_html):
    article = {
        "title": meta["title"][:64],
        "author": meta.get("author", ""),
        "digest": meta.get("digest", "")[:120],
        "content": content_html,
        "thumb_media_id": thumb_media_id,
        "need_open_comment": 0,
        "only_fans_can_comment": 0,
    }
    r = requests.post(f"{API}/cgi-bin/draft/add", params={"access_token": token},
                      data=json.dumps({"articles": [article]}, ensure_ascii=False).encode("utf-8"),
                      timeout=60)
    data = r.json()
    if "media_id" not in data:
        raise SystemExit(f"创建草稿失败：{data}")
    return data["media_id"]


def freepublish(token, draft_media_id):
    r = requests.post(f"{API}/cgi-bin/freepublish/submit", params={"access_token": token},
                      data=json.dumps({"media_id": draft_media_id}).encode("utf-8"), timeout=60)
    data = r.json()
    if data.get("errcode", 0) != 0:
        raise SystemExit(f"群发失败：{data}")
    return data.get("publish_id")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--publish", action="store_true", help="创建草稿后立即群发(不可撤回)。默认只建草稿。")
    a = ap.parse_args()

    meta_path = os.path.join(CONTENT, "meta.json")
    if not os.path.isfile(meta_path):
        raise SystemExit(f"缺少 {meta_path}")
    with open(meta_path, encoding="utf-8") as f:
        meta = json.load(f)
    content_path = os.path.join(CONTENT, meta.get("content_file", "wechat-content.html"))
    cover_path = os.path.join(CONTENT, meta.get("cover_file", "cover.jpg"))
    with open(content_path, encoding="utf-8") as f:
        content_html = f.read()

    appid, secret = load_creds()
    print(f"[{meta.get('date')}] 获取 token …")
    token = get_token(appid, secret)
    print("上传封面 …")
    thumb = upload_thumb(token, cover_path)
    print("创建草稿 …")
    draft = add_draft(token, meta, thumb, content_html)
    print(f"✅ 草稿已创建 media_id={draft}")
    if a.publish:
        print("正式群发 …")
        pid = freepublish(token, draft)
        print(f"✅ 已提交群发 publish_id={pid}")
    else:
        print("（未群发；登录 mp.weixin.qq.com 草稿箱预览确认后手动发，或加 --publish 自动群发）")


if __name__ == "__main__":
    main()
