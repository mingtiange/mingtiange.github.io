#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 sitemap.xml 里的全部 URL 提交给 IndexNow（Bing / Yandex / Seznam）。

用法：python3 scripts/indexnow.py
密钥文件放在站点根目录：<key>.txt，内容即密钥本身。
"""

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HOST = "mingtiange.github.io"


def main():
    keyfile = next(p for p in ROOT.glob("*.txt") if re.fullmatch(r"[0-9a-f]{32}\.txt", p.name))
    key = keyfile.read_text(encoding="utf-8").strip()
    urls = re.findall(r"<loc>([^<]+)</loc>", (ROOT / "sitemap.xml").read_text(encoding="utf-8"))

    payload = {
        "host": HOST,
        "key": key,
        "keyLocation": f"https://{HOST}/{keyfile.name}",
        "urlList": urls,
    }
    req = urllib.request.Request(
        "https://api.indexnow.org/indexnow",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(f"IndexNow: HTTP {r.status} · 提交 {len(urls)} 个 URL")
    except urllib.error.HTTPError as e:
        print(f"IndexNow: HTTP {e.code} · {e.read()[:200]!r}")


if __name__ == "__main__":
    main()
